type SfxName =
  | 'line_single'
  | 'line_double'
  | 'line_triple'
  | 'line_tetris'
  | 'gameover'
  | 'score'
  | 'move'
  | 'soft_drop'
  | 'hard_drop'
  | 'rotate'
  | 'hold';

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

export class AudioManager {
  private music: HTMLAudioElement | null = null;
  private musicEnabled = true;
  private musicVolume = 0.25;
  private sfxEnabled = true;
  private sfxVolume = 0.4;
  private readonly sfxSources: Record<SfxName, string>;
  private readonly musicSrc: string;

  constructor(musicSrc: string, sfxSources: Record<SfxName, string>) {
    this.musicSrc = musicSrc;
    this.sfxSources = sfxSources;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  setMusicVolume(volume: number) {
    this.musicVolume = clamp01(volume);
    if (this.music) {
      this.music.volume = this.musicVolume;
    }
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = clamp01(volume);
  }

  startMusic() {
    if (!this.musicEnabled) return;
    if (!this.music) {
      const audio = new Audio(this.musicSrc);
      audio.loop = true;
      audio.volume = this.musicVolume;
      this.music = audio;
    }
    this.music!.currentTime = 0;
    const playPromise = this.music!.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        /* ignore autoplay restrictions */
      });
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }

  private playSynth(name: SfxName) {
    if (!this.sfxEnabled) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const preset =
      name === 'line_single'
        ? { type: 'triangle', freq: 420, dur: 0.1, vol: 0.35 }
      : name === 'line_double'
        ? { type: 'triangle', freq: 500, dur: 0.1, vol: 0.4 }
      : name === 'line_triple'
        ? { type: 'sawtooth', freq: 580, dur: 0.12, vol: 0.45 }
      : name === 'line_tetris'
        ? { type: 'sawtooth', freq: 760, dur: 0.16, vol: 0.5 }
      : name === 'move'
        ? { type: 'triangle', freq: 260, dur: 0.05, vol: 0.25 }
      : name === 'soft_drop'
        ? { type: 'sine', freq: 310, dur: 0.06, vol: 0.2 }
      : name === 'hard_drop'
        ? { type: 'square', freq: 120, dur: 0.18, vol: 0.5 }
      : name === 'rotate'
        ? { type: 'triangle', freq: 520, dur: 0.08, vol: 0.3 }
      : name === 'hold'
        ? { type: 'sine', freq: 340, dur: 0.08, vol: 0.25 }
      : null;

    if (!preset) return;

    osc.type = preset.type as OscillatorType;
    osc.frequency.value = preset.freq;
    gain.gain.value = preset.vol * this.sfxVolume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + preset.dur);
    osc.stop(ctx.currentTime + preset.dur);
  }

  playSfx(name: SfxName, volumeScale = 1) {
    if (!this.sfxEnabled) return;
    const src = this.sfxSources[name];
    if (src) {
      const audio = new Audio(src);
      audio.volume = clamp01(this.sfxVolume * volumeScale);
      audio.play().catch(() => {
        /* ignore */
      });
      return;
    }

    // Fallback synth if no file is configured
    this.playSynth(name);
  }
}

export const DEFAULT_MUSIC_SRC = '/audio/tetris_theme.mp3';
export const DEFAULT_SFX = {
  line_single: '/audio/tetris/single.wav',
  line_double: '/audio/tetris/double.wav',
  line_triple: '/audio/tetris/triple.wav',
  line_tetris: '/audio/tetris/tetris.wav',
  gameover: '/audio/gameover.mp3',
  score: '/audio/score.mp3',
  move: '/audio/tetris/move.wav',
  soft_drop: '/audio/tetris/softdrop.wav',
  hard_drop: '/audio/tetris/harddrop.wav',
  rotate: '/audio/tetris/rotate.wav',
  hold: '/audio/tetris/hold.wav',
} satisfies Record<SfxName, string>;
