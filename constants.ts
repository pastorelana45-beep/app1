import { Instrument } from './types';

export interface ExtendedInstrument extends Instrument {
  isPro?: boolean;
  midiProgram: number;
}

export const INSTRUMENTS: ExtendedInstrument[] = [
  // Piano & Keys
  { id: 'acoustic_grand_piano', name: 'Grand Piano', category: 'Piano', color: 'bg-blue-600', midiProgram: 0 },
  { id: 'electric_piano_1', name: 'Electric Piano', category: 'Keys', color: 'bg-cyan-500', isPro: true, midiProgram: 4 },
  { id: 'harpsichord', name: 'Harpsichord', category: 'Keys', color: 'bg-amber-700', midiProgram: 6 },
  { id: 'rock_organ', name: 'Rock Organ', category: 'Organ', color: 'bg-orange-600', isPro: true, midiProgram: 18 },

  // Guitars
  { id: 'acoustic_guitar_nylon', name: 'Nylon Guitar', category: 'Guitar', color: 'bg-yellow-700', midiProgram: 24 },
  { id: 'electric_guitar_clean', name: 'Clean Electric', category: 'Guitar', color: 'bg-emerald-500', isPro: true, midiProgram: 27 },
  { id: 'distortion_guitar', name: 'Overdrive Gt', category: 'Guitar', color: 'bg-red-600', isPro: true, midiProgram: 30 },

  // Strings & Orchestral
  { id: 'violin', name: 'Violin Solo', category: 'Strings', color: 'bg-rose-500', midiProgram: 40 },
  { id: 'string_ensemble_1', name: 'String Section', category: 'Orch', color: 'bg-pink-600', isPro: true, midiProgram: 48 },
  { id: 'cello', name: 'Cello Solo', category: 'Strings', color: 'bg-red-800', midiProgram: 42 },
  { id: 'trumpet', name: 'Trumpet', category: 'Brass', color: 'bg-amber-500', midiProgram: 56 },
  { id: 'alto_sax', name: 'Alto Sax', category: 'Reed', color: 'bg-purple-600', isPro: true, midiProgram: 65 },

  // Synth
  { id: 'lead_1_square', name: 'Square Lead', category: 'Synth', color: 'bg-lime-500', midiProgram: 80 },
  { id: 'lead_2_sawtooth', name: 'Saw Lead', category: 'Synth', color: 'bg-green-500', midiProgram: 81 },
  { id: 'synth_bass_1', name: 'Analog Bass', category: 'Bass', color: 'bg-indigo-700', isPro: true, midiProgram: 38 },
  { id: 'pad_1_new_age', name: 'New Age Pad', category: 'Atmosphere', color: 'bg-sky-400', isPro: true, midiProgram: 88 },

  // Ethnic & Perc
  { id: 'sitar', name: 'Sitar', category: 'World', color: 'bg-orange-800', isPro: true, midiProgram: 104 },
  { id: 'kalimba', name: 'Kalimba', category: 'Perc', color: 'bg-teal-500', midiProgram: 108 },
  { id: 'marimba', name: 'Marimba', category: 'Perc', color: 'bg-orange-900', midiProgram: 12 }
];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];