import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './Header';
import { Visualizer } from './Visualizer';
import { InstrumentGrid } from './InstrumentGrid';
import { ProLanding } from './ProLanding';
import { AudioEngine } from './audioEngine';
import { licenseService } from './licenseService';
import { RecordedNote } from './types';
import { INSTRUMENTS } from './constants';
import { exportMidi, downloadBlob } from './midiExport';
import { downloadProjectZip } from './sourceExporter';
import { 
  Mic, Square, Lock, FolderArchive, Save, Crown, Activity, Settings2
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0].id);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [lastSequence, setLastSequence] = useState<RecordedNote[]>([]);
  const [showSalesPage, setShowSalesPage] = useState(false);
  const [isPro, setIsPro] = useState(false); 
  
  const audioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    const init = async () => {
      const proStatus = await licenseService.isUserPro();
      setIsPro(proStatus);
    };
    init();

    audioEngineRef.current = new AudioEngine((midi, name) => {
      setCurrentNote(name);
    });
    audioEngineRef.current.loadInstrument(selectedInstrument);

    return () => audioEngineRef.current?.stopMic();
  }, []);

  const handleRec = async () => {
    if (appState === 'recording') {
      audioEngineRef.current?.stopMic();
      const seq = audioEngineRef.current?.getSequence() || [];
      setLastSequence(seq);
      setAppState('idle');
    } else {
      try {
        await audioEngineRef.current?.startMic('recording');
        setAppState('recording');
      } catch (e) {
        alert("Accesso al microfono negato.");
      }
    }
  };

  const handleExport = () => {
    if (!isPro) { setShowSalesPage(true); return; }
    if (lastSequence.length === 0) { alert("Registra prima una melodia!"); return; }
    
    const currentInst = INSTRUMENTS.find(i => i.id === selectedInstrument);
    const midiProgram = currentInst?.midiProgram || 0;
    
    const blob = exportMidi(lastSequence, midiProgram);
    downloadBlob(blob, `vocal_midi_${Date.now()}.mid`);
  };

  const activeColor = useMemo(() => 
    INSTRUMENTS.find(i => i.id === selectedInstrument)?.color || 'bg-purple-500'
  , [selectedInstrument]);

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      <Header onUpgradeClick={() => setShowSalesPage(true)} isPro={isPro} />
      
      {showSalesPage && (
        <ProLanding 
          onClose={() => setShowSalesPage(false)} 
          onUpgrade={() => {
            licenseService.activatePro();
            setIsPro(true);
            setShowSalesPage(false);
          }} 
        />
      )}
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 pb-32">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center glass p-6 rounded-[2rem] border-white/5 gap-4 shadow-2xl">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
               <Activity className="w-6 h-6 text-purple-500" />
             </div>
             <div>
               <h2 className="text-sm font-black uppercase tracking-widest text-white/90">Main Audio Engine</h2>
               <div className="flex items-center gap-2 mt-1">
                 <div className={`w-2 h-2 rounded-full ${appState !== 'idle' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                 <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">
                   {appState === 'recording' ? 'Recording Phase' : 'Idle / Monitoring'}
                 </span>
               </div>
             </div>
          </div>
          <button 
            onClick={downloadProjectZip}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95 shadow-lg"
          >
            <FolderArchive className="w-4 h-4" /> Export Source ZIP
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Visualizer analyser={audioEngineRef.current?.getAnalyser() || null} isActive={appState !== 'idle'} activeColor={activeColor} />
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleRec} 
                className={`p-10 rounded-[3rem] border transition-all flex flex-col items-center gap-4 group relative overflow-hidden ${
                  appState === 'recording' 
                    ? 'bg-red-500/10 border-red-500/40 active-glow' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                {appState === 'recording' ? (
                  <Square className="w-10 h-10 text-red-500 fill-red-500" />
                ) : (
                  <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  {appState === 'recording' ? 'Stop Recording' : 'Start Recording'}
                </span>
              </button>

              <button 
                onClick={handleExport} 
                className="p-10 rounded-[3rem] bg-white/5 border border-white/5 hover:border-white/10 flex flex-col items-center gap-4 relative transition-all group"
              >
                {!isPro && <Lock className="absolute top-6 right-8 w-4 h-4 text-amber-500" />}
                <Save className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Download MIDI</span>
              </button>
            </div>
          </div>

          <aside className="lg:col-span-4 glass p-10 rounded-[3.5rem] flex flex-col items-center justify-center text-center border-white/5 relative shadow-inner">
             <div className="absolute top-8 left-10 flex items-center gap-2 opacity-20">
               <Settings2 className="w-4 h-4" />
               <span className="text-[8px] font-black uppercase tracking-widest">Pitch Monitor</span>
             </div>
             <div className="text-[140px] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
               {currentNote || '--'}
             </div>
             <div className="mt-8 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
               <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Signal Detected</span>
             </div>
          </aside>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30">Sound Library</h2>
            {isPro && <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-2"><Crown className="w-3 h-3"/> Full Library Unlocked</span>}
          </div>
          <InstrumentGrid 
            selectedId={selectedInstrument} 
            onSelect={(id: string) => {
              const inst = INSTRUMENTS.find(i => i.id === id);
              if (inst?.isPro && !isPro) {
                setShowSalesPage(true);
                return;
              }
              setSelectedInstrument(id);
              audioEngineRef.current?.loadInstrument(id);
            }} 
          />
        </div>
      </main>
    </div>
  );
};

export default App;
