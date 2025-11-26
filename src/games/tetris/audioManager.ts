type SfxName = 'line_single' | 'line_double' | 'line_triple' | 'line_tetris' | 'gameover' | 'score' | 'move';

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

  playSfx(name: SfxName, volumeScale = 1) {
    if (!this.sfxEnabled) return;
    const src = this.sfxSources[name];
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = clamp01(this.sfxVolume * volumeScale);
    audio.play().catch(() => {
      /* ignore */
    });
  }
}

export const DEFAULT_MUSIC_SRC = '/audio/tetris_theme.mp3';
export const DEFAULT_SFX = {
  line_single: '/audio/line_single.mp3',
  line_double: '/audio/line_single.mp3',
  line_triple: '/audio/line_tetris.mp3',
  line_tetris: '/audio/line_tetris.mp3',
  gameover: '/audio/gameover.mp3',
  score: '/audio/score.mp3',
  move: '/audio/move.mp3',
} satisfies Record<SfxName, string>;
