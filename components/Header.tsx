
import React, { useState } from 'react';
import { Mic, Music, Settings, Info, Share2, Check, Crown, Sparkles } from 'lucide-react';

interface HeaderProps {
  onUpgradeClick: () => void;
  isPro: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onUpgradeClick, isPro }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VocalSynth Pro',
          text: 'Trasforma la tua voce in MIDI con questa workstation professionale!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Errore condivisione:', err);
      }
    } else {
      copyLink();
    }
  };

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-4 border-b border-white/10 glass sticky top-0 z-50 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center glow-purple">
          <Music className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">VocalSynth<span className="text-purple-400">Pro</span></h1>
          <p className="text-[10px] text-white/50 mono tracking-widest uppercase">Hybrid Offline Station</p>
        </div>
      </div>

      <nav className="hidden lg:flex items-center gap-8">
        <button className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors border-b-2 border-purple-500 pb-1">
          <Mic className="w-4 h-4" /> Studio
        </button>
        <button className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white transition-colors pb-1">
          <Settings className="w-4 h-4" /> MIDI Setup
        </button>
        {!isPro && (
          <button 
            onClick={onUpgradeClick}
            className="group flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors pb-1 relative"
          >
            <Crown className="w-4 h-4" /> Upgrade Pro
            <span className="absolute -top-3 -right-6 px-1.5 py-0.5 bg-red-600 text-white text-[7px] font-black rounded-full animate-bounce">-50%</span>
          </button>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {!isPro ? (
          <button 
            onClick={onUpgradeClick}
            className="relative group flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black rounded-xl text-xs font-black transition-all active:scale-95 shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:bg-white"
          >
            <Sparkles className="w-3.5 h-3.5" />
            SBLOCCA PRO
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[10px] font-black text-purple-400">
            <Check className="w-3 h-3" /> LICENZA PRO ATTIVA
          </div>
        )}
        
        <button 
          onClick={copyLink}
          className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all"
          title="Copia Link App"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
