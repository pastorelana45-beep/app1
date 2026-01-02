
import React from 'react';

interface MidiKeyboardProps {
  activeMidi: number | null;
  activeColor: string;
}

export const MidiKeyboard: React.FC<MidiKeyboardProps> = ({ activeMidi, activeColor }) => {
  // Range C3 (48) a C6 (84)
  const startMidi = 48;
  const endMidi = 84;
  const keys = [];

  for (let m = startMidi; m <= endMidi; m++) {
    const isBlack = [1, 3, 6, 8, 10].includes(m % 12);
    const isActive = activeMidi === m;
    
    keys.push(
      <div
        key={m}
        className={`relative flex-1 h-28 border-r border-black/10 last:border-0 transition-all duration-150 ${
          isBlack 
            ? 'bg-zinc-900 h-16 -mx-3 z-10 rounded-b-md border-x border-black/60 shadow-lg' 
            : 'bg-[#fafafa] z-0 rounded-b-xl border-t-2 border-zinc-200'
        } ${isActive ? (isBlack ? 'bg-purple-600' : 'bg-purple-400') : ''} group overflow-hidden`}
      >
        {isActive && (
          <div className={`absolute inset-0 opacity-40 blur-md bg-white animate-pulse`} />
        )}
        
        {/* Label per tasti C */}
        {!isBlack && m % 12 === 0 && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-black/20 uppercase">
            C{Math.floor(m / 12) - 1}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-[#030305] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative">
      {/* Glossy top bar */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/5 to-transparent rounded-t-[2.5rem]" />
      
      <div className="flex items-center justify-between mb-5 px-2">
        <div className="flex flex-col">
          <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Studio Monitor: MIDI Map</h3>
          <p className="text-[7px] text-white/10 uppercase tracking-widest mt-0.5">Range: C3 (48) — C6 (84)</p>
        </div>
        {activeMidi ? (
          <div className="px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 animate-pulse">
            <span className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest">Signal Detected: {activeMidi}</span>
          </div>
        ) : (
          <span className="text-[9px] font-mono text-white/5 uppercase tracking-widest">No MIDI Input</span>
        )}
      </div>

      <div className="flex relative px-4 py-2 bg-zinc-950 rounded-2xl shadow-inner border border-white/5 overflow-hidden">
        {keys}
      </div>
    </div>
  );
};
