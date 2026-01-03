
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header.tsx';
import { Visualizer } from './Visualizer.tsx';
import { InstrumentGrid } from './InstrumentGrid.tsx';
import { MidiKeyboard } from './MidiKeyboard.tsx';
import { AudioEngine } from './audioEngine.ts';
import { INSTRUMENTS } from './constants.ts';
import { exportMidi, downloadBlob } from './midiExport.ts';
import { ProLanding } from './ProLanding.tsx';
import { licenseService } from './licenseService.ts';
import { 
  Mic, Square, Save, Activity, ChevronUp, ChevronDown, Play, Loader2, Music
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0].id);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [octaveShift, setOctaveShift] = useState(0);
  const [sensitivity, setSensitivity] = useState(0.01);
  const [isLoadingInstrument, setIsLoadingInstrument] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showProLanding, setShowProLanding] = useState(false);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    const checkPro = async () => {
      const pro = await licenseService.isUserPro();
      setIsPro(pro);
    };
    checkPro();

    const engine = new AudioEngine((midi, name) => {
      setCurrentNote(name);
      setActiveMidi(midi);
    });
    audioEngineRef.current = engine;
    
    const loadInitial = async () => {
      setIsLoadingInstrument(true);
      await engine.loadInstrument(selectedInstrument);
      setIsLoadingInstrument(false);
    };
    loadInitial();

    return () => {
      audioEngineRef.current?.stopMic();
    };
  }, []);

  const handleInstrumentChange = async (id: string) => {
    setSelectedInstrument(id);
    setIsLoadingInstrument(true);
    await audioEngineRef.current?.loadInstrument(id);
    setIsLoadingInstrument(false);
  };

  const handleRec = async () => {
    if (appState === 'recording') {
      audioEngineRef.current?.stopMic();
      setAppState('idle');
    } else {
      try {
        if (appState === 'live') audioEngineRef.current?.stopMic();
        await audioEngineRef.current?.startMic('recording');
        setAppState('recording');
      } catch (e) {
        alert("Microfono necessario per registrare.");
      }
    }
  };

  const handleLiveMode = async () => {
    if (appState === 'live') {
      audioEngineRef.current?.stopMic();
      setAppState('idle');
    } else {
      try {
        if (appState === 'recording') audioEngineRef.current?.stopMic();
        await audioEngineRef.current?.startMic('live');
        setAppState('live');
      } catch (e) {
        alert("Microfono necessario per il monitor live.");
      }
    }
  };

  const handlePreview = () => {
    if (appState !== 'idle') return;
    audioEngineRef.current?.previewSequence();
  };

  const handleExport = () => {
    if (!isPro) {
      setShowProLanding(true);
      return;
    }
    const seq = audioEngineRef.current?.getSequence() || [];
    if (seq.length === 0) {
      alert("Registra qualcosa prima di esportare.");
      return;
    }
    const inst = INSTRUMENTS.find(i => i.id === selectedInstrument);
    const blob = exportMidi(seq, inst?.midiProgram || 0);
    downloadBlob(blob, `vocal_midi_${Date.now()}.mid`);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      <Header 
        isPro={isPro} 
        onUpgradeClick={() => setShowProLanding(true)} 
        onGeneratePromo={() => alert("Funzionalità Cinema Pro in arrivo!")}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* TOP PANEL: Scope & Keyboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Visualizer 
              analyser={audioEngineRef.current?.getAnalyser() || null} 
              isActive={appState !== 'idle'} 
              activeColor="purple"
            />
            <MidiKeyboard activeMidi={activeMidi} activeColor="purple" />
          </div>

          {/* CONTROLS SIDEBAR */}
          <div className="glass p-8 rounded-[3rem] border-white/5 space-y-10 shadow-2xl">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Studio Controls</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleRec}
                  className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 border ${
                    appState === 'recording' 
                      ? 'bg-red-600 border-red-500 shadow-lg shadow-red-600/20' 
                      : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  {appState === 'recording' ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                  <span className="text-xs font-black uppercase tracking-widest">
                    {appState === 'recording' ? 'Stop Recording' : 'Start Recording'}
                  </span>
                </button>

                <button 
                  onClick={handleLiveMode}
                  className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 border ${
                    appState === 'live' 
                      ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-600/20' 
                      : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  <Activity className={`w-5 h-5 ${appState === 'live' ? 'animate-pulse' : ''}`} />
                  <span className="text-xs font-black uppercase tracking-widest">Live Monitor</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handlePreview}
                    disabled={appState !== 'idle'}
                    className="py-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-20"
                  >
                    <Play className="w-3 h-3 fill-current" /> Preview
                  </button>
                  <button 
                    onClick={handleExport}
                    className="py-4 bg-amber-500 text-black rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                  >
                    <Save className="w-3 h-3" /> Export MIDI
                  </button>
                </div>
              </div>
            </div>

            {/* SETTINGS */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Pitch Shift</span>
                  <span className="text-[9px] text-white/20 font-mono">Octave adjustment</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                  <button 
                    onClick={() => {
                      const newShift = octaveShift - 1;
                      setOctaveShift(newShift);
                      audioEngineRef.current?.setOctaveShift(newShift);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-xs font-black font-mono">{octaveShift > 0 ? '+' : ''}{octaveShift}</span>
                  <button 
                    onClick={() => {
                      const newShift = octaveShift + 1;
                      setOctaveShift(newShift);
                      audioEngineRef.current?.setOctaveShift(newShift);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Sensibilità Ingresso</span>
                  <span className="text-[9px] font-mono text-purple-400">{(sensitivity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.001" 
                  max="0.1" 
                  step="0.001" 
                  value={sensitivity} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSensitivity(val);
                    audioEngineRef.current?.setSensitivity(val);
                  }}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* INSTRUMENT LIBRARY */}
        <div className="space-y-4">
          <InstrumentGrid selectedId={selectedInstrument} onSelect={handleInstrumentChange} />
        </div>
      </main>

      {/* FOOTER STATS */}
      <footer className="p-6 border-t border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${appState === 'idle' ? 'bg-zinc-600' : 'bg-green-500 animate-pulse'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Engine Status: {appState}</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <Music className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
              {isLoadingInstrument ? 'Loading Samples...' : 'System Ready'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentNote && (
            <div className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
               <span className="text-[10px] font-black font-mono text-purple-400">NOTE: {currentNote} (MIDI: {activeMidi})</span>
            </div>
          )}
        </div>
      </footer>

      {showProLanding && (
        <ProLanding 
          onClose={() => setShowProLanding(false)} 
          onUpgrade={() => {
            licenseService.activatePro();
            setIsPro(true);
            setShowProLanding(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
