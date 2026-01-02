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
  Mic, Square, Lock, Save, Crown, Activity, Settings2, Sliders, ChevronUp, ChevronDown, Play
} from 'lucide-react';

const App: React.FC = () => {
  // --- STATI ---
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

  // --- INIZIALIZZAZIONE (Solo al montaggio) ---
  useEffect(() => {
    const init = async () => {
      // 1. Controllo Licenza / Successo Pagamento
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        await licenseService.activatePro();
        setIsPro(true);
        // Pulisce l'URL dai parametri Stripe
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        const proStatus = await licenseService.isUserPro();
        setIsPro(proStatus);
      }
      
      // 2. Creazione Engine Audio (Una sola istanza)
      audioEngineRef.current = new AudioEngine((midi, name) => {
        setCurrentNote(name);
        setActiveMidi(midi);
      });
      
      // 3. Caricamento primo strumento
      setIsLoadingInstrument(true);
      await audioEngineRef.current.loadInstrument(selectedInstrument);
      setIsLoadingInstrument(false);
    };

    init();

    // Cleanup allo smontaggio del componente
    return () => {
      audioEngineRef.current?.stopMic();
    };
  }, []);

  // --- HANDLERS ---

  // Gestione cambio strumento (Richiamata dalla griglia)
  const handleInstrumentChange = async (id: string) => {
    const inst = INSTRUMENTS.find(i => i.id === id);
    
    // Controllo se lo strumento è Pro
    if (inst?.isPro && !isPro) {
      setShowSalesPage(true);
      return;
    }

    setSelectedInstrument(id);
    setIsLoadingInstrument(true);
    
    if (audioEngineRef.current) {
      await audioEngineRef.current.loadInstrument(id);
    }
    
    setIsLoadingInstrument(false);
  };

  const handleRec = async () => {
    if (appState === 'recording') {
      audioEngineRef.current?.stopMic();
      const seq = audioEngineRef.current?.getSequence() || [];
      setLastSequence(seq);
      setAppState('idle');
    } else {
      if (appState === 'live') audioEngineRef.current?.stopMic();
      try {
        await audioEngineRef.current?.startMic('recording');
        setAppState('recording');
      } catch (e) {
        alert("Accesso al microfono richiesto per registrare.");
      }
    }
  };

  const handleLiveMode = async () => {
    if (appState === 'live') {
      audioEngineRef.current?.stopMic();
      setAppState('idle');
    } else {
      if (appState === 'recording') audioEngineRef.current?.stopMic();
      try {
        await audioEngineRef.current?.startMic('live');
        setAppState('live');
      } catch (e) {
        alert("Accesso al microfono richiesto per la modalità Live.");
      }
    }
  };

  const handlePlayLast = () => {
    if (lastSequence.length === 0) {
      alert("Nessuna sequenza registrata. Canta qualcosa prima!");
      return;
    }
    // Esegue la sequenza tramite l'engine
    audioEngineRef.current?.playSequence(lastSequence);
  };

  const handleExport = () => {
    if (!isPro) {
      setShowSalesPage(true);
      return;
    }
    if (lastSequence.length === 0) {
      alert("Registra una melodia prima di esportare.");
      return;
    }
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

  // Calcolo colore attivo basato sullo strumento
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
            // Sostituire con il proprio link Stripe reale
            window.location.href = 'https://buy.stripe.com/9B68wQ9EaaU7cW13C7frW01';
          }} 
        />
      )}
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 pb-32">
        
        {/* TOP BAR: STATO E CONTROLLI OTTARE */}
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
                <button onClick={() => handleOctaveChange(-1)} className="p-1 hover:text-purple-400"><ChevronDown className="w-4 h-4" /></button>
                <span className="text-xs font-black min-w-[15px] text-center">{octaveShift}</span>
                <button onClick={() => handleOctaveChange(1)} className="p-1 hover:text-purple-400"><ChevronUp className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN SECTION: VISUALIZER E CONTROLLI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            
            <Visualizer 
              analyser={audioEngineRef.current?.getAnalyser() || null} 
              isActive={appState !== 'idle'} 
              activeColor={activeColor} 
            />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* REC */}
              <button 
                onClick={handleRec} 
                className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-3 ${appState === 'recording' ? 'bg-red-500/20 border-red-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                {appState === 'recording' ? <Square className="w-6 h-6 text-red-500" /> : <Mic className="w-6 h-6 text-white" />}
                <span className="text-[9px] font-black uppercase opacity-50">Registra</span>
              </button>

              {/* PLAYBACK */}
              <button 
                onClick={handlePlayLast} 
                disabled={lastSequence.length === 0 || appState !== 'idle'}
                className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-3 bg-white/5 border-white/5 ${lastSequence.length === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10 active:scale-95'}`}
              >
                <Play className={`w-6 h-6 ${lastSequence.length > 0 ? 'text-green-500' : 'text-white'}`} />
                <span className="text-[9px] font-black uppercase opacity-50">Play</span>
              </button>

              {/* LIVE MODE */}
              <button 
                onClick={handleLiveMode} 
                className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-3 ${appState === 'live' ? 'bg-purple-500/20 border-purple-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <Sliders className={`w-6 h-6 ${appState === 'live' ? 'text-purple-500' : 'text-white'}`} />
                <span className="text-[9px] font-black uppercase opacity-50">Live</span>
              </button>

              {/* EXPORT */}
              <button 
                onClick={handleExport} 
                className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-3 relative hover:bg-white/10 transition-all"
              >
                {!isPro && <Lock className="absolute top-4 right-6 w-3 h-3 text-amber-500" />}
                <Save className="w-6 h-6 text-white" />
                <span className="text-[9px] font-black uppercase opacity-50">Esporta MIDI</span>
              </button>
            </div>

            <MidiKeyboard activeMidi={activeMidi} activeColor={activeColor} />
          </div>

          {/* SIDEBAR: NOTE DISPLAY E SENSITIVITY */}
          <aside className="lg:col-span-4 glass p-8 rounded-[3rem] flex flex-col items-center justify-center text-center border-white/5 relative h-full min-h-[400px]">
             <div className="text-[140px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 leading-none">
               {currentNote || '--'}
             </div>
             <div className="mt-12 w-full space-y-4">
               <span className="text-[10px] font-black uppercase opacity-30 tracking-widest">Input Sensitivity</span>
               <div className="pt-2 space-y-4">
                 <input 
                   type="range" 
                   min="0.001" 
                   max="0.05" 
                   step="0.001" 
                   value={sensitivity} 
                   onChange={(e) => {
                     const val = parseFloat(e.target.value);
                     setSensitivity(val);
                     audioEngineRef.current?.setSensitivity(val);
                   }} 
                   className="w-full accent-purple-500 cursor-pointer" 
                 />
               </div>
             </div>
          </aside>
        </div>

        {/* INSTRUMENT SELECTION */}
        <div className="space-y-6">
          <InstrumentGrid 
            selectedId={selectedInstrument} 
            isLoading={isLoadingInstrument}
            onSelect={handleInstrumentChange} 
          />
        </div>
      </main>
    </div>
  );
};

export default App; // Esportazione pulita senza commenti errati
