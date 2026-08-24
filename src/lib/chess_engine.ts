import { Chess, type Move as ChessJSMove } from 'chess.js';
import type { Key as CGKey } from '@lichess-org/chessground/types';
import type {
  Square,
  BoardColor,
  PieceType,
  MoveDetail,
  GameStatus,
  BoardDestMap,
  ChessPiece,
} from '../types/chess_types';

export class ChessEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  public reset(): void {
    this.chess.reset();
  }

  public load(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Loads a match by replaying the history of SAN moves to restore full move history & undo capabilities.
   * Falls back to FEN loading if replay encounters any error.
   */
  public loadHistoryOrFen(history: string[], fen: string): boolean {
    this.chess.reset();
    let replayedOk = true;
    for (const move of history) {
      try {
        const res = this.chess.move(move);
        if (!res) {
          replayedOk = false;
          break;
        }
      } catch {
        replayedOk = false;
        break;
      }
    }

    if (!replayedOk) {
      return this.load(fen);
    }
    return true;
  }

  public clear(): void {
    this.chess.clear();
  }

  public put(piece: ChessPiece, square: Square): boolean {
    return this.chess.put({ type: piece.type, color: piece.color }, square);
  }

  public remove(square: Square): ChessPiece | null {
    const p = this.chess.remove(square);
    return p ? { color: p.color, type: p.type } : null;
  }

  public getFen(): string {
    return this.chess.fen();
  }

  public getTurn(): BoardColor {
    return this.chess.turn();
  }

  public getPiece(square: Square): ChessPiece | null {
    const p = this.chess.get(square);
    return p ? { color: p.color, type: p.type } : null;
  }

  public isCheck(): boolean {
    return this.chess.isCheck();
  }

  public isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  public isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  public isDraw(): boolean {
    return this.chess.isDraw();
  }

  public isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  public isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  public isFiftyMoves(): boolean {
    return this.chess.isDrawByFiftyMoves();
  }

  public isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  public getStatus(): GameStatus {
    const history = this.chess.history();
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
      isDraw: this.chess.isDraw(),
      isThreefoldRepetition: this.chess.isThreefoldRepetition(),
      isInsufficientMaterial: this.chess.isInsufficientMaterial(),
      isFiftyMoves: this.chess.isDrawByFiftyMoves(),
      isGameOver: this.chess.isGameOver(),
      moveNumber: Math.floor(history.length / 2) + 1,
      halfMoves: history.length,
      history,
    };
  }

  private getInternalMoves(square?: Square): Array<{ from: Square; to: Square; promotion?: PieceType }> {
    try {
      const chessInternal = this.chess as any;
      if (typeof chessInternal._moves === 'function') {
        const rawMoves = chessInternal._moves({
          legal: true,
          square: square ? square.toLowerCase() : undefined,
        });
        if (Array.isArray(rawMoves)) {
          return rawMoves.map((m: any) => ({
            from: ('abcdefgh'[m.from & 15] + (8 - (m.from >> 4))) as Square,
            to: ('abcdefgh'[m.to & 15] + (8 - (m.to >> 4))) as Square,
            promotion: m.promotion as PieceType | undefined,
          }));
        }
      }
    } catch {
      // Fallback to public moves API
    }

    try {
      const moves = this.chess.moves({ square, verbose: true });
      return moves.map((m) => ({
        from: m.from as Square,
        to: m.to as Square,
        promotion: m.promotion as PieceType | undefined,
      }));
    } catch {
      return [];
    }
  }

  public getLegalMoves(square?: Square): ChessJSMove[] {
    try {
      if (square) {
        return this.chess.moves({ square, verbose: true });
      }
      return this.chess.moves({ verbose: true });
    } catch {
      const moves = this.getInternalMoves(square);
      return moves.map(
        (m) =>
          ({
            color: this.chess.turn(),
            from: m.from,
            to: m.to,
            piece: this.chess.get(m.from)?.type || 'p',
            flags: '',
            san: `${m.from}-${m.to}`,
            lan: `${m.from}${m.to}`,
            before: this.chess.fen(),
            after: this.chess.fen(),
            promotion: m.promotion,
            isCapture: () => false,
            isPromotion: () => !!m.promotion,
            isEnPassant: () => false,
            isKingsideCastle: () => false,
            isQueensideCastle: () => false,
            isBigPawn: () => false,
          }) as unknown as ChessJSMove
      );
    }
  }

  public getDests(): BoardDestMap {
    const dests: BoardDestMap = new Map();
    const legalMoves = this.getInternalMoves();

    for (const move of legalMoves) {
      const from = move.from as CGKey;
      const to = move.to as CGKey;
      const existing = dests.get(from);
      if (existing) {
        existing.push(to);
      } else {
        dests.set(from, [to]);
      }
    }
    return dests;
  }

  public isPromotionMove(from: Square, to: Square): boolean {
    const piece = this.chess.get(from);
    if (!piece || piece.type !== 'p') return false;

    if (piece.color === 'w' && to.endsWith('8') && from.endsWith('7')) {
      const moves = this.getInternalMoves(from);
      return moves.some((m) => m.to === to);
    }
    if (piece.color === 'b' && to.endsWith('1') && from.endsWith('2')) {
      const moves = this.getInternalMoves(from);
      return moves.some((m) => m.to === to);
    }
    return false;
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
    try {
      let res: ChessJSMove;
      if (typeof move === 'string') {
        res = this.chess.move(move);
      } else {
        res = this.chess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion || 'q',
        });
      }

      if (!res) return null;

      return {
        from: res.from as Square,
        to: res.to as Square,
        promotion: res.promotion as PieceType | undefined,
        captured: res.captured as PieceType | undefined,
        piece: res.piece as PieceType,
        color: res.color as BoardColor,
        san: res.san,
        lan: res.lan,
        flags: res.flags,
        isCapture: res.isCapture(),
        isPromotion: res.isPromotion(),
        isCastling: res.isKingsideCastle() || res.isQueensideCastle(),
        isCheck: this.chess.isCheck(),
        isCheckmate: this.chess.isCheckmate(),
      };
    } catch {
      return null;
    }
  }

  public undoMove(): MoveDetail | null {
    const res = this.chess.undo();
    if (!res) return null;

    return {
      from: res.from as Square,
      to: res.to as Square,
      promotion: res.promotion as PieceType | undefined,
      captured: res.captured as PieceType | undefined,
      piece: res.piece as PieceType,
      color: res.color as BoardColor,
      san: res.san,
      lan: res.lan,
      flags: res.flags,
      isCapture: res.isCapture(),
      isPromotion: res.isPromotion(),
      isCastling: res.isKingsideCastle() || res.isQueensideCastle(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
    };
  }

  public getPgn(): string {
    return this.chess.pgn();
  }

  public loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      return true;
    } catch {
      return false;
    }
  }

  public getHistory(): string[] {
    return this.chess.history();
  }

  public getHistoryVerbose(): ChessJSMove[] {
    return this.chess.history({ verbose: true });
  }

  public getBoard(): ({ square: Square; type: PieceType; color: BoardColor } | null)[][] {
    const rawBoard = this.chess.board();
    return rawBoard.map((row) =>
      row.map((cell) =>
        cell
          ? {
              square: cell.square as Square,
              type: cell.type as PieceType,
              color: cell.color as BoardColor,
            }
          : null
      )
    );
  }
}
