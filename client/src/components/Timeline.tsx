import React, { useRef } from 'react';
import type { Annotation } from '../types';
import { motion } from 'framer-motion';
import { Scissors } from 'lucide-react';

interface Props {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  annotations: Annotation[];
}

export const Timeline: React.FC<Props> = ({ duration, currentTime, onSeek, annotations }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || duration <= 0) return;
    const update = (clientX: number) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      onSeek((x / rect.width) * duration);
    };
    update(e.clientX);
    const move = (ev: MouseEvent) => update(ev.clientX);
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col select-none relative group overflow-hidden border-t border-white/[0.05]">
        {/* Track Header */}
        <div className="h-10 px-6 flex items-center justify-between bg-zinc-900/30 border-b border-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              <Scissors size={12} /> Editing Track
            </div>
            <div className="h-3 w-px bg-white/5" />
            <div className="text-[10px] font-mono text-blue-500 font-bold tracking-tighter">
              {currentTime.toFixed(2)}s
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500/20" />
            <div className="w-2 h-2 rounded-full bg-zinc-800" />
          </div>
        </div>

        <div className="flex-1 flex flex-col">
            {/* Ruler */}
            <div className="h-10 bg-zinc-950/50 flex items-end px-0 relative border-b border-white/[0.02]">
                {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="flex-1 border-r border-white/[0.05] h-3 flex items-start pl-1 group/tick">
                        {i % 4 === 0 && (
                          <span className="text-[9px] text-zinc-700 font-black font-mono absolute -top-5">
                            {(i * (duration / 40)).toFixed(0)}s
                          </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Canvas */}
            <div 
                ref={containerRef}
                className="flex-1 relative cursor-crosshair group/canvas"
                onMouseDown={handleMouseDown}
            >
                {/* Visual Audio Waveform Placeholder */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 opacity-[0.03] pointer-events-none flex items-center gap-[2px] px-2">
                  {Array.from({ length: 200 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-white" style={{ height: `${Math.random() * 100}%` }} />
                  ))}
                </div>

                {/* Annotation Clips */}
                <div className="absolute inset-y-0 py-4 w-full">
                    {annotations.map((ann) => {
                        const l = (ann.time_sec / duration) * 100;
                        const w = (ann.duration_sec / duration) * 100;
                        return (
                            <motion.div
                                key={ann.id}
                                layoutId={`clip-${ann.id}`}
                                className="absolute h-full rounded-xl border border-white/10 overflow-hidden shadow-2xl group/clip backdrop-blur-md"
                                style={{ left: `${l}%`, width: `${w}%`, borderLeft: `4px solid ${ann.color}`, backgroundColor: 'rgba(255,255,255,0.03)' }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                                <div className="p-3 flex items-center gap-3 h-full">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ann.color }} />
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] text-white font-bold truncate leading-none uppercase tracking-wider">{ann.text || 'Step'}</span>
                                      <span className="text-[9px] text-zinc-500 font-bold mt-1 tracking-widest">{ann.duration_sec}s</span>
                                    </div>
                                </div>
                                {/* Resizers */}
                                <div className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/10 cursor-e-resize transition-colors" />
                            </motion.div>
                        );
                    })}
                </div>

                {/* Playhead Overlay */}
                <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-blue-500 z-50 pointer-events-none shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                >
                    <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xl" />
                </div>
            </div>
        </div>
    </div>
  );
};
