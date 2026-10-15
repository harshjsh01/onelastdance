'use client';

import { useState } from 'react';
import { verifyPasscode, logoutAdmin } from '@/app/actions';
import { Lock, ShieldCheck, KeyRound, Loader2, AlertCircle, Eye, EyeOff, LogOut } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface PasscodeLockProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

// Client-side SHA-256 hasher: ensures raw password never appears in network payload
async function hashPasscode(str: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function PasscodeLock({ title, subtitle, children }: PasscodeLockProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Initial check on mount: check sessionStorage or server cookie via verification test
  useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('navrang_gate_auth');
      if (stored === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Hash passcode locally so raw passcode never appears in Network tab
      const hashed = await hashPasscode(passcode.trim());

      // 2. Server verification
      const res = await verifyPasscode(hashed);

      if (res.success) {
        sessionStorage.setItem('navrang_gate_auth', 'true');
        setIsAuthenticated(true);
        setPasscode('');
      } else {
        setError(res.error || 'Invalid passcode.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('navrang_gate_auth');
    await logoutAdmin();
    setIsAuthenticated(false);
  };

  if (isAuthenticated === true) {
    return (
      <div className="relative">
        {/* Floating Logout Button */}
        <div className="fixed bottom-4 right-4 z-50 no-print">
          <button
            type="button"
            onClick={handleLogout}
            title="Lock & Log Out"
            className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/20 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Lock</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#090314] text-foreground relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_#260d47_0%,_#090314_80%)] -z-20" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-amber-500/10 blur-[140px] rounded-full -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm glass p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl space-y-6 text-center"
      >
        {/* Header Icon & Logo */}
        <div className="relative w-16 h-16 rounded-2xl bg-black/60 border border-amber-400/40 p-2 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Image
            src="/logo.png"
            alt="Navrang Logo"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md">
            <Lock className="w-3 h-3 stroke-[3]" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 ml-1 uppercase tracking-wider flex items-center justify-between">
              <span>Security Passcode</span>
              <span className="text-[10px] text-amber-400 font-normal">Authorized Personnel</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter authorized password"
                className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition-all text-white font-mono tracking-widest text-sm"
              />
              <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={!passcode || loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-wider"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{loading ? 'Authenticating...' : 'Unlock Access'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Navrang 2026 Zero-Exposure Protected Gate</span>
        </div>
      </motion.div>
    </div>
  );
}
