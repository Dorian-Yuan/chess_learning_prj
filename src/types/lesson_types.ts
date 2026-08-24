import type { Square, BoardColor } from './chess_types';

export type LessonType = 'piece' | 'special';

export type GoalType =
  | 'reach_target'      // 移动棋子到指定目标格
  | 'capture_all'       // 吃掉所有指定目标棋子（如散落的黑卒/金币）
  | 'make_move'         // 走出指定的合法标准步（如王车易位、吃过路兵、升变）
  | 'checkmate'         // 一到两步内达成将死
  | 'escape_check'      // 成功化解将军（吃子/垫子/逃王）
  | 'stalemate_defense' // 走成逼和以守和
  | 'custom';

export interface LessonLevel {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  fen: string;
  orientation?: 'white' | 'black';
  playerColor?: BoardColor;
  goalType: GoalType;
  targetSquares?: Square[];
  targetPieces?: Square[];
  expectedMoves?: string[]; // 允许的 SAN 或 UCI 走法，如 ['e2e4', 'e4', 'O-O']
  opponentMoves?: Record<string, string>; // 玩家走法 -> 对手自动应手
  successMessage?: string;
}

export interface PieceLessonData {
  id: string;
  name: string;
  nameZh: string;
  symbol: string;
  role: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
  pieceValue: number | string; // 1, 3, 3, 5, 9, '无限'
  icon: string;
  badge: string;
  shortDesc: string;
  fullRules: {
    movement: string;
    capture: string;
    special?: string;
  };
  pieceTips?: {
    keyPoints: string[];
    summary: string;
  };
  levels: LessonLevel[];
}

export interface SpecialRuleData {
  id: string;
  title: string;
  titleEn: string;
  badge: string;
  icon: string;
  shortDesc: string;
  conditionList: string[];
  rulesExplanation: string[];
  levels: LessonLevel[];
}
