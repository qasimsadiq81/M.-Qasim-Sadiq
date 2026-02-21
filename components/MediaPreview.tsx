
import React, { useRef, useState, useEffect } from 'react';
import { FileData, BoundingBox, ManualAnnotation, AnnotationType } from '../types';
import BoundingBoxOverlay from './BoundingBoxOverlay';
import { 
  Waves, Mic, Trash2, Zap, Crosshair, ShieldCheck, 
  AlertCircle, LayoutGrid
} from 'lucide-react';

interface MediaPreviewProps {
  fileData: FileData;
  boxes: BoundingBox[];
  manualBoxes?: ManualAnnotation[];
  isProcessing?: boolean;
  onAddManualBox?: (box: ManualAnnotation) => void;
  onClearManualBoxes?: () => void;
  onReAuditRegion?: (box: ManualAnnotation) => void;
  onVerifyAIBox?: (box: BoundingBox) => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ 
  fileData, 
  boxes, 
  manualBoxes = [], 
  isProcessing,
  onAddManualBox,
  onClearManualBoxes,
  onReAuditRegion,
  onVerifyAIBox
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<AnnotationType>('INFO');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<[number, number, number, number] | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || isProcessing || fileData.type === 'audio') return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 1000;
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 1000;
    
    setCurrentBox([
      Math.min(startPos.y, y),
      Math.min(startPos.x, x),
      Math.max(startPos.y, y),
      Math.max(startPos.x, x)
    ]);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox && onAddManualBox) {
      onAddManualBox({
        id: Math.random().toString(36).substr(2, 9),
        box_2d: currentBox,
        label: 'Manual Marker',
        type: drawMode
      });
    }
    setIsDrawing(false);
    setCurrentBox(null);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto space-y-4 animate-in fade-in duration-700">
      {/* COMMAND TOOLBAR */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Spatial HUD Controls</span>
          </div>
          <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded-lg border border-white/5">
            <button 
              onClick={() => setDrawMode('INFO')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${drawMode === 'INFO' ? 'bg-cyan-400 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Mapping
            </button>
            <button 
              onClick={() => setDrawMode('RISK')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${drawMode === 'RISK' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Risk
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {manualBoxes.length > 0 && (
            <button onClick={onClearManualBoxes} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
          )}
          {manualBoxes.length > 0 && onReAuditRegion && (
            <button 
              onClick={() => onReAuditRegion(manualBoxes[manualBoxes.length-1])}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 bg-white text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-cyan-50 shadow-xl disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" /> Focal Re-Audit
            </button>
          )}
        </div>
      </div>

      <div 
        ref={containerRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative aspect-auto bg-black rounded-[1.5rem] overflow-hidden shadow-2xl border border-white/5 transition-all duration-500 
          ${isDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
      >
        {fileData.type === 'image' && (
          <img src={fileData.previewUrl} alt="Neural Source" className="w-full h-auto block select-none pointer-events-none" />
        )}
        
        {fileData.type === 'video' && (
          <video src={fileData.previewUrl} controls className="w-full h-auto block max-h-[70vh] bg-black" />
        )}

        {fileData.type === 'audio' && (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-950/50 space-y-8">
            <Waves className="w-48 h-48 text-cyan-400/20 animate-pulse" />
            <audio src={fileData.previewUrl} controls className="w-full max-w-md filter invert hue-rotate-180" />
          </div>
        )}

        {/* NEURAL SCAN HUD EFFECT */}
        {isProcessing && (
          <div className="absolute inset-0 z-40 pointer-events-none bg-cyan-400/5 backdrop-blur-[1px]">
             <div className="absolute inset-0 overflow-hidden">
                <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scan_2.5s_linear_infinite]" />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="bg-black/90 px-8 py-4 rounded-xl border border-cyan-500/30 shadow-2xl">
                   <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em] animate-pulse">Running Neural Decomposition</p>
                </div>
             </div>
          </div>
        )}

        {/* DRAWING FEEDBACK */}
        {currentBox && (
          <div 
            className={`absolute border z-50 pointer-events-none transition-colors ${drawMode === 'RISK' ? 'border-fuchsia-500 bg-fuchsia-500/5' : 'border-cyan-400 bg-cyan-400/5'}`}
            style={{
              top: `${currentBox[0]/10}%`,
              left: `${currentBox[1]/10}%`,
              width: `${(currentBox[3] - currentBox[1])/10}%`,
              height: `${(currentBox[2] - currentBox[0])/10}%`,
            }}
          />
        )}

        {fileData.type !== 'audio' && !isProcessing && (
          <BoundingBoxOverlay 
            boxes={boxes} 
            manualBoxes={manualBoxes}
            containerRef={containerRef} 
            onVerifyAI={onVerifyAIBox}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(0%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(800%); opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default MediaPreview;
