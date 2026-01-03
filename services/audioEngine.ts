import { detectPitch, midiToNoteName } from './pitchDetection';
import { RecordedNote } from './types';

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
  private onNoteUpdate: (note: number | null, name: string | null) => void;

  constructor(onNoteUpdate: (note: number | null, name: string | null) => void) {
    this.onNoteUpdate = onNoteUpdate;
  }

  async loadInstrument(instrumentId: string) {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
    }
    if (!(window as any).Soundfont) {
      await this.loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
    }
    this.instrument = await (window as any).Soundfont.instrument(this.audioCtx!, instrumentId, { soundfont: 'FluidR3_GM' });
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((res) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => res();
      document.head.appendChild(s);
    });
  }

  async startMic(mode: 'live' | 'recording') {
    this.mode = mode;
    if (mode === 'recording') this.sequence = [];
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    if (this.audioCtx?.state === 'suspended') await this.audioCtx.resume();
    
    this.source = this.audioCtx!.createMediaStreamSource(this.micStream);
    this.analyser = this.audioCtx!.createAnalyser();
    this.analyser.fftSize = 2048;
    this.source.connect(this.analyser);
    
    this.recordingStart = this.audioCtx!.currentTime;
    this.isProcessing = true;
    this.process();
  }

  stopMic() {
    this.isProcessing = false;
    this.mode = 'idle';
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
  }

  private process = () => {
    if (!this.isProcessing || !this.analyser) return;
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    
    const { pitch } = detectPitch(buf, this.audioCtx!.sampleRate);
    
    if (pitch > 0) {
      const midi = Math.round(12 * Math.log2(pitch / 440) + 69);
      const name = midiToNoteName(midi);
      this.onNoteUpdate(midi, name);
      
      if (this.mode === 'recording') {
        this.sequence.push({ 
          midi, 
          startTime: this.audioCtx!.currentTime - this.recordingStart, 
          duration: 0.1, 
          pitchTrajectory: [] 
        });
      }
    } else {
      this.onNoteUpdate(null, null);
    }
    requestAnimationFrame(this.process);
  }

  getAnalyser() { return this.analyser; }
  getSequence() { return this.sequence; }
}
