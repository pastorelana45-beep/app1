
import React, { useState, useMemo } from 'react';
import { Instrument } from '../types';
import { INSTRUMENTS } from '../constants';
import { Layers, Loader2, Crown, Lock } from 'lucide-react';

interface InstrumentGridProps {
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export const InstrumentGrid: React.FC<InstrumentGridProps> = ({ 
  selectedId, 
  onSelect, 
  isLoading
}) => {
  const [filter, setFilter] = useState('All');

  const categories = useMemo(() => {
    return ['All', ...new Set(INSTRUMENTS.map(i => i.category))];
  }, []);

  const filteredInstruments = useMemo(() => {
    if (filter === 'All') return INSTRUMENTS;
    return INSTRUMENTS.filter(i => i.category === filter);
  }, [filter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest ${
              filter === cat 
                ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' 
                : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[480px] overflow-y-auto pr-2 custom-scroll">
        {filteredInstruments.map((inst: any) => {
          const isSelected = selectedId === inst.id;
          
          return (
            <button
              key={inst.id}
              onClick={() => onSelect(inst.id)}
              disabled={isLoading}
              className={`relative group p-5 rounded-[2rem] border transition-all duration-300 flex flex-col items-center gap-3 focus:outline-none active:scale-95 ${
                isSelected 
                  ? 'bg-purple-600/10 border-purple-500/50 shadow-2xl shadow-purple-900/10' 
                  : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
              }`}
            >
              {inst.isPro && (
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-amber-500 rounded-full shadow-lg z-10">
                  <Crown className="w-2.5 h-2.5 text-white" />
                  <span className="text-[7px] font-black text-white uppercase">PRO</span>
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isSelected ? inst.color : 'bg-zinc-800'} transition-all shadow-lg group-hover:scale-110 relative`}>
                {isLoading && isSelected ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                ) : (
                  <Layers className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-zinc-600'}`} />
                )}
              </div>
              
              <div className="text-center w-full">
                <p className={`text-xs font-black truncate px-1 tracking-tight ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{inst.name}</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">{inst.category}</p>
              </div>

              {isSelected && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
