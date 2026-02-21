
import React, { useState, useCallback, useEffect, useRef } from 'react';
import MediaUploader from './components/MediaUploader';
import MediaPreview from './components/MediaPreview';
import AnalysisResult from './components/AnalysisResult';
import LiveExpert from './components/LiveExpert';
import { analyzeMedia } from './services/geminiService';
import { FileData, AnalysisResponse, ManualAnnotation, BoundingBox } from './types';
import { 
  Zap, History as HistoryIcon, Trash2, 
  AlertCircle, Radio, ShieldCheck, Target, 
  Settings2, Activity, Globe, Shield, Link,
  Camera, Video, Folder, Info
} from 'lucide-react';

const STORAGE_KEY = 'spatial_agent_v8_history';

const App: React.FC = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [manualBoxes, setManualBoxes] = useState<ManualAnnotation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [currentHost, setCurrentHost] = useState('');

  useEffect(() => {
    setCurrentHost(window.location.hostname);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp) })));
        }
      } catch (e) {}
    }
  }, []);

  const performAnalysis = async (data: FileData, customPrompt?: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      if (!data.base64) throw new Error("Binary data missing.");
      const result = await analyzeMedia(data.type, data.base64, data.file.type, customPrompt);
      setAnalysis(result);
      
      const newItem = { 
        id: Math.random().toString(36).substr(2, 9), 
        fileData: data, 
        analysis: result, 
        timestamp: new Date() 
      };
      setHistory(prev => [newItem, ...prev.slice(0, 19)]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newItem, ...history].slice(0, 20)));
    } catch (err: any) {
      setError(err.message || "Neural synchronization error.");
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleReAuditRegion = (box: ManualAnnotation) => {
    if (!fileData) return;
    const [ymin, xmin, ymax, xmax] = box.box_2d;
    const prompt = `Perform a high-precision forensic analysis of the area within [ymin: ${ymin}, xmin: ${xmin}, ymax: ${ymax}, xmax: ${xmax}]. Identify all micro-details.`;
    performAnalysis(fileData, prompt);
  };

  const handleVerifyAIBox = (box: BoundingBox) => {
    setManualBoxes(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        box_2d: box.box_2d,
        label: box.label,
        type: 'CLEAR',
        verified: true
      }
    ]);
  };

  const handleFileSelect = useCallback(async (data: FileData) => {
    setFileData(data);
    setAnalysis(null);
    setManualBoxes([]);
    await performAnalysis(data);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-cyan-500/30 font-sans">
      {/* HEADER: Matches screenshot exactly */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/90 backdrop-blur-md px-6 py-5 flex justify-between items-center border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Multimodal Spatial Agent
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">V2.5 // NEURAL MAPPING ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-mono tracking-tighter uppercase">Secure Pipeline 128-bit</span>
          </div>
          <button 
            onClick={() => setIsLiveMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 hover:bg-slate-800 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500" /> Field Expert
          </button>
        </div>
      </header>

      {isLiveMode && <LiveExpert onClose={() => setIsLiveMode(false)} />}

      <main className="flex-1 max-w-7xl mx-auto w-full pt-28 pb-40 px-6 space-y-12">
        {!isProcessing && !analysis && (
          <div className="max-w-3xl mx-auto py-20">
            <MediaUploader onFileSelect={handleFileSelect} isProcessing={isProcessing} />
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto p-10 bg-red-950/20 border border-red-500/20 rounded-3xl text-red-400 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-lg font-black uppercase tracking-widest">Neural Link Failure</h3>
            </div>
            <p className="font-mono text-xs bg-red-500/5 p-6 rounded-xl">{error}</p>
            <button onClick={() => { setFileData(null); setError(null); }} className="mt-8 w-full py-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Reset Interface</button>
          </div>
        )}

        {fileData && !error && (
          <div className="animate-in fade-in duration-1000">
            <MediaPreview 
              fileData={fileData} 
              boxes={analysis?.boxes || []} 
              manualBoxes={manualBoxes}
              isProcessing={isProcessing} 
              onAddManualBox={(box) => setManualBoxes(prev => [...prev, box])}
              onClearManualBoxes={() => setManualBoxes([])}
              onReAuditRegion={handleReAuditRegion}
              onVerifyAIBox={handleVerifyAIBox}
            />
          </div>
        )}

        {(isProcessing || (analysis && !error)) && (
          <AnalysisResult 
            analysis={analysis || { description: '', boxes: [] }} 
            isLoading={isProcessing} 
            onRefresh={() => fileData && performAnalysis(fileData)}
            onNew={() => { setFileData(null); setAnalysis(null); setManualBoxes([]); }}
          />
        )}
      </main>

      {/* FLOATING UTILITY DOCK */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
         <button className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white" title="Link Analysis"><Link className="w-5 h-5" /></button>
         <button className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white" title="Camera Capture"><Camera className="w-5 h-5" /></button>
         <button className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white" title="Video Stream"><Video className="w-5 h-5" /></button>
         <button className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white" title="Audit Folder"><Folder className="w-5 h-5" /></button>
         <div className="w-px h-8 bg-white/10 mx-1" />
         <button className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white" title="HUD Settings"><Settings2 className="w-5 h-5" /></button>
      </nav>

      <footer className="py-12 px-8 text-center opacity-30">
        <p className="text-[10px] font-mono tracking-[0.5em] text-slate-500 uppercase">Field Terminal v2.5_Neural // Forensic Division</p>
      </footer>
    </div>
  );
};

export default App;
