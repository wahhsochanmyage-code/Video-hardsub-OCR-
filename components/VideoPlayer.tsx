
import React, { useRef, useEffect, useState } from 'react';
import { SubtitleArea, VideoMetadata } from '../types';

interface VideoPlayerProps {
  url: string;
  area: SubtitleArea;
  setArea: (area: SubtitleArea) => void;
  onMetadataLoaded: (meta: VideoMetadata) => void;
  onTimeUpdate: (time: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  url, 
  area, 
  setArea,
  onMetadataLoaded, 
  onTimeUpdate,
  videoRef,
  currentTime
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startArea, setStartArea] = useState<SubtitleArea>(area);
  const [videoDisplayRect, setVideoDisplayRect] = useState({ left: 0, top: 0, width: 0, height: 0 });

  const updateVideoDisplayRect = () => {
    if (!videoRef.current || !containerRef.current) return;
    const video = videoRef.current;
    const container = containerRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const videoWidth = video.videoWidth || 16;
    const videoHeight = video.videoHeight || 9;
    const videoRatio = videoWidth / videoHeight;
    const containerRatio = containerRect.width / containerRect.height;

    let displayWidth, displayHeight, displayLeft, displayTop;

    if (videoRatio > containerRatio) {
      // Video is wider than container ratio (or container is narrow like mobile portrait)
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / videoRatio;
      displayLeft = 0;
      displayTop = (containerRect.height - displayHeight) / 2;
    } else {
      // Video is taller than container ratio
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * videoRatio;
      displayTop = 0;
      displayLeft = (containerRect.width - displayWidth) / 2;
    }

    setVideoDisplayRect({
      left: displayLeft,
      top: displayTop,
      width: displayWidth,
      height: displayHeight
    });
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateVideoDisplayRect();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      onMetadataLoaded({
        duration: videoRef.current.duration,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
        aspectRatio: videoRef.current.videoWidth / videoRef.current.videoHeight
      });
      // Small delay to ensure browser has updated the layout
      requestAnimationFrame(updateVideoDisplayRect);
    }
  };

  const startAction = (clientX: number, clientY: number, type: 'drag' | 'resize') => {
    if (type === 'drag') setIsDragging(true);
    else setIsResizing(true);
    setStartPos({ x: clientX, y: clientY });
    setStartArea(area);
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault();
    startAction(e.clientX, e.clientY, type);
  };

  const handleTouchStart = (e: React.TouchEvent, type: 'drag' | 'resize') => {
    const touch = e.touches[0];
    startAction(touch.clientX, touch.clientY, type);
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging && !isResizing) return;
      if (!containerRef.current || videoDisplayRect.width === 0) return;

      const dx = ((clientX - startPos.x) / videoDisplayRect.width) * 100;
      const dy = ((clientY - startPos.y) / videoDisplayRect.height) * 100;

      if (isDragging) {
        setArea({
          ...startArea,
          x: Math.min(Math.max(0, startArea.x + dx), 100 - startArea.width),
          y: Math.min(Math.max(0, startArea.y + dy), 100 - startArea.height),
        });
      } else if (isResizing) {
        setArea({
          ...startArea,
          width: Math.min(Math.max(5, startArea.width + dx), 100 - startArea.x),
          height: Math.min(Math.max(5, startArea.height + dy), 100 - startArea.y),
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const endAction = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', endAction);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', endAction);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endAction);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', endAction);
    };
  }, [isDragging, isResizing, startPos, startArea, setArea, videoDisplayRect]);

  return (
    <div 
      className="relative group bg-black rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 select-none flex items-center justify-center w-full aspect-video" 
      ref={containerRef}
    >
      <video 
        ref={videoRef}
        src={url}
        className="w-full h-full block object-contain pointer-events-auto"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={() => videoRef.current && onTimeUpdate(videoRef.current.currentTime)}
        controls
        playsInline
      />
      
      {videoDisplayRect.width > 0 && (
        <div 
          className={`absolute border-2 border-indigo-400/80 bg-indigo-500/10 transition-shadow duration-200 cursor-move touch-none ${isDragging ? 'shadow-[0_0_20px_rgba(99,102,241,0.8)] z-10' : ''}`}
          style={{
            left: `${videoDisplayRect.left + (area.x / 100) * videoDisplayRect.width}px`,
            top: `${videoDisplayRect.top + (area.y / 100) * videoDisplayRect.height}px`,
            width: `${(area.width / 100) * videoDisplayRect.width}px`,
            height: `${(area.height / 100) * videoDisplayRect.height}px`,
            boxShadow: isDragging || isResizing ? 'none' : '0 0 0 9999px rgba(0, 0, 0, 0.6)'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
          onTouchStart={(e) => handleTouchStart(e, 'drag')}
        >
          <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[8px] sm:text-[10px] px-2 py-0.5 rounded-t font-black uppercase tracking-wider whitespace-nowrap shadow-lg">
            OCR AREA
          </div>
          
          <div 
            className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 cursor-nwse-resize flex items-center justify-center group/handle touch-none"
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize'); }}
            onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, 'resize'); }}
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-indigo-500 rounded-tl-lg shadow-inner flex items-center justify-center group-hover/handle:bg-white transition-colors">
               <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white group-hover/handle:text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.293 3.293a1 1 0 011.414 1.414l-12 12a1 1 0 01-1.414-1.414l12-12z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {!url && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm gap-2">
          <svg className="w-8 h-8 text-slate-700 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Neural Stream Awaiting Input</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
