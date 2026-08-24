export interface PgnHeaders {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result?: string;
  WhiteElo?: string;
  BlackElo?: string;
  [key: string]: string | undefined;
}

export class PgnFormatter {
  /**
   * Format move history (array of SAN) into clean, standard PGN string
   */
  public static formatPgn(history: string[], headers: PgnHeaders = {}): string {
    const defaultHeaders: PgnHeaders = {
      Event: 'Chess Learning Web Match',
      Site: 'Chess Learning App',
      Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      Round: '1',
      White: 'Player',
      Black: 'Stockfish / Opponent',
      Result: '*',
      ...headers,
    };

    let pgn = '';
    for (const [key, val] of Object.entries(defaultHeaders)) {
      if (val !== undefined) {
        pgn += `[${key} "${val}"]\n`;
      }
    }
    pgn += '\n';

    // Format moves in pairs: 1. e4 e5 2. Nf3 Nc6 ...
    let moveText = '';
    for (let i = 0; i < history.length; i++) {
      if (i % 2 === 0) {
        const moveNum = Math.floor(i / 2) + 1;
        moveText += `${moveNum}. ${history[i]} `;
      } else {
        moveText += `${history[i]} `;
      }
    }

    if (defaultHeaders.Result && defaultHeaders.Result !== '*') {
      moveText += defaultHeaders.Result;
    }

    return (pgn + moveText).trim();
  }

  /**
   * Formats move history into structured paired move rows for UI display
   */
  public static getMovePairs(history: string[]): Array<{
    number: number;
    white: string;
    black?: string;
    whiteIndex: number;
    blackIndex?: number;
  }> {
    const pairs: Array<{
      number: number;
      white: string;
      black?: string;
      whiteIndex: number;
      blackIndex?: number;
    }> = [];

    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1],
        whiteIndex: i,
        blackIndex: i + 1 < history.length ? i + 1 : undefined,
      });
    }

    return pairs;
  }
}
