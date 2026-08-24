export type OpeningType = 'open' | 'semi-open' | 'closed';

export interface OpeningMove {
  ply: number;
  san: string;
  uci: string;
  comment: string;
  fen?: string;
}

export interface OpeningVariation {
  id: string;
  name: string;
  nameZh: string;
  eco: string;
  description: string;
  moves: OpeningMove[];
}

export interface OpeningPrinciple {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  summary: string;
  details: string[];
  tips: string;
}

export interface OpeningItem {
  id: string;
  name: string;
  nameZh: string;
  eco: string;
  type: OpeningType;
  typeNameZh: string;
  badge: string;
  shortDesc: string;
  strategy: {
    whiteIdea: string;
    blackIdea: string;
    keyThemes: string[];
  };
  mainLine: OpeningMove[];
  variations: OpeningVariation[];
}

export interface OpeningBookData {
  principles: OpeningPrinciple[];
  openings: OpeningItem[];
}
