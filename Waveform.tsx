import React, { useEffect, useRef, memo } from 'react';

interface WaveformProps {
  active: boolean;
  color: string;
  amplitude: number;
}

export const Waveform: React.FC<WaveformProps> = memo(({ active, color, amplitude }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // Resize to match display size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const { width, height } = canvas;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (active) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        // Base amplitude logic
        // We use 'amplitude' prop (0-1) to scale the wave
        const amp = Math.max(10, amplitude * (height / 2));

        phaseRef.current += 0.15; // Speed

        for (let x = 0; x < width; x++) {
          // Sine wave formula: y = A * sin(kx - wt)
          // Taper ends so it fades at edges
          const taper = 1 - Math.pow((2 * x / width) - 1, 2);
          const y = centerY + Math.sin(x * 0.02 - phaseRef.current) * amp * taper;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Secondary subtle wave
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.5;
        for (let x = 0; x < width; x++) {
          const taper = 1 - Math.pow((2 * x / width) - 1, 2);
          const y = centerY + Math.sin(x * 0.015 - phaseRef.current * 0.7) * (amp * 0.6) * taper;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else {
        // Flat line when inactive
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = '#334155'; // Slate 700
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [active, color, amplitude]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
});