import { UciParser } from '../../utils/uci_parser';
import type { EvalScore } from '../../types/engine_types';
import type { BoardOrientation } from '../../types/chess_types';

export class EvalBarUI {
  private container: HTMLElement;
  private barFillElement: HTMLElement | null = null;
  private labelElement: HTMLElement | null = null;
  private currentOrientation: BoardOrientation = 'white';
  private currentScore: EvalScore | null = null;
  private currentPct: number = 50;

  constructor(container: HTMLElement, orientation: BoardOrientation = 'white') {
    this.container = container;
    this.currentOrientation = orientation;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="eval-bar-wrapper" title="局面评估条 (Stockfish 实时算力)">
        <div class="eval-bar-track">
          <div class="eval-bar-fill" id="eval-bar-fill"></div>
        </div>
        <div class="eval-bar-badge" id="eval-bar-badge">0.0</div>
      </div>
    `;

    this.barFillElement = this.container.querySelector('#eval-bar-fill');
    this.labelElement = this.container.querySelector('#eval-bar-badge');
    this.updateDisplay(null, 'w');
  }

  public setOrientation(orientation: BoardOrientation): void {
    this.currentOrientation = orientation;
    this.updateDisplay(this.currentScore, 'w');
  }

  /**
   * Updates the evaluation bar with score from Stockfish
   * @param rawScore Score from UCI info (from perspective of side to move or white)
   * @param sideToMove Current side to move ('w' | 'b')
   */
  public updateScore(rawScore: EvalScore | null, sideToMove: 'w' | 'b' = 'w'): void {
    if (!rawScore) {
      this.currentScore = null;
      this.updateDisplay(null, sideToMove);
      return;
    }

    // Convert raw score to white's perspective
    const whiteScore = UciParser.toWhitePerspective(rawScore, sideToMove);
    this.currentScore = whiteScore;
    this.updateDisplay(whiteScore, sideToMove);
  }

  private updateDisplay(whiteScore: EvalScore | null, _sideToMove: 'w' | 'b'): void {
    if (!this.barFillElement || !this.labelElement) return;

    if (!whiteScore) {
      this.currentPct = 50;
      this.barFillElement.style.height = '50%';
      this.labelElement.innerText = '0.0';
      this.labelElement.className = 'eval-bar-badge eval-neutral';
      return;
    }

    const whiteWinPct = UciParser.calculateWhiteWinPercentage(whiteScore);
    this.currentPct = whiteWinPct;

    // Adjust percentage based on board orientation
    // If orientation is white: White is at bottom, so white fill height is whiteWinPct%
    // If orientation is black: Black is at bottom, so black fill height is (100 - whiteWinPct)%
    const fillHeight = this.currentOrientation === 'white' ? whiteWinPct : 100 - whiteWinPct;
    this.barFillElement.style.height = `${fillHeight}%`;

    let labelText = '';
    if (whiteScore.type === 'mate') {
      labelText = `M${Math.abs(whiteScore.value)}`;
      if (whiteScore.value > 0) {
        this.labelElement.className = 'eval-bar-badge eval-white-winning';
      } else {
        this.labelElement.className = 'eval-bar-badge eval-black-winning';
      }
    } else {
      const val = whiteScore.value / 100;
      labelText = (val >= 0 ? '+' : '') + val.toFixed(1);
      if (val >= 1.5) {
        this.labelElement.className = 'eval-bar-badge eval-white-winning';
      } else if (val <= -1.5) {
        this.labelElement.className = 'eval-bar-badge eval-black-winning';
      } else {
        this.labelElement.className = 'eval-bar-badge eval-neutral';
      }
    }

    this.labelElement.innerText = labelText;
  }

  public getScore(): EvalScore | null {
    return this.currentScore;
  }

  public getPercentage(): number {
    return this.currentPct;
  }

  public reset(): void {
    this.currentScore = null;
    this.updateDisplay(null, 'w');
  }

  public destroy(): void {
    this.container.innerHTML = '';
    this.barFillElement = null;
    this.labelElement = null;
  }
}

