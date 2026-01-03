import { detectPitch } from './pitchDetection';
import { RecordedNote } from '../types';

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private instrument: any = null;
  
  // Effetto Echo
  private delayNode: DelayNode | null = null;
  private feedbackNode: GainNode | null = null;
  private echoLevel: GainNode | null = null;

  private activeLiveNote: any = null;
  private currentMidi: number | null = null;
  private octaveShift: number = 0;
  private sensitivity: number = 0.01;

  constructor(private onNoteUpdate: (note: number | null, name: string | null) => void) {}

  private initAudio() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;

    // --- SETUP ECHO ---
    this.delayNode = this.audioCtx.createDelay();
    this.delayNode.delayTime.value = 0.3; // 300ms

    this.feedbackNode = this.audioCtx.createGain();
    this.feedbackNode.gain.value = 0.35; // Intensità ripetizioni

    this.echoLevel = this.audioCtx.createGain();
    this.echoLevel.gain.value = 0.2; // Volume generale echo

    // Connessione loop: Delay -> Feedback -> Delay
    this.delayNode.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode);
    // Connessione uscita: Delay -> EchoLevel -> Destinazione
    this.delayNode.connect(this.echoLevel);
    this.echoLevel.connect(this.audioCtx.destination);
  }

  // Metodo per gestire l'intensità dell'echo dinamicamente
  private updateEchoDynamic(clarity: number) {
    if (!this.echoLevel) return;
    // Se la nota è poco chiara (clarity bassa), aumentiamo l'echo per mascherare
    const targetGain = clarity < 0.7 ? 0.5 : 0.15;
    this.echoLevel.gain.setTargetAtTime(targetGain, this.audioCtx!.currentTime, 0.1);
  }

  async loadInstrument(id: string) {
    this.initAudio();
    // Qui carichiamo soundfont-player come nel tuo file originale...
    // Nota: Per connettere lo strumento all'echo, lo strumento deve supportare .connect()
    // Se soundfont-player non lo permette, l'echo sarà applicato globalmente
  }

  playNote(midi: number, clarity: number) {
    if (!this.instrument || this.currentMidi === midi) return;
    
    this.stopNote();
    this.currentMidi = midi;
    this.updateEchoDynamic(clarity);

    const now = this.audioCtx!.currentTime;
    this.activeLiveNote = this.instrument.play(midi + (this.octaveShift * 12), now, { gain: 0.7 });
  }

  stopNote() {
    if (this.activeLiveNote) {
      const now = this.audioCtx!.currentTime;
      // Fade out di 50ms per evitare "click" (Punto 3 della tua richiesta)
      this.activeLiveNote.stop(now + 0.05);
      this.activeLiveNote = null;
      this.currentMidi = null;
    }
  }
}
