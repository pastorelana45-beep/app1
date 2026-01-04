import React from 'react';
import { Crown, Check, Download, Music, Globe, X, ArrowRight, Star, Sparkles, ShieldCheck, Lock } from 'lucide-react';

interface ProLandingProps {
  onClose: () => void;
  onUpgrade: () => void;
}

export const ProLanding: React.FC<ProLandingProps> = ({ onClose, onUpgrade }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-[#050507] overflow-y-auto animate-in fade-in duration-300">
      {/* Banner Sconto */}
      <div className="bg-amber-500 text-black py-2 px-4 text-center text-[10px] font-black uppercase tracking-widest sticky top-0 z-[210] flex items-center justify-center gap-3">
        <Sparkles className="w-3 h-3" /> Offerta Lancio: Sblocca tutto a metà prezzo <Sparkles className="w-3 h-3" />
      </div>

      <button onClick={onClose} className="fixed top-12 right-6 p-3 bg-white/5 rounded-full border border-white/10 z-[220] hover:bg-white/10 transition-all">
        <X className="w-6 h-6 text-white/50" />
      </button>

      <section className="pt-24 pb-20 px-6 text-center max-w-5xl mx-auto space-y-12">
        <div className="inline-block px-4 py-2 bg-zinc-900 border border-white/10 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-4">
          Upgrade Professionale
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">
          Trasforma la tua Voce in <span className="text-purple-500">Oro MIDI.</span>
        </h1>

        <p className="text-xl text-white/40 max-w-2xl mx-auto leading-relaxed">
          Sblocca l'esportazione MIDI e oltre 50 strumenti professionali per portare le tue melodie vocali direttamente nella tua DAW.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left py-12">
          <div className="glass p-8 rounded-3xl border-white/5 space-y-4">
            <Download className="text-purple-500 w-8 h-8" />
            <h3 className="font-black uppercase text-sm">Export MIDI</h3>
            <p className="text-xs text-white/40 leading-relaxed">Scarica file .mid puliti e pronti per Ableton, Logic o FL Studio. Niente più latenza audio.</p>
          </div>
          <div className="glass p-8 rounded-3xl border-white/5 space-y-4">
            <Music className="text-amber-500 w-8 h-8" />
            <h3 className="font-black uppercase text-sm">50+ Strumenti</h3>
            <p className="text-xs text-white/40 leading-relaxed">Sblocca Piani, Lead, Synth Bass e Archi campionati in alta fedeltà.</p>
          </div>
          <div className="glass p-8 rounded-3xl border-white/5 space-y-4">
            <Globe className="text-blue-500 w-8 h-8" />
            <h3 className="font-black uppercase text-sm">Full Offline</h3>
            <p className="text-xs text-white/40 leading-relaxed">La versione Pro salva tutti i campioni in locale. Componi ovunque senza internet.</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-900 to-black p-12 rounded-[4rem] border border-white/10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-black">9.99€</span>
              <span className="text-xl text-white/20 line-through italic">19.99€</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Pagamento unico • Accesso illimitato</p>
          </div>

          <button onClick={onUpgrade} className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl">
            Attiva Licenza Pro Ora
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 opacity-30 grayscale text-[8px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2 justify-center"><ShieldCheck className="w-3 h-3"/> Sicuro</div>
            <div className="flex items-center gap-2 justify-center"><Lock className="w-3 h-3"/> SSL 256bit</div>
            <div className="flex items-center gap-2 justify-center"><Crown className="w-3 h-3"/> Lifetime</div>
            <div className="flex items-center gap-2 justify-center"><Check className="w-3 h-3"/> Instantaneo</div>
          </div>
        </div>
      </section>
    </div>
  );
};