
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
    const timeDomain = new Float32Array(analyser.fftSize);

    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getFloatTimeDomainData(timeDomain);

      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Waveform
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isActive ? '#a855f7' : '#222';
      
      if (isActive) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
      }

      const sliceWidth = canvas.width / timeDomain.length;
      let x = 0;

      for (let i = 0; i < timeDomain.length; i++) {
        const v = timeDomain[i] * 0.8;
        const y = (v * canvas.height / 2) + (canvas.height / 2);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Glow intensity based on activity
      if (isActive) {
        let maxVal = 0;
        for (let i = 0; i < timeDomain.length; i++) {
          if (Math.abs(timeDomain[i]) > maxVal) maxVal = Math.abs(timeDomain[i]);
        }
        ctx.fillStyle = `rgba(168, 85, 247, ${maxVal * 0.15})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, isActive]);

  return (
    <div className="w-full h-64 bg-[#050507] rounded-[3rem] overflow-hidden border border-white/5 relative shadow-inner group">
      <canvas ref={canvasRef} className="w-full h-full" width={1000} height={300} />
      <div className="absolute top-8 left-10 opacity-30 pointer-events-none transition-opacity group-hover:opacity-60">
        <span className="text-[8px] font-black uppercase tracking-[0.4em] font-mono">VocalSynth Real-time Scope v3.2</span>
      </div>
      <div className="absolute bottom-8 right-10 flex gap-1 items-end pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`w-1 rounded-full transition-all duration-300 ${isActive ? 'bg-purple-500 h-4' : 'bg-white/5 h-1'}`} style={{ transitionDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
};
