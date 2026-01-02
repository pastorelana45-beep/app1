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
  Mic, Square, Lock, Save, Activity, Sliders, ChevronUp, ChevronDown, Play, X, HelpCircle, Info
} from 'lucide-react';

// --- COMPONENTE TUTORIAL (Incluso nel file per comodità) ---
const Tutorial: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const steps = [
    {
      icon: <Mic className="w-6 h-6 text-purple-500" />,
      title: "Canta o Fischia",
      desc: "L'app trasforma la tua voce in musica. Il fischio è perfetto per melodie pulite."
    },
    {
      icon: <Sliders className="w-6 h-6 text-blue-500" />,
      title: "Regola Sensibilità",
      desc: "Se l'app non ti sente, sposta lo slider verso sinistra. Abbiamo ottimizzato il codice per rilevare anche fischi leggeri!"
    },
    {
      icon: <Play className="w-6 h-6 text-amber-500" />,
      title: "Live vs Registra",
      desc: "Usa 'Live' per suonare subito. 'Registra' per salvare la tua performance e scaricarla in MIDI."
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="bg-[#0a0a0f] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 relative shadow-2xl">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full" />
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tighter mb-2 italic">START CREATING</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Guida Rapida</p>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-5 items-start">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">{step.icon}</div>
                <div>
                  <h3 className="font-bold text-white/90 text-sm">{step.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-full mt-10 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/20">
            Iniziamo!
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPALE ---
const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0].id);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [lastSequence, setLastSequence] = useState<RecordedNote[]>([]);
  const [showSalesPage, setShowSalesPage] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isPro, setIsPro] = useState(false); 
  const [octaveShift, setOctaveShift] = useState(0);
  const [sensitivity, setSensitivity] = useState(0.002); // Sensibilità ottimizzata
  const [isLoadingInstrument, setIsLoadingInstrument] = useState(false);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    const init = async () => {
      // Controllo Tutorial
      const tutorialSeen = localStorage.getItem('vocal_synth_tutorial_seen');
      if (!tutorialSeen) setShowTutorial(true);

      // Controllo Licenza
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        await licenseService.activatePro();
        setIsPro(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        const proStatus = await licenseService.isUserPro();
        setIsPro(proStatus);
      }
      
      // Init Audio Engine
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
  }, []);

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
        alert("Accesso al microfono richiesto.");
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
        alert("Accesso al microfono richiesto.");
      }
    }
  };

  const handlePlayLast = () => {
    if (lastSequence.length === 0) return;
    audioEngineRef.current?.playSequence(lastSequence);
  };

  const handleExport = () => {
    if (!isPro) { setShowSalesPage(true); return; }
    if (lastSequence.length === 0) return;
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
    <div className="min-h-screen bg-[#050507] text-white flex flex-col font-sans selection:bg-purple-500/30">
      
      {showTutorial && <Tutorial onClose={() => {
        localStorage.setItem('vocal_synth_tutorial_seen', 'true');
        setShowTutorial(false);
      }} />}

      <Header onUpgradeClick={() => setShowSalesPage(true)} isPro={isPro} />
      
      {showSalesPage && (
        <ProLanding onClose={() => setShowSalesPage(false)} onUpgrade={() => {
          window.location.href = 'IL_TUO_LINK_STRIPE';
        }} />
      )}
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 pb-32">
        
        {/* TOP CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass p-6 rounded-[2.5rem] border-white/5 gap-4 shadow-2xl shadow-purple-500/5">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
               <Activity className="w-6 h-6 text-purple-500" />
             </div>
             <div>
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Engine Status</h2>
               <div className="flex items-center gap-2 mt-0.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${appState !== 'idle' ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-green-500'}`} />
                 <span className="text-[11px] font-black uppercase">
                   {appState === 'recording' ? 'Recording' : appState === 'live' ? 'Live Mode' : 'Ready'}
                 </span>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1.5">Octave</span>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-1.5 border border-white/5">
                <button onClick={() => handleOctaveChange(-1)} className="hover:text-purple-400 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                <span className="text-xs font-black min-w-[12px] text-center">{octaveShift}</span>
                <button onClick={() => handleOctaveChange(1)} className="hover:text-purple-400 transition-colors"><ChevronUp className="w-4 h-4" /></button>
              </div>
            </div>
            <button onClick={() => setShowTutorial(true)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
              <HelpCircle className="w-5 h-5 text-white/40" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Visualizer analyser={audioEngineRef.current?.getAnalyser() || null} isActive={appState !== 'idle'} activeColor={activeColor} />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button onClick={handleRec} className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-3 ${appState === 'recording' ? 'bg-red-500/20 border-red-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                {appState === 'recording' ? <Square className="w-6 h-6 text-red-500 fill-red-500" /> : <Mic className="w-6 h-6 text-white" />}
                <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">Registra</span>
              </button>

              <button onClick={handlePlayLast} disabled={lastSequence.length === 0 || appState !== 'idle'} className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-3 bg-white/5 border-white/5 ${lastSequence.length === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10 active:scale-95 shadow-lg shadow-green-500/5'}`}>
                <Play className={`w-6 h-6 ${lastSequence.length > 0 ? 'text-green-500 fill-green-500' : 'text-white'}`} />
                <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">Play</span>
              </button>

              <button onClick={handleLiveMode} className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-3 ${appState === 'live' ? 'bg-purple-500/20 border-purple-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                <Sliders className={`w-6 h-6 ${appState === 'live' ? 'text-purple-500' : 'text-white'}`} />
                <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">Live</span>
              </button>

              <button onClick={handleExport} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-3 relative hover:bg-white/10 transition-all">
                {!isPro && <Lock className="absolute top-4 right-6 w-3.5 h-3.5 text-amber-500" />}
                <Save className="w-6 h-6 text-white" />
                <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">Export MIDI</span>
              </button>
            </div>

            <MidiKeyboard activeMidi={activeMidi} activeColor={activeColor} />
          </div>

          <aside className="lg:col-span-4 glass p-10 rounded-[3.5rem] flex flex-col items-center justify-center text-center border-white/5 relative h-full min-h-[450px]">
             <div className="text-[140px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/5 leading-none select-none">
               {currentNote || '--'}
             </div>
             
             <div className="mt-16 w-full max-w-[200px] space-y-6">
               <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                   <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Sensibilità</span>
                   <Info className="w-3 h-3 opacity-20" />
                 </div>
                 <input 
                   type="range" min="0.0001" max="0.02" step="0.0001" 
                   value={sensitivity} 
                   onChange={(e) => {
                     const val = parseFloat(e.target.value);
                     setSensitivity(val);
                     audioEngineRef.current?.setSensitivity(val);
                   }} 
                   className="w-full accent-purple-500 cursor-none h-1.5 bg-white/5 rounded-full appearance-none" 
                 />
                 <p className="text-[8px] opacity-20 font-bold uppercase tracking-tighter">Sposta a sinistra per fischi leggeri</p>
               </div>
             </div>
          </aside>
        </div>

        <div className="pt-8">
          <InstrumentGrid 
            selectedId={selectedInstrument} 
            isLoading={isLoadingInstrument}
            onSelect={async (id) => {
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
```[[3](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQEqsaDL5J4i_HgcFGsRvirk-3NDpCmIo-rzit9ZrP28IvaT3ycATUmpfJ5zK_4piHl4MMdtjb1ttiruMw9D6sNjT1SoxfnmUGU4sz2yof8I2XSxsVhmMZKGKmw6IYgelppxFUsnT8wydw%3D%3D)][[4](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQEqbQA7LoKg1xQXFOcD5kW2XuBDFBIGokP-buhyVPFG6akViSKPIQ0P4aPJMGm9NKBgdesCLHxZTaWY_ewSJaJen6lWJlN9kh956auvyzI2qPShueoIL0vfCzCwtXhtOxJh9PEre9j506FSOmn7xhCC7fGnYElaoUauD9uqYuXVSxFwNP-rR0bd10OcJ_ihQIGAxbWcoFBuaYVH)]
