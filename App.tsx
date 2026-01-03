import React, { useState, useEffect, useRef } from 'react';
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
import { downloadProjectZip } from './services/projectExporter';
import { 
  Mic, Square, FolderArchive, Save, Crown, Activity, Settings2, Sliders, ChevronUp, ChevronDown
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

  // 1. OTTIMIZZAZIONE LICENZA: Controllo automatico al caricamento
  useEffect(() => {
    const isLicensed = licenseService.checkIsPro();
    setIsPro(isLicensed);
    
    // Inizializza l'engine audio
    audioEngineRef.current = new AudioEngine((midi, name) => {
      setActiveMidi(midi);
      setCurrentNote(name);
    });
  }, []);

  const toggleLive = async () => {
    if (appState === 'live') {
      audioEngineRef.current?.stop();
      setAppState('idle');
    } else {
      const success = await audioEngineRef.current?.startLive();
      if (success) setAppState('live');
    }
  };

  const startRecording = async () => {
    const success = await audioEngineRef.current?.startRecording();
    if (success) setAppState('recording');
  };

  const stopRecording = () => {
    const sequence = audioEngineRef.current?.stopRecording();
    if (sequence) setLastSequence(sequence);
    setAppState('idle');
  };

  const handleExportMidi = () => {
    if (lastSequence.length === 0) return;
    const inst = INSTRUMENTS.find(i => i.id === selectedInstrument);
    const blob = exportMidi(lastSequence, inst?.midiId || 0);
    downloadBlob(blob, `vocal-synth-${inst?.name.toLowerCase()}.mid`);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-purple-500/30">
      <Header isPro={isPro} onUpgradeClick={() => setShowSalesPage(true)} />
      
      {showSalesPage && (
        <ProLanding 
          onClose={() => setShowSalesPage(false)} 
          onUpgrade={() => licenseService.redirectToPayment()} 
        />
      )}

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visualizer & Controls */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative group">
            <Visualizer 
              analyser={audioEngineRef.current?.getAnalyser() || null} 
              isActive={appState !== 'idle'} 
              activeColor={INSTRUMENTS.find(i => i.id === selectedInstrument)?.color || 'bg-purple-500'}
            />
            
            <div className="absolute top-6 right-8 flex gap-3">
               <div className="glass px-4 py-2 rounded-2xl flex items-center gap-3 border-white/10">
                  <Activity className={`w-3 h-3 ${appState !== 'idle' ? 'text-green-400 animate-pulse' : 'text-white/20'}`} />
                  <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">
                    {appState === 'idle' ? 'System Ready' : `${appState} Mode`}
                  </span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={appState === 'recording' ? stopRecording : startRecording}
              className={`group flex items-center justify-center gap-4 p-6 rounded-[2rem] transition-all active:scale-95 ${
                appState === 'recording' 
                ? 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.3)]' 
                : 'bg-white text-black hover:bg-zinc-200 shadow-xl'
              }`}
            >
              {appState === 'recording' ? <Square className="fill-current" /> : <Mic className="group-hover:animate-bounce" />}
              <span className="font-black uppercase tracking-widest text-sm">
                {appState === 'recording' ? 'Stop Rec' : 'Start Rec'}
              </span>
            </button>

            <button
              onClick={toggleLive}
              className={`flex items-center justify-center gap-4 p-6 rounded-[2rem] transition-all active:scale-95 border ${
                appState === 'live'
                ? 'bg-purple-600 border-transparent text-white shadow-[0_0_40px_rgba(168,85,247,0.3)]'
                : 'bg-transparent border-white/10 text-white hover:bg-white/5'
              }`}
            >
              <Activity className={appState === 'live' ? 'animate-spin-slow' : ''} />
              <span className="font-black uppercase tracking-widest text-sm">Live Monitor</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleExportMidi}
                disabled={lastSequence.length === 0}
                className="flex-1 flex items-center justify-center gap-3 bg-zinc-900 border border-white/5 text-white p-6 rounded-[2rem] hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Save className="w-5 h-5" />
                <span className="font-black uppercase tracking-widest text-[10px]">MIDI</span>
              </button>
              <button
                onClick={downloadProjectZip}
                className="px-6 bg-zinc-900 border border-white/5 text-white rounded-[2rem] hover:bg-zinc-800 transition-all"
                title="Export Project"
              >
                <FolderArchive className="w-5 h-5" />
              </button>
            </div>
          </div>

          <MidiKeyboard 
            activeMidi={activeMidi} 
            activeColor={INSTRUMENTS.find(i => i.id === selectedInstrument)?.color || 'bg-purple-500'} 
          />
        </div>

        {/* Right Column: Settings & Instruments */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[2.5rem] p-8 border-white/5 space-y-8">
             <div className="flex items-center gap-3 opacity-50">
                <Settings2 className="w-4 h-4" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Engine Settings</h2>
             </div>

             <div className="space-y-6">
               <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Octave Shift</label>
                    <span className="text-xl font-mono font-black text-purple-400">{octaveShift > 0 ? `+${octaveShift}` : octaveShift}</span>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const next = Math.max(-2, octaveShift - 1);
                        setOctaveShift(next);
                        audioEngineRef.current?.setOctaveShift(next);
                      }}
                      className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        const next = Math.min(2, octaveShift + 1);
                        setOctaveShift(next);
                        audioEngineRef.current?.setOctaveShift(next);
                      }}
                      className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                 </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                 <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3 h-3 text-purple-500" />
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sensitivity</label>
                    </div>
                    <span className="text-xs font-mono font-bold text-white/60">{Math.round(sensitivity * 100)}%</span>
                 </div>
                 <input 
                   type="range" min="0.001" max="0.05" step="0.001" 
                   value={sensitivity}
                   onChange={(e) => {
                     const val = parseFloat(e.target.value);
                     setSensitivity(val);
                     audioEngineRef.current?.setSensitivity(val);
                   }}
                   className="w-full accent-purple-500 bg-white/5 h-1 rounded-full appearance-none cursor-pointer"
                 />
               </div>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30">Libreria Strumenti</h2>
              {isPro && <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-2"><Crown className="w-3 h-3"/> PRO Unlocked</span>}
            </div>
            <InstrumentGrid 
              selectedId={selectedInstrument} 
              isLoading={isLoadingInstrument}
              onSelect={async (id: string) => {
                const inst = INSTRUMENTS.find(i => i.id === id);
                if (inst?.isPro && !isPro) {
                  setShowSalesPage(true);
                  return;
                }
                setSelectedInstrument(id);
                setIsLoadingInstrument(true);
                await audioEngineRef.current?.loadInstrument(id);
                setIsLoadingInstrument(false);
              }} 
            />
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
