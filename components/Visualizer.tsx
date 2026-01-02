
import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  activeColor: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, isActive, activeColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomain = new Float32Array(analyser.fftSize);

    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      analyser.getFloatTimeDomainData(timeDomain);

      // Fondale scuro con persistenza (effetto scia)
      ctx.fillStyle = 'rgba(5, 5, 7, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Griglia Pro
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 25) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Disegno Spettrogramma (Frequency Bars)
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barX = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        ctx.fillStyle = isActive ? `rgba(168, 85, 247, ${0.05 + (dataArray[i]/255) * 0.2})` : 'rgba(255,255,255,0.02)';
        ctx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);
        barX += barWidth + 1;
      }

      // Disegno Waveform (Time Domain)
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isActive ? '#a855f7' : '#27272a';
      
      if (isActive) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
      }

      const sliceWidth = canvas.width / (timeDomain.length / 1.5);
      let x = 0;

      for (let i = 0; i < timeDomain.length / 1.5; i++) {
        const v = timeDomain[i] * 0.95;
        const y = (v * canvas.height / 2.2) + (canvas.height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevV = timeDomain[i - 1] * 0.95;
          const prevY = (prevV * canvas.height / 2.2) + (canvas.height / 2);
          const cpX = x - (sliceWidth / 2);
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Indicatori di picco
      if (isActive) {
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(168, 85, 247, ${0.2 + (avg/255) * pulse})`;
        ctx.beginPath();
        ctx.arc(20, 20, 4 + (avg/10), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [analyser, isActive]);

  return (
    <div className="w-full h-48 bg-[#050507] rounded-[2rem] overflow-hidden border border-white/5 relative group shadow-[inset_0_0_60px_rgba(0,0,0,1)]">
      <canvas ref={canvasRef} className="w-full h-full" width={1000} height={250} />
      
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] transition-all duration-500 group-hover:backdrop-blur-none">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-white/5 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="flex gap-1">
                   <div className="w-1 h-3 bg-white/20 rounded-full animate-pulse [animation-delay:-0.3s]" />
                   <div className="w-1 h-5 bg-white/20 rounded-full animate-pulse [animation-delay:-0.15s]" />
                   <div className="w-1 h-3 bg-white/20 rounded-full animate-pulse" />
                 </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-white/10 tracking-[0.6em] uppercase">Monitor Offline</span>
          </div>
        </div>
      )}
      
      {/* HUD Elements */}
      <div className="absolute top-6 left-8 pointer-events-none">
        <div className="flex flex-col gap-1 opacity-40">
          <span className="text-[7px] font-mono text-purple-400 uppercase tracking-widest leading-none">Signal Processor V3.1</span>
          <div className="h-[1px] w-12 bg-purple-500/30" />
        </div>
      </div>
      
      <div className="absolute bottom-6 right-8 flex items-end gap-6 pointer-events-none">
        <div className="flex flex-col items-end gap-1 opacity-40">
          <span className="text-[6px] font-mono text-white/20 uppercase tracking-widest leading-none">Bit Depth: 32bit Float</span>
          <span className="text-[6px] font-mono text-white/20 uppercase tracking-widest leading-none">Hanning Window</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex gap-1 h-3 items-end">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className={`w-1 rounded-full transition-all duration-300 ${isActive && i < 6 ? 'bg-purple-500/60 h-full' : 'bg-white/5 h-1'}`} />
            ))}
          </div>
          <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest mt-1">Sync</span>
        </div>
      </div>
    </div>
  );
};
