import { soundPlayer } from '../lib/sound_player';
import type { EngineDifficulty } from '../types/engine_types';

export type BoardTheme = 'wood' | 'blue' | 'green' | 'classic';
export type ThemeMode = 'light' | 'dark' | 'system';
export type AnimationSpeed = 'slow' | 'standard' | 'fast';

export interface AppSettings {
  themeMode: ThemeMode;
  boardTheme: BoardTheme;
  soundMuted: boolean;
  soundVolume: number;
  animationSpeed: AnimationSpeed;
  showCoordinates: boolean;
  defaultAiDifficulty: EngineDifficulty;
}

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  boardTheme: 'wood',
  soundMuted: false,
  soundVolume: 0.4,
  animationSpeed: 'standard',
  showCoordinates: true,
  defaultAiDifficulty: 'intermediate',
};

const STORAGE_KEYS = {
  THEME_MODE: 'chess_theme_mode',
  THEME: 'chess_board_theme',
  SOUND_MUTED: 'chess_sound_muted',
  SOUND_VOLUME: 'chess_sound_volume',
  ANIMATION_SPEED: 'chess_animation_speed',
  SHOW_COORDS: 'chess_show_coords',
  DEFAULT_AI: 'chess_default_ai_difficulty',
} as const;

export class SettingsManager {
  private static instance: SettingsManager | null = null;
  private settings: AppSettings;
  private listeners: Array<(settings: AppSettings) => void> = [];
  private mediaQueryList: MediaQueryList | null = null;

  private constructor() {
    this.settings = this.loadSettings();
    this.setupSystemThemeListener();
    this.applySettings();
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private setupSystemThemeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryList.addEventListener('change', () => {
        if (this.settings.themeMode === 'system') {
          this.applyThemeAttribute();
          this.notify();
        }
      });
    }
  }

  private loadSettings(): AppSettings {
    try {
      const storedThemeMode = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode | null;
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as BoardTheme | null;
      const storedMuted = localStorage.getItem(STORAGE_KEYS.SOUND_MUTED);
      const storedVol = localStorage.getItem(STORAGE_KEYS.SOUND_VOLUME);
      const storedAnim = localStorage.getItem(STORAGE_KEYS.ANIMATION_SPEED) as AnimationSpeed | null;
      const storedCoords = localStorage.getItem(STORAGE_KEYS.SHOW_COORDS);
      const storedAi = localStorage.getItem(STORAGE_KEYS.DEFAULT_AI) as EngineDifficulty | null;

      return {
        themeMode: (storedThemeMode && ['light', 'dark', 'system'].includes(storedThemeMode)) ? storedThemeMode : DEFAULT_SETTINGS.themeMode,
        boardTheme: (storedTheme && ['wood', 'blue', 'green', 'classic'].includes(storedTheme)) ? storedTheme : DEFAULT_SETTINGS.boardTheme,
        soundMuted: storedMuted !== null ? storedMuted === 'true' : DEFAULT_SETTINGS.soundMuted,
        soundVolume: storedVol !== null ? Math.max(0, Math.min(1, parseFloat(storedVol) || 0.4)) : DEFAULT_SETTINGS.soundVolume,
        animationSpeed: (storedAnim && ['slow', 'standard', 'fast'].includes(storedAnim)) ? storedAnim : DEFAULT_SETTINGS.animationSpeed,
        showCoordinates: storedCoords !== null ? storedCoords !== 'false' : DEFAULT_SETTINGS.showCoordinates,
        defaultAiDifficulty: (storedAi && ['beginner', 'novice', 'intermediate', 'advanced'].includes(storedAi)) ? storedAi : DEFAULT_SETTINGS.defaultAiDifficulty,
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  private applyThemeAttribute(): void {
    if (typeof document === 'undefined') return;

    let effectiveTheme = this.settings.themeMode;
    if (effectiveTheme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }

  public applySettings(): void {
    // 1. App Theme Mode (light / dark / system)
    this.applyThemeAttribute();

    // 2. Board Theme
    document.documentElement.setAttribute('data-board-theme', this.settings.boardTheme);

    // 3. Sound
    soundPlayer.setMuted(this.settings.soundMuted);
    soundPlayer.setVolume(this.settings.soundVolume);
  }

  public setThemeMode(mode: ThemeMode): void {
    this.settings.themeMode = mode;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch {}
    this.applySettings();
    this.notify();
  }

  public setBoardTheme(theme: BoardTheme): void {
    this.settings.boardTheme = theme;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {}
    this.applySettings();
    this.notify();
  }

  public setSoundMuted(muted: boolean): void {
    this.settings.soundMuted = muted;
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, String(muted));
    } catch {}
    this.applySettings();
    this.notify();
  }

  public setSoundVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.settings.soundVolume = clamped;
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_VOLUME, String(clamped));
    } catch {}
    this.applySettings();
    this.notify();
  }

  public setAnimationSpeed(speed: AnimationSpeed): void {
    this.settings.animationSpeed = speed;
    try {
      localStorage.setItem(STORAGE_KEYS.ANIMATION_SPEED, speed);
    } catch {}
    this.notify();
  }

  public setShowCoordinates(show: boolean): void {
    this.settings.showCoordinates = show;
    try {
      localStorage.setItem(STORAGE_KEYS.SHOW_COORDS, String(show));
    } catch {}
    this.notify();
  }

  public setDefaultAiDifficulty(difficulty: EngineDifficulty): void {
    this.settings.defaultAiDifficulty = difficulty;
    try {
      localStorage.setItem(STORAGE_KEYS.DEFAULT_AI, difficulty);
    } catch {}
    this.notify();
  }

  public getThemeMode(): ThemeMode {
    return this.settings.themeMode;
  }

  public getAnimationDuration(): number {
    switch (this.settings.animationSpeed) {
      case 'slow':
        return 350;
      case 'fast':
        return 80;
      case 'standard':
      default:
        return 200;
    }
  }

  public getShowCoordinates(): boolean {
    return this.settings.showCoordinates;
  }

  public getDefaultAiDifficulty(): EngineDifficulty {
    return this.settings.defaultAiDifficulty;
  }

  public resetDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    try {
      localStorage.removeItem(STORAGE_KEYS.THEME_MODE);
      localStorage.removeItem(STORAGE_KEYS.THEME);
      localStorage.removeItem(STORAGE_KEYS.SOUND_MUTED);
      localStorage.removeItem(STORAGE_KEYS.SOUND_VOLUME);
      localStorage.removeItem(STORAGE_KEYS.ANIMATION_SPEED);
      localStorage.removeItem(STORAGE_KEYS.SHOW_COORDS);
      localStorage.removeItem(STORAGE_KEYS.DEFAULT_AI);
    } catch {}
    this.applySettings();
    this.notify();
  }

  public subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const s = this.getSettings();
    this.listeners.forEach((listener) => listener(s));
  }
}

export const settingsManager = SettingsManager.getInstance();
