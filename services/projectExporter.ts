
import JSZip from 'https://esm.sh/jszip@^3.10.1';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // Root files
  const rootFiles = [
    'index.html', 'index.tsx', 'App.tsx', 'types.ts', 'constants.ts', 
    'metadata.json', 'manifest.json', 'package.json', 'tsconfig.json', 'vite.config.ts'
  ];
  
  // Components
  const componentFiles = [
    'Header.tsx', 'Visualizer.tsx', 'InstrumentGrid.tsx', 'MidiKeyboard.tsx', 'ProLanding.tsx'
  ];
  
  // Services
  const serviceFiles = [
    'audioEngine.ts', 'pitchDetection.ts', 'midiExport.ts', 'licenseService.ts', 'projectExporter.ts'
  ];

  for (const file of rootFiles) {
    try {
      const response = await fetch(`./${file}`);
      if (response.ok) zip.file(file, await response.text());
    } catch (e) {}
  }

  const compFolder = zip.folder("components");
  for (const file of componentFiles) {
    try {
      const response = await fetch(`./components/${file}`);
      if (response.ok) compFolder!.file(file, await response.text());
    } catch (e) {}
  }

  const servFolder = zip.folder("services");
  for (const file of serviceFiles) {
    try {
      const response = await fetch(`./services/${file}`);
      if (response.ok) servFolder!.file(file, await response.text());
    } catch (e) {}
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VocalSynthPro_Source_GitHubReady.zip`;
  a.click();
}
