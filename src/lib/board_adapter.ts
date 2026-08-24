import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { Config } from '@lichess-org/chessground/config';
import type { Key as CGKey, Color as CGColor } from '@lichess-org/chessground/types';
import type { DrawShape } from '@lichess-org/chessground/draw';
import { ChessEngine } from './chess_engine';
import { soundPlayer } from './sound_player';
import { settingsManager } from '../utils/settings_manager';
import { PromotionModal } from '../modules/game_play/promotion_modal_ui';
import type {
  Square,
  BoardOrientation,
  PieceType,
  BoardAdapterConfig,
  MoveDetail,
} from '../types/chess_types';

export class BoardAdapter {
  private ground: Api | null = null;
  private engine: ChessEngine;
  private config: BoardAdapterConfig;
  private currentOrientation: BoardOrientation = 'white';
  private movableColor: 'white' | 'black' | 'both' | 'none' = 'both';
  private viewOnly: boolean = false;
  private unsubscribeSettings?: () => void;

  constructor(config: BoardAdapterConfig) {
    this.config = config;
    this.engine = new ChessEngine(config.fen);
    this.currentOrientation = config.orientation || 'white';
    this.viewOnly = !!config.viewOnly;
    this.movableColor = config.movableColor || 'both';

    this.initBoard();
    this.subscribeToSettings();
  }

  private subscribeToSettings(): void {
    this.unsubscribeSettings = settingsManager.subscribe((settings) => {
      if (this.ground) {
        const showCoords = this.config.coordinates !== undefined ? this.config.coordinates : settings.showCoordinates;
        const animDuration = this.config.animationDuration ?? settingsManager.getAnimationDuration();
        this.ground.set({
          coordinates: showCoords,
          animation: {
            enabled: animDuration > 0,
            duration: animDuration,
          },
        });
      }
    });
  }

  private initBoard(): void {
    const fen = this.engine.getFen();
    const dests = this.viewOnly || this.movableColor === 'none' ? new Map() : this.engine.getDests();
    const turnColor = this.engine.getTurn() === 'w' ? 'white' : 'black';
    const showCoords = this.config.coordinates !== undefined ? this.config.coordinates : settingsManager.getShowCoordinates();
    const animDuration = this.config.animationDuration ?? settingsManager.getAnimationDuration();

    const cgConfig: Config = {
      fen,
      orientation: this.currentOrientation,
      turnColor,
      coordinates: showCoords,
      viewOnly: this.viewOnly,
      highlight: {
        lastMove: this.config.highlightLastMove !== false,
        check: true,
      },
      animation: {
        enabled: animDuration > 0,
        duration: animDuration,
      },
      movable: {
        free: false,
        color: this.getCGMovableColor(),
        dests,
        showDests: this.config.showDests !== false,
        events: {
          after: (orig, dest) => {
            this.handleMove(orig as Square, dest as Square);
          },
        },
      },
      draggable: {
        enabled: !this.viewOnly && this.movableColor !== 'none',
        showGhost: true,
      },
      selectable: {
        enabled: !this.viewOnly && this.movableColor !== 'none',
      },
      events: {
        select: (key) => {
          if (this.config.onSelect) {
            this.config.onSelect(key as Square);
          }
        },
      },
    };

    this.ground = Chessground(this.config.container, cgConfig);
  }

  private getCGMovableColor(): CGColor | 'both' | undefined {
    if (this.viewOnly || this.movableColor === 'none') return undefined;
    if (this.movableColor === 'both') return 'both';
    return this.movableColor;
  }

  private async handleMove(orig: Square, dest: Square): Promise<void> {
    const isPromo = this.engine.isPromotionMove(orig, dest);
    let promotionPiece: PieceType | undefined = undefined;

    if (isPromo) {
      if (this.config.onPromotionRequired) {
        promotionPiece = await new Promise<PieceType>((resolve) => {
          this.config.onPromotionRequired!(orig, dest, resolve);
        });
      } else {
        const color = this.engine.getTurn();
        promotionPiece = await PromotionModal.show(color, this.config.container);
      }
    }

    const moveDetail = this.engine.makeMove({
      from: orig,
      to: dest,
      promotion: promotionPiece,
    });

    if (!moveDetail) {
      if (this.config.autoPlaySound !== false) {
        soundPlayer.play('illegal');
      }
      this.syncBoard();
      return;
    }

    const status = this.engine.getStatus();

    if (this.config.autoPlaySound !== false) {
      if (status.isCheckmate || status.isDraw) {
        soundPlayer.play('gameEnd');
      } else if (status.isCheck) {
        soundPlayer.play('check');
      } else if (moveDetail.isPromotion) {
        soundPlayer.play('promote');
      } else if (moveDetail.isCapture) {
        soundPlayer.play('capture');
      } else {
        soundPlayer.play('move');
      }
    }

    this.syncBoard(orig, dest);

    if (this.config.onMove) {
      this.config.onMove(orig, dest, moveDetail, status);
    }
    if (status.isCheck && this.config.onCheck) {
      this.config.onCheck(status.turn);
    }
    if (status.isCheckmate && this.config.onCheckmate) {
      const winner = status.turn === 'w' ? 'b' : 'w';
      this.config.onCheckmate(winner);
    }
  }

  public syncBoard(lastOrig?: Square, lastDest?: Square): void {
    if (!this.ground) return;

    const fen = this.engine.getFen();
    const isOver = this.engine.isGameOver();
    const dests = isOver || this.viewOnly || this.movableColor === 'none' ? new Map() : this.engine.getDests();
    const turnColor = this.engine.getTurn() === 'w' ? 'white' : 'black';

    const lastMove = lastOrig && lastDest ? [lastOrig as CGKey, lastDest as CGKey] : undefined;

    this.ground.set({
      fen,
      turnColor,
      check: this.engine.isCheck(),
      lastMove,
      movable: {
        color: isOver ? undefined : this.getCGMovableColor(),
        dests,
      },
    });
  }

  public setPosition(fen: string): boolean {
    const ok = this.engine.load(fen);
    if (ok) {
      this.syncBoard();
    }
    return ok;
  }

  public loadHistoryOrFen(history: string[], fen: string): boolean {
    const ok = this.engine.loadHistoryOrFen(history, fen);
    if (ok) {
      this.syncBoard();
    }
    return ok;
  }

  public reset(): void {
    this.engine.reset();
    if (this.ground) {
      this.ground.set({ lastMove: [] });
    }
    this.syncBoard();
  }

  public undo(): MoveDetail | null {
    const move = this.engine.undoMove();
    if (move) {
      this.syncBoard();
    }
    return move;
  }

  public async makeUserMove(orig: Square, dest: Square): Promise<void> {
    await this.handleMove(orig, dest);
  }

  public makeMove(
    move:
      | string
      | {
          from: Square;
          to: Square;
          promotion?: PieceType;
        }
  ): MoveDetail | null {
    const res = this.engine.makeMove(move);
    if (res) {
      if (this.config.autoPlaySound !== false) {
        if (res.isCheckmate) {
          soundPlayer.play('gameEnd');
        } else if (res.isCheck) {
          soundPlayer.play('check');
        } else if (res.isPromotion) {
          soundPlayer.play('promote');
        } else if (res.isCapture) {
          soundPlayer.play('capture');
        } else {
          soundPlayer.play('move');
        }
      }
      this.syncBoard(res.from, res.to);
    }
    return res;
  }

  public setOrientation(orientation: BoardOrientation): void {
    this.currentOrientation = orientation;
    if (this.ground) {
      this.ground.set({ orientation });
    }
  }

  public toggleOrientation(): BoardOrientation {
    this.currentOrientation = this.currentOrientation === 'white' ? 'black' : 'white';
    this.setOrientation(this.currentOrientation);
    return this.currentOrientation;
  }

  public getOrientation(): BoardOrientation {
    return this.currentOrientation;
  }

  public setMovableColor(color: 'white' | 'black' | 'both' | 'none'): void {
    this.movableColor = color;
    this.syncBoard();
  }

  public setViewOnly(viewOnly: boolean): void {
    this.viewOnly = viewOnly;
    if (this.ground) {
      this.ground.set({
        viewOnly,
        draggable: { enabled: !viewOnly },
        selectable: { enabled: !viewOnly },
      });
    }
    this.syncBoard();
  }

  public setShapes(shapes: DrawShape[]): void {
    if (this.ground) {
      this.ground.setAutoShapes(shapes);
    }
  }

  public clearShapes(): void {
    if (this.ground) {
      this.ground.setAutoShapes([]);
    }
  }

  public getEngine(): ChessEngine {
    return this.engine;
  }

  public getGround(): Api | null {
    return this.ground;
  }

  public destroy(): void {
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
      this.unsubscribeSettings = undefined;
    }
    PromotionModal.cleanup();
    if (this.ground) {
      this.ground.destroy();
      this.ground = null;
    }
  }
}
