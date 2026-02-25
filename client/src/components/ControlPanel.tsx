import React from 'react';
import type { Annotation } from '../types';
import { 
  Type, MousePointer2, MapPin, LayoutTemplate, MessageSquare, 
  Heading, Clock, CheckCircle2, Undo2, Trash2, 
  MonitorPlay, Layers, Palette, Sparkles, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import * as Slider from '@radix-ui/react-slider';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';

interface Props {
  currentText: string;
  setCurrentText: (s: string) => void;
  currentType: 'dot' | 'arrow' | 'pin';
  setCurrentType: (t: 'dot' | 'arrow' | 'pin') => void;
  currentStyle: 'label' | 'callout' | 'headline';
  setCurrentStyle: (s: 'label' | 'callout' | 'headline') => void;
  currentColor: string;
  setCurrentColor: (c: string) => void;
  currentTextColor: string;
  setCurrentTextColor: (c: string) => void;
  currentSize: number;
  setCurrentSize: (n: number) => void;
  currentTextSize: number;
  setCurrentTextSize: (n: number) => void;
  currentFontWeight: string;
  setCurrentFontWeight: (s: string) => void;
  currentFontStyle: string;
  setCurrentFontStyle: (s: string) => void;
  currentFontFamily: string;
  setCurrentFontFamily: (s: string) => void;
  currentDuration: number;
  setCurrentDuration: (n: number) => void;
  labelAlwaysVisible: boolean;
  setLabelAlwaysVisible: (v: boolean) => void;
  
  onUndo: () => void;
  onClear: () => void;
  onExport: () => void;
  isExporting: boolean;
  annotations: Annotation[];
}

const ControlSection = ({ title, icon: Icon, children, className }: any) => (
  <div className={cn("space-y-4 mb-8", className)}>
    <div className="flex items-center gap-2 px-1">
      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
        <Icon size={14} />
      </div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">{title}</h3>
    </div>
    <div className="px-1">{children}</div>
  </div>
);

export const ControlPanel: React.FC<Props> = ({
  currentText, setCurrentText,
  currentType, setCurrentType,
  currentStyle, setCurrentStyle,
  currentColor, setCurrentColor,
  currentTextColor, setCurrentTextColor,
  currentSize, setCurrentSize,
  currentTextSize, setCurrentTextSize,
  currentFontWeight, setCurrentFontWeight,
  currentFontStyle, setCurrentFontStyle,
  currentFontFamily, setCurrentFontFamily,
  currentDuration, setCurrentDuration,
  labelAlwaysVisible, setLabelAlwaysVisible,
  onUndo, onClear, onExport, isExporting,
  annotations
}) => {
  return (
    <Tooltip.Provider>
    <div className="h-full bg-zinc-950 border-l border-white/[0.05] flex flex-col font-sans select-none overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-6 border-b border-white/[0.05] flex items-center justify-between bg-zinc-950/50 backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Inspector <Sparkles size={14} className="text-blue-500" />
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Element Configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button 
                onClick={onUndo}
                className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.05] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-90"
              >
                <Undo2 size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="bg-zinc-900 text-white text-[10px] px-2 py-1 rounded border border-white/10" sideOffset={5}>
                Undo Last Action
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        
        {/* Content Tab System */}
        <Tabs.Root defaultValue="content" className="flex flex-col">
          <Tabs.List className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl mb-8 border border-white/[0.05]">
            <Tabs.Trigger 
              value="content" 
              className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-500 transition-all"
            >
              General
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="style" 
              className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-500 transition-all"
            >
              Appearance
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="content" className="animate-in fade-in slide-in-from-right-2 duration-300">
            <ControlSection title="Annotation Text" icon={Type}>
              <div className="relative group">
                <textarea
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="What should the viewer do?"
                  className="w-full bg-zinc-900 border border-white/[0.05] rounded-2xl p-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all h-32 resize-none placeholder:text-zinc-600 font-medium leading-relaxed shadow-inner"
                />
                <div className="absolute bottom-4 right-4 text-[10px] font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded-md border border-white/5 backdrop-blur-md">
                  {currentText.length}
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/[0.05]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-zinc-300">Visibility Mode</span>
                  <span className="text-[10px] text-zinc-500 font-medium">{labelAlwaysVisible ? 'Pinned to screen' : 'Appears on hover'}</span>
                </div>
                <button 
                  onClick={() => setLabelAlwaysVisible(!labelAlwaysVisible)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    labelAlwaysVisible ? "bg-blue-600" : "bg-zinc-800"
                  )}
                >
                  <motion.div 
                    animate={{ x: labelAlwaysVisible ? 22 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                  />
                </button>
              </div>
            </ControlSection>

            <ControlSection title="Timeline & Size" icon={Clock}>
              <div className="space-y-8 mt-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Marker Size</span>
                    <span className="text-[12px] font-mono font-bold text-blue-400">{currentSize}px</span>
                  </div>
                  <Slider.Root 
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[currentSize]}
                    max={120}
                    min={8}
                    step={2}
                    onValueChange={([val]) => setCurrentSize(val)}
                  >
                    <Slider.Track className="bg-zinc-800 relative grow rounded-full h-[4px]">
                      <Slider.Range className="absolute bg-blue-600 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-xl rounded-full hover:scale-125 transition-transform focus:outline-none ring-4 ring-blue-500/20" />
                  </Slider.Root>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Display Duration</span>
                    <span className="text-[12px] font-mono font-bold text-purple-400">{currentDuration}s</span>
                  </div>
                  <Slider.Root 
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[currentDuration]}
                    max={15}
                    min={0.5}
                    step={0.5}
                    onValueChange={([val]) => setCurrentDuration(val)}
                  >
                    <Slider.Track className="bg-zinc-800 relative grow rounded-full h-[4px]">
                      <Slider.Range className="absolute bg-purple-600 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-xl rounded-full hover:scale-125 transition-transform focus:outline-none ring-4 ring-purple-500/20" />
                  </Slider.Root>
                </div>
              </div>
            </ControlSection>
          </Tabs.Content>

          <Tabs.Content value="style" className="animate-in fade-in slide-in-from-left-2 duration-300">
            <ControlSection title="Marker Presets" icon={Layers}>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dot', icon: <CheckCircle2 size={18} />, label: 'Standard' },
                  { id: 'arrow', icon: <MousePointer2 size={18} />, label: 'Indicator' },
                  { id: 'pin', icon: <MapPin size={18} />, label: 'Point' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setCurrentType(type.id as any)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all relative group",
                      currentType === type.id 
                        ? "bg-blue-600/10 border-blue-500/50 text-blue-400" 
                        : "bg-zinc-900 border-white/[0.03] text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                    )}
                  >
                    {currentType === type.id && (
                      <motion.div layoutId="markerBg" className="absolute inset-0 bg-blue-500/5 rounded-[15px] pointer-events-none" />
                    )}
                    <span className="group-hover:scale-110 transition-transform">{type.icon}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider">{type.label}</span>
                  </button>
                ))}
              </div>
            </ControlSection>

            <ControlSection title="Text Display" icon={LayoutTemplate}>
              <div className="space-y-2">
                {[
                  { id: 'label', icon: <MessageSquare size={16} />, label: 'Floating Label', desc: 'Minimal text bubble' },
                  { id: 'callout', icon: <LayoutTemplate size={16} />, label: 'Dynamic Box', desc: 'Connected box style' },
                  { id: 'headline', icon: <Heading size={16} />, label: 'Cinematic Title', desc: 'Lower third presentation' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setCurrentStyle(style.id as any)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                      currentStyle === style.id 
                        ? "bg-zinc-800 border-white/10 ring-1 ring-blue-500/30" 
                        : "bg-zinc-900/50 border-white/[0.03] hover:bg-zinc-900 hover:border-white/10"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-xl transition-colors",
                      currentStyle === style.id ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500 group-hover:text-zinc-300"
                    )}>
                      {style.icon}
                    </div>
                    <div>
                      <div className={cn("text-xs font-bold", currentStyle === style.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>{style.label}</div>
                      <div className="text-[10px] text-zinc-600 font-medium mt-0.5">{style.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </ControlSection>

            <ControlSection title="Color Palette" icon={Palette}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Marker</span>
                  <div className="relative">
                    <input 
                      type="color" value={currentColor} 
                      onChange={(e) => setCurrentColor(e.target.value)}
                      className="w-full h-12 rounded-xl bg-zinc-900 border border-white/5 cursor-pointer p-1.5"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Typography</span>
                  <div className="relative">
                    <input 
                      type="color" value={currentTextColor} 
                      onChange={(e) => setCurrentTextColor(e.target.value)}
                      className="w-full h-12 rounded-xl bg-zinc-900 border border-white/5 cursor-pointer p-1.5"
                    />
                  </div>
                </div>
              </div>
            </ControlSection>

            <ControlSection title="Typography" icon={Type}>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Text Size</span>
                    <span className="text-[12px] font-mono font-bold text-blue-400">{currentTextSize}px</span>
                  </div>
                  <Slider.Root 
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[currentTextSize]}
                    max={48}
                    min={8}
                    step={1}
                    onValueChange={([val]) => setCurrentTextSize(val)}
                  >
                    <Slider.Track className="bg-zinc-800 relative grow rounded-full h-[4px]">
                      <Slider.Range className="absolute bg-blue-600 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-xl rounded-full hover:scale-125 transition-transform focus:outline-none ring-4 ring-blue-500/20" />
                  </Slider.Root>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Weight</label>
                    <select 
                      value={currentFontWeight}
                      onChange={(e) => setCurrentFontWeight(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="400">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">SemiBold</option>
                      <option value="700">Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Style</label>
                    <select 
                      value={currentFontStyle}
                      onChange={(e) => setCurrentFontStyle(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Font Family</label>
                  <select 
                    value={currentFontFamily}
                    onChange={(e) => setCurrentFontFamily(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                    <option value="serif">Serif</option>
                    <option value="'Playfair Display', serif">Playfair Display</option>
                  </select>
                </div>
              </div>
            </ControlSection>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/[0.05] bg-zinc-950 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button 
            onClick={onClear}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all active:scale-95"
          >
            <Trash2 size={14} /> Reset all
          </button>
          <div className="bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
            {annotations.length} Nodes
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onExport}
          disabled={isExporting || annotations.length === 0}
          className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] group relative overflow-hidden"
        >
          {isExporting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Rendering Master...</span>
            </>
          ) : (
            <>
              <MonitorPlay size={18} />
              <span>Export Production</span>
              <div className="absolute inset-0 bg-blue-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 mix-blend-difference" />
            </>
          )}
        </motion.button>
      </div>
    </div>
    </Tooltip.Provider>
  );
};
