import { useRef, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

export default function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getFrequencyData, isPlaying } = usePlayer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      const dataArray = getFrequencyData();
      
      ctx.clearRect(0, 0, width, height);

      if (dataArray) {
        // We only care about the lower half of frequencies for visual impact
        const bars = 64; 
        const barWidth = (width / bars) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bars; i++) {
          barHeight = (dataArray[i] / 255) * height;

          // Glowing gradient based on height
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, 'rgba(236, 72, 153, 0.4)'); // Pink base
          gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.8)'); // Purple mid
          gradient.addColorStop(1, 'rgba(56, 189, 248, 1)'); // Blue top

          ctx.fillStyle = gradient;
          
          // Draw rounded bars
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, 4);
          ctx.fill();

          x += barWidth + 1;
        }
      }

      if (isPlaying) {
        animationId = requestAnimationFrame(draw);
      } else {
        // If paused, draw once a flat line or just keep last frame
      }
    };

    draw();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [getFrequencyData, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={150} 
      style={{ width: '100%', height: '150px', display: 'block' }}
    />
  );
}
