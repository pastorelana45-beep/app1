import { detectPitch, midiToNoteName } from './pitchDetection.ts';
import { RecordedNote } from './types.ts';

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private instrument: any = null;
  private isProcessing = false;
  private mode: 'live' | 'recording' | 'idle' = 'idle';
  private sequence: RecordedNote[] = [];
  private recordingStart: number = 0;
  private lastStableMidi: number | null = null;
  private activeLiveNote: any = null;
  private octaveShift: number = 0;
  private sensitivity: number = 0.01;
  private onNoteUpdate: (note: number | null, name: string | null) => void;

  // --- SEPARATORE DI CANALI ---
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;
  private multimediaOutput: HTMLAudioElement | null = null;

  constructor(onNoteUpdate: (note: number | null, name: string | null) => void) {
    this.onNoteUpdate = onNoteUpdate;
  }

  private async initAudio() {
    if (this.audioCtx) return;

    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
      sampleRate: 44100,
      latencyHint: 'playback' // Forza il profilo Multimedia (YouTube-style)
    });

    // CREIAMO IL CANALE DI USCITA MULTIMEDIALE SEPARATO
    this.mediaStreamDest = this.audioCtx.createMediaStreamDestination();
    this.multimediaOutput = new Audio();
    this.multimediaOutput.srcObject = this.mediaStreamDest.stream;
    
    // Questo forza Android a usare il cursore "Musica" e non "Chiamata"
    this.multimediaOutput.play().catch(() => console.log("Richiesta interazione utente"));

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  async startMic(mode: 'live' | 'recording') {
    await this.initAudio();
    this.mode = mode;
    this.lastStableMidi = null;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          // Flag interni per Chromium per evitare il profilo "Voice"
          googEchoCancellation: false,
          googAutoGainControl: false,
          googNoiseSuppression: false,
          googHighpassFilter: false,
        } as any
      });

      this.source = this.audioCtx!.createMediaStreamSource(this.micStream);
      this.source.connect(this.analyser!);
      
      this.isProcessing = true;
      this.recordingStart = this.audioCtx!.currentTime;
      this.process();
    } catch (e) {
      console.error("Errore accesso microfono");
    }
  }

  async stopMic() {
    this.isProcessing = false;
    this.mode = 'idle';

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    // Chiudiamo il contesto per resettare completamente i driver Bluetooth
    if (this.audioCtx) {
      await this.audioCtx.close();
      this.audioCtx = null;
    }

    this.onNoteUpdate(null, null);
    this.lastStableMidi = null;
  }

  private playNote(midi: number) {
    if (this.activeLiveNote) try { this.activeLiveNote.stop(); } catch(e) {}
    
    if (this.instrument && this.audioCtx) {
      // MANDIAMO L'AUDIO AL DESTINATION SEPARATO (L'elemento <audio> HTML5)
      this.activeLiveNote = this.instrument.play(midi, this.audioCtx.currentTime, { 
        gain: 1.0,
        destination: this.mediaStreamDest // Cruciale: non va all'uscita standard!
      });
    }
  }

  async previewSequence() {
    await this.stopMic(); // Rilascia il microfono
    await this.initAudio(); // Riapre in modalità YouTube

    if (!this.instrument || this.sequence.length === 0 || !this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    this.sequence.forEach(note => {
      this.instrument.play(note.midi, now + note.startTime + 0.1, { 
        duration: note.duration, 
        gain: 1.0,
        destination: this.mediaStreamDest 
      });
    });
  }

  private process = () => {
    if (!this.isProcessing || !this.analyser || !this.audioCtx) return;
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    const { pitch, clarity } = detectPitch(buf, this.audioCtx.sampleRate);
    
    if (pitch > 0 && clarity > 0.85) {
      let midi = Math.round(12 * Math.log2(pitch / 440) + 69) + (this.octaveShift * 12);
      if (midi !== this.lastStableMidi) {
        this.playNote(midi);
        if (this.mode === 'recording') {
          this.sequence.push({ 
            midi, 
            startTime: this.audioCtx.currentTime - this.recordingStart, 
            duration: 0.2, 
            pitchTrajectory: [] 
          });
        }
        this.lastStableMidi = midi;
        this.onNoteUpdate(midi, midiToNoteName(midi));
      }
    }
    if (this.isProcessing) requestAnimationFrame(this.process);
  }

  async loadInstrument(instrumentId: string) {
    if (!this.audioCtx) await this.initAudio();
    if (!(window as any).Soundfont) {
      await this.loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
    }
    try {
      this.instrument = await (window as any).Soundfont.instrument(this.audioCtx!, instrumentId, { 
        soundfont: 'FluidR3_GM',
        destination: this.mediaStreamDest // Colleghiamo lo strumento al canale multimedia
      });
      return true;
    } catch (e) { return false; }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((res) => {
      const s = document.createElement('script');
      s.src = src; s.onload = () => res();
      document.head.appendChild(s);
    });
  }

  getAnalyser() { return this.analyser; }
  getSequence() { return this.sequence; }
  setOctaveShift(s: number) { this.octaveShift = s; }
  setSensitivity(v: number) { this.sensitivity = v; }
}
