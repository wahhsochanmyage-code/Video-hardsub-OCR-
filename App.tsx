
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  OCRLanguage, 
  SubtitleArea, 
  SubtitleEntry, 
  OCRProcessState,
  VideoMetadata 
} from './types';
import VideoPlayer from './components/VideoPlayer';
import OCRSettings from './components/OCRSettings';
import SubtitleResult from './components/SubtitleResult';
import { ocrService } from './services/geminiService';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [area, setArea] = useState<SubtitleArea>({ x: 10, y: 75, width: 80, height: 18 });
  const [language, setLanguage] = useState<OCRLanguage>(OCRLanguage.English);
  const [timeRange, setTimeRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [processState, setProcessState] = useState<OCRProcessState>({
    isProcessing: false,
    progress: 0,
    currentStep: ''
  });
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setSubtitles([]);
      setMetadata(null);
    }
  };

  const handleMetadataLoaded = (meta: VideoMetadata) => {
    setMetadata(meta);
    setTimeRange({ start: 0, end: meta.duration });
  };

  const captureFrame = useCallback((time: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve('');
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      const videoActualW = video.videoWidth;
      const videoActualH = video.videoHeight;
      
      const cropX = (area.x / 100) * videoActualW;
      const cropY = (area.y / 100) * videoActualH;
      const cropW = (area.width / 100) * videoActualW;
      const cropH = (area.height / 100) * videoActualH;

      canvas.width = cropW;
      canvas.height = cropH;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      const seekAndCapture = () => {
        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
        video.removeEventListener('seeked', seekAndCapture);
      };

      video.addEventListener('seeked', seekAndCapture);
      video.currentTime = Math.min(time, video.duration);
    });
  }, [area]);

  const startOCR = async () => {
    if (!videoRef.current || !metadata) return;
    
    setProcessState({ isProcessing: true, progress: 0, currentStep: 'Initializing Vision Neural Scan...' });
    
    try {
      const step = 0.5; 
      const framesToProcess: { data: string; timestamp: number }[] = [];
      const originalTime = videoRef.current.currentTime;
      
      videoRef.current.pause();

      let current = timeRange.start;
      const duration = timeRange.end - timeRange.start;
      const totalSteps = Math.ceil(duration / step);
      let count = 0;

      while (current <= timeRange.end) {
        const frameData = await captureFrame(current);
        framesToProcess.push({ data: frameData, timestamp: current });
        current += step;
        count++;
        setProcessState(prev => ({ 
          ...prev, 
          progress: Math.min(25, (count / totalSteps) * 25),
          currentStep: `Extracting frames (${Math.round((count/totalSteps)*100)}%)...` 
        }));
      }

      setProcessState(prev => ({ ...prev, progress: 30, currentStep: 'Neural Dialogue Mapping...' }));

      const batchSize = 10;
      let allSubs: SubtitleEntry[] = [];
      
      for (let i = 0; i < framesToProcess.length; i += batchSize) {
        const batch = framesToProcess.slice(i, i + batchSize);
        const batchResults = await ocrService.processFrames(batch, language);
        allSubs = [...allSubs, ...batchResults];
        
        setProcessState(prev => ({ 
          ...prev, 
          progress: 30 + (i / framesToProcess.length) * 65,
          currentStep: `Decoding segment ${Math.floor(i/batchSize) + 1}/${Math.ceil(framesToProcess.length/batchSize)}...`
        }));
      }

      const finalSubs: SubtitleEntry[] = [];
      const sorted = allSubs.sort((a, b) => a.startTime - b.startTime);
      
      sorted.forEach(sub => {
        const last = finalSubs[finalSubs.length - 1];
        if (last && sub.text.trim().toLowerCase() === last.text.trim().toLowerCase() && sub.startTime <= last.endTime + 0.3) {
          last.endTime = Math.max(last.endTime, sub.endTime);
        } else if (sub.text.trim().length > 0) {
          finalSubs.push(sub);
        }
      });

      setSubtitles(finalSubs);
      videoRef.current.currentTime = originalTime;
      setProcessState({ isProcessing: false, progress: 100, currentStep: 'Process Complete.' });
    } catch (err) {
      console.error(err);
      alert("Neural extraction failed. Verify API configuration.");
      setProcessState({ isProcessing: false, progress: 0, currentStep: 'Failed.' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-10 space-y-6 md:space-y-10 max-w-[1700px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-center glass-panel p-6 sm:p-8 rounded-3xl md:rounded-[2rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 opacity-50"></div>
        <div className="flex items-center space-x-4 md:space-x-6 relative z-10 w-full md:w-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] animate-pulse flex-shrink-0">
            <svg className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent glow-text">
              VISION<span className="text-indigo-500">OCR</span>
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-3 mt-1">
              <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-cyan-500"></span>
              </span>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Neural Dialogue Engine</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 md:mt-0 flex items-center justify-between md:justify-end space-x-4 sm:space-x-6 relative z-10 w-full md:w-auto">
          {metadata && (
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stream Active</span>
              <span className="text-xs sm:text-sm font-mono text-cyan-400">{metadata.width}×{metadata.height}</span>
            </div>
          )}
          <label className="flex items-center space-x-2 sm:space-x-3 bg-white text-black hover:bg-indigo-50 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)] active:scale-95 font-extrabold text-[10px] sm:text-sm uppercase tracking-widest group whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            <span>Load Source</span>
            <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
          </label>
        </div>
      </header>

      {videoUrl ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start">
          <div className="lg:col-span-8 flex flex-col space-y-6 md:space-y-8">
            {/* Centered Video Player Container for Mobile */}
            <div className="neon-border rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-black shadow-2xl bg-black flex items-center justify-center">
              <VideoPlayer 
                url={videoUrl} 
                area={area} 
                setArea={setArea}
                onMetadataLoaded={handleMetadataLoaded}
                onTimeUpdate={setCurrentTime}
                videoRef={videoRef}
                currentTime={currentTime}
              />
            </div>
            
            <OCRSettings 
              area={area} 
              setArea={setArea}
              language={language}
              setLanguage={setLanguage}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              totalDuration={metadata?.duration || 0}
              onStartOCR={startOCR}
              processState={processState}
              currentTime={currentTime}
            />
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-10 h-fit">
            <SubtitleResult 
              subtitles={subtitles} 
              currentTime={currentTime}
              onJumpTo={(time) => { if(videoRef.current) videoRef.current.currentTime = time; }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl md:rounded-[3rem] p-8 sm:p-16 md:p-24 text-slate-500 glass-panel">
          <div className="p-6 sm:p-12 bg-slate-900 rounded-2xl sm:rounded-[3rem] mb-6 sm:mb-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 relative group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <svg className="w-12 h-12 sm:w-24 sm:h-24 text-slate-700 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white glow-text text-center">Awaiting Source Stream</h2>
          <p className="mt-4 text-center max-w-lg text-slate-400 text-sm sm:text-lg leading-relaxed">
            Unleash advanced neural OCR on your cinematic content. Upload a video to begin frame-perfect dialogue extraction.
          </p>
          <div className="mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 w-full max-w-3xl">
            {[
              { label: 'Neural Scan', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z', color: 'text-indigo-400' },
              { label: 'Neural Map', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z', color: 'text-cyan-400' },
              { label: 'Dialogue Sync', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-violet-400' }
            ].map(item => (
              <div key={item.label} className="bg-slate-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-col items-center text-center space-y-2 sm:space-y-3 border border-slate-800 transition-all hover:-translate-y-2 hover:border-slate-700 shadow-xl">
                <svg className={`w-6 h-6 sm:w-8 sm:h-8 ${item.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <footer className="py-10 sm:py-16 text-center">
        <div className="inline-flex items-center space-x-4 glass-panel px-4 sm:px-6 py-2 rounded-full border border-slate-800">
           <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Gemini Neural Extraction Engine</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
