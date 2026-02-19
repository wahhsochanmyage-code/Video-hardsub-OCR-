
import React, { useMemo, useEffect, useRef } from 'react';
import { SubtitleEntry } from '../types';

interface SubtitleResultProps {
  subtitles: SubtitleEntry[];
  currentTime: number;
  onJumpTo: (time: number) => void;
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

const SubtitleResult: React.FC<SubtitleResultProps> = ({ subtitles, currentTime, onJumpTo }) => {
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeSubtitleId = useMemo(() => {
    const active = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
    return active?.id;
  }, [subtitles, currentTime]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSubtitleId]);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSRT = () => {
    let content = '';
    subtitles.forEach((s, i) => {
      content += `${i + 1}\n`;
      content += `${formatTime(s.startTime)} --> ${formatTime(s.endTime)}\n`;
      content += `${s.text}\n\n`;
    });
    downloadFile(content, 'subtitles.srt', 'text/plain');
  };

  const exportTXT = () => {
    const content = subtitles.map(s => `[${s.startTime.toFixed(2)} - ${s.endTime.toFixed(2)}] ${s.text}`).join('\n');
    downloadFile(content, 'subtitles.txt', 'text/plain');
  };

  return (
    <div className="glass-panel rounded-3xl md:rounded-[2.5rem] shadow-2xl h-[400px] sm:h-[500px] lg:h-[calc(100vh-280px)] lg:min-h-[600px] flex flex-col overflow-hidden border border-white/5 group/result">
      <div className="p-4 sm:p-8 border-b border-white/5 bg-white/[0.02]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Transcription</h3>
            <p className="text-[9px] sm:text-[10px] text-indigo-400 uppercase tracking-[0.3em] mt-1 font-bold">
              {subtitles.length} Sync Nodes
            </p>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            {[
              { label: 'SRT', action: exportSRT },
              { label: 'TXT', action: exportTXT }
            ].map(btn => (
              <button 
                key={btn.label}
                disabled={subtitles.length === 0}
                onClick={btn.action}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-800/80 hover:bg-white hover:text-black disabled:opacity-20 text-white text-[9px] sm:text-[10px] font-black rounded-xl transition-all border border-slate-700 uppercase tracking-widest shadow-lg active:scale-95"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative">
           <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
             <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
           <div className="w-full bg-black/40 border border-slate-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 pl-10 sm:pl-12 text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold">
             Realtime Neural Trace
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar bg-black/20" ref={containerRef}>
        {subtitles.length > 0 ? (
          subtitles.map((sub) => {
            const isActive = activeSubtitleId === sub.id;
            const status = currentTime < sub.startTime ? 'pending' : (currentTime > sub.endTime ? 'completed' : 'active');

            return (
              <div 
                key={sub.id}
                ref={isActive ? activeRef : null}
                onClick={() => onJumpTo(sub.startTime)}
                className={`group/card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-500 cursor-pointer relative overflow-hidden ${
                  isActive 
                    ? 'subtitle-active border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                    : 'bg-slate-900/30 border-white/5 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 p-2 sm:p-3">
                     <span className="flex h-1 w-1 sm:h-1.5 sm:w-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-2 sm:mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className={`text-[8px] sm:text-[9px] font-black px-2 sm:px-3 py-1 rounded-full tracking-widest uppercase transition-colors ${
                      isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {sub.startTime.toFixed(2)}s — {sub.endTime.toFixed(2)}s
                    </span>
                  </div>
                  <div className={`w-1 h-1 rounded-full transition-all duration-500 ${
                    status === 'active' ? 'bg-indigo-400 scale-150 shadow-[0_0_10px_rgba(99,102,241,1)]' : 
                    status === 'completed' ? 'bg-slate-700' : 'bg-slate-800'
                  }`}></div>
                </div>
                
                <p className={`text-xs sm:text-sm leading-relaxed transition-all ${
                  isActive ? 'text-white font-bold' : 'text-slate-400 group-hover/card:text-slate-200'
                }`}>
                  {sub.text}
                </p>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center px-6 sm:px-10 space-y-4 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/50 rounded-2xl sm:rounded-[2rem] flex items-center justify-center border border-slate-800/50 relative">
              <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full"></div>
              <svg className="w-8 h-8 sm:w-10 sm:h-10 opacity-30 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div>
              <p className="text-sm sm:text-lg font-black text-slate-500 uppercase tracking-widest">Buffer Empty</p>
              <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.4em] mt-2 opacity-50 font-bold">Process Video to Begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubtitleResult;
