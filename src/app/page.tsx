'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { verifyAndGetPass, StudentTicket } from './actions';
import { TicketCard } from '@/components/TicketCard';
import { PrintButton } from '@/components/PrintButton';
import {
  Sparkles,
  Search,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Music,
  Users,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentTicket | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [queryValue, setQueryValue] = useState('');
  const [nameValue, setNameValue] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await verifyAndGetPass(formData);

    if (res.error) {
      setError(res.error);
      setStudent(null);
    } else if (res.student) {
      setStudent(res.student);
    }

    setLoading(false);
  };

  const handleReset = () => {
    setStudent(null);
    setError(null);
    setQueryValue('');
    setNameValue('');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 relative overflow-hidden text-foreground">
      {/* Background Ambience & Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_#260d47_0%,_#090314_80%)] -z-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 blur-[140px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/15 blur-[140px] rounded-full -z-10 animate-pulse delay-700" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-purple-600/10 blur-[120px] rounded-full -z-10" />

      {/* Top Navbar */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 sm:mb-12 no-print">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-full p-1 bg-black/40 border border-amber-400/40 shadow-lg shadow-amber-500/20">
            <Image
              src="/logo.png"
              alt="Navrang Logo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
              NAVRANG 2026
            </h1>
            <p className="text-[10px] font-semibold text-amber-400/90 tracking-widest uppercase">
              ECB Dandiya Night
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/scan"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-all active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Gate Scanner</span>
            <span className="sm:hidden">Scan</span>
          </Link>

          <Link
            href="/admin"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-2 transition-all active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-xl my-auto">
        <AnimatePresence mode="wait">
          {!student ? (
            /* Registration Verification Form */
            <motion.div
              key="search-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Hero Banner */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dandiya &amp; Garba Evening</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3 gradient-festive">
                  Get Your Entry Pass
                </h1>

                <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                  Enter your <span className="text-amber-400 font-semibold">Scholar No.</span>,{' '}
                  <span className="text-amber-400 font-semibold">Registered Phone</span>, or{' '}
                  <span className="text-amber-400 font-semibold">Transaction ID / UTR</span> to view and download your verified entry pass.
                </p>
              </div>

              {/* Form Card */}
              <div className="glass p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 border border-amber-500/25">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wider flex items-center justify-between">
                      <span>Scholar No. / Phone / Transaction ID</span>
                      <span className="text-[10px] text-amber-400/80 font-normal">Required</span>
                    </label>
                    <div className="relative">
                      <input
                        name="query"
                        type="text"
                        required
                        value={queryValue}
                        onChange={(e) => setQueryValue(e.target.value)}
                        placeholder="Enter Scholar No., Mobile No., or Transaction ID"
                        className="w-full bg-black/40 border border-amber-500/30 rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition-all placeholder:text-slate-500 text-white font-medium"
                      />
                      <Search className="w-4 h-4 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wider flex items-center justify-between">
                      <span>Full Name</span>
                      <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      placeholder="Enter your registered name"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition-all placeholder:text-slate-600 text-white font-medium"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{error}</p>
                        <p className="text-red-400/80 mt-1">
                          If you have already paid, please ensure your details match your Google Form submission.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-pink-600 hover:opacity-95 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 text-sm tracking-wide uppercase"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Registration...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Verify &amp; Generate Pass</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Event Info Strip */}
                <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                    <span className="block font-semibold text-white">October 2026</span>
                    <span className="text-[9px]">Navrang Night</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <Clock className="w-3.5 h-3.5 text-pink-400 mx-auto mb-1" />
                    <span className="block font-semibold text-white">3:30 PM</span>
                    <span className="text-[9px]">Gate Closes</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                    <span className="block font-semibold text-white">ECB Campus</span>
                    <span className="text-[9px]">Bikaner</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Digital Ticket Result Display */
            <motion.div
              key="ticket-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="w-full space-y-6"
            >
              <div className="text-center no-print">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Payment Confirmed &amp; Verified</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Your Navrang Entry Pass
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Save this pass or show the QR code at the entry gate.
                </p>
              </div>

              {/* Ticket Card Component */}
              <TicketCard
                name={student.name}
                ticketId={student.ticket_id}
                scholarNo={student.scholar_no}
                branch={student.branch}
                yearSem={student.year_sem}
                contactNo={student.contact_no}
                status={student.status}
              />

              {/* Action Buttons */}
              <div className="space-y-3 no-print">
                <PrintButton />

                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold rounded-xl border border-white/10 transition-all text-xs"
                >
                  Search Another Registration
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsible Rules & Terms */}
        <div className="mt-8 glass rounded-2xl p-4 sm:p-5 border border-white/10 no-print">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between text-left text-xs font-bold text-amber-400 uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5" />
              Event Guidelines &amp; Terms
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showRules ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showRules && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3.5 pt-3.5 border-t border-white/10 text-xs text-slate-300 space-y-2 leading-relaxed"
            >
              <p>• <strong>Entry Pass:</strong> Permitted only with a valid digital or printed pass with verifiable QR code.</p>
              <p>• <strong>Timings:</strong> Entry gates close strictly at <strong>3:30 PM</strong>. Late entry may be restricted.</p>
              <p>• <strong>Dress Code:</strong> Traditional Indian attire (Kurta-Pyjama / Chaniya Choli / Kediyu) is encouraged.</p>
              <p>• <strong>Dandiya Sticks:</strong> Permitted and encouraged. Please use them responsibly.</p>
              <p>• <strong>Security:</strong> College ID cards must be carried along with this pass.</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center text-xs text-slate-500 mt-10 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <p>© 2026 Engineering College Bikaner. Navrang Dandiya &amp; Garba Evening.</p>
        <p className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Official Event Pass Verification System</span>
        </p>
      </footer>
    </main>
  );
}
