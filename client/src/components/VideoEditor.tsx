import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import type { Annotation, VideoMetadata } from '../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Settings2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Slider from '@radix-ui/react-slider';
import * as Tooltip from '@radix-ui/react-tooltip';

interface Props {
  file: File | null;
  metadata: VideoMetadata | null;
  onMetadataLoaded: (meta: VideoMetadata) => void;
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  currentTime: number;
  setCurrentTime: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  markerMode: boolean;
  
  currentText: string;
  currentType: 'dot' | 'arrow' | 'pin';
  currentStyle: 'label' | 'callout' | 'headline';
  currentColor: string;
  currentTextColor: string;
  currentSize: number;
  currentTextSize: number;
  currentFontWeight: string;
  currentFontStyle: string;
  currentFontFamily: string;
  currentDuration: number;
  labelAlwaysVisible: boolean;
}

export const VideoEditor: React.FC<Props> = ({
  file,
  metadata,
  onMetadataLoaded,
  annotations,
  setAnnotations,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  markerMode,
  currentText,
  currentType,
  currentStyle,
  currentColor,
  currentTextColor,
  currentSize,
  currentTextSize,
  currentFontWeight,
  currentFontStyle,
  currentFontFamily,
  currentDuration,
  labelAlwaysVisible
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [overlayRect, setOverlayRect] = useState<{ width: number, height: number, left: number, top: number } | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
      else videoRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const updateOverlayRect = () => {
    if (!containerRef.current || !metadata) return;
    const container = containerRef.current.getBoundingClientRect();
    const vidAspect = metadata.width / metadata.height;
    const contAspect = container.width / container.height;

    let renderW, renderH, offsetX, offsetY;
    if (contAspect > vidAspect) {
        renderH = container.height;
        renderW = renderH * vidAspect;
        offsetX = (container.width - renderW) / 2;
        offsetY = 0;
    } else {
        renderW = container.width;
        renderH = renderW / vidAspect;
        offsetX = 0;
        offsetY = (container.height - renderH) / 2;
    }
    setOverlayRect({ width: renderW, height: renderH, left: offsetX, top: offsetY });
  };

  useLayoutEffect(() => {
      updateOverlayRect();
      const observer = new ResizeObserver(updateOverlayRect);
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
  }, [metadata]); 

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const meta = {
        filename: file?.name || 'video',
        duration: videoRef.current.duration,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
        fps: 30,
        url: ''
      };
      onMetadataLoaded(meta);
      setTimeout(updateOverlayRect, 50); 
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      setIsHovering(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setIsHovering(false), 3000);

      if (draggingId === null || !overlayRect || !metadata || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      let relX = (clientX - overlayRect.left) / overlayRect.width;
      let relY = (clientY - overlayRect.top) / overlayRect.height;

      const finalX = Math.max(0, Math.min(1, relX)) * metadata.width;
      const finalY = Math.max(0, Math.min(1, relY)) * metadata.height;

      setAnnotations(prev => prev.map(ann => ann.id === draggingId ? { ...ann, x: finalX, y: finalY } : ann));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!markerMode || !overlayRect || !metadata || draggingId !== null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (clientX < overlayRect.left || clientX > overlayRect.left + overlayRect.width ||
        clientY < overlayRect.top || clientY > overlayRect.top + overlayRect.height) return;

    const relX = (clientX - overlayRect.left) / overlayRect.width;
    const relY = (clientY - overlayRect.top) / overlayRect.height;

    const newAnn: Annotation = {
        id: Date.now(),
        x: relX * metadata.width,
        y: relY * metadata.height,
        time_sec: currentTime,
        duration_sec: currentDuration,
        text: currentText || `Task ${annotations.length + 1}`,
        marker_type: currentType,
        text_style: currentStyle,
        color: currentColor,
        text_color: currentTextColor,
        marker_size: currentSize,
        text_size: currentTextSize,
        font_weight: currentFontWeight,
        font_style: currentFontStyle,
        font_family: currentFontFamily,
        label_always_visible: labelAlwaysVisible
    };
    setAnnotations([...annotations, newAnn]);
    setIsPlaying(false);
  };

  const activeAnnotations = annotations.filter(
    ann => currentTime >= ann.time_sec && currentTime <= (ann.time_sec + ann.duration_sec)
  );

  return (
    <Tooltip.Provider>
    <div 
        ref={containerRef}
        className="h-full w-full relative flex items-center justify-center overflow-hidden bg-black group/editor selection:none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setIsHovering(false); setDraggingId(null); }}
        onMouseUp={() => setDraggingId(null)}
        onClick={handleOverlayClick}
        style={{ cursor: draggingId ? 'grabbing' : markerMode ? 'crosshair' : 'default' }}
    >
        {objectUrl ? (
          <video
            ref={videoRef}
            src={objectUrl}
            className="w-full h-full object-contain pointer-events-none transition-transform duration-700"
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={handleLoadedMetadata}
            muted={isMuted}
            playsInline
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-800 animate-pulse">
              <Play size={32} />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Waiting for Media</div>
          </motion.div>
        )}

        {/* Video Overlay Layer */}
        {metadata && overlayRect && (
             <div 
                className="absolute pointer-events-none"
                style={{ width: overlayRect.width, height: overlayRect.height, left: overlayRect.left, top: overlayRect.top }}
             >
                <AnimatePresence>
                {activeAnnotations.map(ann => {
                    const l = (ann.x / metadata.width) * 100;
                    const t = (ann.y / metadata.height) * 100;
                    
                    return (
                        <motion.div
                            key={ann.id}
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group/marker z-50"
                            style={{ left: `${l}%`, top: `${t}%`, pointerEvents: 'auto' }}
                            onMouseDown={(e) => { e.stopPropagation(); setDraggingId(ann.id); setIsPlaying(false); }}
                        >
                            {/* Marker Graphics */}
                            <div className="relative">
                                {ann.marker_type === 'dot' && (
                                    <div 
                                        className="rounded-full border-[3px] border-white shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-125"
                                        style={{ backgroundColor: ann.color, width: ann.marker_size, height: ann.marker_size }}
                                    />
                                )}
                                {ann.marker_type === 'arrow' && (
                                    <div className="drop-shadow-2xl transition-transform group-hover:scale-125" style={{ color: ann.color, transform: 'rotate(-45deg)', fontSize: ann.marker_size * 2 }}>➤</div>
                                )}
                                {ann.marker_type === 'pin' && (
                                    <div className="drop-shadow-2xl transition-transform group-hover:scale-125 -translate-y-1/2" style={{ color: ann.color, fontSize: ann.marker_size * 2.5 }}>📍</div>
                                )}

                                {/* Label Component */}
                                <AnimatePresence>
                                    {(ann.label_always_visible || draggingId === ann.id || isHovering) && (
                                        <>
                                            {ann.text_style === 'label' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="absolute left-full ml-4 top-1/2 -translate-y-1/2"
                                                >
                                                    <div 
                                                        className="backdrop-blur-2xl border border-white/10 px-5 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] whitespace-nowrap"
                                                        style={{ 
                                                            backgroundColor: 'rgba(9,9,11,0.85)',
                                                            color: ann.text_color,
                                                            borderLeft: `4px solid ${ann.color}`
                                                        }}
                                                    >
                                                        <div 
                                                            className="tracking-tight"
                                                            style={{ 
                                                                fontSize: `${ann.text_size}px`,
                                                                fontWeight: ann.font_weight,
                                                                fontStyle: ann.font_style,
                                                                fontFamily: ann.font_family
                                                            }}
                                                        >
                                                            {ann.text}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {ann.text_style === 'callout' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="absolute"
                                                    style={{ left: 40, bottom: 40 }}
                                                >
                                                    <div className="relative">
                                                        {/* Connecting Line */}
                                                        <div 
                                                            className="absolute bottom-0 left-0 w-10 h-10 border-l-2 border-b-2 -translate-x-full translate-y-full"
                                                            style={{ borderColor: ann.color, borderBottomLeftRadius: '12px' }}
                                                        />
                                                        <div 
                                                            className="backdrop-blur-2xl border-2 px-6 py-4 rounded-2xl shadow-2xl min-w-[200px]"
                                                            style={{ 
                                                                backgroundColor: 'rgba(9,9,11,0.9)',
                                                                color: ann.text_color,
                                                                borderColor: ann.color
                                                            }}
                                                        >
                                                            <div 
                                                                style={{ 
                                                                    fontSize: `${ann.text_size}px`,
                                                                    fontWeight: ann.font_weight,
                                                                    fontStyle: ann.font_style,
                                                                    fontFamily: ann.font_family
                                                                }}
                                                            >
                                                                {ann.text}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Headline style is rendered outside the marker group for absolute bottom positioning */}
                            <AnimatePresence>
                                {ann.text_style === 'headline' && (ann.label_always_visible || isHovering) && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="fixed bottom-32 left-10 z-[60]"
                                        style={{ width: overlayRect.width / 2 }}
                                    >
                                        <div 
                                            className="backdrop-blur-3xl border border-white/10 px-8 py-6 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
                                            style={{ backgroundColor: 'rgba(9,9,11,0.8)' }}
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: ann.color }} />
                                            <div 
                                                style={{ 
                                                    color: ann.text_color,
                                                    fontSize: `${ann.text_size * 1.5}px`,
                                                    fontWeight: ann.font_weight,
                                                    fontStyle: ann.font_style,
                                                    fontFamily: ann.font_family
                                                }}
                                            >
                                                {ann.text}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
             </div>
        )}

        {/* Cinematic Controls */}
        <AnimatePresence>
            {isHovering && (
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-zinc-950/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-4 flex items-center gap-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                        {/* Play/Pause */}
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            {isPlaying ? <Pause fill="black" size={24} /> : <Play fill="black" size={24} className="ml-1" />}
                        </button>

                        <div className="flex-1 flex flex-col gap-3">
                            {/* Scrubber */}
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-black font-mono text-zinc-500 w-12">{currentTime.toFixed(1)}s</span>
                                <Slider.Root 
                                    className="relative flex items-center select-none touch-none grow h-5"
                                    value={[currentTime]}
                                    max={metadata?.duration || 100}
                                    step={0.01}
                                    onValueChange={([val]) => { setCurrentTime(val); if (videoRef.current) videoRef.current.currentTime = val; }}
                                >
                                    <Slider.Track className="bg-white/10 relative grow rounded-full h-[6px] overflow-hidden">
                                        <Slider.Range className="absolute bg-blue-500 h-full" />
                                    </Slider.Track>
                                    <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-lg ring-4 ring-blue-500/20 focus:outline-none" />
                                </Slider.Root>
                                <span className="text-[11px] font-black font-mono text-zinc-500 w-12 text-right">{metadata?.duration.toFixed(1) || '0.0'}s</span>
                            </div>

                            {/* Utility Bar */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-6">
                                    <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; }} className="text-zinc-500 hover:text-white transition-colors">
                                        <RotateCcw size={18} />
                                    </button>
                                    <div className="h-4 w-px bg-white/5" />
                                    <div className="flex items-center gap-3 group/vol">
                                        <button onClick={() => setIsMuted(!isMuted)} className="text-zinc-500 hover:text-white transition-colors">
                                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                        </button>
                                        <div className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-300">
                                            <div className="w-20 h-1 bg-white/10 rounded-full">
                                                <div className="w-3/4 h-full bg-blue-500 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <button className="text-zinc-500 hover:text-white transition-colors"><Settings2 size={18} /></button>
                                    <button className="text-zinc-500 hover:text-white transition-colors"><Maximize2 size={18} /></button>
                                    <button className="text-zinc-500 hover:text-white transition-colors"><MoreHorizontal size={18} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Floating Action Hint */}
        {markerMode && !isPlaying && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-10 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 backdrop-blur-xl pointer-events-none z-10 shadow-2xl shadow-blue-500/10"
            >
                Click video to place {currentType} marker
            </motion.div>
        )}
    </div>
    </Tooltip.Provider>
  );
};
