import React from 'react';
import { Mic, Sliders, Music, Save, Play, X } from 'lucide-react';

interface TutorialProps {
  onClose: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const steps = [
    {
      icon: <Mic className="w-6 h-6 text-purple-500" />,
      title: "Canta o Fischia",
      desc: "L'app trasforma la tua voce in musica. Assicurati di essere in un ambiente silenzioso."
    },
    {
      icon: <Sliders className="w-6 h-6 text-blue-500" />,
      title: "Regola Sensibilità",
      desc: "Se l'app non ti sente, sposta lo slider della sensibilità verso sinistra. Se rileva troppo rumore, verso destra."
    },
    {
      icon: <Music className="w-6 h-6 text-green-500" />,
      title: "Scegli lo Strumento",
      desc: "Puoi trasformare la tua voce in un pianoforte, un synth o persino un flauto dalla griglia in basso."
    },
    {
      icon: <Play className="w-6 h-6 text-amber-500" />,
      title: "Live vs Record",
      desc: "Usa 'Live' per sentire lo strumento mentre canti. Usa 'Registra' per creare una melodia da esportare."
    },
    {
      icon: <Save className="w-6 h-6 text-red-500" />,
      title: "Esporta MIDI",
      desc: "Una volta registrata una sequenza, puoi scaricarla come file MIDI e usarla su Ableton, FL Studio o Logic."
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#12121a] border border-white/10 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
        {/* Decorazione Sfondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tighter">BENVENUTO</h2>
              <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Guida Rapida</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid gap-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4 items-start group">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-purple-500/30 transition-colors">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white/90">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-10 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/20"
          >
            Ho capito, iniziamo!
          </button>
        </div>
      </div>
    </div>
  );
};