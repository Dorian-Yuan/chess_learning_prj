export type EngineDifficulty = 'beginner' | 'novice' | 'intermediate' | 'advanced';

export interface DifficultyPreset {
  id: EngineDifficulty;
  name: string;
  nameZh: string;
  description: string;
  skillLevel: number; // 0 to 20
  depth: number;
  minDelayMs: number;
  maxDelayMs: number;
  eloEstimate: string;
}

export const DIFFICULTY_PRESETS: Record<EngineDifficulty, DifficultyPreset> = {
  beginner: {
    id: 'beginner',
    name: 'Beginner',
    nameZh: '入门',
    description: '基础算力，走法偏随性温和，适合初学棋子走法的爱好者。',
    skillLevel: 0,
    depth: 2,
    minDelayMs: 300,
    maxDelayMs: 800,
    eloEstimate: '~800 Elo',
  },
  novice: {
    id: 'novice',
    name: 'Novice',
    nameZh: '初级',
    description: '具备基础战术意识，会抓住明显失误，适合进阶练习。',
    skillLevel: 8,
    depth: 6,
    minDelayMs: 500,
    maxDelayMs: 1000,
    eloEstimate: '~1300 Elo',
  },
  intermediate: {
    id: 'intermediate',
    name: 'Intermediate',
    nameZh: '中级',
    description: '具备良好中局与残局战术嗅觉，计算严谨，具备俱乐部棋手水平。',
    skillLevel: 15,
    depth: 10,
    minDelayMs: 600,
    maxDelayMs: 1200,
    eloEstimate: '~1800 Elo',
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced',
    nameZh: '高级',
    description: '接近特级大师级别算力，深层搜索与精确杀法，极具挑战性。',
    skillLevel: 20,
    depth: 16,
    minDelayMs: 800,
    maxDelayMs: 1500,
    eloEstimate: '~2500+ Elo',
  },
};

export interface EngineConfig {
  difficulty: EngineDifficulty;
  depth?: number;
  skillLevel?: number;
  timeLimitMs?: number;
}

export interface EvalScore {
  type: 'cp' | 'mate';
  value: number; // Centipawns (from white's perspective) or moves to mate (+3 or -2)
  formatted: string; // '+0.45', '-1.20', 'M3', 'M-2'
}

export interface BestMoveInfo {
  bestMove: string; // UCI format e.g. 'e2e4'
  ponder?: string;
  score?: EvalScore;
  depth?: number;
  pv?: string[]; // Principal variation
}

export type EngineState = 'uninitialized' | 'initializing' | 'ready' | 'thinking' | 'error';

