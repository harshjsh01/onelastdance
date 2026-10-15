import { getTicketDetails } from '@/app/actions';
import { TicketCard } from '@/components/TicketCard';
import { PrintButton } from '@/components/PrintButton';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Sparkles, MapPin, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getTicketDetails(id);

  if (!student) {
    notFound();
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10 flex flex-col items-center justify-center bg-background relative overflow-hidden text-foreground">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_#260d47_0%,_#090314_80%)] -z-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 blur-[140px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/15 blur-[140px] rounded-full -z-10 animate-pulse delay-700" />

      <div className="w-full max-w-xl space-y-6 my-auto">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center no-print">
          <Link
            href="/"
            className="text-slate-400 hover:text-white flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Pass Verified</span>
          </div>
        </div>

        {/* Ticket Header */}
        <div className="text-center no-print">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Navrang Navratri 2026 Pass
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Engineering College Bikaner • Dandiya &amp; Garba Evening
          </p>
        </div>

        {/* Render TicketCard */}
        <TicketCard
          name={student.name}
          ticketId={student.ticket_id}
          scholarNo={student.scholar_no}
          branch={student.branch}
          yearSem={student.year_sem}
          contactNo={student.contact_no}
          status={student.status}
        />

        {/* Event Details Box */}
        <div className="glass p-5 rounded-2xl border border-white/10 space-y-3 text-xs text-slate-300 no-print">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Event
            </span>
            <span className="font-bold text-white">Navrang 2026</span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-pink-400" /> Gate Timing
            </span>
            <span className="font-bold text-amber-400">Closes at 3:30 PM Sharp</span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Venue
            </span>
            <span className="font-bold text-white">ECB Main Campus Ground</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Admission Status</span>
            <span
              className={`font-black uppercase tracking-wider ${
                student.status === 'checked_in' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {student.status === 'checked_in'
                ? `Checked In (${student.checked_in_at || 'Done'})`
                : 'Valid & Active'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <PrintButton />
      </div>
    </main>
  );
}
