
import JSZip from 'jszip';

export async function downloadProjectZip() {
  const zip = new JSZip();
  
  const files = [
    'index.html', 'index.tsx', 'App.tsx', 'Header.tsx', 'Visualizer.tsx',
    'InstrumentGrid.tsx', 'ProLanding.tsx', 'MidiKeyboard.tsx', 'audioEngine.ts', 
    'pitchDetection.ts', 'licenseService.ts', 'midiExport.ts', 'types.ts', 
    'constants.ts', 'package.json', 'tsconfig.json', 'vite.config.ts', 'metadata.json', 'manifest.json'
  ];

  for (const filename of files) {
    try {
      const response = await fetch(`./${filename}`);
      if (response.ok) {
        const content = await response.text();
        zip.file(filename, content);
      }
    } catch (e) {}
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VocalSynthPro_Source_Flat.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
