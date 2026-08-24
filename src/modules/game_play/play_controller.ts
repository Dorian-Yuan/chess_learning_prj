import { BoardAdapter } from '../../lib/board_adapter';
import { stockfishWorker } from '../../lib/stockfish_worker';
import { settingsManager } from '../../utils/settings_manager';
import { GameStorage, type SavedGameState } from '../../utils/game_storage';
import { UciParser } from '../../utils/uci_parser';
import { PgnFormatter } from '../../utils/pgn_formatter';
import { EvalBarUI } from './eval_bar_ui';
import type {
  Square,
  BoardColor,
  BoardOrientation,
  MoveDetail,
  GameStatus,
} from '../../types/chess_types';
import type {
  EngineDifficulty,
  EvalScore,
} from '../../types/engine_types';
import { DIFFICULTY_PRESETS } from '../../types/engine_types';

export type GameMode = 'vs_ai' | 'free_play';
export type PlayerColorChoice = 'white' | 'black' | 'random';

export interface PlayControllerConfig {
  boardContainer: HTMLElement;
  evalBarContainer: HTMLElement;
  onStatusChange?: (state: PlayState) => void;
  onGameOver?: (result: GameOverResult) => void;
  onHintUpdate?: (hint: HintInfo | null) => void;
  onAiThinkingChange?: (isThinking: boolean, depth?: number) => void;
}

export interface PlayState {
  gameMode: GameMode;
  difficulty: EngineDifficulty;
  playerColorChoice: PlayerColorChoice;
  assignedColor: BoardColor;
  turn: BoardColor;
  isAiThinking: boolean;
  isGameOver: boolean;
  gameStatus: GameStatus;
  history: string[];
  evalScore: EvalScore | null;
  hint: HintInfo | null;
}

export interface GameOverResult {
  winner: 'w' | 'b' | 'draw';
  reason: string;
  titleZh: string;
  detailZh: string;
}

export interface HintInfo {
  uci: string;
  from: Square;
  to: Square;
  san?: string;
  score?: EvalScore;
}

export class PlayController {
  private boardAdapter: BoardAdapter;
  private evalBar: EvalBarUI;
  private config: PlayControllerConfig;

  private gameMode: GameMode = 'vs_ai';
  private difficulty: EngineDifficulty = settingsManager.getDefaultAiDifficulty();
  private playerColorChoice: PlayerColorChoice = 'white';
  private assignedColor: BoardColor = 'w';
  
  private isAiThinking: boolean = false;
  private isGameOver: boolean = false;
  private currentHint: HintInfo | null = null;
  private currentEvalScore: EvalScore | null = null;
  private gameOverResult: GameOverResult | null = null;

  constructor(config: PlayControllerConfig) {
    this.config = config;

    this.evalBar = new EvalBarUI(config.evalBarContainer, 'white');

    this.boardAdapter = new BoardAdapter({
      container: config.boardContainer,
      orientation: 'white',
      coordinates: true,
      highlightLastMove: true,
      showDests: true,
      movableColor: 'white',
      onMove: (_orig, _dest, moveDetail, status) => {
        this.handleMove(moveDetail, status);
      },
    });

    // Initialize Stockfish worker in background
    stockfishWorker.init().catch((err) => {
      console.warn('[PlayController] Stockfish init error:', err);
    });
  }

  public getBoardAdapter(): BoardAdapter {
    return this.boardAdapter;
  }

  public getState(): PlayState {
    const status = this.boardAdapter.getEngine().getStatus();
    return {
      gameMode: this.gameMode,
      difficulty: this.difficulty,
      playerColorChoice: this.playerColorChoice,
      assignedColor: this.assignedColor,
      turn: status.turn,
      isAiThinking: this.isAiThinking,
      isGameOver: this.isGameOver,
      gameStatus: status,
      history: status.history,
      evalScore: this.currentEvalScore,
      hint: this.currentHint,
    };
  }

  private notifyStateChange(): void {
    if (this.config.onStatusChange) {
      this.config.onStatusChange(this.getState());
    }
  }

  /**
   * Persists current game state into localStorage for seamless continuation
   */
  public autoSave(): void {
    if (this.isGameOver) {
      GameStorage.clearSavedGame();
      return;
    }
    const engine = this.boardAdapter.getEngine();
    const status = engine.getStatus();
    const history = engine.getHistory();

    // Only persist if at least one move has been played or it's an active non-empty match
    if (history.length === 0 && status.turn === this.assignedColor) {
      return;
    }

    const state: SavedGameState = {
      fen: engine.getFen(),
      history,
      difficulty: this.difficulty,
      playerColorChoice: this.playerColorChoice,
      assignedColor: this.assignedColor,
      gameMode: this.gameMode,
      turn: status.turn,
      moveCount: history.length,
      timestamp: Date.now(),
      isGameOver: false,
      orientation: this.boardAdapter.getOrientation(),
      evalScore: this.currentEvalScore,
    };
    GameStorage.saveGame(state);
  }

  /**
   * Resumes an existing match from saved snapshot
   */
  public async resumeSavedGame(saved: SavedGameState): Promise<void> {
    if (this.isAiThinking) {
      stockfishWorker.stop();
      this.isAiThinking = false;
    }

    this.gameMode = saved.gameMode;
    this.difficulty = saved.difficulty;
    this.playerColorChoice = saved.playerColorChoice;
    this.assignedColor = saved.assignedColor;
    stockfishWorker.setDifficulty(this.difficulty);

    this.isGameOver = false;
    this.gameOverResult = null;
    this.currentHint = null;
    this.currentEvalScore = saved.evalScore || null;
    this.clearHintShapes();

    // Restore engine board & history
    this.boardAdapter.loadHistoryOrFen(saved.history, saved.fen);
    this.boardAdapter.setOrientation(saved.orientation || (this.assignedColor === 'w' ? 'white' : 'black'));
    this.evalBar.setOrientation(saved.orientation || (this.assignedColor === 'w' ? 'white' : 'black'));
    this.evalBar.reset();

    await stockfishWorker.newGame();

    const currentTurn = this.boardAdapter.getEngine().getTurn();

    // Set board movable colors
    if (this.gameMode === 'free_play') {
      this.boardAdapter.setMovableColor('both');
    } else {
      if (currentTurn === this.assignedColor) {
        this.boardAdapter.setMovableColor(this.assignedColor === 'w' ? 'white' : 'black');
      } else {
        this.boardAdapter.setMovableColor('none');
      }
    }

    this.notifyStateChange();

    // Check if interrupted when it was AI's turn
    if (this.gameMode === 'vs_ai' && currentTurn !== this.assignedColor) {
      await this.triggerAiMove();
    } else {
      this.triggerBackgroundEval();
    }
  }

  /**
   * Starts a brand new match with given settings
   */
  public async startNewGame(options?: {
    mode?: GameMode;
    difficulty?: EngineDifficulty;
    playerColor?: PlayerColorChoice;
  }): Promise<void> {
    // Clear any previous saved game snapshot when explicitly starting a new match
    GameStorage.clearSavedGame();

    if (this.isAiThinking) {
      stockfishWorker.stop();
      this.isAiThinking = false;
    }

    if (options?.mode !== undefined) {
      this.gameMode = options.mode;
    }
    if (options?.difficulty !== undefined) {
      this.difficulty = options.difficulty;
      stockfishWorker.setDifficulty(this.difficulty);
    }
    if (options?.playerColor !== undefined) {
      this.playerColorChoice = options.playerColor;
    }

    // Resolve random color choice
    if (this.playerColorChoice === 'random') {
      this.assignedColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      this.assignedColor = this.playerColorChoice === 'white' ? 'w' : 'b';
    }

    this.isGameOver = false;
    this.gameOverResult = null;
    this.currentHint = null;
    this.currentEvalScore = null;
    this.clearHintShapes();

    // Reset Engine & Board
    this.boardAdapter.reset();
    const orientation: BoardOrientation = this.assignedColor === 'w' ? 'white' : 'black';
    this.boardAdapter.setOrientation(orientation);
    this.evalBar.setOrientation(orientation);
    this.evalBar.reset();

    await stockfishWorker.newGame();

    // Set board movable colors
    if (this.gameMode === 'free_play') {
      this.boardAdapter.setMovableColor('both');
    } else {
      if (this.assignedColor === 'w') {
        this.boardAdapter.setMovableColor('white');
      } else {
        // Player is Black, White AI moves first!
        this.boardAdapter.setMovableColor('none');
      }
    }

    this.notifyStateChange();

    // If player is Black in vs_ai mode, trigger AI first move
    if (this.gameMode === 'vs_ai' && this.assignedColor === 'b') {
      await this.triggerAiMove();
    } else {
      this.triggerBackgroundEval();
    }
  }

  /**
   * Main move handler after player drops a piece
   */
  private async handleMove(_moveDetail: MoveDetail, status: GameStatus): Promise<void> {
    this.clearHintShapes();

    // Check if game has ended
    if (this.checkAndHandleGameOver(status)) {
      this.notifyStateChange();
      return;
    }

    // Save snapshot after user's valid move
    this.autoSave();

    if (this.gameMode === 'vs_ai') {
      // If next turn belongs to AI
      if (status.turn !== this.assignedColor) {
        await this.triggerAiMove();
      } else {
        this.boardAdapter.setMovableColor(this.assignedColor === 'w' ? 'white' : 'black');
        this.triggerBackgroundEval();
      }
    } else {
      // Free play mode
      this.boardAdapter.setMovableColor('both');
      this.triggerBackgroundEval();
    }

    this.notifyStateChange();
  }

  /**
   * Triggers AI thinking and move execution
   */
  private async triggerAiMove(): Promise<void> {
    if (this.isGameOver) return;

    this.isAiThinking = true;
    this.boardAdapter.setMovableColor('none');
    this.config.onAiThinkingChange?.(true, DIFFICULTY_PRESETS[this.difficulty].depth);
    this.notifyStateChange();

    const currentFen = this.boardAdapter.getEngine().getFen();

    try {
      const result = await stockfishWorker.getPlayMove(currentFen, {
        onInfo: (info) => {
          if (info.score) {
            this.currentEvalScore = info.score;
            const turn = this.boardAdapter.getEngine().getTurn();
            this.evalBar.updateScore(info.score, turn);
          }
        },
      });

      this.isAiThinking = false;
      this.config.onAiThinkingChange?.(false);

      if (this.isGameOver) return;

      const parsedMove = UciParser.uciToMove(result.bestMove);
      if (parsedMove) {
        this.boardAdapter.makeMove({
          from: parsedMove.from,
          to: parsedMove.to,
          promotion: parsedMove.promotion || 'q',
        });

        const status = this.boardAdapter.getEngine().getStatus();
        if (this.checkAndHandleGameOver(status)) {
          this.notifyStateChange();
          return;
        }

        // Save state after AI move
        this.autoSave();
      }

      // Re-enable player's movement
      this.boardAdapter.setMovableColor(this.assignedColor === 'w' ? 'white' : 'black');
      this.triggerBackgroundEval();
    } catch (err) {
      console.error('[PlayController] AI move error:', err);
      this.isAiThinking = false;
      this.config.onAiThinkingChange?.(false);
      this.boardAdapter.setMovableColor(this.assignedColor === 'w' ? 'white' : 'black');
    }

    this.notifyStateChange();
  }

  /**
   * Runs lightweight background evaluation to update EvalBar
   */
  private triggerBackgroundEval(): void {
    if (this.isAiThinking || this.isGameOver) return;
    const fen = this.boardAdapter.getEngine().getFen();
    const turn = this.boardAdapter.getEngine().getTurn();

    stockfishWorker
      .evaluate(fen, 10, (info) => {
        if (info.score) {
          this.currentEvalScore = info.score;
          this.evalBar.updateScore(info.score, turn);
        }
      })
      .then((res) => {
        if (res.score) {
          this.currentEvalScore = res.score;
          this.evalBar.updateScore(res.score, turn);
          this.notifyStateChange();
        }
      })
      .catch(() => {});
  }

  /**
   * Checks whether the game is over and displays result
   */
  private checkAndHandleGameOver(status: GameStatus): boolean {
    if (!status.isGameOver) return false;

    this.isGameOver = true;
    this.boardAdapter.setMovableColor('none');
    GameStorage.clearSavedGame();

    let result: GameOverResult;

    if (status.isCheckmate) {
      const winnerColor = status.turn === 'w' ? 'b' : 'w';
      const winnerName = winnerColor === 'w' ? '白方 (White)' : '黑方 (Black)';
      const isPlayerWinner =
        this.gameMode === 'vs_ai' ? winnerColor === this.assignedColor : true;

      result = {
        winner: winnerColor,
        reason: 'checkmate',
        titleZh:
          this.gameMode === 'vs_ai'
            ? isPlayerWinner
              ? '恭喜！您获得了胜利！'
              : '遗憾！AI 赢得了本局对弈'
            : `将死！${winnerName} 获得胜利！`,
        detailZh: `${winnerName} 成功完成将死，锁定胜局。`,
      };
    } else if (status.isStalemate) {
      result = {
        winner: 'draw',
        reason: 'stalemate',
        titleZh: '逼和（平局）',
        detailZh: '轮到走棋方无合法走法且未受将军，根据规则判定为逼和。',
      };
    } else if (status.isThreefoldRepetition) {
      result = {
        winner: 'draw',
        reason: 'threefold',
        titleZh: '三次重复局面（平局）',
        detailZh: '相同的棋盘局面重复出现三次，判定为和棋。',
      };
    } else if (status.isInsufficientMaterial) {
      result = {
        winner: 'draw',
        reason: 'material',
        titleZh: '子力不足和棋',
        detailZh: '双方剩余子力均无法达成将死，判定为和棋。',
      };
    } else if (status.isFiftyMoves) {
      result = {
        winner: 'draw',
        reason: 'fifty_moves',
        titleZh: '五十步和棋',
        detailZh: '连续 50 回合未发生吃子及兵的推进，判定为平局。',
      };
    } else {
      result = {
        winner: 'draw',
        reason: 'draw',
        titleZh: '对局结束（和棋）',
        detailZh: '双方握手言和。',
      };
    }

    this.gameOverResult = result;
    this.config.onGameOver?.(result);
    return true;
  }

  /**
   * Undoes the last move(s)
   */
  public undoMove(): void {
    if (this.isAiThinking) return;

    this.clearHintShapes();
    this.isGameOver = false;
    this.gameOverResult = null;

    if (this.gameMode === 'vs_ai') {
      const history = this.boardAdapter.getEngine().getHistory();
      if (history.length === 0) return;

      const currentTurn = this.boardAdapter.getEngine().getTurn();

      // If it's currently player's turn, undo both AI's move and player's previous move
      if (currentTurn === this.assignedColor) {
        if (history.length >= 2) {
          this.boardAdapter.undo();
          this.boardAdapter.undo();
        } else if (history.length === 1 && this.assignedColor === 'b') {
          // AI made first move, undo 1 move
          this.boardAdapter.undo();
        }
      } else {
        // AI's turn (rare, e.g. after error), undo 1 move
        this.boardAdapter.undo();
      }

      this.boardAdapter.setMovableColor(this.assignedColor === 'w' ? 'white' : 'black');
    } else {
      // Free play mode: undo 1 half-move
      this.boardAdapter.undo();
      this.boardAdapter.setMovableColor('both');
    }

    this.triggerBackgroundEval();
    this.autoSave();
    this.notifyStateChange();
  }

  /**
   * Requests a best move hint from Stockfish and renders arrow
   */
  public async requestHint(): Promise<void> {
    if (this.isAiThinking || this.isGameOver) return;

    const fen = this.boardAdapter.getEngine().getFen();
    try {
      const info = await stockfishWorker.getBestMove(fen, { depth: 14 });
      if (info.bestMove && info.bestMove.length >= 4) {
        const from = info.bestMove.slice(0, 2) as Square;
        const to = info.bestMove.slice(2, 4) as Square;

        this.currentHint = {
          uci: info.bestMove,
          from,
          to,
          score: info.score,
        };

        // Render green hint arrow on board
        this.boardAdapter.setShapes([
          {
            orig: from,
            dest: to,
            brush: 'green',
          },
        ]);

        this.config.onHintUpdate?.(this.currentHint);
        this.notifyStateChange();
      }
    } catch (err) {
      console.warn('[PlayController] Hint request failed:', err);
    }
  }

  public clearHintShapes(): void {
    this.currentHint = null;
    this.boardAdapter.clearShapes();
    this.config.onHintUpdate?.(null);
  }

  /**
   * Resigns the match for player
   */
  public resign(): void {
    if (this.isGameOver) return;

    if (this.isAiThinking) {
      stockfishWorker.stop();
      this.isAiThinking = false;
    }

    this.isGameOver = true;
    this.boardAdapter.setMovableColor('none');
    GameStorage.clearSavedGame();

    const winner: BoardColor = this.assignedColor === 'w' ? 'b' : 'w';
    const result: GameOverResult = {
      winner,
      reason: 'resignation',
      titleZh: this.gameMode === 'vs_ai' ? '您已认输' : '认输',
      detailZh: `${this.assignedColor === 'w' ? '白方' : '黑方'} 认输，对手胜出。`,
    };

    this.gameOverResult = result;
    this.config.onGameOver?.(result);
    this.notifyStateChange();
  }

  /**
   * Offers a draw. If vs AI and position is balanced, AI accepts!
   */
  public offerDraw(): boolean {
    if (this.isGameOver) return false;

    if (this.gameMode === 'vs_ai') {
      const history = this.boardAdapter.getEngine().getHistory();
      const cp = this.currentEvalScore?.type === 'cp' ? Math.abs(this.currentEvalScore.value) : 999;

      // Realistic AI draw evaluation: accepts if moves >= 15 and evaluation is roughly equal (|cp| <= 100)
      if (history.length >= 15 && cp <= 100) {
        this.isGameOver = true;
        this.boardAdapter.setMovableColor('none');
        GameStorage.clearSavedGame();

        const result: GameOverResult = {
          winner: 'draw',
          reason: 'agreement',
          titleZh: 'AI 同意和棋',
          detailZh: '当前局面势均力敌，AI 接受了您的和棋请求。',
        };
        this.gameOverResult = result;
        this.config.onGameOver?.(result);
        this.notifyStateChange();
        return true;
      } else {
        return false;
      }
    } else {
      // Free play mode: immediately accept
      this.isGameOver = true;
      this.boardAdapter.setMovableColor('none');
      GameStorage.clearSavedGame();
      const result: GameOverResult = {
        winner: 'draw',
        reason: 'agreement',
        titleZh: '双方商定和棋',
        detailZh: '双方棋手协商一致同意和棋。',
      };
      this.gameOverResult = result;
      this.config.onGameOver?.(result);
      this.notifyStateChange();
      return true;
    }
  }

  /**
   * Exports full PGN string with rich headers
   */
  public getPgnString(): string {
    const history = this.boardAdapter.getEngine().getHistory();
    const preset = DIFFICULTY_PRESETS[this.difficulty];

    let whiteName = 'Player';
    let blackName = `Stockfish AI (${preset.nameZh} ${preset.eloEstimate})`;
    let whiteElo = '1500';
    let blackElo = preset.eloEstimate.replace(/[^0-9]/g, '') || '1500';

    if (this.gameMode === 'vs_ai') {
      if (this.assignedColor === 'b') {
        whiteName = `Stockfish AI (${preset.nameZh} ${preset.eloEstimate})`;
        blackName = 'Player';
        whiteElo = blackElo;
        blackElo = '1500';
      }
    } else {
      whiteName = 'White Player';
      blackName = 'Black Player';
    }

    let result = '*';
    if (this.isGameOver && this.gameOverResult) {
      if (this.gameOverResult.winner === 'w') result = '1-0';
      else if (this.gameOverResult.winner === 'b') result = '0-1';
      else result = '1/2-1/2';
    }

    return PgnFormatter.formatPgn(history, {
      Event: this.gameMode === 'vs_ai' ? 'Stockfish AI Challenge' : 'Chess Learning Workbench Match',
      Site: 'Chess Learning Web App',
      Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      Round: '1',
      White: whiteName,
      Black: blackName,
      WhiteElo: whiteElo,
      BlackElo: blackElo,
      Result: result,
    });
  }

  /**
   * Loads a PGN string into the board & engine
   */
  public loadPgnString(pgn: string): boolean {
    const success = this.boardAdapter.getEngine().loadPgn(pgn);
    if (success) {
      this.boardAdapter.syncBoard();
      this.isGameOver = this.boardAdapter.getEngine().isGameOver();
      this.clearHintShapes();
      this.triggerBackgroundEval();
      this.autoSave();
      this.notifyStateChange();
      return true;
    }
    return false;
  }

  /**
   * Sets game mode ('vs_ai' | 'free_play')
   */
  public setGameMode(mode: GameMode): void {
    if (this.gameMode !== mode) {
      this.gameMode = mode;
      if (mode === 'free_play') {
        this.boardAdapter.setMovableColor('both');
      } else {
        this.boardAdapter.setMovableColor(
          this.boardAdapter.getEngine().getTurn() === this.assignedColor
            ? this.assignedColor === 'w'
              ? 'white'
              : 'black'
            : 'none'
        );
      }
      this.notifyStateChange();
    }
  }

  public toggleOrientation(): BoardOrientation {
    const newOrientation = this.boardAdapter.toggleOrientation();
    this.evalBar.setOrientation(newOrientation);
    return newOrientation;
  }

  public destroy(): void {
    if (this.isAiThinking) {
      stockfishWorker.stop();
    }
    this.evalBar.destroy();
    this.boardAdapter.destroy();
  }
}
