import type { BoardColor, BoardOrientation } from '../types/chess_types';
import type { EngineDifficulty, EvalScore } from '../types/engine_types';

export const SAVED_GAME_STORAGE_KEY = 'chess_saved_game_v1';

export interface SavedGameState {
  fen: string;
  history: string[];
  difficulty: EngineDifficulty;
  playerColorChoice: 'white' | 'black' | 'random';
  assignedColor: BoardColor;
  gameMode: 'vs_ai' | 'free_play';
  turn: BoardColor;
  moveCount: number;
  timestamp: number;
  isGameOver: boolean;
  orientation: BoardOrientation;
  evalScore?: EvalScore | null;
}

export class GameStorage {
  public static saveGame(state: SavedGameState): void {
    if (typeof localStorage === 'undefined') return;
    try {
      // If game is over, we don't save or we clear snapshot
      if (state.isGameOver) {
        GameStorage.clearSavedGame();
        return;
      }
      localStorage.setItem(SAVED_GAME_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[GameStorage] Failed to save game snapshot:', e);
    }
  }

  public static loadSavedGame(): SavedGameState | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SAVED_GAME_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedGameState;
      if (!parsed.fen || !Array.isArray(parsed.history)) {
        return null;
      }
      return parsed;
    } catch (e) {
      console.warn('[GameStorage] Failed to load saved game snapshot:', e);
      return null;
    }
  }

  public static clearSavedGame(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(SAVED_GAME_STORAGE_KEY);
    } catch (e) {
      console.warn('[GameStorage] Failed to clear saved game snapshot:', e);
    }
  }

  public static hasSavedGame(): boolean {
    return GameStorage.loadSavedGame() !== null;
  }
}
