import { PuzzleUI } from '../tactic_trainer/puzzle_ui';
import type { PuzzleTheme } from '../../types/puzzle_types';

let currentPuzzleUI: PuzzleUI | null = null;

export function renderTacticsView(container: HTMLElement, targetId?: string): void {
  // Cleanup any active puzzle UI instance
  if (currentPuzzleUI) {
    currentPuzzleUI.destroy();
    currentPuzzleUI = null;
  }

  // Parse URL query parameters if present (e.g. #/tactics?id=fork_01 or #/tactics?theme=fork)
  const currentHash = window.location.hash;
  let activeId = targetId;
  let activeTheme: PuzzleTheme | 'all' | undefined = undefined;

  if (currentHash.includes('?')) {
    const queryString = currentHash.split('?')[1];
    const params = new URLSearchParams(queryString);
    if (!activeId) {
      activeId = params.get('id') || params.get('puzzle') || undefined;
    }
    const themeParam = params.get('theme');
    if (themeParam) {
      activeTheme = themeParam as PuzzleTheme | 'all';
    }
  }

  currentPuzzleUI = new PuzzleUI(container, activeId, activeTheme);
}
