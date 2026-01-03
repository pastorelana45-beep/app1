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

  constructor(onNoteUpdate: (note: number | null, name: string | null) => void) {
    this.onNoteUpdate = onNoteUpdate;
  }

  /**
   * Imposta lo shift dell'ottava per la trasposizione in tempo reale.
   */
  setOctaveShift(shift: number) { 
    this.octaveShift = shift; 
  }
  
  /**
   * Imposta la soglia di sensibilità del volume per l'attivazione delle note.
   */
  setSensitivity(val: number) { 
    this.sensitivity = val; 
  }

  /**
   * Inizializza l'AudioContext con parametri ottimizzati per la latenza.
   */
  private initAudio() {
    if (!this.audioCtx) {
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

  /**
   * Carica lo strumento MIDI (Soundfont).
   */
  async loadInstrument(instrumentId: string) {
    this.initAudio();
    if (!(window as any).Soundfont) {
      await this.loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
    }
    
    if (this.activeLiveNote) {
      try { this.activeLiveNote.stop(); } catch(e) {}
      this.activeLiveNote = null;
    }
    
    try {
      this.instrument = await (window as any).Soundfont.instrument(this.audioCtx!, instrumentId, { 
        soundfont: 'FluidR3_GM',
        gain: 1.5
      });
      return true;
    } catch (e) {
      console.error("Errore nel caricamento dello strumento:", e);
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

  /**
   * Avvia l'acquisizione dal microfono.
   */
  async startMic(mode: 'live' | 'recording') {
    this.initAudio();
    this.mode = mode;
    this.lastStableMidi = null;
    if (mode === 'recording') this.sequence = [];
    
    try {
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        }
      };

      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.source = this.audioCtx!.createMediaStreamSource(this.micStream);
      this.source.connect(this.analyser!);
      
      this.recordingStart = this.audioCtx!.currentTime;
      this.isProcessing = true;
      this.process();
    } catch (e) {
      console.error("Errore accesso microfono:", e);
      throw e;
    }
  }

  /**
   * Ferma il microfono e rilascia TOTALMENTE l'hardware.
   */
  stopMic() {
    this.isProcessing = false;
    this.mode = 'idle';
    
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => {
        track.stop(); 
      });
      this.micStream = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.activeLiveNote) {
      try { this.activeLiveNote.stop(); } catch(e) {}
      this.activeLiveNote = null;
    }

    this.onNoteUpdate(null, null);
    this.lastStableMidi = null;
  }

  /**
   * Riproduce la sequenza registrata senza riattivare il microfono.
   */
  previewSequence() {
    if (!this.instrument || this.sequence.length === 0 || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    this.sequence.forEach(note => {
      this.instrument.play(note.midi, now + note.startTime, { 
        duration: note.duration, 
        gain: 0.8 
      });
    });
  }

  /**
   * Loop principale di analisi del pitch.
   */
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
          if (this.sequence.length > 0) {
             const last = this.sequence[this.sequence.length - 1];
             last.duration = (this.audioCtx.currentTime - this.recordingStart) - last.startTime;
          }
          
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
        if (this.activeLiveNote) {
          try { this.activeLiveNote.stop(); } catch(e) {}
        }
        
        if (this.mode === 'recording' && this.sequence.length > 0) {
           const last = this.sequence[this.sequence.length - 1];
           last.duration = (this.audioCtx.currentTime - this.recordingStart) - last.startTime;
        }
        
        this.lastStableMidi = null;
        this.onNoteUpdate(null, null);
      }
    }
    
    if (this.isProcessing) {
      requestAnimationFrame(this.process);
    }
  }

  private playNote(midi: number) {
    if (this.activeLiveNote) {
      try { this.activeLiveNote.stop(); } catch(e) {}
    }
    
    if (this.instrument && this.audioCtx) {
      try {
        this.activeLiveNote = this.instrument.play(midi, this.audioCtx.currentTime, { gain: 0.8 });
      } catch (e) {
        console.warn("Nota non riprodotta", e);
      }
    }
  }

  getAnalyser() { return this.analyser; }
  getSequence() { return this.sequence; }
}
