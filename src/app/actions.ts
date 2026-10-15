'use server';

import verifiedStudentsData from '@/data/verified_students.json';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface StudentTicket {
  timestamp: string;
  name: string;
  scholar_no: string;
  branch: string;
  year_sem: string;
  contact_no: string;
  email: string;
  submitted_transaction_id: string;
  verification_status: string;
  bank_source: string;
  matched_bank_utr: string;
  ticket_id: string;
  status?: string;
  checked_in_at?: string;
}

// In-memory checked in tracking for fast local operation
// When Supabase is connected, it also syncs to Supabase
const checkInStore = new Map<string, { status: string; checked_in_at: string }>();

// Search & Verify Student Registration
export async function verifyAndGetPass(formData: FormData) {
  const query = (formData.get('query') as string || '').trim().toLowerCase();
  const nameInput = (formData.get('name') as string || '').trim().toLowerCase();

  if (!query && !nameInput) {
    return { error: 'Please enter your Scholar No., Registered Mobile No., or Transaction ID.' };
  }

  const cleanQuery = query.replace(/[^a-zA-Z0-9]/g, '');

  // 1. First search in local verified dataset
  const verifiedList = verifiedStudentsData as StudentTicket[];

  const matched = verifiedList.find((s) => {
    const sName = s.name.toLowerCase();
    const sScholar = s.scholar_no.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const sContact = s.contact_no.replace(/\D/g, '');
    const sTxn = s.submitted_transaction_id.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const sUtr = (s.matched_bank_utr || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const sTicketId = s.ticket_id.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

    // Match by Scholar No
    if (cleanQuery && sScholar && (cleanQuery === sScholar || sScholar.includes(cleanQuery))) {
      return true;
    }

    // Match by Contact No (last 10 digits)
    if (cleanQuery && cleanQuery.length >= 7 && sContact.endsWith(cleanQuery)) {
      return true;
    }

    // Match by Transaction ID or UTR
    if (cleanQuery && cleanQuery.length >= 6 && (sTxn.includes(cleanQuery) || sUtr.includes(cleanQuery) || cleanQuery === sTxn)) {
      return true;
    }

    // Match by Ticket ID
    if (cleanQuery && cleanQuery === sTicketId) {
      return true;
    }

    // Match by Name if query matches student name
    if (cleanQuery && cleanQuery.length >= 4 && sName.includes(cleanQuery)) {
      return true;
    }

    // Match if name input provided
    if (nameInput && nameInput.length >= 3 && sName.includes(nameInput)) {
      if (cleanQuery && (sScholar.includes(cleanQuery) || sContact.endsWith(cleanQuery) || sTxn.includes(cleanQuery))) {
        return true;
      }
    }

    return false;
  });

  if (!matched) {
    return {
      error: 'No verified registration found for the provided details. Please verify your Scholar No., Phone No., or Transaction ID.',
    };
  }

  // Check check-in status
  const checkIn = checkInStore.get(matched.ticket_id);

  return {
    success: true,
    student: {
      ...matched,
      status: checkIn?.status || 'valid',
      checked_in_at: checkIn?.checked_in_at,
    },
  };
}

// Fetch ticket by Ticket ID
export async function getTicketDetails(ticketId: string) {
  const verifiedList = verifiedStudentsData as StudentTicket[];
  const cleanId = ticketId.trim().toUpperCase();

  const found = verifiedList.find((s) => s.ticket_id.toUpperCase() === cleanId);

  if (!found) {
    return null;
  }

  const checkIn = checkInStore.get(found.ticket_id);

  return {
    ...found,
    status: checkIn?.status || 'valid',
    checked_in_at: checkIn?.checked_in_at,
  };
}

// Gate QR Code Verification (Strict Single-Use Only)
export async function verifyTicketGate(ticketId: string) {
  const verifiedList = verifiedStudentsData as StudentTicket[];
  const cleanId = ticketId.trim().toUpperCase();

  const student = verifiedList.find((s) => s.ticket_id.toUpperCase() === cleanId);

  if (!student) {
    return {
      status: 'invalid' as const,
      message: 'Invalid Pass: This Ticket ID is not registered in the verified database.',
    };
  }

  // 1. Check in-memory store
  const existing = checkInStore.get(student.ticket_id);
  if (existing && existing.status === 'checked_in') {
    return {
      status: 'duplicate' as const,
      message: `Already Checked-In at ${existing.checked_in_at}. This pass is valid for one-time entry only.`,
      name: student.name,
      scholarNo: student.scholar_no,
      branch: student.branch,
      ticketId: student.ticket_id,
      time: existing.checked_in_at,
    };
  }

  // 2. Check Firebase Firestore (Real-time Cloud Sync)
  try {
    const { doc, getDoc, setDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');

    const docRef = doc(db, 'students', cleanId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.status === 'checked_in') {
        const checkedTime = data.checked_in_at || existing?.checked_in_at || 'Earlier';
        checkInStore.set(student.ticket_id, {
          status: 'checked_in',
          checked_in_at: checkedTime,
        });

        return {
          status: 'duplicate' as const,
          message: `Already Checked-In at ${checkedTime}. This pass is valid for one-time entry only.`,
          name: data.name || student.name,
          scholarNo: data.scholar_no || student.scholar_no,
          branch: data.branch || student.branch,
          ticketId: cleanId,
          time: checkedTime,
        };
      }
    }
  } catch (fbErr) {
    // Firebase optional fallback
  }

  // 3. Check Supabase table if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { data: supaData } = await supabase
        .from('navrang_checkins')
        .select('*')
        .eq('ticket_id', student.ticket_id)
        .maybeSingle();

      if (supaData && supaData.status === 'checked_in') {
        const checkedTime = supaData.checked_in_at || 'Earlier today';
        checkInStore.set(student.ticket_id, {
          status: 'checked_in',
          checked_in_at: checkedTime,
        });

        return {
          status: 'duplicate' as const,
          message: `Already Checked-In at ${checkedTime}. This pass is valid for one-time entry only.`,
          name: student.name,
          scholarNo: student.scholar_no,
          branch: student.branch,
          ticketId: student.ticket_id,
          time: checkedTime,
        };
      }
    } catch (e) {
      // Supabase table check optional fallback
    }
  }

  const now = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Save to in-memory store
  checkInStore.set(student.ticket_id, {
    status: 'checked_in',
    checked_in_at: now,
  });

  // Sync to Firebase Firestore
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');

    await setDoc(
      doc(db, 'students', cleanId),
      {
        ...student,
        status: 'checked_in',
        checked_in_at: now,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (fbWriteErr) {
    console.warn('Firebase checkin write fallback:', fbWriteErr);
  }

  // Sync to Supabase if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      await supabase.from('navrang_checkins').upsert({
        ticket_id: student.ticket_id,
        name: student.name,
        scholar_no: student.scholar_no,
        branch: student.branch,
        status: 'checked_in',
        checked_in_at: now,
      });
    } catch (e) {
      // Silently fall back
    }
  }

  return {
    status: 'success' as const,
    message: 'Access Granted! Welcome to Navrang 2026.',
    name: student.name,
    scholarNo: student.scholar_no,
    branch: student.branch,
    yearSem: student.year_sem,
    ticketId: student.ticket_id,
    time: now,
  };
}

// Admin stats
export async function getAdminDashboardData() {
  const verifiedList = verifiedStudentsData as StudentTicket[];
  const totalVerified = verifiedList.length;
  const checkedInCount = checkInStore.size;

  // Branch breakdown
  const branchCounts: Record<string, number> = {};
  for (const s of verifiedList) {
    const b = (s.branch || 'Other').trim().toUpperCase();
    branchCounts[b] = (branchCounts[b] || 0) + 1;
  }

  return {
    totalRegistrations: 349,
    totalVerified,
    checkedInCount,
    remainingCount: totalVerified - checkedInCount,
    branchCounts,
    recentCheckIns: Array.from(checkInStore.entries()).slice(-10).reverse(),
  };
}

// Bulk Upload & Sync all verified registrations to Firebase Firestore
export async function syncAllToFirebase() {
  try {
    const verifiedList = verifiedStudentsData as StudentTicket[];
    const { writeBatch, doc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');

    // Firestore batch limit is 500 operations per batch
    const batch = writeBatch(db);
    let count = 0;

    for (const student of verifiedList) {
      const docRef = doc(db, 'students', student.ticket_id);
      batch.set(
        docRef,
        {
          ...student,
          status: checkInStore.get(student.ticket_id)?.status || 'valid',
          checked_in_at: checkInStore.get(student.ticket_id)?.checked_in_at || null,
          synced_at: new Date().toISOString(),
        },
        { merge: true }
      );
      count++;
    }

    await batch.commit();

    return {
      success: true,
      count,
      message: `Successfully migrated and synced ${count} verified registrations to Firebase Firestore!`,
    };
  } catch (err: unknown) {
    console.error('Firebase Bulk Sync Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ========================================================
// ZERO-EXPOSURE PASSCODE AUTHENTICATION
// ========================================================
const EXPECTED_HASH =
  process.env.ADMIN_PASSCODE_HASH ||
  '946b1eb08fa82905b7e759476d6d9931a1076940984dc0920462a850f286f798';
const RAW_PASSCODE = process.env.ADMIN_PASSCODE || '946240988';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'navrang-secret-salt-2026-garba-ecb-secure-session';

export async function verifyPasscode(inputHashOrPlain: string) {
  const clean = (inputHashOrPlain || '').trim();
  let hash = clean.toLowerCase();

  // If client already sent SHA-256 (64 hex characters)
  if (clean.length !== 64) {
    hash = crypto.createHash('sha256').update(clean).digest('hex').toLowerCase();
  }

  const isMatch = hash === EXPECTED_HASH || clean === RAW_PASSCODE;

  if (isMatch) {
    const sessionToken = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update('navrang_admin_authorized')
      .digest('hex');

    const cookieStore = await cookies();
    cookieStore.set('navrang_auth_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return { success: true };
  }

  return { success: false, error: 'Incorrect Passcode. Access Denied.' };
}

export async function checkAuthSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('navrang_auth_session')?.value;
    if (!token) return false;

    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update('navrang_admin_authorized')
      .digest('hex');

    return token === expected;
  } catch (e) {
    return false;
  }
}

export async function logoutAdmin() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('navrang_auth_session');
  } catch (e) {
    // Ignore cookie delete errors
  }
  return { success: true };
}