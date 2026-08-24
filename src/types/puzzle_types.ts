export type PuzzleTheme =
  | 'fork'
  | 'pin'
  | 'discovered_check'
  | 'discovered_attack'
  | 'skewer'
  | 'deflection';

export interface TacticalPuzzle {
  id: string;
  title: string;
  theme: string;
  themeKey: PuzzleTheme;
  difficulty: 1 | 2 | 3;
  fen: string;
  turn: 'white' | 'black';
  moves: string[]; // UCI moves
  sanMoves?: string[];
  hint: string;
  successMessage: string;
  explanation: string;
}

export interface PuzzleProgress {
  solvedPuzzles: string[];
  lastPlayedId?: string;
  filterTheme?: string;
  filterDifficulty?: number;
}
