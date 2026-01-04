
import React, { useState, useMemo } from 'react';
import { INSTRUMENTS } from '../constants.ts';
import { Music, Crown, Loader2, Lock } from 'lucide-react';

export const InstrumentGrid = ({ selectedId, onSelect, isLoading, isProUser }: any) => {
  const [activeCat, setActiveCat] = useState('All');
  
  const categories = useMemo(() => ['All', ...new Set(INSTRUMENTS.map(i => i.category))], []);
  
  const filtered = useMemo(() => 
    activeCat === 'All' ? INSTRUMENTS : INSTRUMENTS.filter(i => i.category === activeCat)
  , [activeCat]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Sound Library</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                activeCat === cat 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' 
                  : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map(inst => (
          <button 
            key={inst.id} 
            onClick={() => onSelect(inst.id)} 
            className={`p-6 rounded-[2.5rem] border flex flex-col items-center gap-4 transition-all relative group ${
              selectedId === inst.id 
                ? 'bg-purple-600/10 border-purple-500/50 shadow-2xl ring-1 ring-purple-500/30' 
                : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
            }`}
          >
            {inst.isPro && !isProUser && (
              <div className="absolute top-4 left-6 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-500/50" />
                <span className="text-[6px] font-black text-amber-500/50 uppercase">Pro</span>
              </div>
            )}

            {inst.isPro && isProUser && (
              <div className="absolute top-4 left-6">
                <Crown className="w-2.5 h-2.5 text-amber-500" />
              </div>
            )}
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${
              selectedId === inst.id ? inst.color : 'bg-zinc-800'
            }`}>
              {isLoading && selectedId === inst.id ? (
                <Loader2 className="animate-spin w-5 h-5 text-white" />
              ) : (
                <Music className={`w-6 h-6 ${selectedId === inst.id ? 'text-white' : 'text-zinc-600'}`} />
              )}
            </div>
            
            <div className="text-center w-full">
              <p className={`text-[10px] font-black uppercase tracking-tighter truncate px-2 ${
                selectedId === inst.id ? 'text-white' : 'text-white/60'
              }`}>
                {inst.name}
              </p>
              <p className="text-[8px] opacity-20 font-bold uppercase tracking-widest mt-1">{inst.category}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
