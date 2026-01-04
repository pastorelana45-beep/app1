
import React from 'react';
import { Music, Share2, Video } from 'lucide-react';

interface HeaderProps {
  onUpgradeClick: () => void;
  isPro: boolean;
  onGeneratePromo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onUpgradeClick, isPro, onGeneratePromo }) => (
  <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 glass sticky top-0 z-[60]">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[1rem] flex items-center justify-center shadow-lg shadow-purple-500/20">
        <Music className="text-white w-7 h-7" />
      </div>
      <div>
        <h1 className="text-xl font-black text-white tracking-tighter">VocalSynth<span className="text-purple-400">Pro</span></h1>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-white/30 uppercase font-black tracking-[0.3em]">Studio Workstation</span>
          {isPro && <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black uppercase">Licensed</span>}
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      {/* Cinema button for Gemini Veo integration */}
      <button 
        onClick={onGeneratePromo}
        className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-purple-400 hover:bg-purple-500/20 transition-all active:scale-95 group shadow-lg"
        title="Genera Video Promo per Social"
      >
        <Video className="w-4 h-4 group-hover:animate-pulse" />
        <span className="hidden sm:inline">Cinema</span>
      </button>

      {!isPro && (
        <button 
          onClick={onUpgradeClick} 
          className="px-6 py-2.5 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white active:scale-95 shadow-lg shadow-amber-500/10"
        >
          Go Pro
        </button>
      )}
      
      <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/30 hover:text-white transition-all">
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  </header>
);
