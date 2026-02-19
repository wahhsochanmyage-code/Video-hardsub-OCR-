
export enum OCRLanguage {
  English = 'English',
  Japanese = 'Japanese',
  Korean = 'Korean',
  ChineseSimplified = 'Chinese (Simplified)',
  ChineseTraditional = 'Chinese (Traditional)',
  Thai = 'Thai'
}

export interface SubtitleArea {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface OCRProcessState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}
