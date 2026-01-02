
import React, { useState, useEffect } from 'react';
import { Crown, Check, Zap, Music, Download, Globe, ShieldCheck, Star, X, ArrowRight, Clock, Lock, HelpCircle, Quote, Sparkles } from 'lucide-react';

interface ProLandingProps {
  onClose: () => void;
  onUpgrade: () => void;
}

export const ProLanding: React.FC<ProLandingProps> = ({ onClose, onUpgrade }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 1, minutes: 24, seconds: 54 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-[#050507] overflow-y-auto custom-scroll animate-in fade-in zoom-in-95 duration-500">
      {/* Dynamic Scarcity Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-400 text-black py-2.5 px-4 text-center text-[10px] font-black uppercase tracking-[0.3em] sticky top-0 z-[210] flex items-center justify-center gap-4 shadow-xl">
        <Sparkles className="w-3 h-3 animate-pulse" />
        Sconto Early Bird: -50% scade tra {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        <Sparkles className="w-3 h-3 animate-pulse" />
      </div>

      <button 
        onClick={onClose}
        className="fixed top-16 right-10 p-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all z-[220] backdrop-blur-md"
      >
        <X className="w-6 h-6 text-white/50" />
      </button>

      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl space-y-10 relative">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-white/10 rounded-full shadow-2xl">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[8px] font-black">U{i}</div>)}
            </div>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-2">+1,200 Producer Attivi</span>
          </div>

          <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.8]">
            Da Voce a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-400 to-indigo-500">Masterpiece.</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/40 max-w-2xl mx-auto leading-relaxed">
            Non lasciare che le tue idee evaporino. Trasformale in tracce MIDI professionali pronte per la tua DAW con un solo click.
          </p>

          <div className="flex flex-col items-center gap-6 pt-6">
            <button 
              onClick={onUpgrade}
              className="group relative px-12 py-7 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-base hover:scale-105 transition-all shadow-[0_20px_80px_rgba(255,255,255,0.15)] active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-200 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-4">PRENDI VOCALSYNTH PRO ORA <ArrowRight className="w-5 h-5" /></span>
            </button>
            <div className="flex items-center gap-6 opacity-30">
               <span className="text-[10px] font-black tracking-[0.3em] uppercase">Trusted by:</span>
               <div className="flex gap-4 font-black italic text-sm">
                  <span>BEATMAG</span>
                  <span>SYNTH-TECH</span>
                  <span>AUDIO-PRO</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Focus */}
      <section className="max-w-6xl mx-auto px-6 py-32 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
         <div className="space-y-8">
            <h2 className="text-4xl font-black text-white leading-tight uppercase tracking-tighter">Perché i professionisti<br/>scelgono la versione PRO?</h2>
            <div className="space-y-6">
               <div className="flex gap-6">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center shrink-0"><Download className="text-purple-400" /></div>
                  <div>
                     <h4 className="font-black text-white uppercase text-sm">Export MIDI 1:1</h4>
                     <p className="text-sm text-white/40">Niente più registrazioni audio sporche. Ottieni file MIDI puliti compatibili con Ableton, FL Studio e Logic.</p>
                  </div>
               </div>
               <div className="flex gap-6">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0"><Music className="text-amber-400" /></div>
                  <div>
                     <h4 className="font-black text-white uppercase text-sm">Sound Engine Esteso</h4>
                     <p className="text-sm text-white/40">Sblocca 50+ strumenti campionati in alta definizione (Piani Rhodes, Synth Bass, Lead Analogici).</p>
                  </div>
               </div>
               <div className="flex gap-6">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0"><Globe className="text-indigo-400" /></div>
                  <div>
                     <h4 className="font-black text-white uppercase text-sm">Offline Workstation</h4>
                     <p className="text-sm text-white/40">Produci ovunque. La versione PRO funziona al 100% senza internet una volta installata.</p>
                  </div>
               </div>
            </div>
         </div>
         <div className="glass p-2 rounded-[3rem] border-white/10 shadow-3xl bg-white/5">
            <div className="bg-zinc-950 rounded-[2.5rem] p-8 space-y-6">
               <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <span className="text-amber-500 font-black text-xs uppercase tracking-widest">Feedback Recente</span>
                  <div className="flex gap-1 text-amber-500"><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/></div>
               </div>
               <Quote className="w-10 h-10 text-white/10" />
               <p className="text-lg italic text-white/80 leading-relaxed">"Sostituisce ore di lavoro manuale in studio. Canticchio la melodia e ho già il MIDI pronto per il mio Massive X. Incredibile."</p>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full" />
                  <div>
                     <p className="text-xs font-black text-white uppercase">Davide R.</p>
                     <p className="text-[9px] text-white/30 uppercase">Ghost Producer @ Berlin</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Pricing Final Hook */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center space-y-12">
         <div className="space-y-4">
            <h3 className="text-5xl font-black text-white uppercase tracking-tighter">Investimento Minimo,<br/>Risultato Massimo.</h3>
            <p className="text-white/40">Un unico pagamento. Nessun abbonamento fastidioso.</p>
         </div>

         <div className="bg-zinc-900/50 border border-white/10 rounded-[4rem] p-12 space-y-8 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
            <div className="flex flex-col items-center gap-2">
               <span className="text-amber-500 font-black text-[10px] uppercase tracking-[0.4em]">One-Time Payment</span>
               <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-white">9.99€</span>
                  <span className="text-2xl text-white/20 line-through">19.99€</span>
               </div>
            </div>
            
            <button 
              onClick={onUpgrade}
              className="w-full py-7 bg-amber-500 hover:bg-amber-400 text-black rounded-3xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95"
            >
              ATTIVA LICENZA PRO ORA
            </button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 grayscale opacity-40">
               <div className="flex items-center gap-2 justify-center text-[8px] font-bold uppercase"><ShieldCheck className="w-3 h-3"/> Garanzia 30gg</div>
               <div className="flex items-center gap-2 justify-center text-[8px] font-bold uppercase"><Lock className="w-3 h-3"/> SSL Encrypted</div>
               <div className="flex items-center gap-2 justify-center text-[8px] font-bold uppercase"><Crown className="w-3 h-3"/> Accesso Lifetime</div>
               <div className="flex items-center gap-2 justify-center text-[8px] font-bold uppercase"><Check className="w-3 h-3"/> Supporto 24/7</div>
            </div>
         </div>
      </section>

      <footer className="py-20 text-center border-t border-white/5 space-y-4">
         <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">VocalSynth Pro © 2025 • Designed for Professionals</div>
      </footer>
    </div>
  );
};
