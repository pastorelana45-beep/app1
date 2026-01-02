import { detectPitch, midiToNoteName } from './pitchDetection';
import { RecordedNote, PitchPoint } from '../types';

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
  private silentFramesCounter: number = 0;
  private readonly MAX_SILENT_FRAMES = 8; 

  private lastStableMidi: number | null = null;
  private activeLiveNote: any = null;
  private readonly MIN_NOTE_DURATION = 0.05;
  
  private pitchBuffer: number[] = [];
  private readonly BUFFER_SIZE = 3; 

  private octaveShift: number = 0; 
  private sensitivity: number = 0.002;

  private onNoteUpdate: (note: number | null, name: string | null) => void;

  constructor(onNoteUpdate: (note: number | null, name: string | null) => void) {
    this.onNoteUpdate = onNoteUpdate;
  }

  setOctaveShift(shift: number) { this.octaveShift = shift; }
  setSensitivity(val: number) { this.sensitivity = val; }

  private initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 44100,
        latencyHint: 'interactive'
      });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
    }
  }

  async startMic(mode: 'live' | 'recording') {
    this.initAudio();
    this.mode = mode;
    this.isProcessing = true;
    this.silentFramesCounter = 0;
    
    if (mode === 'recording') {
      this.sequence = [];
      this.recordingStart = this.audioCtx!.currentTime;
    }

    try {
      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true } 
        });
        this.source = this.audioCtx!.createMediaStreamSource(this.micStream);
        this.source.connect(this.analyser!);
      }
      if (this.audioCtx!.state === 'suspended') await this.audioCtx!.resume();
      
      requestAnimationFrame(this.processAudio);
    } catch (err) {
      console.error("Mic Error:", err);
    }
  }

  stopMic() {
    this.isProcessing = false;
    this.stopNote();
    if (this.mode === 'recording' && this.lastStableMidi !== null) this.closeLastNote();
    this.mode = 'idle';
    this.onNoteUpdate(null, null);
  }

  async playSequence(sequence: RecordedNote[]) {
    if (!this.instrument || !this.audioCtx) return;
    await this.audioCtx.resume();
    this.stopNote();
    const now = this.audioCtx.currentTime;
    sequence.forEach(note => {
      this.instrument.play(note.midi, now + note.startTime + 0.1, { 
        duration: note.duration,
        gain: 0.8 
      });
    });
  }

  private processAudio = () => {
    if (!this.isProcessing || !this.analyser || !this.audioCtx) return;
    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);
    
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    // BOOST VOLUME: Moltiplichiamo per 2 per rendere i fischi leggeri più visibili
    const volume = Math.sqrt(sum / buffer.length) * 2; 
    
    if (volume < this.sensitivity) { 
      this.handleSilence();
    } else {
      const { pitch, clarity } = detectPitch(buffer, this.audioCtx.sampleRate);
      // CLARITY 0.5: Molto più permissivo per i fischi (meno puri della voce)
      if (pitch > 0 && clarity > 0.5) { 
        this.silentFramesCounter = 0;
        this.pitchBuffer.push(pitch);
        if (this.pitchBuffer.length > this.BUFFER_SIZE) this.pitchBuffer.shift();
        
        const sorted = [...this.pitchBuffer].sort((a, b) => a - b);
        const smoothedPitch = sorted[Math.floor(sorted.length / 2)];

        let midiFloat = 12 * (Math.log2(smoothedPitch / 440)) + 69;
        midiFloat += (this.octaveShift * 12);
        this.handlePitchDetection(Math.round(midiFloat));
      } else {
        this.handleSilence();
      }
    }
    if (this.isProcessing) requestAnimationFrame(this.processAudio);
  };

  private handlePitchDetection(midi: number) {
    if (this.lastStableMidi !== midi) {
      if (this.mode === 'recording') this.recordNoteChange(midi);
      if (this.mode === 'live') this.playNote(midi);
      this.lastStableMidi = midi;
      this.onNoteUpdate(midi, midiToNoteName(midi));
    }
  }

  private handleSilence() {
    this.silentFramesCounter++;
    if (this.silentFramesCounter > this.MAX_SILENT_FRAMES) {
      this.stopNote();
      if (this.mode === 'recording' && this.lastStableMidi !== null) this.closeLastNote();
      this.lastStableMidi = null;
      this.onNoteUpdate(null, null);
    }
  }

  private recordNoteChange(midi: number) {
    if (this.lastStableMidi !== null) this.closeLastNote();
    this.lastNoteStart = this.audioCtx!.currentTime;
  }

  private closeLastNote() {
    if (this.lastStableMidi === null) return;
    const duration = this.audioCtx!.currentTime - this.lastNoteStart;
    if (duration >= this.MIN_NOTE_DURATION) {
      this.sequence.push({ 
        midi: this.lastStableMidi, 
        startTime: this.lastNoteStart - this.recordingStart, 
        duration,
        pitchTrajectory: []
      });
    }
  }

  private playNote(midi: number) {
    if (!this.instrument) return;
    this.stopNote();
    this.activeLiveNote = this.instrument.play(midi, this.audioCtx!.currentTime, { gain: 0.8 });
  }

  private stopNote() {
    if (this.activeLiveNote) {
      try { this.activeLiveNote.stop(); } catch(e) {}
      this.activeLiveNote = null;
    }
  }

  async loadInstrument(instrumentId: string) {
    this.initAudio();
    if (!(window as any).Soundfont) await this.loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
    try {
      this.instrument = await (window as any).Soundfont.instrument(this.audioCtx!, instrumentId, { soundfont: 'FluidR3_GM' });
      return true;
    } catch (err) { return false; }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  getAnalyser() { return this.analyser; }
  getSequence() { return [...this.sequence]; }
}
