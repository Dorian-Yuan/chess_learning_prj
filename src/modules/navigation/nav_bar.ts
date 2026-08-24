import { appRouter } from '../../utils/router';
import { initIcons } from '../../utils/icons';

interface TabItem {
  id: string;
  name: string;
  path: string;
  prefixes: string[];
  icon: string;
}

const TAB_ITEMS: TabItem[] = [
  {
    id: 'home',
    name: '首页',
    path: '#/',
    prefixes: ['/', '/play'],
    icon: 'swords',
  },
  {
    id: 'learn',
    name: '学习',
    path: '#/rules/pieces',
    prefixes: ['/rules', '/rules/pieces', '/rules/specials'],
    icon: 'book-open',
  },
  {
    id: 'train',
    name: '训练',
    path: '#/openings',
    prefixes: ['/train', '/openings', '/tactics'],
    icon: 'target',
  },
  {
    id: 'settings',
    name: '设置',
    path: '#/settings',
    prefixes: ['/settings'],
    icon: 'settings',
  },
];

export class NavBar {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    const currentPath = appRouter.getCurrentPath() || '/';

    const tabsHtml = TAB_ITEMS.map((tab) => {
      let isActive = false;
      if (tab.id === 'home') {
        isActive = currentPath === '/' || currentPath === '' || currentPath.startsWith('/play');
      } else {
        isActive = tab.prefixes.some((prefix) => currentPath.startsWith(prefix));
      }

      return `
        <a href="${tab.path}" class="capsule-tab-item ${isActive ? 'active' : ''}" data-tab="${tab.id}" title="${tab.name}" aria-label="${tab.name}">
          <div class="capsule-tab-icon-wrap">
            <i data-lucide="${tab.icon}" class="icon"></i>
          </div>
        </a>
      `;
    }).join('');

    this.container.innerHTML = `
      <!-- Minimalist Top Header -->
      <div class="top-header">
        <a href="#/" class="top-brand">
          <img src="${import.meta.env.BASE_URL}assets/logo/logo.png" alt="Logo" class="top-logo" />
          <div class="top-title-group">
            <span class="top-title">国际象棋研习</span>
            <span class="top-tag">Editorial</span>
          </div>
        </a>
      </div>

      <!-- Floating Capsule Bottom Tab Bar -->
      <nav class="capsule-tab-bar" aria-label="Navigation Tabs">
        <div class="capsule-tab-inner">
          ${tabsHtml}
        </div>
      </nav>
    `;

    initIcons(this.container);
  }

  public updateActive(): void {
    this.render();
  }
}

