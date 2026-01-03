import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { InstrumentGrid } from './components/InstrumentGrid';
import { ProLanding } from './components/ProLanding';
import { MidiKeyboard } from './components/MidiKeyboard';
import { AudioEngine } from './services/audioEngine';
import { licenseService } from './services/licenseService'; // Assicurati che il percorso sia corretto
import { INSTRUMENTS } from './constants';
import { 
  Mic, Square, Save, Crown, Activity, Bluetooth, FolderArchive 
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [isPro, setIsPro] = useState(false);
  const [showSalesPage, setShowSalesPage] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0].id);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // --- FIX LICENZA: Eseguito al caricamento dell'app ---
  useEffect(() => {
    const proActive = licenseService.isProUser();
    setIsPro(proActive);

    audioEngineRef.current = new AudioEngine((midi, name) => {
      // Gestione aggiornamento note (UI)
    });
  }, []);

  const handleUpgrade = () => {
    licenseService.redirectToPayment();
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans">
      <Header isPro={isPro} onUpgradeClick={() => setShowSalesPage(true)} />
      
      {showSalesPage && (
        <ProLanding 
          onClose={() => setShowSalesPage(false)} 
          onUpgrade={handleUpgrade} 
        />
      )}

      <main className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
        <Visualizer 
          analyser={audioEngineRef.current?.getAnalyser() || null} 
          isActive={appState !== 'idle'} 
          activeColor="purple"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Bottone REC */}
          <button onClick={() => setAppState(appState === 'recording' ? 'idle' : 'recording')}
            className={`p-6 rounded-3xl font-bold flex items-center justify-center gap-2 ${appState === 'recording' ? 'bg-red-500' : 'bg-white text-black'}`}>
            {appState === 'recording' ? <Square size={20}/> : <Mic size={20}/>} REC
          </button>

          {/* Bottone LIVE */}
          <button onClick={() => setAppState(appState === 'live' ? 'idle' : 'live')}
            className={`p-6 rounded-3xl font-bold border flex items-center justify-center gap-2 ${appState === 'live' ? 'bg-purple-600 border-transparent' : 'border-white/10'}`}>
            <Activity size={20}/> LIVE
          </button>

          {/* --- BOTTONE FIX BLUETOOTH --- */}
          <button 
            onClick={() => audioEngineRef.current?.fixBluetooth()}
            className="p-6 rounded-3xl font-bold bg-zinc-900 border border-blue-500/30 text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-500/10">
            <Bluetooth size={20} className="animate-pulse" /> FIX BT
          </button>

          {/* Bottone SALVA */}
          <button className="p-6 rounded-3xl font-bold bg-zinc-900 border border-white/5 flex items-center justify-center gap-2">
            <Save size={20}/> MIDI
          </button>
        </div>

        <InstrumentGrid 
          selectedId={selectedInstrument} 
          onSelect={(id) => {
            const inst = INSTRUMENTS.find(i => i.id === id);
            if (inst?.isPro && !isPro) {
              setShowSalesPage(true);
            } else {
              setSelectedInstrument(id);
            }
          }}
          isLoading={false}
        />
      </main>
    </div>
  );
};

export default App;
