import { BoardAdapter } from '../../lib/board_adapter';
import openingBookData from '../../data/opening_book.json';
import type {
  OpeningItem,
  OpeningVariation,
  OpeningMove,
  OpeningBookData,
  OpeningType
} from '../../types/opening_types';

export interface OpeningExplorerState {
  currentOpening: OpeningItem;
  currentVariation: OpeningVariation | null;
  activeMoves: OpeningMove[];
  currentPly: number;
  totalPlies: number;
  currentMove: OpeningMove | null;
  isPlaying: boolean;
  activeTypeFilter: OpeningType | 'all' | 'principles';
  searchQuery: string;
}

export class OpeningController {
  private bookData: OpeningBookData;
  private currentOpening: OpeningItem;
  private currentVariation: OpeningVariation | null = null;
  private currentPly: number = 0;
  private isPlaying: boolean = false;
  private playInterval: number | null = null;
  private boardAdapter: BoardAdapter | null = null;
  private boardContainer: HTMLElement;
  private onStateChange: (state: OpeningExplorerState) => void;
  private activeTypeFilter: OpeningType | 'all' | 'principles' = 'all';
  private searchQuery: string = '';

  constructor(
    boardContainer: HTMLElement,
    onStateChange: (state: OpeningExplorerState) => void,
    initialOpeningId?: string,
    initialVariationId?: string
  ) {
    this.bookData = openingBookData as OpeningBookData;
    this.boardContainer = boardContainer;
    this.onStateChange = onStateChange;

    const matchedOpening = initialOpeningId
      ? this.bookData.openings.find((o) => o.id === initialOpeningId)
      : null;
    this.currentOpening = matchedOpening || this.bookData.openings[0];

    if (initialVariationId && this.currentOpening.variations) {
      this.currentVariation =
        this.currentOpening.variations.find((v) => v.id === initialVariationId) || null;
    }

    this.initBoard();
  }

  private initBoard(): void {
    if (this.boardAdapter) {
      this.boardAdapter.destroy();
    }

    this.boardAdapter = new BoardAdapter({
      container: this.boardContainer,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'white',
      viewOnly: true,
      coordinates: true,
      highlightLastMove: true,
      showDests: false,
    });

    this.goToPly(0);
  }

  public getActiveMoves(): OpeningMove[] {
    if (this.currentVariation) {
      return this.currentVariation.moves;
    }
    return this.currentOpening.mainLine;
  }

  public selectOpening(openingId: string): void {
    const opening = this.bookData.openings.find((o) => o.id === openingId);
    if (!opening) return;

    this.stopAutoPlay();
    this.currentOpening = opening;
    this.currentVariation = null;
    this.currentPly = 0;
    this.initBoard();
  }

  public selectVariation(variationId: string | null): void {
    this.stopAutoPlay();
    if (!variationId) {
      this.currentVariation = null;
    } else {
      this.currentVariation =
        this.currentOpening.variations.find((v) => v.id === variationId) || null;
    }
    this.currentPly = 0;
    this.initBoard();
  }

  public goToPly(ply: number): void {
    const moves = this.getActiveMoves();
    const targetPly = Math.max(0, Math.min(ply, moves.length));
    this.currentPly = targetPly;

    if (!this.boardAdapter) return;

    if (targetPly === 0) {
      this.boardAdapter.reset();
    } else {
      const targetMove = moves[targetPly - 1];
      if (targetMove.fen) {
        this.boardAdapter.setPosition(targetMove.fen);
      } else {
        // Replay moves from start
        this.boardAdapter.reset();
        for (let i = 0; i < targetPly; i++) {
          const m = moves[i];
          this.boardAdapter.makeMove(m.san || m.uci);
        }
      }
    }

    this.notifyState();
  }

  public nextMove(): boolean {
    const moves = this.getActiveMoves();
    if (this.currentPly < moves.length) {
      this.goToPly(this.currentPly + 1);
      return true;
    }
    this.stopAutoPlay();
    return false;
  }

  public prevMove(): boolean {
    if (this.currentPly > 0) {
      this.goToPly(this.currentPly - 1);
      return true;
    }
    return false;
  }

  public firstMove(): void {
    this.stopAutoPlay();
    this.goToPly(0);
  }

  public lastMove(): void {
    this.stopAutoPlay();
    const moves = this.getActiveMoves();
    this.goToPly(moves.length);
  }

  public toggleAutoPlay(): void {
    if (this.isPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  public startAutoPlay(): void {
    const moves = this.getActiveMoves();
    if (this.currentPly >= moves.length) {
      this.goToPly(0);
    }
    this.isPlaying = true;
    this.notifyState();

    if (this.playInterval) {
      window.clearInterval(this.playInterval);
    }

    this.playInterval = window.setInterval(() => {
      const hasNext = this.nextMove();
      if (!hasNext) {
        this.stopAutoPlay();
      }
    }, 1500);
  }

  public stopAutoPlay(): void {
    this.isPlaying = false;
    if (this.playInterval) {
      window.clearInterval(this.playInterval);
      this.playInterval = null;
    }
    this.notifyState();
  }

  public toggleOrientation(): void {
    if (this.boardAdapter) {
      this.boardAdapter.toggleOrientation();
    }
  }

  public setTypeFilter(filter: OpeningType | 'all' | 'principles'): void {
    this.activeTypeFilter = filter;
    this.notifyState();
  }

  public setSearchQuery(query: string): void {
    this.searchQuery = query.trim().toLowerCase();
    this.notifyState();
  }

  public getFilteredOpenings(): OpeningItem[] {
    return this.bookData.openings.filter((op) => {
      // Type filter
      if (this.activeTypeFilter !== 'all' && this.activeTypeFilter !== 'principles') {
        if (op.type !== this.activeTypeFilter) return false;
      }
      // Search query
      if (this.searchQuery) {
        const matchesName = op.name.toLowerCase().includes(this.searchQuery);
        const matchesZh = op.nameZh.toLowerCase().includes(this.searchQuery);
        const matchesEco = op.eco.toLowerCase().includes(this.searchQuery);
        if (!matchesName && !matchesZh && !matchesEco) return false;
      }
      return true;
    });
  }

  public getPrinciples() {
    return this.bookData.principles;
  }

  private notifyState(): void {
    const moves = this.getActiveMoves();
    const currentMove = this.currentPly > 0 ? moves[this.currentPly - 1] : null;

    this.onStateChange({
      currentOpening: this.currentOpening,
      currentVariation: this.currentVariation,
      activeMoves: moves,
      currentPly: this.currentPly,
      totalPlies: moves.length,
      currentMove,
      isPlaying: this.isPlaying,
      activeTypeFilter: this.activeTypeFilter,
      searchQuery: this.searchQuery,
    });
  }

  public destroy(): void {
    this.stopAutoPlay();
    if (this.boardAdapter) {
      this.boardAdapter.destroy();
      this.boardAdapter = null;
    }
  }
}
