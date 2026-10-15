'use server';

import verifiedStudentsData from '@/data/verified_students.json';
import { supabase } from '@/lib/supabase';

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

// Gate QR Code Verification
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

  const existing = checkInStore.get(student.ticket_id);

  if (existing && existing.status === 'checked_in') {
    return {
      status: 'duplicate' as const,
      message: `Already Checked-In at ${existing.checked_in_at}`,
      name: student.name,
      scholarNo: student.scholar_no,
      branch: student.branch,
    };
  }

  const now = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  checkInStore.set(student.ticket_id, {
    status: 'checked_in',
    checked_in_at: now,
  });

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