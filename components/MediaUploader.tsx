
import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Video, Search, AlertCircle, HardDrive, Cpu, Mic } from 'lucide-react';
import { FileData, MediaType } from '../types';

interface MediaUploaderProps {
  onFileSelect: (fileData: FileData) => void;
  isProcessing: boolean;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // Lowered to 25MB to stay within Proxy/CloudRun 32MB hard limits

const MediaUploader: React.FC<MediaUploaderProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const processFile = useCallback((file: File) => {
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError(`Payload exceeds Proxy limits (${(file.size / 1024 / 1024).toFixed(1)}MB). Please upload a file under 25MB for neural analysis.`);
      return;
    }

    setIsReading(true);
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const previewUrl = URL.createObjectURL(file);
      
      let type: MediaType = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      onFileSelect({
        file,
        previewUrl,
        type,
        base64
      });
      setIsReading(false);
    };

    reader.onerror = () => {
      setError("Data stream corrupted. Failed to read binary source.");
      setIsReading(false);
    };

    reader.readAsDataURL(file);
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="relative"
      >
        <label className={`
          flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl 
          transition-all duration-300 cursor-pointer relative overflow-hidden
          ${isProcessing || isReading ? 'border-cyan-500/50 bg-cyan-500/5 cursor-not-allowed' : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 hover:border-cyan-500/80'}
          ${isDragging ? 'border-cyan-400 bg-cyan-400/10 scale-[1.01] shadow-2xl shadow-cyan-500/20' : ''}
        `}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
            <div className={`p-4 rounded-full mb-4 transition-all duration-500 ${isDragging ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Upload className={`w-8 h-8 ${isProcessing || isReading ? 'animate-bounce' : ''}`} />
            </div>
            
            <h3 className="text-lg font-bold text-slate-200 mb-1">Neural Multimodal Ingestion</h3>
            <p className="mb-2 text-sm text-slate-400">
              Drop scene footage or <span className="text-cyan-400 underline">select files</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-6">
              25MB Safe Payload Limit // Photos, Video, & Audio
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <div className="flex items-center text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full">
                <Search className="w-3 h-3 mr-2 text-blue-400" /> Logic Scan
              </div>
              <div className="flex items-center text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full">
                <Mic className="w-3 h-3 mr-2 text-rose-400" /> Audio Forensic
              </div>
              <div className="flex items-center text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full">
                <HardDrive className="w-3 h-3 mr-2 text-cyan-400" /> Infra Audit
              </div>
            </div>
          </div>
          
          <input 
            type="file" 
            className="hidden" 
            accept="image/*,video/*,audio/*"
            onChange={handleFileChange}
            disabled={isProcessing || isReading}
          />

          {(isProcessing || isReading) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.3em] animate-pulse">
                  {isReading ? 'Ingesting Spectral Stream' : 'Neural Mapping Active'}
                </span>
                <span className="text-[8px] text-slate-500 mt-2">OPTIMIZING DATA PACKETS</span>
              </div>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
