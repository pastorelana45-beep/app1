import { detectPitch, midiToNoteName } from './pitchDetection.ts';
import { RecordedNote } from './types.ts';

export class AudioEngine {
  private micCtx: AudioContext | null = null;
  private playbackCtx: AudioContext | null = null;

  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  private instrument: any = null;
  private isProcessing = false;
  private mode: 'live' | 'recording' | 'idle' = 'idle';

  private sequence: RecordedNote[] = [];
  private recordingStart = 0;
  private lastStableMidi: number | null = null;
  private activeLiveNote: any = null;

  private octaveShift = 0;
  private sensitivity = 0.01;

  private onNoteUpdate: (note: number | null, name: string | null) => void;

  constructor(onNoteUpdate: (note: number | null, name: string | null) => void) {
    this.onNoteUpdate = onNoteUpdate;
  }

  /* ================= MICROPHONE CONTEXT ================= */

  private async initMic() {
    if (this.micCtx) return;

    this.micCtx = new AudioContext({
      sampleRate: 44100,
      latencyHint: 'interactive' // ok per input
    });

    this.analyser = this.micCtx.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  async startMic(mode: 'live' | 'recording') {
    await this.initMic();
    this.mode = mode;
    this.lastStableMidi = null;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      this.source = this.micCtx!.createMediaStreamSource(this.micStream);
      this.source.connect(this.analyser!);

      this.isProcessing = true;
      this.recordingStart = this.micCtx!.currentTime;
      this.process();
    } catch (e) {
      console.error('Microfono bloccato', e);
    }
  }

  async stopMic() {
    this.isProcessing = false;
    this.mode = 'idle';

    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }

    if (this.micCtx) {
      await this.micCtx.close(); // 🔥 fondamentale
      this.micCtx = null;
    }

    this.analyser = null;
    this.source = null;
    this.lastStableMidi = null;
    this.onNoteUpdate(null, null);
  }

  /* ================= PLAYBACK CONTEXT ================= */

  private async initPlayback() {
    if (this.playbackCtx) return;

    this.playbackCtx = new AudioContext({
      sampleRate: 44100,
      latencyHint: 'playback' // 🔥 forza MEDIA
    });
  }

  async loadInstrument(instrumentId: string) {
    await this.initPlayback();

    if (!(window as any).Soundfont) {
      await this.loadScript(
        'https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js'
      );
    }

    try {
      this.instrument = await (window as any).Soundfont.instrument(
        this.playbackCtx!,
        instrumentId,
        { soundfont: 'FluidR3_GM' }
      );
      return true;
    } catch {
      return false;
    }
  }

  async previewSequence() {
    await this.stopMic();          // ⛔ chiude CALL
    await this.initPlayback();     // ✅ apre MEDIA

    if (!this.instrument || !this.sequence.length || !this.playbackCtx) return;

    const now = this.playbackCtx.currentTime;

    this.sequence.forEach(note => {
      this.instrument.play(
        note.midi,
        now + note.startTime + 0.1,
        {
          duration: note.duration,
          gain: 1.0
        }
      );
    });
  }

  private playNote(midi: number) {
    if (!this.instrument || !this.playbackCtx) return;

    if (this.activeLiveNote) {
      try { this.activeLiveNote.stop(); } catch {}
    }

    this.activeLiveNote = this.instrument.play(
      midi,
      this.playbackCtx.currentTime,
      { gain: 1.0 }
    );
  }

  /* ================= AUDIO LOOP ================= */

  private process = () => {
    if (!this.isProcessing || !this.analyser || !this.micCtx) return;

    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);

    const { pitch, clarity } = detectPitch(buf, this.micCtx.sampleRate);

    if (pitch > 0 && clarity > 0.85) {
      const midi =
        Math.round(12 * Math.log2(pitch / 440) + 69) +
        this.octaveShift * 12;

      if (midi !== this.lastStableMidi) {
        this.playNote(midi);

        if (this.mode === 'recording') {
          this.sequence.push({
            midi,
            startTime: this.micCtx.currentTime - this.recordingStart,
            duration: 0.2,
            pitchTrajectory: []
          });
        }

        this.lastStableMidi = midi;
        this.onNoteUpdate(midi, midiToNoteName(midi));
      }
    }

    requestAnimationFrame(this.process);
  };

  /* ================= UTILS ================= */

  private loadScript(src: string): Promise<void> {
    return new Promise(res => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => res();
      document.head.appendChild(s);
    });
  }

  getSequence() { return this.sequence; }
  setOctaveShift(v: number) { this.octaveShift = v; }
  setSensitivity(v: number) { this.sensitivity = v; }
}
