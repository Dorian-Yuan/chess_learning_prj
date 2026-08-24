import { appRouter } from './utils/router';
import { settingsManager } from './utils/settings_manager';
import { NavBar } from './modules/navigation/nav_bar';
import { renderPlayView } from './modules/views/play_view';
import { renderRulesView } from './modules/views/rules_view';
import { renderOpeningsView } from './modules/views/openings_view';
import { renderTacticsView } from './modules/views/tactics_view';
import { renderSettingsView } from './modules/views/settings_view';

// Register PWA Service Worker (offline precaching)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch((err) => {
      console.warn('[PWA] Service worker registration failed:', err);
    });
  });
}

function initApp(): void {
  // Ensure settings are applied on DOM mount
  settingsManager.applySettings();
  const appRoot = document.getElementById('app');
  if (!appRoot) {
    throw new Error('Root element #app not found');
  }

  // Create skeleton containers
  const navContainer = document.createElement('header');
  navContainer.id = 'navbar-container';

  const mainContainer = document.createElement('main');
  mainContainer.id = 'main-container';
  mainContainer.className = 'main-container';

  appRoot.appendChild(navContainer);
  appRoot.appendChild(mainContainer);

  const navBar = new NavBar(navContainer);

  // Register Routes
  appRouter.register('/', () => {
    renderPlayView(mainContainer);
  });

  appRouter.register('/rules', () => {
    renderRulesView(mainContainer, 'pieces');
  });

  appRouter.register('/rules/pieces', () => {
    renderRulesView(mainContainer, 'pieces');
  });

  appRouter.register('/rules/specials', () => {
    renderRulesView(mainContainer, 'specials');
  });

  appRouter.register('/openings', () => {
    renderOpeningsView(mainContainer);
  });

  appRouter.register('/tactics', () => {
    renderTacticsView(mainContainer);
  });

  appRouter.register('/play', () => {
    renderPlayView(mainContainer);
  });

  appRouter.register('/settings', () => {
    renderSettingsView(mainContainer);
  });

  appRouter.setDefault(() => {
    renderPlayView(mainContainer);
  });

  // Keep NavBar state updated on route changes
  appRouter.onRouteChange(() => {
    navBar.updateActive();
    window.scrollTo(0, 0);
  });

  // Start Router
  appRouter.init();
  navBar.render();
}

// Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
  initApp();
});
