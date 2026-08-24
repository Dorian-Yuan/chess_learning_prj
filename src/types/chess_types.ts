import type { Square as ChessJSSquare, Color as ChessJSColor, PieceSymbol as ChessJSPieceSymbol } from 'chess.js';
import type { Key as CGKey } from '@lichess-org/chessground/types';

export type Square = ChessJSSquare;
export type BoardColor = ChessJSColor; // 'w' | 'b'
export type PieceType = ChessJSPieceSymbol; // 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

export type BoardOrientation = 'white' | 'black';

export interface ChessPiece {
  color: BoardColor;
  type: PieceType;
}

export interface MoveDetail {
  from: Square;
  to: Square;
  promotion?: PieceType;
  captured?: PieceType;
  piece: PieceType;
  color: BoardColor;
  san: string;
  lan: string;
  flags: string;
  isCapture: boolean;
  isPromotion: boolean;
  isCastling: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
}

export interface GameStatus {
  fen: string;
  turn: BoardColor;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isThreefoldRepetition: boolean;
  isInsufficientMaterial: boolean;
  isFiftyMoves: boolean;
  isGameOver: boolean;
  moveNumber: number;
  halfMoves: number;
  history: string[];
}

export type MoveResult =
  | { success: true; move: MoveDetail; status: GameStatus }
  | { success: false; error: string };

export type BoardDestMap = Map<CGKey, CGKey[]>;

export interface BoardAdapterConfig {
  container: HTMLElement;
  fen?: string;
  orientation?: BoardOrientation;
  viewOnly?: boolean;
  coordinates?: boolean;
  highlightLastMove?: boolean;
  showDests?: boolean;
  autoPlaySound?: boolean;
  animationDuration?: number;
  movableColor?: 'white' | 'black' | 'both' | 'none';
  onMove?: (orig: Square, dest: Square, moveDetail: MoveDetail, status: GameStatus) => void;
  onSelect?: (square: Square) => void;
  onPromotionRequired?: (orig: Square, dest: Square, resolve: (piece: PieceType) => void) => void;
  onCheck?: (color: BoardColor) => void;
  onCheckmate?: (winner: BoardColor) => void;
}

export type SoundEffect = 'move' | 'capture' | 'check' | 'gameEnd' | 'promote' | 'illegal';
