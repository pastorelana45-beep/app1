
// @google/genai Coding Guidelines followed:
// 1. Used new GoogleGenAI({apiKey: process.env.API_KEY})
// 2. Used veo-3.1-fast-generate-preview for video generation
// 3. Implemented window.aistudio key selection check and handling
// 4. Followed operation polling and download link generation with API key

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { Visualizer } from './components/Visualizer.tsx';
import { InstrumentGrid } from './components/InstrumentGrid.tsx';
import { MidiKeyboard } from './components/MidiKeyboard.tsx';
import { AudioEngine } from './services/audioEngine.ts';
import { INSTRUMENTS } from './constants.ts';
import { downloadBlob, exportMidi } from './services/midiExport.ts';
import { ProLanding } from './components/ProLanding.tsx';
import { licenseService } from './services/licenseService.ts';
import { GoogleGenAI } from "@google/genai";
import { 
  Mic, Square, ChevronUp, ChevronDown, Loader2, Volume2, PlayCircle, Download, Settings, AlertCircle, Crown, Video
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0].id);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [octaveShift, setOctaveShift] = useState(0);
  const [sensitivity, setSensitivity] = useState(0.015);
  const [loadingInstrumentId, setLoadingInstrumentId] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [showProLanding, setShowProLanding] = useState(false);
  const [isEngineInitialized, setIsEngineInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<string | null>(null);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    // Check Pro License Status
    const checkLicense = async () => {
      const proStatus = await licenseService.isUserPro();
      setIsPro(proStatus);
    };
    checkLicense();

    const engine = new AudioEngine((midi) => setActiveMidi(midi));
    audioEngineRef.current = engine;
    return () => audioEngineRef.current?.stopMic();
  }, []);

  const initializeApp = async () => {
    if (!audioEngineRef.current) return;
    setError(null);
    setLoadingInstrumentId(selectedInstrument);
    try {
      await audioEngineRef.current.initAudio();
      const success = await audioEngineRef.current.loadInstrument(selectedInstrument);
      if (success) {
        setIsEngineInitialized(true);
      } else {
        setError("Errore caricamento suoni. Riprova.");
      }
    } catch (e) {
      setError("Errore accesso audio.");
    } finally {
      setLoadingInstrumentId(null);
    }
  };

  const handleInstrumentChange = async (id: string) => {
    const inst = INSTRUMENTS.find(i => i.id === id);
    
    // BLOCCO PRO: Se lo strumento è Pro e l'utente non lo è, apri landing
    if (inst?.isPro && !isPro) {
      setShowProLanding(true);
      return;
    }

    if (loadingInstrumentId) return;
    setError(null);
    setSelectedInstrument(id);
    setLoadingInstrumentId(id);
    if (audioEngineRef.current) {
      const success = await audioEngineRef.current.loadInstrument(id);
      if (!success) {
        setError(`Impossibile caricare ${inst?.name}.`);
      }
    }
    setLoadingInstrumentId(null);
  };

  const handleRec = async () => {
    if (!audioEngineRef.current) return;
    if (appState === 'recording') {
      audioEngineRef.current.stopMic();
      setAppState('idle');
    } else {
      try {
        await audioEngineRef.current.startMic('recording');
        setAppState('recording');
      } catch (e) { alert("Permesso microfono negato."); }
    }
  };

  const handleLiveMode = async () => {
    if (!audioEngineRef.current) return;
    if (appState === 'live') {
      audioEngineRef.current.stopMic();
      setAppState('idle');
    } else {
      try {
        await audioEngineRef.current.startMic('live');
        setAppState('live');
      } catch (e) { alert("Permesso microfono negato."); }
    }
  };

  const handleDownloadMidi = () => {
    if (!isPro) {
      setShowProLanding(true);
      return;
    }
    if (!audioEngineRef.current) return;
    const sequence = audioEngineRef.current.getSequence();
    if (sequence.length === 0) return alert("Nulla da esportare!");
    const inst = INSTRUMENTS.find(i => i.id === selectedInstrument);
    const blob = exportMidi(sequence, inst?.midiProgram || 0);
    downloadBlob(blob, `vocal_synth_${selectedInstrument}.mid`);
  };

  const handlePreview = () => {
    audioEngineRef.current?.previewSequence();
  };

  const adjustOctave = (delta: number) => {
    const newVal = Math.max(-3, Math.min(3, octaveShift + delta));
    setOctaveShift(newVal);
    audioEngineRef.current?.setOctaveShift(newVal);
  };

  const adjustSensitivity = (val: number) => {
    setSensitivity(val);
    audioEngineRef.current?.setSensitivity(val);
  };

  const handleGeneratePromo = async () => {
    try {
      if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
      }

      setIsGeneratingVideo(true);
      setVideoGenerationStatus("Preparing studio scene...");

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inst = INSTRUMENTS.find(i => i.id === selectedInstrument);

      setVideoGenerationStatus(`Synthesizing visuals for ${inst?.name}...`);

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A high-end cinematic close-up of a futuristic music studio where a singer's voice is visually transformed into golden glowing musical notes and complex MIDI structures. The ${inst?.name} instrument is prominently featured as a holographic interface. Cyberpunk aesthetic, 8k resolution, professional lighting.`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      setVideoGenerationStatus("Weaving visual textures...");

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoGenerationStatus("Mastering finished. Downloading...");
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VocalSynthPro_Cinema_Promo.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      console.error('Video generation error:', e);
      if (e.message?.includes("Requested entity was not found.")) {
        await (window as any).aistudio.openSelectKey();
      } else {
        alert("Cinema generation encountered an issue.");
      }
    } finally {
      setIsGeneratingVideo(false);
      setVideoGenerationStatus(null);
    }
  };

  if (!isEngineInitialized) {
    return (
      <div className="fixed inset-0 bg-[#050507] flex flex-col items-center justify-center z-[300] p-6 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl animate-pulse">
           <Volume2 className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">VocalSynth<span className="text-purple-400">Pro</span></h1>
        <p className="text-white/40 max-w-sm mb-10 text-sm">Sblocca il motore audio per iniziare a trasformare la tua voce in MIDI.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button 
          onClick={initializeApp}
          disabled={!!loadingInstrumentId}
          className="px-12 py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-2xl flex items-center gap-3 disabled:opacity-50"
        >
          {loadingInstrumentId ? <Loader2 className="animate-spin w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
          {loadingInstrumentId ? 'Loading...' : 'Inizia Ora'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] pb-24 selection:bg-purple-500/30">
      <Header onUpgradeClick={() => setShowProLanding(true)} isPro={isPro} onGeneratePromo={handleGeneratePromo} />
      
      {isGeneratingVideo && (
        <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative mb-12">
             <div className="w-40 h-40 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
             <Video className="w-16 h-16 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Cinema Engine Active</h2>
          <p className="text-purple-400 font-mono text-xs uppercase tracking-widest animate-pulse h-4">{videoGenerationStatus}</p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Visualizer analyser={audioEngineRef.current?.getAnalyser() || null} isActive={appState !== 'idle'} activeColor="purple" />
          
          <InstrumentGrid 
            selectedId={selectedInstrument} 
            onSelect={handleInstrumentChange} 
            isLoading={loadingInstrumentId}
            isProUser={isPro}
          />
          <MidiKeyboard activeMidi={activeMidi} activeColor="purple" />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-[3rem] border-white/5 space-y-8 sticky top-32 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-white/20" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Control Panel</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleRec}
                  className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all ${
                    appState === 'recording' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  {appState === 'recording' ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {appState === 'recording' ? 'Stop Recording' : 'Start Recording'}
                </button>
                <button 
                  onClick={handleLiveMode}
                  className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all ${
                    appState === 'live' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  {appState === 'live' ? 'Live Active' : 'Live Monitor'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">Octave Shift</h4>
                  <p className="text-[18px] font-black text-white">{octaveShift > 0 ? `+${octaveShift}` : octaveShift}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => adjustOctave(-1)} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => adjustOctave(1)} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">Mic Sensitivity</h4>
                  <span className="text-[10px] font-mono text-purple-400">{(sensitivity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0.001" max="0.1" step="0.001" 
                  value={sensitivity} 
                  onChange={(e) => adjustSensitivity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={handlePreview}
                disabled={appState !== 'idle'}
                className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-all disabled:opacity-20 flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Preview Last Rec
              </button>
              <button 
                onClick={handleDownloadMidi}
                className={`w-full py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 ${
                   isPro ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-amber-500 text-black'
                }`}
              >
                {!isPro && <Crown className="w-4 h-4" />}
                <Download className="w-4 h-4" /> {isPro ? 'Export MIDI' : 'Unlock MIDI Export'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {showProLanding && (
        <ProLanding 
          onClose={() => setShowProLanding(false)} 
          onUpgrade={() => licenseService.redirectToPayment()} 
        />
      )}
    </div>
  );
};
export default App;
