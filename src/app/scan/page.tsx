'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifyTicketGate } from '../actions';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Search,
  Sparkles,
  QrCode
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type ScanResult = {
  status: 'success' | 'duplicate' | 'invalid' | 'error' | null;
  message: string;
  name?: string;
  scholarNo?: string;
  branch?: string;
  yearSem?: string;
  ticketId?: string;
  time?: string;
};

export default function ScannerPage() {
  const [result, setResult] = useState<ScanResult>({ status: null, message: '' });
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const startScanner = () => {
      const element = document.getElementById('reader');
      if (isScanning && !scannerRef.current && element) {
        try {
          const scanner = new Html5QrcodeScanner(
            'reader',
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
          );

          scanner.render(onScanSuccess, onScanFailure);
          scannerRef.current = scanner;
        } catch (err) {
          console.error('Scanner init error:', err);
        }
      }
    };

    const timer = setTimeout(startScanner, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  async function handleVerification(rawInput: string) {
    let cleanId = rawInput.trim();
    if (cleanId.includes('/ticket/')) {
      cleanId = cleanId.split('/ticket/')[1].split('/')[0];
    } else if (cleanId.includes('/verify/')) {
      cleanId = cleanId.split('/verify/')[1].split('/')[0];
    }

    if (loading || !cleanId) return;

    setIsScanning(false);
    setLoading(true);

    try {
      const res = await verifyTicketGate(cleanId);
      setResult(res as ScanResult);
    } catch (err) {
      setResult({ status: 'error', message: 'Verification server error occurred.' });
    } finally {
      setLoading(false);
    }
  }

  function onScanSuccess(decodedText: string) {
    handleVerification(decodedText);
  }

  function onScanFailure() {
    // ignore frame drop errors
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId) {
      handleVerification(manualId);
    }
  };

  const resetScanner = () => {
    setResult({ status: null, message: '' });
    setManualId('');
    setIsScanning(true);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 transition-colors duration-500 text-foreground ${
        result.status === 'success'
          ? 'bg-[#032014]'
          : result.status === 'duplicate'
          ? 'bg-[#291404]'
          : result.status === 'invalid' || result.status === 'error'
          ? 'bg-[#29050d]'
          : 'bg-[#090314]'
      }`}
    >
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between mb-4">
        <Link
          href="/"
          className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Navrang Gatekeeper
          </span>
        </div>
      </header>

      {/* Main Scanner Container */}
      <main className="w-full max-w-md my-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white">Entry Gate Scanner</h1>
          <p className="text-xs text-slate-400 mt-1">Scan student pass QR code or enter Pass ID</p>
        </div>

        <AnimatePresence mode="wait">
          {isScanning ? (
            <motion.div
              key="scanner-box"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass p-5 rounded-3xl border border-amber-500/20 shadow-2xl space-y-4"
            >
              {/* QR Camera Reader */}
              <div
                id="reader"
                className="w-full overflow-hidden rounded-2xl bg-black/60 border border-white/10"
              />

              {/* Manual ID Input Fallback */}
              <div className="pt-2">
                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-card px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest absolute">
                    Or Enter ID Manually
                  </span>
                </div>

                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="e.g. NRG-1001"
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!manualId || loading}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                  >
                    Verify
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* Result Modal */
            <motion.div
              key="result-box"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6 text-center"
            >
              {result.status === 'success' && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest rounded-full">
                      Access Granted
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 capitalize">
                      {result.name}
                    </h2>
                    <p className="text-emerald-400 text-xs font-mono font-bold mt-1">
                      {result.scholarNo} • {result.branch}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-300">
                    <p className="font-semibold text-white">Admitted to Navrang 2026</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Scanned at {result.time}</p>
                  </div>
                </div>
              )}

              {result.status === 'duplicate' && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-widest rounded-full">
                      Already Checked-In
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-3 capitalize">
                      {result.name}
                    </h2>
                    <p className="text-amber-300 text-xs font-mono mt-1">
                      {result.scholarNo} • {result.branch}
                    </p>
                  </div>
                  <p className="text-xs text-amber-400/90">{result.message}</p>
                </div>
              )}

              {(result.status === 'invalid' || result.status === 'error') && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 mx-auto flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-black uppercase tracking-widest rounded-full">
                      Entry Denied
                    </span>
                    <h2 className="text-xl font-bold text-white mt-3">Invalid Pass</h2>
                  </div>
                  <p className="text-xs text-red-300">{result.message}</p>
                </div>
              )}

              <button
                onClick={resetScanner}
                className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs tracking-wider uppercase"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scan Next Student</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Status */}
      <footer className="w-full max-w-md text-center text-xs text-slate-500 py-3">
        <span>ECB Navrang 2026 Live Gatekeeper System</span>
      </footer>
    </div>
  );
}
