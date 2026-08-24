import { BoardAdapter } from '../../lib/board_adapter';
import { soundPlayer } from '../../lib/sound_player';
import tacticsPuzzlesData from '../../data/tactics_puzzles.json';
import type { TacticalPuzzle, PuzzleTheme } from '../../types/puzzle_types';
import type { MoveDetail, GameStatus } from '../../types/chess_types';

export interface PuzzleState {
  mode: 'list' | 'training';
  currentPuzzle: TacticalPuzzle | null;
  puzzleIndex: number;
  totalPuzzlesInFilter: number;
  isSolved: boolean;
  hintRevealed: boolean;
  activeThemeFilter: PuzzleTheme | 'all';
  activeDifficultyFilter: number; // 0 for all, 1, 2, 3
  solvedIds: string[];
  message?: string;
  messageType?: 'success' | 'error' | 'info';
  moveStep: number;
  totalSteps: number;
}

const STORAGE_KEY = 'chess_tactics_solved_ids';

export class PuzzleController {
  private allPuzzles: TacticalPuzzle[];
  private currentPuzzle: TacticalPuzzle | null = null;
  private boardAdapter: BoardAdapter | null = null;
  private boardContainer: HTMLElement | null = null;
  private currentMoveIndex: number = 0;
  private isSolved: boolean = false;
  private hintRevealed: boolean = false;
  private mode: 'list' | 'training' = 'list';
  private activeThemeFilter: PuzzleTheme | 'all' = 'all';
  private activeDifficultyFilter: number = 0;
  private solvedIds: Set<string> = new Set();
  private onStateChange: (state: PuzzleState) => void;
  private opponentTimer: number | null = null;

  constructor(
    onStateChange: (state: PuzzleState) => void,
    initialPuzzleId?: string,
    initialTheme?: PuzzleTheme | 'all'
  ) {
    this.allPuzzles = tacticsPuzzlesData as TacticalPuzzle[];
    this.onStateChange = onStateChange;

    if (initialTheme) {
      this.activeThemeFilter = initialTheme;
    }

    this.loadProgress();

    if (initialPuzzleId) {
      const p = this.allPuzzles.find((item) => item.id === initialPuzzleId);
      if (p) {
        this.currentPuzzle = p;
        this.mode = 'training';
      }
    }
  }

  public setBoardContainer(container: HTMLElement): void {
    this.boardContainer = container;
  }

  private loadProgress(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          this.solvedIds = new Set(arr);
        }
      }
    } catch {}
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.solvedIds)));
    } catch {}
  }

  public getFilteredPuzzles(): TacticalPuzzle[] {
    return this.allPuzzles.filter((p) => {
      if (this.activeThemeFilter !== 'all' && p.themeKey !== this.activeThemeFilter) {
        return false;
      }
      if (this.activeDifficultyFilter > 0 && p.difficulty !== this.activeDifficultyFilter) {
        return false;
      }
      return true;
    });
  }

  public setThemeFilter(theme: PuzzleTheme | 'all'): void {
    this.activeThemeFilter = theme;
    this.notifyState();
  }

  public setDifficultyFilter(diff: number): void {
    this.activeDifficultyFilter = diff;
    this.notifyState();
  }

  public enterTraining(puzzleId: string): void {
    const puzzle = this.allPuzzles.find((p) => p.id === puzzleId);
    if (!puzzle) return;

    this.mode = 'training';
    this.currentPuzzle = puzzle;
    this.currentMoveIndex = 0;
    this.isSolved = this.solvedIds.has(puzzle.id);
    this.hintRevealed = false;
    this.notifyState();
  }

  public backToList(): void {
    this.mode = 'list';
    if (this.opponentTimer) {
      window.clearTimeout(this.opponentTimer);
      this.opponentTimer = null;
    }
    if (this.boardAdapter) {
      this.boardAdapter.destroy();
      this.boardAdapter = null;
    }
    this.notifyState();
  }

  public initPuzzle(): void {
    if (!this.currentPuzzle || !this.boardContainer) return;

    if (this.opponentTimer) {
      window.clearTimeout(this.opponentTimer);
      this.opponentTimer = null;
    }

    this.currentMoveIndex = 0;
    this.isSolved = this.solvedIds.has(this.currentPuzzle.id);
    this.hintRevealed = false;

    if (this.boardAdapter) {
      this.boardAdapter.destroy();
      this.boardAdapter = null;
    }

    const puzzle = this.currentPuzzle;
    const userTurn = puzzle.turn;

    this.boardAdapter = new BoardAdapter({
      container: this.boardContainer,
      fen: puzzle.fen,
      orientation: userTurn,
      movableColor: userTurn,
      coordinates: true,
      highlightLastMove: true,
      showDests: true,
      onMove: (orig, dest, moveDetail, status) => {
        this.handleUserMove(orig, dest, moveDetail, status);
      },
    });

    this.notifyState({
      message: `${userTurn === 'white' ? '白方先行' : '黑方先行'} · 请找出最佳战术走法！`,
      messageType: 'info',
    });
  }

  private handleUserMove(
    orig: string,
    dest: string,
    moveDetail: MoveDetail,
    _status: GameStatus
  ): void {
    if (!this.currentPuzzle || !this.boardAdapter) return;

    const puzzle = this.currentPuzzle;
    const expectedUci = puzzle.moves[this.currentMoveIndex]?.toLowerCase();
    const expectedSan = puzzle.sanMoves ? puzzle.sanMoves[this.currentMoveIndex] : null;

    const userUci = `${orig}${dest}${moveDetail.promotion ? moveDetail.promotion.toLowerCase() : ''}`.toLowerCase();
    const userSan = moveDetail.san;

    const isMatch = userUci === expectedUci || userSan === expectedSan;

    if (isMatch) {
      this.currentMoveIndex++;

      // Check if puzzle is fully solved
      if (this.currentMoveIndex >= puzzle.moves.length) {
        this.isSolved = true;
        this.solvedIds.add(puzzle.id);
        this.saveProgress();
        soundPlayer.play('gameEnd');

        this.notifyState({
          message: puzzle.successMessage || '太棒了！战术走法完全正确！',
          messageType: 'success',
        });
      } else {
        // Opponent counter-move in multi-step puzzle
        this.boardAdapter.setMovableColor('none');
        this.notifyState({
          message: '走法正确！对方正在应对...',
          messageType: 'info',
        });

        this.opponentTimer = window.setTimeout(() => {
          if (!this.currentPuzzle || !this.boardAdapter) return;
          const oppUci = this.currentPuzzle.moves[this.currentMoveIndex];
          const oppSan = this.currentPuzzle.sanMoves ? this.currentPuzzle.sanMoves[this.currentMoveIndex] : null;

          if (oppSan || oppUci) {
            this.boardAdapter.makeMove(oppSan || oppUci);
            this.currentMoveIndex++;
          }

          // Hand back turn to user
          const userColor = this.currentPuzzle.turn;
          this.boardAdapter.setMovableColor(userColor);

          this.notifyState({
            message: '轮到你继续走下一步！',
            messageType: 'info',
          });
        }, 450);
      }
    } else {
      // Wrong move: reset board position to before this move
      soundPlayer.play('illegal');

      this.notifyState({
        message: '走法有误，请再仔细观察！可点击「提示」获取解题线索。',
        messageType: 'error',
      });

      // Re-sync position
      setTimeout(() => {
        this.syncToCurrentStep();
      }, 300);
    }
  }

  private syncToCurrentStep(): void {
    if (!this.currentPuzzle || !this.boardAdapter) return;

    // Reload starting fen and play up to currentMoveIndex
    this.boardAdapter.setPosition(this.currentPuzzle.fen);
    for (let i = 0; i < this.currentMoveIndex; i++) {
      const m = this.currentPuzzle.sanMoves
        ? this.currentPuzzle.sanMoves[i]
        : this.currentPuzzle.moves[i];
      this.boardAdapter.makeMove(m);
    }
    this.boardAdapter.setMovableColor(this.currentPuzzle.turn);
  }

  public retryPuzzle(): void {
    this.initPuzzle();
  }

  public toggleHint(): void {
    this.hintRevealed = !this.hintRevealed;
    this.notifyState();
  }

  public toggleOrientation(): void {
    if (this.boardAdapter) {
      this.boardAdapter.toggleOrientation();
    }
  }

  public nextPuzzle(): void {
    const list = this.getFilteredPuzzles();
    if (!this.currentPuzzle) return;
    const idx = list.findIndex((p) => p.id === this.currentPuzzle!.id);
    if (idx !== -1 && idx < list.length - 1) {
      this.enterTraining(list[idx + 1].id);
    }
  }

  public prevPuzzle(): void {
    const list = this.getFilteredPuzzles();
    if (!this.currentPuzzle) return;
    const idx = list.findIndex((p) => p.id === this.currentPuzzle!.id);
    if (idx > 0) {
      this.enterTraining(list[idx - 1].id);
    }
  }

  public getSolvedCount(theme?: PuzzleTheme): { solved: number; total: number } {
    const list = theme
      ? this.allPuzzles.filter((p) => p.themeKey === theme)
      : this.allPuzzles;
    const solved = list.filter((p) => this.solvedIds.has(p.id)).length;
    return { solved, total: list.length };
  }

  private notifyState(extra?: { message: string; messageType: 'success' | 'error' | 'info' }): void {
    const filtered = this.getFilteredPuzzles();
    const puzzleIndex = this.currentPuzzle
      ? filtered.findIndex((p) => p.id === this.currentPuzzle!.id)
      : -1;

    this.onStateChange({
      mode: this.mode,
      currentPuzzle: this.currentPuzzle,
      puzzleIndex,
      totalPuzzlesInFilter: filtered.length,
      isSolved: this.isSolved,
      hintRevealed: this.hintRevealed,
      activeThemeFilter: this.activeThemeFilter,
      activeDifficultyFilter: this.activeDifficultyFilter,
      solvedIds: Array.from(this.solvedIds),
      message: extra?.message,
      messageType: extra?.messageType,
      moveStep: this.currentMoveIndex,
      totalSteps: this.currentPuzzle ? this.currentPuzzle.moves.length : 0,
    });
  }

  public destroy(): void {
    if (this.opponentTimer) {
      window.clearTimeout(this.opponentTimer);
      this.opponentTimer = null;
    }
    if (this.boardAdapter) {
      this.boardAdapter.destroy();
      this.boardAdapter = null;
    }
  }
}
