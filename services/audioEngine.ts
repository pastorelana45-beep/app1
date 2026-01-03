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

  private async initAudio() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
      sampleRate: 44100,
      latencyHint: 'playback' // Cruciale: dice ad Android "sono un player musicale"
    });
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  async startMic(mode: 'live' | 'recording') {
    await this.initAudio();
    this.mode = mode;
    this.lastStableMidi = null;

    try {
      // SETTAGGI "YOUTUBE-STYLE" PER IL MICROFONO
      // Disabilitando questi 3, Android spesso evita di attivare la modalità chiamata
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false, 
          noiseSuppression: false, 
          autoGainControl: false,
        }
      });

      this.source = this.audioCtx!.createMediaStreamSource(this.micStream);
      this.source.connect(this.analyser!);
      
      this.isProcessing = true;
      this.recordingStart = this.audioCtx!.currentTime;
      this.process();
    } catch (e) {
      console.error("Microfono bloccato");
    }
  }

  // QUESTA FUNZIONE È QUELLA CHE SBLOCCA LA CASSA
  async stopMic() {
    this.isProcessing = false;
    this.mode = 'idle';

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => {
        track.stop(); // SPEGNE IL MICROFONO FISICAMENTE
      });
      this.micStream = null;
    }

    // KILLIAMO IL CONTESTO: Se non lo facciamo, Android resta in modalità chiamata
    if (this.audioCtx) {
      await this.audioCtx.close();
      this.audioCtx = null;
    }

    this.onNoteUpdate(null, null);
    this.lastStableMidi = null;
  }

  async previewSequence() {
    // Prima di suonare, resettiamo tutto per tornare in modalità "Musica/YouTube"
    await this.stopMic();
    await this.initAudio();

    if (!this.instrument || this.sequence.length === 0 || !this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    this.sequence.forEach(note => {
      this.instrument.play(note.midi, now + note.startTime + 0.1, { 
        duration: note.duration, 
        gain: 1.0 
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

  private playNote(midi: number) {
    if (this.activeLiveNote) try { this.activeLiveNote.stop(); } catch(e) {}
    if (this.instrument && this.audioCtx) {
      this.activeLiveNote = this.instrument.play(midi, this.audioCtx.currentTime, { gain: 1.0 });
    }
  }

  async loadInstrument(instrumentId: string) {
    if (!this.audioCtx) await this.initAudio();
    if (!(window as any).Soundfont) {
      await this.loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
    }
    try {
      this.instrument = await (window as any).Soundfont.instrument(this.audioCtx!, instrumentId, { soundfont: 'FluidR3_GM' });
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
