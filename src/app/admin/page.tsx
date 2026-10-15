'use client';

import { useState, useMemo } from 'react';
import verifiedData from '@/data/verified_students.json';
import { syncAllToFirebase } from '../actions';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Sparkles,
  RefreshCw,
  Cloud,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AdminPage() {
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleFirebaseSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncAllToFirebase();
      if (res.success) {
        setSyncStatus({ success: true, message: res.message || 'Synced successfully!' });
      } else {
        setSyncStatus({ success: false, message: res.error || 'Sync failed.' });
      }
    } catch (e: any) {
      setSyncStatus({ success: false, message: e.message || 'Failed to connect to Firebase.' });
    } finally {
      setSyncing(false);
    }
  };

  // Branch list
  const branches = useMemo(() => {
    const set = new Set<string>();
    verifiedData.forEach((s) => {
      const b = s.branch ? s.branch.trim() : 'Other';
      set.add(b);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, []);

  // Filtered students
  const filtered = useMemo(() => {
    return verifiedData.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.scholar_no.toLowerCase().includes(q) ||
        s.contact_no.includes(q) ||
        s.ticket_id.toLowerCase().includes(q) ||
        (s.matched_bank_utr && s.matched_bank_utr.includes(q));

      const matchBranch =
        selectedBranch === 'ALL' ||
        (s.branch && s.branch.trim() === selectedBranch);

      return matchSearch && matchBranch;
    });
  }, [search, selectedBranch]);

  // Toggle check in
  const toggleCheckIn = (ticketId: string) => {
    setCheckedInIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  // Export CSV of filtered list
  const exportCSV = () => {
    const headers = [
      'Ticket ID',
      'Name',
      'Scholar No',
      'Branch',
      'Year / Sem',
      'Contact',
      'Email',
      'Bank Source',
      'UTR',
      'Gate Status'
    ];
    const rows = filtered.map((s) => [
      s.ticket_id,
      `"${s.name}"`,
      `"${s.scholar_no}"`,
      `"${s.branch}"`,
      `"${s.year_sem}"`,
      s.contact_no,
      s.email,
      s.bank_source,
      s.matched_bank_utr,
      checkedInIds.has(s.ticket_id) ? 'Checked In' : 'Pending Entry'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `navrang_2026_verified_attendance_${selectedBranch}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#090314] text-foreground p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navbar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="relative w-10 h-10 rounded-full p-1 bg-black/40 border border-amber-400/40">
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Navrang 2026 Admin Desk
              </h1>
              <p className="text-xs text-amber-400 font-semibold tracking-wider uppercase">
                Gate Management &amp; Attendance Registry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFirebaseSync}
              disabled={syncing}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              {syncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span>{syncing ? 'Syncing to Firebase...' : 'Sync to Firebase'}</span>
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/scan"
              className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <span>Open Scanner</span>
            </Link>
          </div>
        </header>

        {/* Sync Notification Banner */}
        {syncStatus && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
              syncStatus.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span className="font-medium">{syncStatus.message}</span>
            </div>
            <button
              onClick={() => setSyncStatus(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass p-5 rounded-2xl border border-amber-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Verified
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-400">
                {verifiedData.length}
              </span>
              <span className="text-xs text-slate-500">students</span>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Checked In
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-400">
                {checkedInIds.size}
              </span>
              <span className="text-xs text-emerald-500/80">at gate</span>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-pink-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending Entry
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-pink-400">
                {verifiedData.length - checkedInIds.size}
              </span>
              <span className="text-xs text-slate-500">remaining</span>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-purple-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Event Capacity
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-purple-400">329 / 349</span>
              <span className="text-xs text-purple-400/80">94.3%</span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, scholar no, phone, UTR..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {branches.map((b) => (
                <option key={b} value={b} className="bg-slate-900 text-white">
                  Branch: {b}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400 ml-2">
              Showing {filtered.length} of {verifiedData.length}
            </span>
          </div>
        </div>

        {/* Attendees Table */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-black/60 sticky top-0 z-10 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 font-bold">Pass ID</th>
                  <th className="p-3.5 font-bold">Attendee Name</th>
                  <th className="p-3.5 font-bold">Scholar No</th>
                  <th className="p-3.5 font-bold">Branch / Year</th>
                  <th className="p-3.5 font-bold">Contact</th>
                  <th className="p-3.5 font-bold">Bank Source / UTR</th>
                  <th className="p-3.5 font-bold text-center">Gate Check-In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => {
                  const isChecked = checkedInIds.has(s.ticket_id);
                  return (
                    <tr
                      key={s.ticket_id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-3.5 font-mono font-bold text-amber-400 whitespace-nowrap">
                        <Link
                          href={`/ticket/${s.ticket_id}`}
                          target="_blank"
                          className="hover:underline flex items-center gap-1"
                        >
                          {s.ticket_id}
                        </Link>
                      </td>
                      <td className="p-3.5 font-semibold text-white capitalize whitespace-nowrap">
                        {s.name}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">
                        {s.scholar_no || '—'}
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        <span className="text-slate-200 font-medium">{s.branch}</span>
                        {s.year_sem && (
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({s.year_sem})
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                        {s.contact_no}
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        <span className="text-xs text-amber-300 font-medium block">
                          {s.bank_source}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {s.matched_bank_utr}
                        </span>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleCheckIn(s.ticket_id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isChecked
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40'
                          }`}
                        >
                          {isChecked ? 'Checked In ✓' : 'Mark In'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
