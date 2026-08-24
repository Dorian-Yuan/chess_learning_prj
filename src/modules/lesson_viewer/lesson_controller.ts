import { BoardAdapter } from '../../lib/board_adapter';
import { soundPlayer } from '../../lib/sound_player';
import type { PieceLessonData, SpecialRuleData, LessonLevel } from '../../types/lesson_types';
import type { MoveDetail, GameStatus } from '../../types/chess_types';

export interface LessonState {
  lessonId: string;
  lessonTitle: string;
  levelIndex: number;
  totalLevels: number;
  currentLevel: LessonLevel;
  isCompleted: boolean;
  isLevelPassed: boolean;
  hintRevealed: boolean;
  message?: string;
  messageType?: 'success' | 'error' | 'info';
}

export class LessonController {
  private lessonData: PieceLessonData | SpecialRuleData;
  private currentLevelIndex: number = 0;
  private boardAdapter: BoardAdapter | null = null;
  private boardContainer: HTMLElement;
  private isLevelPassed: boolean = false;
  private hintRevealed: boolean = false;
  private onStateChange: (state: LessonState) => void;

  constructor(
    lessonData: PieceLessonData | SpecialRuleData,
    boardContainer: HTMLElement,
    onStateChange: (state: LessonState) => void,
    initialLevelIndex: number = 0
  ) {
    this.lessonData = lessonData;
    this.boardContainer = boardContainer;
    this.onStateChange = onStateChange;
    this.currentLevelIndex = Math.max(0, Math.min(initialLevelIndex, lessonData.levels.length - 1));

    this.initCurrentLevel();
  }

  public initCurrentLevel(): void {
    this.isLevelPassed = false;
    this.hintRevealed = false;
    const level = this.getCurrentLevel();

    if (this.boardAdapter) {
      this.boardAdapter.destroy();
    }

    this.boardAdapter = new BoardAdapter({
      container: this.boardContainer,
      fen: level.fen,
      orientation: level.orientation || 'white',
      movableColor: 'white',
      coordinates: true,
      highlightLastMove: true,
      showDests: true,
      onMove: (orig, dest, moveDetail, status) => {
        this.handleMove(orig, dest, moveDetail, status);
      },
    });

    this.notifyState();
  }

  public getCurrentLevel(): LessonLevel {
    return this.lessonData.levels[this.currentLevelIndex];
  }

  public getCurrentLevelIndex(): number {
    return this.currentLevelIndex;
  }

  public getTotalLevels(): number {
    return this.lessonData.levels.length;
  }

  public getLessonData(): PieceLessonData | SpecialRuleData {
    return this.lessonData;
  }

  public toggleHint(): void {
    this.hintRevealed = !this.hintRevealed;
    this.notifyState();
  }

  public retryLevel(): void {
    this.initCurrentLevel();
  }

  public nextLevel(): void {
    if (this.currentLevelIndex < this.lessonData.levels.length - 1) {
      this.currentLevelIndex++;
      this.initCurrentLevel();
    }
  }

  public prevLevel(): void {
    if (this.currentLevelIndex > 0) {
      this.currentLevelIndex--;
      this.initCurrentLevel();
    }
  }

  public setLevel(index: number): void {
    if (index >= 0 && index < this.lessonData.levels.length) {
      this.currentLevelIndex = index;
      this.initCurrentLevel();
    }
  }

  public toggleBoardOrientation(): void {
    if (this.boardAdapter) {
      this.boardAdapter.toggleOrientation();
    }
  }

  private handleMove(
    orig: string,
    dest: string,
    moveDetail: MoveDetail,
    status: GameStatus
  ): void {
    const level = this.getCurrentLevel();
    let passed = false;
    let feedbackMsg = '';

    const moveUci = `${orig}${dest}${moveDetail.promotion ? moveDetail.promotion.toLowerCase() : ''}`;
    const moveSan = moveDetail.san;

    switch (level.goalType) {
      case 'make_move': {
        if (level.expectedMoves && level.expectedMoves.length > 0) {
          const match = level.expectedMoves.some(
            (exp) => exp.toLowerCase() === moveUci.toLowerCase() || exp === moveSan
          );
          if (match) {
            passed = true;
          } else {
            passed = false;
            feedbackMsg = '走法不符合本关要求，请参考提示重试！';
          }
        } else {
          passed = true;
        }
        break;
      }
      case 'escape_check': {
        if (!status.isCheck) {
          passed = true;
        } else {
          passed = false;
          feedbackMsg = '王仍然处于被将军危险中，请寻找安全格或阻挡攻击！';
        }
        break;
      }
      case 'reach_target': {
        if (level.targetSquares && level.targetSquares.includes(dest as any)) {
          passed = true;
        } else {
          passed = false;
          feedbackMsg = '还未到达指定目标格，请再试一次！';
        }
        break;
      }
      case 'checkmate': {
        if (status.isCheckmate) {
          passed = true;
        } else {
          passed = false;
          feedbackMsg = '未能形成将死，注意观察对方王的逃脱格！';
        }
        break;
      }
      case 'stalemate_defense': {
        if (status.isStalemate) {
          passed = true;
        } else {
          passed = false;
          feedbackMsg = '未能形成逼和，请寻找封锁自身所有走法的妙手！';
        }
        break;
      }
      default:
        passed = true;
        break;
    }

    if (passed) {
      this.isLevelPassed = true;
      soundPlayer.play('gameEnd');
      this.saveProgress();

      this.notifyState({
        message: level.successMessage || '恭喜！走法完全正确！',
        messageType: 'success',
      });
    } else {
      soundPlayer.play('illegal');
      this.notifyState({
        message: feedbackMsg || '走法有误，请重新尝试。',
        messageType: 'error',
      });
    }
  }

  private saveProgress(): void {
    try {
      const storageKey = 'chess_learned_progress';
      const stored = localStorage.getItem(storageKey);
      const progress: Record<string, number> = stored ? JSON.parse(stored) : {};
      const currentSaved = progress[this.lessonData.id] || 0;
      progress[this.lessonData.id] = Math.max(currentSaved, this.currentLevelIndex + 1);
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {}
  }

  public getProgress(): number {
    try {
      const storageKey = 'chess_learned_progress';
      const stored = localStorage.getItem(storageKey);
      if (!stored) return 0;
      const progress: Record<string, number> = JSON.parse(stored);
      return progress[this.lessonData.id] || 0;
    } catch {
      return 0;
    }
  }

  private notifyState(extra?: { message: string; messageType: 'success' | 'error' | 'info' }): void {
    const isCompleted = this.currentLevelIndex === this.lessonData.levels.length - 1 && this.isLevelPassed;
    const title = 'title' in this.lessonData ? this.lessonData.title : `${this.lessonData.nameZh} (${this.lessonData.name})`;

    this.onStateChange({
      lessonId: this.lessonData.id,
      lessonTitle: title,
      levelIndex: this.currentLevelIndex,
      totalLevels: this.lessonData.levels.length,
      currentLevel: this.getCurrentLevel(),
      isCompleted,
      isLevelPassed: this.isLevelPassed,
      hintRevealed: this.hintRevealed,
      message: extra?.message,
      messageType: extra?.messageType,
    });
  }

  public destroy(): void {
    if (this.boardAdapter) {
      this.boardAdapter.destroy();
      this.boardAdapter = null;
    }
  }
}
