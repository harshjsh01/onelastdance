'use client';

import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import { Sparkles, Calendar, MapPin, Clock, ShieldCheck } from 'lucide-react';

export interface TicketProps {
  name: string;
  ticketId: string;
  scholarNo?: string;
  branch?: string;
  yearSem?: string;
  contactNo?: string;
  status?: string;
}

export function TicketCard({
  name,
  ticketId,
  scholarNo,
  branch,
  yearSem,
  status = 'verified'
}: TicketProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${baseUrl}/ticket/${ticketId}`;

  return (
    <div className="relative w-full max-w-xl mx-auto glass-card overflow-hidden rounded-3xl border border-amber-500/30 shadow-2xl transition-all duration-300 hover:border-amber-400/50">
      {/* Background Decorative Festive Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 blur-3xl -ml-20 -mb-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Main Ticket Layout */}
      <div className="relative flex flex-col md:flex-row">
        {/* Left Section: Event & Attendee Details */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-amber-500/20">
          {/* Header with Logo */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-amber-400/50 bg-black/40 flex-shrink-0 p-1">
                <Image
                  src="/logo.png"
                  alt="Navrang Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold tracking-widest uppercase">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Engineering College Bikaner</span>
                </div>
                <h2 className="text-xl font-black tracking-tight gradient-festive">
                  NAVRANG 2026
                </h2>
              </div>
            </div>

            <p className="text-[11px] font-semibold tracking-wider text-pink-300 uppercase mb-4">
              ✨ Dandiya &amp; Garba Evening
            </p>

            {/* Attendee Name */}
            <div className="mb-4">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                Pass Holder
              </span>
              <h3 className="text-2xl font-black text-white capitalize leading-tight">
                {name}
              </h3>
            </div>

            {/* Meta: Scholar No & Branch */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Scholar No.
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {scholarNo || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Branch / Sem
                </span>
                <span className="font-semibold text-slate-200 truncate block">
                  {branch ? `${branch}${yearSem ? ` (${yearSem})` : ''}` : 'Student'}
                </span>
              </div>
            </div>
          </div>

          {/* Event Quick Meta & Verified Badge */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Pass ID
              </span>
              <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                {ticketId}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admit One</span>
            </div>
          </div>
        </div>

        {/* Right Section: QR Code & Verification */}
        <div className="w-full md:w-48 flex flex-col items-center justify-center bg-black/40 p-6 md:p-8 flex-shrink-0 relative">
          <div className="p-3 bg-white rounded-2xl shadow-xl border border-amber-300/40">
            <QRCodeSVG
              value={qrUrl}
              size={120}
              level="H"
              includeMargin={false}
            />
          </div>
          <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase mt-3 text-center">
            Scan At Gate
          </span>
          <span className="text-[9px] text-slate-400 mt-1 text-center font-medium">
            Strictly Non-Transferable
          </span>

          <div className="mt-4 pt-3 border-t border-white/10 w-full text-center">
            <span className="text-[9px] text-pink-400 font-bold block">
              Entry Closes 3:30 PM
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              Traditional Dress Required
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Perforation Stubs */}
      <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-[#090314] rounded-full -translate-y-1/2 border-l border-amber-500/30" />
      <div className="hidden md:block absolute top-1/2 -left-3 w-6 h-6 bg-[#090314] rounded-full -translate-y-1/2 border-r border-amber-500/30" />
    </div>
  );
}
