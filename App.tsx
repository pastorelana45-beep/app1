import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { InstrumentGrid } from './components/InstrumentGrid';
import { ProLanding } from './components/ProLanding';
import { MidiKeyboard } from './components/MidiKeyboard';
import { AudioEngine } from './services/audioEngine';
import { licenseService } from './services/licenseService';
import { RecordedNote } from './types';
import { INSTRUMENTS } from './constants';
import { exportMidi, downloadBlob } from './services/midiExport';
import { 
  Mic, Square, Lock, Save, Crown, Activity, Settings2, Sliders, ChevronUp, ChevronDown
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0].id);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [lastSequence, setLastSequence] = useState<RecordedNote[]>([]);
  const [showSalesPage, setShowSalesPage] = useState(false);
  const [isPro, setIsPro] = useState(false); 
  const [octaveShift, setOctaveShift] = useState(0);
  const [sensitivity, setSensitivity] = useState(0.01);
  const [isLoadingInstrument, setIsLoadingInstrument] = useState(false);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    const init = async () => {
      // 1. Controllo se l'utente è appena tornato dal pagamento
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        await licenseService.activatePro();
        setIsPro(true);
        // Pulisce l'URL per togliere "?payment=success"
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Altrimenti controllo lo stato salvato
        const proStatus = await licenseService.isUserPro();
        setIsPro(proStatus);
      }
      
      audioEngineRef.current = new AudioEngine((midi, name) => {
        setCurrentNote(name);
        setActiveMidi(midi);
      });
      
      setIsLoadingInstrument(true);
      await audioEngineRef.current.loadInstrument(selectedInstrument);
      setIsLoadingInstrument(false);
    };
    init();

    return () => audioEngineRef.current?.stopMic();
  }, [selectedInstrument]);

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
        alert("Accesso al microfono richiesto.");
      }
    }
  };

  const handleLiveMode = async () => {
    if (appState === 'live') {
      audioEngineRef.current?.stopMic();
      setAppState('idle');
    } else {
      try {
        await audioEngineRef.current?.startMic('live');
        setAppState('live');
      } catch (e) {
        alert("Accesso al microfono richiesto.");
      }
    }
  };

  const handleExport = () => {
    if (!isPro) { setShowSalesPage(true); return; }
    if (lastSequence.length === 0) { alert("Registra una melodia prima di esportare."); return; }
    const currentInst = INSTRUMENTS.find(i => i.id === selectedInstrument);
    const midiProgram = currentInst?.midiProgram || 0;
    const blob = exportMidi(lastSequence, midiProgram);
    downloadBlob(blob, `vocal_synth_${Date.now()}.mid`);
  };

  const handleOctaveChange = (val: number) => {
    const newOct = Math.max(-2, Math.min(2, octaveShift + val));
    setOctaveShift(newOct);
    audioEngineRef.current?.setOctaveShift(newOct);
  };

  const activeColor = useMemo(() => 
    INSTRUMENTS.find(i => i.id === selectedInstrument)?.color || 'bg-purple-500'
  , [selectedInstrument]);

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col font-sans">
      <Header onUpgradeClick={() => setShowSalesPage(true)} isPro={isPro} />
      
      {showSalesPage && (
        <ProLanding 
          onClose={() => setShowSalesPage(false)} 
          onUpgrade={() => {
            // COLLEGAMENTO A STRIPE
            window.location.href = 'https://buy.stripe.com/9B68wQ9EaaU7cW13C7frW01';
          }} 
        />
      )}
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass p-6 rounded-[2rem] border-white/5 gap-4">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
               <Activity className="w-6 h-6 text-purple-500" />
             </div>
             <div>
               <h2 className="text-sm font-black uppercase tracking-widest text-white/90">Engine Status</h2>
               <div className="flex items-center gap-2 mt-1">
                 <div className={`w-2 h-2 rounded-full ${appState !== 'idle' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                 <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">
                   {appState === 'recording' ? 'Registrazione' : appState === 'live' ? 'Live' : 'Pronto'}
                 </span>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[9px] font-black opacity-30 uppercase mb-1">Octave</span>
              <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/5">
                <button onClick={() => handleOctaveChange(-1)} className="p-1"><ChevronDown className="w-4 h-4" /></button>
                <span className="text-xs font-black">{octaveShift}</span>
                <button onClick={() => handleOctaveChange(1)} className="p-1"><ChevronUp className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Visualizer analyser={audioEngineRef.current?.getAnalyser() || null} isActive={appState !== 'idle'} activeColor={activeColor} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={handleRec} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center gap-3 ${appState === 'recording' ? 'bg-red-500/10 border-red-500/40' : 'bg-white/5 border-white/5'}`}>
                {appState === 'recording' ? <Square className="w-8 h-8 text-red-500" /> : <Mic className="w-8 h-8 text-white" />}
                <span className="text-[9px] font-black uppercase opacity-50">Registra</span>
              </button>
              <button onClick={handleLiveMode} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center gap-3 ${appState === 'live' ? 'bg-purple-500/10 border-purple-500/40' : 'bg-white/5 border-white/5'}`}>
                <Sliders className={`w-8 h-8 ${appState === 'live' ? 'text-purple-500' : 'text-white'}`} />
                <span className="text-[9px] font-black uppercase opacity-50">Live</span>
              </button>
              <button onClick={handleExport} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-3 relative">
                {!isPro && <Lock className="absolute top-6 right-8 w-3 h-3 text-amber-500" />}
                <Save className="w-8 h-8 text-white" />
                <span className="text-[9px] font-black uppercase opacity-50">Esporta</span>
              </button>
            </div>
            <MidiKeyboard activeMidi={activeMidi} activeColor={activeColor} />
          </div>

          <aside className="lg:col-span-4 glass p-8 rounded-[3rem] flex flex-col items-center justify-center text-center border-white/5 relative h-full min-h-[400px]">
             <div className="text-[140px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10">
               {currentNote || '--'}
             </div>
             <div className="mt-12 w-full space-y-4">
               <div className="pt-8 space-y-4">
                 <input type="range" min="0.001" max="0.05" step="0.001" value={sensitivity} onChange={(e) => {
                     const val = parseFloat(e.target.value);
                     setSensitivity(val);
                     audioEngineRef.current?.setSensitivity(val);
                   }} className="w-full accent-purple-500" />
               </div>
             </div>
          </aside>
        </div>

        <div className="space-y-6">
          <InstrumentGrid 
            selectedId={selectedInstrument} 
            isLoading={isLoadingInstrument}
            onSelect={async (id: string) => {
              const inst = INSTRUMENTS.find(i => i.id === id);
              if (inst?.isPro && !isPro) { setShowSalesPage(true); return; }
              setSelectedInstrument(id);
              setIsLoadingInstrument(true);
              await audioEngineRef.current?.loadInstrument(id);
              setIsLoadingInstrument(false);
            }} 
          />
        </div>
      </main>
    </div>
  );
};

export default App;
