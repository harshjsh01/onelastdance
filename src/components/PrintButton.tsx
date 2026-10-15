'use client';

import { Printer, Download, Share2, Check } from 'lucide-react';
import { useState } from 'react';

export function PrintButton() {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Navrang 2026 Entry Pass',
          text: 'Here is my official entry pass for Navrang Dandiya & Garba Evening 2026!',
          url: window.location.href,
        });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full no-print">
      <button
        onClick={handlePrint}
        className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
      >
        <Printer className="w-4 h-4" />
        <span>Print / Save Pass</span>
      </button>

      <button
        onClick={handleShare}
        className="px-4 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        title="Share pass link"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span className="text-xs">Share</span>
          </>
        )}
      </button>
    </div>
  );
}
