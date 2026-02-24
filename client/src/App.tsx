import React, { useState } from 'react';
import { VideoEditor } from './components/VideoEditor';
import { ControlPanel } from './components/ControlPanel';
import { Timeline } from './components/Timeline';
import type { Annotation, VideoMetadata } from './types';
import { Upload, X, Loader2, CheckCircle, Box, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.PROD ? '' : '/api';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Editor State
  const [currentText, setCurrentText] = useState('');
  const [currentType, setCurrentType] = useState<'dot' | 'arrow' | 'pin'>('dot');
  const [currentStyle, setCurrentStyle] = useState<'label' | 'callout' | 'headline'>('label');
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [currentTextColor, setCurrentTextColor] = useState('#ffffff');
  const [currentSize, setCurrentSize] = useState(16);
  const [currentDuration, setCurrentDuration] = useState(3);
  const [labelAlwaysVisible, setLabelAlwaysVisible] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data: VideoMetadata = await res.json();
        setMetadata(data);
      } catch (err) {
        console.error(err);
        setFile(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleExport = async () => {
    if (!metadata) return;
    setIsExporting(true);
    try {
      const res = await fetch(`${API_URL}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: metadata.filename, annotations, keep_audio: true })
      });
      if (!res.ok) throw new Error('Render failed');
      const data = await res.json();
      setExportUrl(data.url);
    } catch (err) {
      console.error(err);
      alert('Render failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-blue-500/30">
      <div className="noise" />
      
      {/* Sidebar - Property Inspector */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-[380px] flex-shrink-0 h-full z-40 relative flex flex-col shadow-[40px_0_80px_rgba(0,0,0,0.8)]"
      >
         {/* Branding Area */}
         <div className="h-20 flex items-center px-8 border-b border-white/[0.05] gap-4 bg-zinc-950">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <Zap size={20} fill="black" stroke="black" />
            </div>
            <div>
                <h1 className="font-black text-lg tracking-tighter uppercase leading-none">EasyExplain</h1>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                   <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">Engine v1.0.4</p>
                </div>
            </div>
         </div>

         <ControlPanel
            currentText={currentText} setCurrentText={setCurrentText}
            currentType={currentType} setCurrentType={setCurrentType}
            currentStyle={currentStyle} setCurrentStyle={setCurrentStyle}
            currentColor={currentColor} setCurrentColor={setCurrentColor}
            currentTextColor={currentTextColor} setCurrentTextColor={setCurrentTextColor}
            currentSize={currentSize} setCurrentSize={setCurrentSize}
            currentDuration={currentDuration} setCurrentDuration={setCurrentDuration}
            labelAlwaysVisible={labelAlwaysVisible} setLabelAlwaysVisible={setLabelAlwaysVisible}
            annotations={annotations}
            onUndo={() => setAnnotations(prev => prev.slice(0, -1))}
            onClear={() => setAnnotations([])}
            onExport={handleExport}
            isExporting={isExporting}
         />
      </motion.div>

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        {/* Navigation Bar */}
        <div className="h-20 border-b border-white/[0.05] bg-zinc-950 flex items-center justify-between px-10">
            <div className="flex items-center gap-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-white/5">
                    <Box size={16} className="text-zinc-500" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Main Composition</span>
                </div>
                <div className="h-4 w-px bg-white/5" />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">{metadata?.width || 0}x{metadata?.height || 0}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-700 font-bold">30.00 FPS</span>
                </div>
            </div>
            
            {file && (
                <button 
                    onClick={() => { setFile(null); setMetadata(null); setAnnotations([]); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
                >
                    <X size={14} /> Close Engine
                </button>
            )}
        </div>

        {/* Studio Workspace */}
        <div className="flex-1 p-10 flex flex-col min-h-0 bg-[#020202]">
            {!file ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
                    <label className="group relative flex flex-col items-center justify-center w-full max-w-4xl h-[500px] border-2 border-dashed border-zinc-800 rounded-[48px] bg-zinc-950/50 hover:bg-zinc-900/50 hover:border-blue-500/30 transition-all cursor-pointer">
                        <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                        
                        <div className="w-32 h-32 rounded-[32px] bg-zinc-900 border border-white/5 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500 shadow-2xl">
                            {isUploading ? (
                                <Loader2 className="animate-spin text-white w-10 h-10" />
                            ) : (
                                <Upload className="text-zinc-600 group-hover:text-white w-10 h-10 transition-colors" />
                            )}
                        </div>
                        
                        <h3 className="text-3xl font-black text-white tracking-tighter mb-4">Initialize Project</h3>
                        <p className="text-zinc-500 font-medium max-w-sm text-center leading-relaxed">
                            Upload high-fidelity footage to start annotating. Supported formats: MP4, MOV, WebM.
                        </p>
                    </label>
                </motion.div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0 gap-10">
                    <div className="flex-1 min-h-0 rounded-[48px] overflow-hidden shadow-[0_80px_160px_rgba(0,0,0,0.9)] border border-white/5 bg-black ring-1 ring-white/10">
                        <VideoEditor
                            file={file} metadata={metadata}
                            onMetadataLoaded={(m) => setMetadata({...metadata!, ...m})}
                            annotations={annotations} setAnnotations={setAnnotations}
                            currentTime={currentTime} setCurrentTime={setCurrentTime}
                            isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                            markerMode={true} currentText={currentText}
                            currentType={currentType} currentStyle={currentStyle}
                            currentColor={currentColor} currentTextColor={currentTextColor}
                            currentSize={currentSize} currentDuration={currentDuration}
                            labelAlwaysVisible={labelAlwaysVisible}
                        />
                    </div>
                    
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="h-64 bg-zinc-950 rounded-[40px] border border-white/[0.05] overflow-hidden shadow-2xl"
                    >
                        <Timeline 
                            duration={metadata?.duration || 100}
                            currentTime={currentTime}
                            onSeek={setCurrentTime}
                            annotations={annotations}
                        />
                    </motion.div>
                </div>
            )}
        </div>

        {/* Premium Export Modal */}
        <AnimatePresence>
            {exportUrl && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[1000] flex items-center justify-center p-8"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
                        className="bg-zinc-900 border border-white/10 rounded-[48px] p-12 max-w-lg w-full text-center relative shadow-2xl overflow-hidden"
                    >
                        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-600/20 to-transparent" />
                        
                        <div className="relative z-10">
                          <div className="w-24 h-24 bg-green-500 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_40px_rgba(34,197,94,0.3)]">
                              <CheckCircle className="w-12 h-12 text-black" />
                          </div>
                          <h3 className="text-4xl font-black text-white tracking-tighter mb-4">Production Ready</h3>
                          <p className="text-zinc-500 font-medium mb-12">Your instructional asset has been successfully compiled and synchronized.</p>
                          
                          <div className="flex flex-col gap-4">
                              <a 
                                  href={`${API_URL}${exportUrl}`} download 
                                  className="w-full py-6 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-2xl"
                              >
                                  Download Master File
                              </a>
                              <button 
                                  onClick={() => setExportUrl(null)} 
                                  className="w-full py-6 bg-zinc-800 text-zinc-500 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:text-white transition-all"
                              >
                                  Return to Editor
                              </button>
                          </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
