
export function detectPitch(buffer: Float32Array, sampleRate: number): { pitch: number; clarity: number } {
  const SIZE = buffer.length;
  const halfSize = Math.floor(SIZE / 2);
  
  let sum = 0;
  for (let i = 0; i < SIZE; i++) sum += buffer[i] * buffer[i];
  const rms = Math.sqrt(sum / SIZE);
  if (rms < 0.005) return { pitch: -1, clarity: 0 }; 

  const yinBuffer = new Float32Array(halfSize);
  for (let tau = 0; tau < halfSize; tau++) {
    for (let i = 0; i < halfSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
    }
  }

  let runningSum = 0;
  yinBuffer[0] = 1;
  for (let tau = 1; tau < halfSize; tau++) {
    runningSum += yinBuffer[tau];
    if (runningSum === 0) yinBuffer[tau] = 1;
    else yinBuffer[tau] *= tau / runningSum;
  }

  const threshold = 0.15;
  let tauFound = -1;
  for (let tau = 2; tau < halfSize; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < halfSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauFound = tau;
      break;
    }
  }

  if (tauFound === -1) {
    let minVal = 1;
    for (let tau = 2; tau < halfSize; tau++) {
      if (yinBuffer[tau] < minVal) {
        minVal = yinBuffer[tau];
        tauFound = tau;
      }
    }
    if (minVal > 0.4) return { pitch: -1, clarity: 0 };
  }

  const pitch = sampleRate / tauFound;
  const clarity = 1 - yinBuffer[tauFound];

  if (pitch < 50 || pitch > 2000) return { pitch: -1, clarity: 0 };

  return { pitch, clarity };
}

export function midiToNoteName(midi: number): string {
  if (midi < 0 || midi > 127) return "--";
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const name = noteNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}
