import { RecordedNote } from './types';

export function exportMidi(sequence: RecordedNote[], instrumentProgram: number = 0): Blob {
  const HEADER_CHUNK_TYPE = [0x4D, 0x54, 0x68, 0x64]; // MThd
  const TRACK_CHUNK_TYPE = [0x4D, 0x54, 0x72, 0x6B];  // MTrk
  
  const ticksPerBeat = 480;
  
  const header = [
    ...HEADER_CHUNK_TYPE,
    0, 0, 0, 6,
    0, 0, // Format 0
    0, 1, // 1 Track
    (ticksPerBeat >> 8) & 0xFF, ticksPerBeat & 0xFF
  ];

  const trackEvents: number[] = [];
  trackEvents.push(0x00, 0xC0, instrumentProgram);

  const ticksPerMs = ticksPerBeat / (60000 / 120); 

  const events: { tick: number, type: number, note: number, velocity: number }[] = [];
  
  sequence.forEach(note => {
    const startTick = Math.floor(note.startTime * 1000 * ticksPerMs);
    const endTick = Math.floor((note.startTime + note.duration) * 1000 * ticksPerMs);
    
    events.push({ tick: startTick, type: 0x90, note: note.midi, velocity: 100 });
    events.push({ tick: endTick, type: 0x80, note: note.midi, velocity: 0 });
  });

  events.sort((a, b) => a.tick - b.tick);

  let lastAbsoluteTick = 0;
  events.forEach(ev => {
    const delta = ev.tick - lastAbsoluteTick;
    trackEvents.push(...encodeVariableLength(delta));
    trackEvents.push(ev.type, ev.note, ev.velocity);
    lastAbsoluteTick = ev.tick;
  });

  trackEvents.push(0x00, 0xFF, 0x2F, 0x00);

  const trackLength = trackEvents.length;
  const trackChunk = [
    ...TRACK_CHUNK_TYPE,
    (trackLength >> 24) & 0xFF, (trackLength >> 16) & 0xFF,
    (trackLength >> 8) & 0xFF, trackLength & 0xFF,
    ...trackEvents
  ];

  return new Blob([new Uint8Array([...header, ...trackChunk])], { type: 'audio/midi' });
}

function encodeVariableLength(value: number): number[] {
  let buffer = value & 0x7F;
  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= 0x80 | (value & 0x7F);
  }
  const result: number[] = [];
  while (true) {
    result.push(buffer & 0xFF);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return result;
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}