'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  QrCode,
  SwitchCamera,
  ImageIcon,
  ShieldCheck,
  AlertCircle,
  Users,
  History,
  Trash2
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

type CheckInRecord = {
  ticketId: string;
  name: string;
  scholarNo: string;
  branch: string;
  time: string;
  date: string;
};

export default function ScannerPage() {
  const [result, setResult] = useState<ScanResult>({ status: null, message: '' });
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'init' | 'running' | 'error' | 'stopped'>('init');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [manualId, setManualId] = useState('');
  const [checkedIns, setCheckedIns] = useState<Record<string, CheckInRecord>>({});
  const [showHistory, setShowHistory] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load persistent check-in log from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('navrang_gate_checked_ins_v2');
      if (stored) {
        setCheckedIns(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read localStorage check-ins', e);
    }
  }, []);

  // Save to localStorage helper
  const recordCheckIn = (record: CheckInRecord) => {
    setCheckedIns((prev) => {
      const updated = { ...prev, [record.ticketId.toUpperCase()]: record };
      try {
        localStorage.setItem('navrang_gate_checked_ins_v2', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
      return updated;
    });
  };

  // Audio & Haptic Feedback
  const triggerFeedback = (type: 'success' | 'error') => {
    // Sound
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'success') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.22);
        } else {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.4);
        }
      }
    } catch (e) {
      // Audio not supported or blocked
    }

    // Vibration
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (type === 'success') {
          navigator.vibrate([120]);
        } else {
          navigator.vibrate([200, 100, 200]);
        }
      }
    } catch (e) {
      // Vibration not supported
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
  };

  const startCamera = async (targetCameraId?: string) => {
    const readerElement = document.getElementById('reader');
    if (!readerElement) return;

    setCameraStatus('init');
    setErrorMessage(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('reader');
      }

      // Check available cameras
      let selectedCamId: string | MediaTrackConstraints = { facingMode: 'environment' };
      try {
        const devs = await Html5Qrcode.getCameras();
        if (devs && devs.length > 0) {
          setCameras(devs);
          if (targetCameraId) {
            selectedCamId = targetCameraId;
          } else {
            const backCam = devs.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            );
            if (backCam) {
              selectedCamId = backCam.id;
              const idx = devs.findIndex((d) => d.id === backCam.id);
              if (idx !== -1) setCurrentCameraIndex(idx);
            }
          }
        }
      } catch (camErr) {
        console.warn('Could not enumerate cameras, falling back to facingMode constraint', camErr);
      }

      await scannerRef.current.start(
        selectedCamId,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => onScanSuccess(decodedText),
        () => {
          // Frame drop ignored
        }
      );

      setCameraStatus('running');
    } catch (err: unknown) {
      console.error('Camera start error:', err);
      setCameraStatus('error');
      const errStr = String(err);
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
        setErrorMessage(
          'Camera permission is required. Please tap the lock icon in your browser address bar and grant Camera access, then tap Retry.'
        );
      } else {
        setErrorMessage(
          'Unable to auto-start camera preview. You can manually enter the Pass ID below or upload a QR image.'
        );
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (isScanning && mounted) {
        await startCamera();
      }
    };

    const timer = setTimeout(init, 200);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isScanning]);

  async function handleVerification(rawInput: string) {
    let cleanId = rawInput.trim();
    if (cleanId.includes('/ticket/')) {
      cleanId = cleanId.split('/ticket/')[1].split('/')[0];
    } else if (cleanId.includes('/verify/')) {
      cleanId = cleanId.split('/verify/')[1].split('/')[0];
    }

    cleanId = cleanId.trim().toUpperCase();

    if (loading || !cleanId) return;

    // STEP 1: Strict One-Time Client Check (instant duplicate detection)
    if (checkedIns[cleanId]) {
      const prev = checkedIns[cleanId];
      await stopCamera();
      setIsScanning(false);
      setResult({
        status: 'duplicate',
        message: `Already Checked-In at ${prev.time}. Passes are valid for ONE-TIME entry only.`,
        name: prev.name,
        scholarNo: prev.scholarNo,
        branch: prev.branch,
        ticketId: cleanId,
        time: prev.time,
      });
      triggerFeedback('error');
      return;
    }

    // STEP 2: Server-Side & Supabase Check
    await stopCamera();
    setIsScanning(false);
    setLoading(true);

    try {
      const res = await verifyTicketGate(cleanId);
      setResult(res as ScanResult);

      if (res.status === 'success') {
        // Record into persistent local database
        recordCheckIn({
          ticketId: cleanId,
          name: res.name || 'Student',
          scholarNo: res.scholarNo || '',
          branch: res.branch || '',
          time: res.time || new Date().toLocaleTimeString('en-IN'),
          date: new Date().toLocaleDateString('en-IN'),
        });
        triggerFeedback('success');
      } else if (res.status === 'duplicate') {
        // Record duplicate into local cache as well
        recordCheckIn({
          ticketId: cleanId,
          name: res.name || 'Student',
          scholarNo: res.scholarNo || '',
          branch: res.branch || '',
          time: res.time || 'Earlier',
          date: new Date().toLocaleDateString('en-IN'),
        });
        triggerFeedback('error');
      } else {
        triggerFeedback('error');
      }
    } catch (err) {
      setResult({ status: 'error', message: 'Verification server error occurred.' });
      triggerFeedback('error');
    } finally {
      setLoading(false);
    }
  }

  function onScanSuccess(decodedText: string) {
    handleVerification(decodedText);
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId) {
      handleVerification(manualId);
    }
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;
    const nextIdx = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIdx);
    await stopCamera();
    await startCamera(cameras[nextIdx].id);
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('reader');
      }
      const decoded = await scannerRef.current.scanFile(file, false);
      handleVerification(decoded);
    } catch (err) {
      alert('Could not detect a valid QR code in this image. Please upload a clear photo or enter Pass ID manually.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetScanner = () => {
    setResult({ status: null, message: '' });
    setManualId('');
    setIsScanning(true);
  };

  const clearLocalHistory = () => {
    if (confirm('Clear local check-in records on this device? This will reset the device test count.')) {
      localStorage.removeItem('navrang_gate_checked_ins_v2');
      setCheckedIns({});
    }
  };

  const totalAdmittedOnDevice = Object.keys(checkedIns).length;

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 transition-colors duration-500 text-foreground ${
        result.status === 'success'
          ? 'bg-[#032014]'
          : result.status === 'duplicate'
          ? 'bg-[#290808]'
          : result.status === 'invalid' || result.status === 'error'
          ? 'bg-[#29050d]'
          : 'bg-[#090314]'
      }`}
    >
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between mb-3">
        <Link
          href="/"
          className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={22} height={22} className="object-contain" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Navrang Gatekeeper
          </span>
        </div>
      </header>

      {/* Main Scanner Container */}
      <main className="w-full max-w-md my-auto">
        {/* Gate Status Pill */}
        <div className="flex items-center justify-between mb-4 px-1 text-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Entry Gate Scanner</h1>
            <p className="text-[11px] text-slate-400">Strict Single-Use Pass Verification</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-amber-500/30 px-3 py-1.5 rounded-xl">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 font-mono">
              {totalAdmittedOnDevice} Admitted
            </span>
          </div>
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
              {/* Camera Stream Viewport */}
              <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-black/80 border border-white/10 flex items-center justify-center">
                {/* HTML5 QR Code Mount Node */}
                <div id="reader" className="w-full h-full" />

                {/* Loading / Warming up state */}
                {cameraStatus === 'init' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-amber-400 text-xs">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span>Opening Camera Stream...</span>
                  </div>
                )}

                {/* Error Banner state */}
                {cameraStatus === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90 text-slate-300 space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-400" />
                    <p className="text-xs leading-relaxed">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {/* Viewfinder Target & Laser (when camera is running) */}
                {cameraStatus === 'running' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Viewfinder Frame */}
                    <div className="relative w-64 h-64 border-2 border-amber-400/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      {/* Corner Brackets */}
                      <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                      <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                      <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                      <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#fbbf24] animate-laser" />
                    </div>
                  </div>
                )}
              </div>

              {/* Controls: Switch Camera & Scan Photo */}
              <div className="flex items-center justify-between gap-2 text-xs">
                {cameras.length > 1 ? (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all active:scale-95 text-[11px]"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Flip Camera</span>
                  </button>
                ) : (
                  <div className="flex-1 text-[11px] text-slate-400 flex items-center gap-1.5 px-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Gate Scanner</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all active:scale-95 text-[11px]"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                  <span>Scan QR Photo</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileScan}
                  className="hidden"
                />
              </div>

              {/* Manual ID Input Fallback */}
              <div className="pt-1">
                <div className="relative flex items-center justify-center my-2.5">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-[#150928] px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest absolute">
                    Or Enter Pass ID Manually
                  </span>
                </div>

                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="e.g. NRG-TEST-01 or NRG-1001"
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

              {/* Quick History Drawer Toggle */}
              {totalAdmittedOnDevice > 0 && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showHistory ? 'Hide Recent Scans' : 'View Recent Scans'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearLocalHistory}
                    className="flex items-center gap-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Reset device scan count"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              )}

              {/* Recent Scan History List */}
              {showHistory && totalAdmittedOnDevice > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-black/50 rounded-xl border border-white/10 text-xs">
                  {Object.values(checkedIns)
                    .slice(-6)
                    .reverse()
                    .map((item) => (
                      <div
                        key={item.ticketId}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
                      >
                        <div>
                          <p className="font-bold text-white text-[11px]">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {item.ticketId} • {item.scholarNo}
                          </p>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                          {item.time}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* Result Screen */
            <motion.div
              key="result-box"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6 text-center"
            >
              {/* SUCCESS: Access Granted (One-Time Admitted) */}
              {result.status === 'success' && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest rounded-full border border-emerald-500/30">
                      Access Granted • One-Time Entry
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 capitalize">
                      {result.name}
                    </h2>
                    <p className="text-emerald-400 text-xs font-mono font-bold mt-1">
                      {result.scholarNo} • {result.branch}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Pass ID: <span className="text-white font-bold">{result.ticketId}</span>
                    </p>
                  </div>
                  <div className="p-3.5 bg-emerald-950/40 rounded-2xl text-xs text-emerald-200 border border-emerald-500/30 space-y-1">
                    <p className="font-bold text-white">Checked In Successfully</p>
                    <p className="text-[11px] text-emerald-300/80">Admitted at {result.time}</p>
                    <p className="text-[10px] text-amber-300/90 font-semibold pt-1 border-t border-emerald-500/20">
                      ⚠️ This pass is now burned and cannot be scanned again.
                    </p>
                  </div>
                </div>
              )}

              {/* DUPLICATE: Entry Denied (Already Used) */}
              {result.status === 'duplicate' && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-600/25 border-2 border-red-500 mx-auto flex items-center justify-center animate-pulse">
                    <XCircle className="w-9 h-9 text-red-500" />
                  </div>
                  <div>
                    <span className="px-3.5 py-1 bg-red-500/20 text-red-300 text-xs font-black uppercase tracking-widest rounded-full border border-red-500/40">
                      Entry Denied • Pass Already Used
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-3 capitalize">
                      {result.name || 'Unknown Student'}
                    </h2>
                    {result.scholarNo && (
                      <p className="text-red-300 text-xs font-mono mt-1">
                        {result.scholarNo} • {result.branch}
                      </p>
                    )}
                    {result.ticketId && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Pass ID: <span className="text-white font-bold">{result.ticketId}</span>
                      </p>
                    )}
                  </div>

                  {/* Warning Details */}
                  <div className="p-4 bg-red-950/60 rounded-2xl text-xs text-red-200 border border-red-500/40 space-y-1.5 text-left">
                    <div className="flex items-center gap-1.5 text-red-400 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>DUPLICATE SCAN DETECTED</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {result.message}
                    </p>
                    <p className="text-[10px] text-amber-300/90 font-bold pt-1.5 border-t border-red-500/20">
                      ⛔ Security Rule: Each entry pass is strictly single-use. Re-entry or sharing pass screenshots is NOT permitted.
                    </p>
                  </div>
                </div>
              )}

              {/* INVALID / ERROR */}
              {(result.status === 'invalid' || result.status === 'error') && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 mx-auto flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <span className="px-3.5 py-1 bg-red-500/20 text-red-300 text-xs font-black uppercase tracking-widest rounded-full border border-red-500/40">
                      Entry Denied • Invalid Pass
                    </span>
                    <h2 className="text-xl font-bold text-white mt-3">Pass Not Found</h2>
                  </div>
                  <div className="p-3.5 bg-red-950/50 rounded-2xl text-xs text-red-200 border border-red-500/30">
                    <p>{result.message}</p>
                  </div>
                </div>
              )}

              <button
                onClick={resetScanner}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs tracking-wider uppercase"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scan Next Student</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Status */}
      <footer className="w-full max-w-md text-center text-xs text-slate-500 py-3 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>ECB Navrang 2026 Live Gatekeeper System</span>
      </footer>
    </div>
  );
}
