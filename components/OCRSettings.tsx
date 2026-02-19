
import React, { useState } from 'react';
import { SubtitleArea, OCRLanguage, OCRProcessState } from '../types';

interface OCRSettingsProps {
  area: SubtitleArea;
  setArea: (area: SubtitleArea) => void;
  language: OCRLanguage;
  setLanguage: (lang: OCRLanguage) => void;
  timeRange: { start: number; end: number };
  setTimeRange: (range: { start: number; end: number }) => void;
  totalDuration: number;
  onStartOCR: () => void;
  processState: OCRProcessState;
  currentTime: number;
}

const OCRSettings: React.FC<OCRSettingsProps> = ({
  area,
  setArea,
  language,
  setLanguage,
  timeRange,
  setTimeRange,
  totalDuration,
  onStartOCR,
  processState,
  currentTime
}) => {
  const [lockAspect, setLockAspect] = useState(false);
  const [aspectRatioValue, setAspectRatioValue] = useState(area.width / area.height);

  const updateArea = (key: keyof SubtitleArea, val: number) => {
    if (lockAspect && (key === 'width' || key === 'height')) {
      if (key === 'width') {
        const newHeight = Math.min(100 - area.y, val / aspectRatioValue);
        setArea({ ...area, width: val, height: newHeight });
      } else {
        const newWidth = Math.min(100 - area.x, val * aspectRatioValue);
        setArea({ ...area, height: val, width: newWidth });
      }
    } else {
      const newArea = { ...area, [key]: val };
      setArea(newArea);
      if (key === 'width' || key === 'height') {
        setAspectRatioValue(newArea.width / newArea.height);
      }
    }
  };

  const toggleLock = () => {
    setAspectRatioValue(area.width / area.height);
    setLockAspect(!lockAspect);
  };

  const setRangeToCurrent = (pos: 'start' | 'end') => {
    if (pos === 'start') {
      setTimeRange({ ...timeRange, start: currentTime });
    } else {
      setTimeRange({ ...timeRange, end: currentTime });
    }
  };

  const resetArea = () => {
    setArea({ x: 10, y: 70, width: 80, height: 20 });
    setAspectRatioValue(80/20);
  };

  return (
    <div className="glass-panel p-4 sm:p-8 rounded-3xl md:rounded-[2.5rem] shadow-2xl space-y-6 sm:space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Configuration</h3>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button 
            onClick={toggleLock}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${lockAspect ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            Aspect {lockAspect ? 'Locked' : 'Free'}
          </button>
          <button 
            onClick={resetArea}
            className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700"
            title="Reset"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 relative z-10">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center space-x-2">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-500 rounded-full"></span>
            <label className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Extraction Zone</label>
          </div>
          <div className="space-y-4 bg-black/30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase">Horizontal</span>
                <span className="text-[10px] sm:text-xs font-mono text-indigo-400">{Math.round(area.x)}%</span>
              </div>
              <input type="range" min="0" max="100" value={area.x} onChange={(e) => updateArea('x', Number(e.target.value))} className="w-full h-1 sm:h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase">Vertical</span>
                <span className="text-[10px] sm:text-xs font-mono text-indigo-400">{Math.round(area.y)}%</span>
              </div>
              <input type="range" min="0" max="100" value={area.y} onChange={(e) => updateArea('y', Number(e.target.value))} className="w-full h-1 sm:h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase">Width</span>
                  <span className="text-[10px] sm:text-xs font-mono text-indigo-400">{Math.round(area.width)}%</span>
                </div>
                <input type="range" min="5" max="100" value={area.width} onChange={(e) => updateArea('width', Number(e.target.value))} className="w-full h-1 sm:h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase">Height</span>
                  <span className="text-[10px] sm:text-xs font-mono text-indigo-400">{Math.round(area.height)}%</span>
                </div>
                <input type="range" min="5" max="100" value={area.height} onChange={(e) => updateArea('height', Number(e.target.value))} className="w-full h-1 sm:h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-500 rounded-full"></span>
              <label className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Neural Language</label>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as OCRLanguage)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
            >
              {Object.values(OCRLanguage).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-violet-500 rounded-full"></span>
              <label className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Processing Window</label>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="relative group/input">
                <input 
                  type="number" step="0.1" min="0" max={totalDuration}
                  value={timeRange.start.toFixed(1)} 
                  onChange={(e) => setTimeRange({...timeRange, start: Math.max(0, Number(e.target.value))})}
                  className="bg-slate-900 border border-slate-800 text-white text-[10px] sm:text-sm rounded-xl sm:rounded-2xl w-full p-3 sm:p-4 pl-8 sm:pl-12 focus:border-indigo-500/50 outline-none transition-all font-mono"
                />
                <span className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-[8px] sm:text-[10px] font-black text-slate-600">IN</span>
              </div>
              <div className="relative group/input">
                <input 
                  type="number" step="0.1" min="0" max={totalDuration}
                  value={timeRange.end.toFixed(1)} 
                  onChange={(e) => setTimeRange({...timeRange, end: Math.min(totalDuration, Number(e.target.value))})}
                  className="bg-slate-900 border border-slate-800 text-white text-[10px] sm:text-sm rounded-xl sm:rounded-2xl w-full p-3 sm:p-4 pl-8 sm:pl-12 focus:border-indigo-500/50 outline-none transition-all font-mono"
                />
                <span className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-[8px] sm:text-[10px] font-black text-slate-600">OUT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 sm:pt-8 border-t border-white/5 relative z-10">
        {processState.isProcessing ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between text-[8px] sm:text-[10px] font-black text-indigo-300 uppercase tracking-widest">
              <span className="animate-pulse">{processState.currentStep}</span>
              <span className="font-mono">{Math.round(processState.progress)}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 sm:h-4 overflow-hidden border border-slate-800 shadow-inner p-0.5 sm:p-1">
              <div 
                className="bg-gradient-to-r from-indigo-600 via-indigo-400 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                style={{ width: `${processState.progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <button 
            onClick={onStartOCR}
            className="group relative w-full py-4 sm:py-6 bg-white text-black font-black text-xs sm:text-base uppercase tracking-[0.2em] sm:tracking-[0.3em] rounded-2xl sm:rounded-3xl overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(255,255,255,0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
              <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              <span>Execute Extraction</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default OCRSettings;
