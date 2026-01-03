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

  // ELEMENTO SEGRETO PER ANDROID
  private destinationStream: MediaStreamAudioDestinationNode | null = null;
  private htmlAudioElement: HTMLAudioElement | null = null;

  constructor(onNoteUpdate: (note: number | null, name: string | null) => void) {
    this.onNoteUpdate = onNoteUpdate;
  }

  setOctaveShift(shift: number) { this.octaveShift = shift; }
  setSensitivity(val: number) { this.sensitivity = val; }

  private initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 44100,
        latencyHint: 'playback' 
      });

      // CREIAMO UN "TUBO" VERSO UN ELEMENTO HTML5 MULTIMEDIA
      this.destinationStream = this.audioCtx.createMediaStreamDestination();
      this.htmlAudioElement = new Audio();
      this.htmlAudioElement.srcObject = this.destinationStream.stream;
      this.htmlAudioElement.play(); // Avviamo il canale multimediale silenzioso

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }

  async loadInstrument(instrumentId: string) {
    this.initAudio();
    if (!(window as any).Soundfont) {
      await this.loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
    }
    try {
      this.instrument = await (window as any).Soundfont.instrument(this.audioCtx!, instrumentId, { 
        soundfont: 'FluidR3_GM',
        gain: 1.5,
        // DICIAMO ALLO STRUMENTO DI SUONARE NEL TUBO MULTIMEDIALE
        destination: this.destinationStream 
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script');
      s.src = src; s.onload = () => res(); s.onerror = (e) => rej(e);
      document.head.appendChild(s);
    });
  }

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
          // FORZIAMO IL PROFILO AUDIO NON-COMMUNICATION
          voiceIsolation: false,
        } as any
      };

      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.source = this.audioCtx!.createMediaStreamSource(this.micStream);
      this.source.connect(this.analyser!);
      
      this.recordingStart = this.audioCtx!.currentTime;
      this.isProcessing = true;
      this.process();
    } catch (e) {
      throw e;
    }
  }

  stopMic() {
    this.isProcessing = false;
    this.mode = 'idle';
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    this.onNoteUpdate(null, null);
    this.lastStableMidi = null;
  }

  previewSequence() {
    if (!this.instrument || this.sequence.length === 0 || !this.audioCtx) return;
    this.stopMic();
    const now = this.audioCtx.currentTime;
    this.sequence.forEach(note => {
      this.instrument.play(note.midi, now + note.startTime + 0.1, { 
        duration: note.duration, 
        gain: 1.2 
      });
    });
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
        if (this.activeLiveNote) try { this.activeLiveNote.stop(); } catch(e) {}
        this.lastStableMidi = null;
        this.onNoteUpdate(null, null);
      }
    }
    if (this.isProcessing) requestAnimationFrame(this.process);
  }

  private playNote(midi: number) {
    if (this.activeLiveNote) try { this.activeLiveNote.stop(); } catch(e) {}
    if (this.instrument && this.audioCtx) {
      this.activeLiveNote = this.instrument.play(midi, this.audioCtx.currentTime, { gain: 0.8 });
    }
  }

  getAnalyser() { return this.analyser; }
  getSequence() { return this.sequence; }
}
