import type { EvalScore, BestMoveInfo } from '../types/engine_types';
import type { Square, PieceType } from '../types/chess_types';

/**
 * Parses UCI engine evaluation outputs and move strings
 */
export class UciParser {
  /**
   * Parse an 'info' line from Stockfish UCI output
   * e.g. "info depth 12 seldepth 18 score cp 35 nodes 120534 nps 602670 pv e2e4 e7e5 g1f3"
   * e.g. "info depth 8 score mate -2 pv e8f8 g7g8q"
   */
  public static parseInfoLine(line: string): Partial<BestMoveInfo> {
    const result: Partial<BestMoveInfo> = {};
    const tokens = line.trim().split(/\s+/);

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === 'depth' && i + 1 < tokens.length) {
        result.depth = parseInt(tokens[i + 1], 10);
      } else if (tokens[i] === 'score' && i + 2 < tokens.length) {
        const type = tokens[i + 1];
        const val = parseInt(tokens[i + 2], 10);
        if (type === 'cp') {
          result.score = {
            type: 'cp',
            value: val,
            formatted: (val >= 0 ? '+' : '') + (val / 100).toFixed(2),
          };
        } else if (type === 'mate') {
          result.score = {
            type: 'mate',
            value: val,
            formatted: `M${val}`,
          };
        }
      } else if (tokens[i] === 'pv') {
        result.pv = tokens.slice(i + 1);
        if (result.pv.length > 0) {
          result.bestMove = result.pv[0];
        }
        break;
      }
    }

    return result;
  }

  /**
   * Parse 'bestmove' line from Stockfish UCI output
   * e.g. "bestmove e2e4 ponder e7e5"
   */
  public static parseBestMoveLine(line: string): { bestMove: string; ponder?: string } {
    const tokens = line.trim().split(/\s+/);
    const bestMove = tokens[1] || '';
    let ponder: string | undefined;

    const ponderIdx = tokens.indexOf('ponder');
    if (ponderIdx !== -1 && ponderIdx + 1 < tokens.length) {
      ponder = tokens[ponderIdx + 1];
    }

    return { bestMove, ponder };
  }

  /**
   * Converts UCI move string (e.g. "e2e4", "e7e8q") to ChessJS move object
   */
  public static uciToMove(uci: string): {
    from: Square;
    to: Square;
    promotion?: PieceType;
  } | null {
    if (!uci || uci.length < 4) return null;
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promotion = uci.length >= 5 ? (uci[4].toLowerCase() as PieceType) : undefined;
    return { from, to, promotion };
  }

  /**
   * Converts move components to UCI move string (e.g. "e7e8q")
   */
  public static moveToUci(from: Square, to: Square, promotion?: PieceType): string {
    return `${from}${to}${promotion ? promotion.toLowerCase() : ''}`;
  }

  /**
   * Formats an evaluation score for display
   */
  public static formatScore(score?: EvalScore): string {
    if (!score) return '0.00';
    if (score.type === 'mate') {
      return `M${score.value > 0 ? '+' : ''}${score.value}`;
    }
    const val = (score.value / 100).toFixed(2);
    return score.value > 0 ? `+${val}` : val;
  }

  /**
   * Converts a score from the perspective of the side to move
   * to White's perspective (standard for evaluation bars).
   */
  public static toWhitePerspective(score: EvalScore, turn: 'w' | 'b'): EvalScore {
    const multiplier = turn === 'w' ? 1 : -1;
    const value = score.value * multiplier;
    let formatted = '';
    if (score.type === 'mate') {
      formatted = `M${value > 0 ? '+' : ''}${value}`;
    } else {
      const valStr = (value / 100).toFixed(2);
      formatted = value > 0 ? `+${valStr}` : valStr;
    }
    return {
      type: score.type,
      value,
      formatted,
    };
  }

  /**
   * Calculates white win percentage (0 to 100) from White's perspective evaluation score
   * Using sigmoid transformation (Lichess standard formula)
   */
  public static calculateWhiteWinPercentage(score?: EvalScore): number {
    if (!score) return 50;
    if (score.type === 'mate') {
      if (score.value > 0) return 100;
      if (score.value < 0) return 0;
      return 50;
    }
    const cp = score.value;
    const p = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
    return Math.max(2, Math.min(98, Math.round(p * 10) / 10));
  }
}

