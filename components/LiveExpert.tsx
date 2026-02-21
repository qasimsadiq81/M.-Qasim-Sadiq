
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, Video, VideoOff, X, Activity, MessageSquare } from 'lucide-react';

const LiveExpert: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are a live telecom field expert. Listen to the technician and provide immediate, concise guidance on fiber compliance and rack installation.',
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => setIsActive(true),
          onmessage: async (msg) => {
            if (msg.serverContent?.inputTranscription) {
              setTranscripts(prev => [...prev.slice(-4), `Tech: ${msg.serverContent.inputTranscription.text}`]);
            }
            if (msg.serverContent?.outputTranscription) {
              setTranscripts(prev => [...prev.slice(-4), `AI: ${msg.serverContent.outputTranscription.text}`]);
            }
            // Audio handling logic would go here...
          },
          onclose: () => setIsActive(false),
          onerror: (e) => console.error("Live Error:", e)
        }
      });
      sessionRef.current = session;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    startSession();
    return () => {
      sessionRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-3 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <X className="w-6 h-6" />
        </button>

        <div className="p-10 space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Link Established
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Remote Engineering Expert</h2>
            <p className="text-slate-500 text-sm">Real-time voice-to-voice field compliance guidance</p>
          </div>

          <div className="flex flex-col items-center justify-center py-12 relative">
             <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <div className="w-64 h-64 border-2 border-cyan-500 rounded-full animate-ping" />
                <div className="absolute w-48 h-48 border-2 border-blue-500 rounded-full animate-pulse" />
             </div>
             <div className="relative z-10 w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-2xl">
                <Activity className="w-12 h-12 text-cyan-400 animate-pulse" />
             </div>
          </div>

          <div className="bg-slate-950/50 rounded-3xl p-6 border border-slate-800 h-48 overflow-y-auto space-y-3 font-mono">
            {transcripts.length === 0 ? (
              <p className="text-slate-600 text-[10px] text-center italic mt-12">Awating voice input...</p>
            ) : transcripts.map((t, i) => (
              <p key={i} className={`text-[10px] leading-relaxed ${t.startsWith('Tech') ? 'text-slate-400' : 'text-cyan-400'}`}>
                {t}
              </p>
            ))}
          </div>

          <div className="flex justify-center gap-6">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-6 rounded-full border transition-all ${isMuted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500'}`}
            >
              {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <button className="p-6 bg-slate-800 border border-slate-700 rounded-full text-slate-300 hover:border-cyan-500 transition-all">
              <Video className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveExpert;
