
import React, { useState, useRef } from 'react';
import { AnalysisResponse, TelecomIssue } from '../types';
import { 
  ShieldCheck, RefreshCw, Plus, Volume2, Loader2, 
  Wand2, Eye, BookOpen, ExternalLink, ShieldAlert, Network, Zap
} from 'lucide-react';
import { generateBriefingAudio, simulateIdealState } from '../services/geminiService';

interface AnalysisResultProps {
  analysis: AnalysisResponse;
  isLoading: boolean;
  onRefresh?: () => void;
  onNew?: () => void;
}

const SeverityBadge = ({ severity }: { severity: TelecomIssue['severity'] }) => {
  const styles = {
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
  };
  return <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${styles[severity]}`}>{severity}</span>;
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, isLoading, onRefresh, onNew }) => {
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationUrl, setSimulationUrl] = useState<string | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-8 p-10 bg-slate-900/30 rounded-[3rem] border border-slate-800 animate-pulse space-y-8">
        <div className="flex gap-4">
          <div className="h-24 w-1/4 bg-slate-800 rounded-3xl"></div>
          <div className="h-24 w-1/4 bg-slate-800 rounded-3xl"></div>
          <div className="h-24 w-1/4 bg-slate-800 rounded-3xl"></div>
          <div className="h-24 w-1/4 bg-slate-800 rounded-3xl"></div>
        </div>
        <div className="h-96 bg-slate-800 rounded-[3rem]"></div>
      </div>
    );
  }

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const url = await simulateIdealState(analysis.description);
      setSimulationUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const playBriefing = async () => {
    if (isPlayingBriefing) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsPlayingBriefing(false);
      return;
    }
    setIsGeneratingAudio(true);
    try {
      const base64 = await generateBriefingAudio(analysis.description);
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = ctx;
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlayingBriefing(false);
      source.start();
      audioSourceRef.current = source;
      setIsPlayingBriefing(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 mb-32 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <section className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/80 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-[0.1em] text-slate-100">Forensic Briefing</h3>
              <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">Granular Detail Log // Optimized at Temp 0.2</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-cyan-400 transition-all border border-transparent hover:border-slate-700">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onNew} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-cyan-50 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg">
              <Plus className="w-4 h-4" /> NEW SCAN
            </button>
          </div>
        </div>

        <div className="p-8 space-y-12">
          {/* ANALYSIS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">Human-Readable Briefing</h4>
                </div>
                <button onClick={playBriefing} disabled={isGeneratingAudio} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${isPlayingBriefing ? 'bg-red-500/10 text-red-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                  {isGeneratingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                  {isPlayingBriefing ? 'STOP' : 'PLAY VOICE'}
                </button>
              </div>
              <div className="text-slate-400 leading-relaxed font-medium bg-black/40 p-8 rounded-[2rem] border border-white/5 min-h-[200px]">
                <p className="whitespace-pre-wrap">{analysis.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wand2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Spatial Reconstruction</h4>
                </div>
                <button 
                  onClick={handleSimulate} 
                  disabled={isSimulating || !!simulationUrl} 
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSimulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                  {simulationUrl ? 'GENERATED' : 'SIMULATE REPAIR'}
                </button>
              </div>
              <div className="aspect-video bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden relative flex items-center justify-center">
                {simulationUrl ? (
                  <img src={simulationUrl} className="w-full h-full object-cover animate-in fade-in duration-1000" />
                ) : isSimulating ? (
                  <div className="text-center space-y-4">
                     <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                     <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest animate-pulse">Neural Simulation Active...</p>
                  </div>
                ) : (
                  <div className="text-center opacity-30">
                    <Zap className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em]">Ready for Ideal State Synthesis</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RESEARCH & GROUNDING */}
          {analysis.groundingSources && analysis.groundingSources.length > 0 && (
             <div className="space-y-6 pt-6 border-t border-white/5">
               <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Technical Context Sources</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.groundingSources.map((src, i) => (
                    <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl hover:bg-blue-500/10 transition-all group">
                       <span className="text-xs font-bold text-slate-300 truncate pr-4">{src.title}</span>
                       <ExternalLink className="w-3.5 h-3.5 text-blue-400 group-hover:scale-125 transition-transform" />
                    </a>
                  ))}
               </div>
             </div>
          )}

          {/* RISK & ASSETS */}
          {analysis.auditData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6 border-t border-white/5">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Violation Records</h4>
                </div>
                <div className="space-y-4">
                  {analysis.auditData.detected_issues?.map((item, i) => (
                    <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-3xl">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-sm font-bold text-slate-100">{item.issue}</h5>
                        <SeverityBadge severity={item.severity} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium italic">"{item.evidence}"</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Network className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Decomposed Inventory</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.auditData.identified_assets?.map((asset, i) => (
                    <span key={i} className="px-5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-[10px] font-mono text-cyan-400 shadow-lg">
                      {asset.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AnalysisResult;
