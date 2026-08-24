import { OpeningController, type OpeningExplorerState } from './opening_controller';
import type { OpeningType } from '../../types/opening_types';
import { initIcons } from '../../utils/icons';

export class OpeningUI {
  private container: HTMLElement;
  private controller: OpeningController | null = null;
  private boardContainer: HTMLElement | null = null;

  constructor(
    container: HTMLElement,
    initialOpeningId?: string,
    initialVariationId?: string
  ) {
    this.container = container;
    this.renderLayout(initialOpeningId, initialVariationId);
  }

  private renderLayout(initialOpeningId?: string, initialVariationId?: string): void {
    this.container.innerHTML = `
      <div class="opening-view-container">
        <!-- Train switch -->
        <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-5); flex-wrap: wrap;">
          <a href="#/openings" class="mode-toggle-btn active">开局浏览</a>
          <a href="#/tactics" class="mode-toggle-btn">战术训练</a>
        </div>
        <!-- Top Breadcrumb & Page Header -->
        <div class="lesson-top-bar" style="margin-bottom: var(--space-4);">
          <div class="lesson-breadcrumbs">
            <a href="#/" class="breadcrumb-link">首页</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">经典开局</span>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <a href="#/play" class="btn btn-outline btn-sm">
              <i data-lucide="swords" class="icon"></i>
              实战演练
            </a>
          </div>
        </div>

        <!-- Master 2-Column Responsive Layout -->
        <div class="opening-layout-grid">
          <!-- Left Column: Filter, Search & Opening Directory -->
          <div class="opening-sidebar-column">
            <!-- Filter Tabs -->
            <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">
              <div class="opening-filter-group">
                <button class="opening-filter-btn active" data-filter="all">全部</button>
                <button class="opening-filter-btn" data-filter="open">开放 (e4 e5)</button>
                <button class="opening-filter-btn" data-filter="semi-open">半开放 (e4 其他)</button>
                <button class="opening-filter-btn" data-filter="closed">封闭 (d4 及其他)</button>
                <button class="opening-filter-btn btn-principles" data-filter="principles">
                  <i data-lucide="sparkles" class="icon" style="width: 14px; height: 14px;"></i>
                  开局三大原则
                </button>
              </div>

              <!-- Search Input -->
              <div style="margin-top: var(--space-2); position: relative;">
                <input
                  type="text"
                  id="opening-search-input"
                  class="form-input"
                  placeholder="搜索开局名称、ECO..."
                  style="width: 100%; padding-left: 28px; font-size: 0.85rem;"
                />
                <i data-lucide="search" class="icon" style="position: absolute; left: 8px; top: 9px; width: 14px; height: 14px; color: var(--text-tertiary);"></i>
              </div>
            </div>

            <!-- Opening Directory List Container -->
            <div id="opening-list-container" class="opening-list-container"></div>
          </div>

          <!-- Right Column: Interactive Demonstration & Intent Commentary -->
          <div class="opening-main-column">
            <!-- Principles View (Hidden by default, shows when principles filter is selected) -->
            <div id="opening-principles-panel" class="card" style="display: none; padding: var(--space-6); margin-bottom: var(--space-4);">
              <div class="card-eyebrow" style="margin-bottom: var(--space-2); display: flex; align-items: center; gap: 6px;">
                <i data-lucide="book-open" class="icon" style="width: 14px; height: 14px;"></i>
                开局战略
              </div>
              <h2 style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-primary); margin-bottom: var(--space-4);">
                开局三大黄金原则
              </h2>
              <div id="opening-principles-content" style="display: flex; flex-direction: column; gap: var(--space-4);"></div>
            </div>

            <!-- Standard Opening Explorer Workspace -->
            <div id="opening-workspace-panel">
              <!-- Header Card -->
              <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-3);">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-2);">
                  <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <span id="opening-eco-badge" class="badge badge-accent">C50</span>
                    <span id="opening-type-badge" class="badge badge-muted">开放开局</span>
                    <span id="opening-badge-tag" class="badge badge-success">古典优雅</span>
                  </div>
                  <div id="opening-variation-chips" class="opening-variation-chips"></div>
                </div>

                <h1 id="opening-main-title" style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-primary); margin: 0 0 var(--space-1) 0;">
                  意大利开局 (Italian Game)
                </h1>
                <p id="opening-short-desc" style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                  国际象棋历史最悠久的经典开局之一，直指黑方 f7 弱点，节奏明快，极易上手。
                </p>
              </div>

              <!-- Board & Intent 2-Column Subgrid -->
              <div class="opening-board-comment-grid">
                <!-- Left: Board & Board Controls -->
                <div class="opening-board-area">
                  <div class="card opening-board-card" style="padding: var(--space-4);">
                    <div id="opening-chessground-container" class="cg-board-square"></div>
                  </div>

                  <!-- Toolbar Controls -->
                  <div class="opening-board-toolbar">
                    <button id="btn-op-first" class="btn btn-secondary btn-sm" title="回到初始局面 (Home)">
                      <i data-lucide="chevrons-left" class="icon"></i>
                    </button>
                    <button id="btn-op-prev" class="btn btn-secondary btn-sm" title="上一步 (方向键左)">
                      <i data-lucide="chevron-left" class="icon"></i>
                      上一步
                    </button>
                    <button id="btn-op-play" class="btn btn-outline btn-sm" title="自动演示 / 暂停 (Space)">
                      <i data-lucide="play" class="icon"></i>
                      <span id="btn-op-play-text">演示</span>
                    </button>
                    <button id="btn-op-next" class="btn btn-primary btn-sm" title="下一步 (方向键右)">
                      下一步
                      <i data-lucide="chevron-right" class="icon"></i>
                    </button>
                    <button id="btn-op-last" class="btn btn-secondary btn-sm" title="跳至末尾 (End)">
                      <i data-lucide="chevrons-right" class="icon"></i>
                    </button>
                    <button id="btn-op-flip" class="btn btn-secondary btn-sm" title="翻转视角 (F)" style="margin-left: auto;">
                      <i data-lucide="refresh-cw" class="icon"></i>
                    </button>
                  </div>

                  <!-- Ply Progress & Move Step Bar -->
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-top: var(--space-2); padding: 0 4px; font-size: 0.85rem; color: var(--text-tertiary);">
                    <span id="opening-ply-indicator">第 0 / 10 步 · 初始局面</span>
                    <span id="opening-active-move-san" style="font-family: var(--font-mono); font-weight: 600; color: var(--color-primary);">--</span>
                  </div>
                </div>

                <!-- Right: Step Intent Commentary & Strategic Notes -->
                <div class="opening-comment-area">
                  <!-- Real-time Move Intent Card -->
                  <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4); border-left: 4px solid var(--color-accent);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
                      <div class="card-eyebrow" style="margin: 0; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="lightbulb" class="icon" style="width: 14px; height: 14px;"></i>
                        每步战略意图解析
                      </div>
                      <span id="opening-intent-ply-tag" class="badge badge-muted">第 0 步</span>
                    </div>
                    <div id="opening-move-intent" style="font-size: 0.95rem; color: var(--text-main); line-height: 1.6; min-height: 54px;">
                      点击「下一步」或使用方向键跟随主线谱法，浏览每一步的攻防战略意图。
                    </div>
                  </div>

                  <!-- Move List PGN Table -->
                  <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">
                    <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-2);">
                      谱线走法记录
                    </div>
                    <div id="opening-moves-table" class="opening-moves-table"></div>
                  </div>

                  <!-- Strategic Ideas Box -->
                  <div class="card" style="padding: var(--space-4); background-color: var(--bg-surface-subtle);">
                    <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-primary); margin-bottom: var(--space-2); display: flex; align-items: center; gap: 6px;">
                      <i data-lucide="compass" class="icon" style="width: 16px; height: 16px; color: var(--color-accent);"></i>
                      开局双方核心构思
                    </div>
                    <div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted); display: flex; flex-direction: column; gap: var(--space-2);">
                      <div>
                        <strong style="color: var(--color-primary);">白方构思：</strong>
                        <span id="opening-white-idea">--</span>
                      </div>
                      <div>
                        <strong style="color: var(--color-primary);">黑方构思：</strong>
                        <span id="opening-black-idea">--</span>
                      </div>
                      <div style="margin-top: var(--space-1); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;" id="opening-themes-container"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.boardContainer = document.getElementById('opening-chessground-container');
    if (!this.boardContainer) return;

    this.controller = new OpeningController(
      this.boardContainer,
      (state) => this.updateUI(state),
      initialOpeningId,
      initialVariationId
    );

    this.bindEvents();
    this.renderPrinciples();
    initIcons(this.container);
  }

  private bindEvents(): void {
    const btnFirst = document.getElementById('btn-op-first');
    const btnPrev = document.getElementById('btn-op-prev');
    const btnPlay = document.getElementById('btn-op-play');
    const btnNext = document.getElementById('btn-op-next');
    const btnLast = document.getElementById('btn-op-last');
    const btnFlip = document.getElementById('btn-op-flip');
    const searchInput = document.getElementById('opening-search-input') as HTMLInputElement | null;

    btnFirst?.addEventListener('click', () => this.controller?.firstMove());
    btnPrev?.addEventListener('click', () => this.controller?.prevMove());
    btnPlay?.addEventListener('click', () => this.controller?.toggleAutoPlay());
    btnNext?.addEventListener('click', () => this.controller?.nextMove());
    btnLast?.addEventListener('click', () => this.controller?.lastMove());
    btnFlip?.addEventListener('click', () => this.controller?.toggleOrientation());

    searchInput?.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      this.controller?.setSearchQuery(val);
    });

    // Filter Buttons
    const filterBtns = this.container.querySelectorAll('.opening-filter-btn');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter') as OpeningType | 'all' | 'principles';
        this.controller?.setTypeFilter(filter);
      });
    });

    // Keyboard Shortcuts
    const handleKeydown = (e: KeyboardEvent) => {
      // Only handle if on opening view
      if (!document.getElementById('opening-chessground-container')) {
        window.removeEventListener('keydown', handleKeydown);
        return;
      }
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        this.controller?.nextMove();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.controller?.prevMove();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.controller?.firstMove();
      } else if (e.key === 'End') {
        e.preventDefault();
        this.controller?.lastMove();
      } else if (e.key.toLowerCase() === 'f') {
        this.controller?.toggleOrientation();
      }
    };
    window.addEventListener('keydown', handleKeydown);
  }

  private renderPrinciples(): void {
    if (!this.controller) return;
    const container = document.getElementById('opening-principles-content');
    if (!container) return;

    const principles = this.controller.getPrinciples();
    container.innerHTML = principles
      .map(
        (p) => `
        <div class="card" style="padding: var(--space-4); border-left: 4px solid var(--color-accent); background-color: var(--bg-surface);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
            <h3 style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--color-primary); margin: 0;">
              ${p.title}
            </h3>
            <span class="badge badge-accent">${p.subtitle}</span>
          </div>
          <p style="font-size: 0.92rem; color: var(--text-main); line-height: 1.6; margin-bottom: var(--space-3);">
            ${p.summary}
          </p>
          <ul style="padding-left: 1.2rem; font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; margin: 0 0 var(--space-3) 0;">
            ${p.details.map((d) => `<li>${d}</li>`).join('')}
          </ul>
          <div style="font-size: 0.85rem; color: var(--color-accent); font-weight: 600;">
            ${p.tips}
          </div>
        </div>
      `
      )
      .join('');
  }

  private updateUI(state: OpeningExplorerState): void {
    const listContainer = document.getElementById('opening-list-container');
    const workspacePanel = document.getElementById('opening-workspace-panel');
    const principlesPanel = document.getElementById('opening-principles-panel');

    // Principles Mode switch
    if (state.activeTypeFilter === 'principles') {
      if (workspacePanel) workspacePanel.style.display = 'none';
      if (principlesPanel) principlesPanel.style.display = 'block';
    } else {
      if (workspacePanel) workspacePanel.style.display = 'block';
      if (principlesPanel) principlesPanel.style.display = 'none';
    }

    // Render Opening Sidebar List
    if (listContainer && this.controller) {
      const filtered = this.controller.getFilteredOpenings();
      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div style="padding: var(--space-6); text-align: center; color: var(--text-tertiary); font-size: 0.9rem;">
            未找到匹配的开局
          </div>
        `;
      } else {
        listContainer.innerHTML = filtered
          .map((op) => {
            const isActive = op.id === state.currentOpening.id;
            return `
              <div class="opening-list-item ${isActive ? 'active' : ''}" data-opening-id="${op.id}">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                  <span style="font-weight: 600; font-size: 0.95rem; color: var(--color-primary);">
                    ${op.nameZh}
                  </span>
                  <span class="badge ${isActive ? 'badge-accent' : 'badge-muted'}" style="font-family: var(--font-mono); font-size: 0.72rem;">
                    ${op.eco}
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between;">
                  <span>${op.name}</span>
                  <span style="font-size: 0.75rem; color: var(--text-tertiary);">${op.typeNameZh}</span>
                </div>
              </div>
            `;
          })
          .join('');

        // Item click listeners
        listContainer.querySelectorAll('.opening-list-item').forEach((item) => {
          item.addEventListener('click', () => {
            const id = item.getAttribute('data-opening-id');
            if (id) this.controller?.selectOpening(id);
          });
        });
      }
    }

    // Update Header
    const ecoBadge = document.getElementById('opening-eco-badge');
    const typeBadge = document.getElementById('opening-type-badge');
    const badgeTag = document.getElementById('opening-badge-tag');
    const mainTitle = document.getElementById('opening-main-title');
    const shortDesc = document.getElementById('opening-short-desc');
    const variationChips = document.getElementById('opening-variation-chips');

    if (ecoBadge) ecoBadge.innerText = state.currentVariation?.eco || state.currentOpening.eco;
    if (typeBadge) typeBadge.innerText = state.currentOpening.typeNameZh;
    if (badgeTag) badgeTag.innerText = state.currentOpening.badge;
    if (mainTitle) {
      const varName = state.currentVariation ? ` · ${state.currentVariation.nameZh}` : '';
      mainTitle.innerText = `${state.currentOpening.nameZh}${varName} (${state.currentVariation ? state.currentVariation.name : state.currentOpening.name})`;
    }
    if (shortDesc) {
      shortDesc.innerText = state.currentVariation?.description || state.currentOpening.shortDesc;
    }

    // Variations Switcher Chips
    if (variationChips) {
      const chips: string[] = [];
      // Main line chip
      chips.push(`
        <button class="opening-chip-btn ${!state.currentVariation ? 'active' : ''}" data-var-id="">
          主变谱线
        </button>
      `);
      // Variations
      (state.currentOpening.variations || []).forEach((v) => {
        const isAct = state.currentVariation?.id === v.id;
        chips.push(`
          <button class="opening-chip-btn ${isAct ? 'active' : ''}" data-var-id="${v.id}">
            ${v.nameZh}
          </button>
        `);
      });
      variationChips.innerHTML = chips.join('');
      variationChips.querySelectorAll('.opening-chip-btn').forEach((chip) => {
        chip.addEventListener('click', () => {
          const varId = chip.getAttribute('data-var-id') || null;
          this.controller?.selectVariation(varId);
        });
      });
    }

    // Update Intent Commentary
    const intentBox = document.getElementById('opening-move-intent');
    const intentPlyTag = document.getElementById('opening-intent-ply-tag');
    const plyIndicator = document.getElementById('opening-ply-indicator');
    const activeMoveSan = document.getElementById('opening-active-move-san');

    if (intentPlyTag) {
      intentPlyTag.innerText = state.currentPly === 0 ? '开局概览' : `第 ${state.currentPly} 步`;
    }

    if (intentBox) {
      if (state.currentPly === 0) {
        intentBox.innerHTML = `
          <strong>开局概述：</strong>${state.currentOpening.shortDesc}<br/>
          <span style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px; display: inline-block;">
            点击「下一步」开始一步步学习主线走法与意图。
          </span>
        `;
      } else if (state.currentMove) {
        const turnColor = state.currentPly % 2 === 1 ? '白方' : '黑方';
        intentBox.innerHTML = `
          <strong style="color: var(--color-primary);">${turnColor} ${state.currentMove.san}：</strong>
          ${state.currentMove.comment}
        `;
      }
    }

    if (plyIndicator) {
      plyIndicator.innerText = `第 ${state.currentPly} / ${state.totalPlies} 步 · ${
        state.currentPly === 0
          ? '初始局面'
          : state.currentPly % 2 === 1
          ? '白方行棋完毕'
          : '黑方行棋完毕'
      }`;
    }

    if (activeMoveSan) {
      if (state.currentPly > 0 && state.currentMove) {
        const moveNum = Math.ceil(state.currentPly / 2);
        const prefix = state.currentPly % 2 === 1 ? `${moveNum}.` : `${moveNum}...`;
        activeMoveSan.innerText = `${prefix} ${state.currentMove.san}`;
      } else {
        activeMoveSan.innerText = '--';
      }
    }

    // Update Strategy Box
    const whiteIdea = document.getElementById('opening-white-idea');
    const blackIdea = document.getElementById('opening-black-idea');
    const themesContainer = document.getElementById('opening-themes-container');

    if (whiteIdea) whiteIdea.innerText = state.currentOpening.strategy.whiteIdea;
    if (blackIdea) blackIdea.innerText = state.currentOpening.strategy.blackIdea;
    if (themesContainer) {
      themesContainer.innerHTML = state.currentOpening.strategy.keyThemes
        .map((t) => `<span class="badge badge-accent" style="font-size: 0.75rem;">#${t}</span>`)
        .join('');
    }

    // Update Moves Table
    const movesTable = document.getElementById('opening-moves-table');
    if (movesTable) {
      const moves = state.activeMoves;
      const rows: string[] = [];
      for (let i = 0; i < moves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whitePly = i + 1;
        const blackPly = i + 2 <= moves.length ? i + 2 : null;

        const whiteActive = state.currentPly === whitePly;
        const blackActive = blackPly !== null && state.currentPly === blackPly;

        rows.push(`
          <div class="opening-move-row">
            <span class="opening-move-num">${moveNum}.</span>
            <button class="opening-move-btn ${whiteActive ? 'active' : ''}" data-ply="${whitePly}">
              ${moves[i].san}
            </button>
            ${
              blackPly !== null
                ? `<button class="opening-move-btn ${blackActive ? 'active' : ''}" data-ply="${blackPly}">
                    ${moves[i + 1].san}
                   </button>`
                : `<span class="opening-move-btn disabled"></span>`
            }
          </div>
        `);
      }
      movesTable.innerHTML = rows.join('');

      movesTable.querySelectorAll('.opening-move-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const ply = parseInt(btn.getAttribute('data-ply') || '0', 10);
          if (ply > 0) this.controller?.goToPly(ply);
        });
      });
    }

    // Update Toolbar Button states
    const btnPrev = document.getElementById('btn-op-prev') as HTMLButtonElement | null;
    const btnNext = document.getElementById('btn-op-next') as HTMLButtonElement | null;
    const btnFirst = document.getElementById('btn-op-first') as HTMLButtonElement | null;
    const btnLast = document.getElementById('btn-op-last') as HTMLButtonElement | null;
    const btnPlayText = document.getElementById('btn-op-play-text');

    if (btnPrev) btnPrev.disabled = state.currentPly === 0;
    if (btnFirst) btnFirst.disabled = state.currentPly === 0;
    if (btnNext) btnNext.disabled = state.currentPly === state.totalPlies;
    if (btnLast) btnLast.disabled = state.currentPly === state.totalPlies;
    if (btnPlayText) btnPlayText.innerText = state.isPlaying ? '暂停' : '演示';

    initIcons(this.container);
  }

  public destroy(): void {
    if (this.controller) {
      this.controller.destroy();
      this.controller = null;
    }
  }
}
