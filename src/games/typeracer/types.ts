// TypeRacer game types

export interface Player {
  id: string;
  name: string;
  progress: number; // 0-100
  wpm: number;
  accuracy: number;
  finished: boolean;
  finishedAt?: number;
}

export interface RaceRoom {
  id: string;
  hostId: string;
  text: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  startTime?: number;
  players: Player[];
  createdAt: number;
  withPunctuation?: boolean;
}

// Solo mode settings
export type SoloModeType = 'text' | 'timed' | 'endless';
export type TimeDuration = 15 | 30;

export interface SoloSettings {
  mode: SoloModeType;
  duration: TimeDuration;
  withPunctuation: boolean;
}

export interface GameStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  timeElapsed: number;
}

export interface KeyState {
  key: string;
  pressed: boolean;
  correct: boolean | null;
}
