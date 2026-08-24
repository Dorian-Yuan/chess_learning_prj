import { OpeningUI } from '../opening_explorer/opening_ui';

let currentOpeningUI: OpeningUI | null = null;

export function renderOpeningsView(container: HTMLElement, targetId?: string): void {
  // Cleanup any active opening UI instance
  if (currentOpeningUI) {
    currentOpeningUI.destroy();
    currentOpeningUI = null;
  }

  // Parse URL query parameters if present (e.g. #/openings?id=italian_game&var=two_knights)
  const currentHash = window.location.hash;
  let activeId = targetId;
  let activeVarId: string | undefined = undefined;

  if (currentHash.includes('?')) {
    const queryString = currentHash.split('?')[1];
    const params = new URLSearchParams(queryString);
    if (!activeId) {
      activeId = params.get('id') || params.get('opening') || undefined;
    }
    activeVarId = params.get('var') || params.get('variation') || undefined;
  }

  currentOpeningUI = new OpeningUI(container, activeId, activeVarId);
}
