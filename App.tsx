import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { InstrumentGrid } from './components/InstrumentGrid';
import { ProLanding } from './components/ProLanding';
import { MidiKeyboard } from './components/MidiKeyboard';
import { AudioEngine } from './services/audioEngine';
import { licenseService } from './services/licenseService';
import { INSTRUMENTS } from './constants';
import { 
  Mic, Square, Save, Activity, Bluetooth, FolderArchive 
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [isPro, setIsPro] = useState(false);
  const [showSalesPage, setShowSalesPage] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0].id);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Inizializzazione Licenza ed Engine
  useEffect(() => {
    const active = licenseService.checkIsPro();
    setIsPro(active);

    audioEngineRef.current = new AudioEngine((midi) => {
      setActiveMidi(midi);
    });
  }, []);

  const toggleLive = async () => {
    if (appState === 'live') {
      audioEngineRef.current?.stop(); // Metodo ipotetico nell'engine
      setAppState('idle');
    } else {
      // Nota: startLive() deve essere implementato nel tuo audioEngine
      setAppState('live');
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <Header isPro={isPro} onUpgradeClick={() => setShowSalesPage(true)} />
      
      {showSalesPage && (
        <ProLanding 
          onClose={() => setShowSalesPage(false)} 
          onUpgrade={() => licenseService.redirectToPayment()} 
        />
      )}

      <main className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Visualizer con Analyser reale */}
        <Visualizer 
          analyser={audioEngineRef.current?.getAnalyser() || null} 
          isActive={appState !== 'idle'} 
          activeColor="purple"
        />

        {/* Console di Comando */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setAppState(appState === 'recording' ? 'idle' : 'recording')}
            className={`p-6 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all ${
              appState === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-white text-black'
            }`}
          >
            {appState === 'recording' ? <Square fill="currentColor" /> : <Mic />} REC
          </button>

          <button 
            onClick={toggleLive}
            className={`p-6 rounded-[2rem] font-black border flex items-center justify-center gap-3 transition-all ${
              appState === 'live' ? 'bg-purple-600 border-transparent' : 'border-white/10 hover:bg-white/5'
            }`}
          >
            <Activity /> LIVE
          </button>

          <button 
            onClick={() => audioEngineRef.current?.fixBluetooth()}
            className="p-6 rounded-[2rem] font-black bg-zinc-900 border border-blue-500/30 text-blue-400 flex items-center justify-center gap-3 hover:bg-blue-500/20"
          >
            <Bluetooth className="animate-pulse" /> FIX BT
          </button>

          <button className="p-6 rounded-[2rem] font-black bg-zinc-900 border border-white/5 flex items-center justify-center gap-3 hover:bg-zinc-800">
            <Save /> MIDI
          </button>
        </div>

        {/* Keyboard Visiva */}
        <MidiKeyboard activeMidi={activeMidi} activeColor="bg-purple-500" />

        {/* Griglia Strumenti */}
        <div className="pt-4 border-t border-white/5">
          <InstrumentGrid 
            selectedId={selectedInstrument} 
            onSelect={(id) => {
              const inst = INSTRUMENTS.find(i => i.id === id);
              if (inst?.isPro && !isPro) {
                setShowSalesPage(true);
              } else {
                setSelectedInstrument(id);
                audioEngineRef.current?.loadInstrument(id);
              }
            }}
            isLoading={false}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
