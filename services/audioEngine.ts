import { detectPitch, midiToNoteName } from './pitchDetection.ts';
import { RecordedNote, PitchPoint } from './types.ts';

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
  private lastNoteStart: number = 0;
  private lastStableMidi: number | null = null;
  private activeLiveNote: any = null;
  private octaveShift: number = 0;
  private sensitivity: number = 0.01;
  private onNoteUpdate: (note: number | null, name: string | null) => void;
  private loadingPromise: Promise<any> | null = null;

  constructor(onNoteUpdate: (note: number | null, name: string | null) => void) {
    this.onNoteUpdate = onNoteUpdate;
  }

  setOctaveShift(shift: number) { this.octaveShift = shift; }
  setSensitivity(val: number) { this.sensitivity = val; }

  private initAudio() {
    if (!this.audioCtx) {
      /**
       * Forziamo un sampleRate di 48kHz. 
       * Molte cuffie Bluetooth entrano in modalità chiamata se vedono 16kHz o frequenze "telefoniche".
       */
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 48000,
        latencyHint: 'interactive' 
      });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  async loadInstrument(instrumentId: string) {
    this.initAudio();
    if (!(window as any).Soundfont) {
      await this.loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
    }
    
    if (this.activeLiveNote) this.activeLiveNote.stop();
    
    try {
      this.loadingPromise = (window as any).Soundfont.instrument(this.audioCtx!, instrumentId, { 
        soundfont: 'FluidR3_GM',
        gain: 1.5
      });
      this.instrument = await this.loadingPromise;
      return true;
    } catch (e) {
      console.error("Errore caricamento strumento:", e);
      return false;
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script');
      s.src = src; 
      s.onload = () => res();
      s.onerror = (e) => rej(e);
      document.head.appendChild(s);
    });
  }

  async startMic(mode: 'live' | 'recording') {
    this.initAudio();
    this.mode = mode;
    this.lastStableMidi = null;
    if (mode === 'recording') this.sequence = [];
    
    try {
      /**
       * CONFIGURAZIONE AGGRESSIVA ANTI-CHIAMATA:
       * Disabilitiamo echoCancellation, noiseSuppression e autoGainControl.
       * Se uno solo di questi è true, molti browser (specialmente mobile) 
       * attivano il profilo Hands-Free del Bluetooth.
       */
      const constraints: any = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          // Flag specifico per iOS per evitare l'elaborazione vocale
          voiceIsolation: false,
          // Flag specifici per Chrome/Chromium
          googEchoCancellation: false,
          googAutoGainControl: false,
          googNoiseSuppression: false,
          googHighpassFilter: false,
          googTypingNoiseDetection: false,
          // Forziamo il sample rate musicale
          sampleRate: 48000,
          channelCount: 1
        }
      };

      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.source = this.audioCtx!.createMediaStreamSource(this.micStream);
      this.source.connect(this.analyser!);
      
      this.recordingStart = this.audioCtx!.currentTime;
      this.isProcessing = true;
      this.process();
    } catch (e) {
      console.error("Errore microfono:", e);
      // Fallback minimo se i parametri avanzati non sono supportati
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.audioCtx!.createMediaStreamSource(this.micStream);
      this.source.connect(this.analyser!);
      this.isProcessing = true;
      this.process();
    }
  }

  stopMic() {
    this.isProcessing = false;
    this.mode = 'idle';
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.activeLiveNote) {
      this.activeLiveNote.stop();
      this.activeLiveNote = null;
    }
    this.onNoteUpdate(null, null);
  }

  private process = () => {
    if (!this.isProcessing || !this.analyser || !this.audioCtx) return;
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    
    const { pitch, clarity } = detectPitch(buf, this.audioCtx.sampleRate);
    
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const volume = Math.sqrt(sum / buf.length);

    if (pitch > 0 && clarity > 0.85 && volume > this.sensitivity) {
      let midi = Math.round(12 * Math.log2(pitch / 440) + 69) + (this.octaveShift * 12);
      midi = Math.max(0, Math.min(127, midi));

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
    } else {
      if (this.lastStableMidi !== null) {
        if (this.activeLiveNote) this.activeLiveNote.stop();
        this.lastStableMidi = null;
        this.onNoteUpdate(null, null);
      }
    }
    
    if (this.isProcessing) requestAnimationFrame(this.process);
  }

  private playNote(midi: number) {
    if (this.activeLiveNote) this.activeLiveNote.stop();
    if (this.instrument && this.audioCtx) {
      try {
        this.activeLiveNote = this.instrument.play(midi, this.audioCtx.currentTime, { gain: 0.8 });
      } catch (e) {
        console.warn("Play failed", e);
      }
    }
  }

  getAnalyser() { return this.analyser; }
  getSequence() { return this.sequence; }
        }
