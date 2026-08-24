import { PuzzleController, type PuzzleState } from './puzzle_controller';
import type { PuzzleTheme } from '../../types/puzzle_types';
import { initIcons } from '../../utils/icons';

export class PuzzleUI {
  private container: HTMLElement;
  private controller: PuzzleController | null = null;
  private boardContainer: HTMLElement | null = null;
  private currentRenderedMode: 'list' | 'training' | null = null;
  private currentRenderedPuzzleId: string | null = null;

  constructor(
    container: HTMLElement,
    initialPuzzleId?: string,
    initialTheme?: PuzzleTheme | 'all'
  ) {
    this.container = container;
    this.controller = new PuzzleController(
      (state) => this.render(state),
      initialPuzzleId,
      initialTheme
    );

    // Initial render
    this.controller.setThemeFilter(initialTheme || 'all');
  }

  private render(state: PuzzleState): void {
    if (state.mode === 'list') {
      this.currentRenderedMode = 'list';
      this.currentRenderedPuzzleId = null;
      this.renderListView(state);
    } else {
      if (
        this.currentRenderedMode === 'training' &&
        state.currentPuzzle &&
        state.currentPuzzle.id === this.currentRenderedPuzzleId
      ) {
        this.updateTrainingUI(state);
      } else {
        this.currentRenderedMode = 'training';
        this.currentRenderedPuzzleId = state.currentPuzzle?.id || null;
        this.renderTrainingView(state);
      }
    }
  }

  private renderListView(state: PuzzleState): void {
    if (!this.controller) return;

    const stats = this.controller.getSolvedCount();
    const progressPercent = Math.round((stats.solved / stats.total) * 100);
    const filteredPuzzles = this.controller.getFilteredPuzzles();

    const themes: Array<{ key: PuzzleTheme | 'all'; label: string; icon: string }> = [
      { key: 'all', label: '全部主题', icon: 'grid' },
      { key: 'fork', label: '击双', icon: 'zap' },
      { key: 'pin', label: '牵制', icon: 'shield' },
      { key: 'discovered_check', label: '抽将', icon: 'crosshair' },
      { key: 'discovered_attack', label: '闪击', icon: 'sparkles' },
      { key: 'skewer', label: '串击', icon: 'arrow-right' },
      { key: 'deflection', label: '消除保护', icon: 'scissors' },
    ];

    this.container.innerHTML = `
      <div class="tactic-view-container">
        <!-- Train switch -->
        <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-5); flex-wrap: wrap;">
          <a href="#/openings" class="mode-toggle-btn">开局浏览</a>
          <a href="#/tactics" class="mode-toggle-btn active">战术训练</a>
        </div>
        <!-- Top Bar -->
        <div style="margin-bottom: var(--space-6);">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-2);">
            <div>
              <h1 style="font-size: 2rem; margin-bottom: var(--space-1); color: var(--color-primary);">
                战术训练
              </h1>
              <p style="color: var(--text-muted); font-size: 1rem; margin: 0;">
                精选 54 道战术组合题
              </p>
            </div>

            <!-- Progress Summary Card -->
            <div class="card" style="padding: var(--space-3) var(--space-5); min-width: 220px; border-left: 4px solid var(--color-success);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase;">
                  完成进度
                </span>
                <span style="font-size: 0.95rem; font-weight: 700; color: var(--color-success);">
                  ${stats.solved} / ${stats.total} (${progressPercent}%)
                </span>
              </div>
              <div style="width: 100%; height: 6px; background-color: var(--bg-surface-subtle); border-radius: 3px; overflow: hidden;">
                <div style="width: ${progressPercent}%; height: 100%; background-color: var(--color-success); transition: width 0.3s ease;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Sub Navigation -->
        <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-6);">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
            <!-- Theme Tabs -->
            <div class="tactic-theme-tabs">
              ${themes
                .map((t) => {
                  const isActive = state.activeThemeFilter === t.key;
                  const themeStats = this.controller?.getSolvedCount(
                    t.key === 'all' ? undefined : t.key
                  );
                  return `
                  <button class="tactic-theme-tab ${isActive ? 'active' : ''}" data-theme="${t.key}">
                    <i data-lucide="${t.icon}" class="icon" style="width: 14px; height: 14px;"></i>
                    <span>${t.label}</span>
                    <span class="badge ${isActive ? 'badge-accent' : 'badge-muted'}" style="font-size: 0.7rem; padding: 1px 5px;">
                      ${themeStats?.solved || 0}/${themeStats?.total || 0}
                    </span>
                  </button>
                `;
                })
                .join('')}
            </div>

            <!-- Difficulty Filter -->
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <span style="font-size: 0.85rem; color: var(--text-muted);">难度:</span>
              <select id="tactic-difficulty-select" class="form-input" style="padding: 6px 10px; font-size: 0.85rem;">
                <option value="0" ${state.activeDifficultyFilter === 0 ? 'selected' : ''}>全部难度</option>
                <option value="1" ${state.activeDifficultyFilter === 1 ? 'selected' : ''}>入门 (难度 1)</option>
                <option value="2" ${state.activeDifficultyFilter === 2 ? 'selected' : ''}>进阶 (难度 2)</option>
                <option value="3" ${state.activeDifficultyFilter === 3 ? 'selected' : ''}>挑战 (难度 3)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Puzzles Grid -->
        <div class="grid grid-cols-3">
          ${
            filteredPuzzles.length === 0
              ? `
            <div class="col-span-3 card" style="padding: var(--space-8); text-align: center; color: var(--text-tertiary);">
              暂无匹配的战术题目
            </div>
          `
              : filteredPuzzles
                  .map((p) => {
                    const isSolved = state.solvedIds.includes(p.id);
                    const turnBadge =
                      p.turn === 'white'
                        ? '<span class="badge badge-muted">白先</span>'
                        : '<span class="badge badge-muted">黑先</span>';

                    return `
                    <div class="card card-interactive puzzle-card" data-puzzle-id="${p.id}">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span class="badge badge-accent">${p.theme}</span>
                          ${turnBadge}
                        </div>
                        <span class="badge ${isSolved ? 'badge-success' : 'badge-muted'}">
                          ${isSolved ? '已攻克' : '未解答'}
                        </span>
                      </div>

                      <h3 style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--color-primary); margin: 0 0 var(--space-3) 0;">
                        ${p.title}
                      </h3>

                      <div style="font-size: 0.82rem; color: var(--text-tertiary); margin-bottom: var(--space-4);">
                        难度：${p.difficulty} 级 · ${p.moves.length > 1 ? `${p.moves.length} 步连环战术` : '单步制胜'}
                      </div>

                      <div class="card-footer" style="padding-top: var(--space-3); margin-top: auto;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">
                          ${isSolved ? '点击温故知新' : '点击开始解谜'}
                        </span>
                        <span style="font-weight: 600; font-size: 0.85rem; color: var(--color-primary); display: flex; align-items: center; gap: 4px;">
                          ${isSolved ? '再次练习' : '进入挑战'}
                          <i data-lucide="chevron-right" class="icon" style="width: 14px; height: 14px;"></i>
                        </span>
                      </div>
                    </div>
                  `;
                  })
                  .join('')
          }
        </div>
      </div>
    `;

    // Bind List View Events
    const themeTabs = this.container.querySelectorAll('.tactic-theme-tab');
    themeTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const theme = tab.getAttribute('data-theme') as PuzzleTheme | 'all';
        this.controller?.setThemeFilter(theme);
      });
    });

    const diffSelect = document.getElementById('tactic-difficulty-select') as HTMLSelectElement | null;
    diffSelect?.addEventListener('change', (e) => {
      const val = parseInt((e.target as HTMLSelectElement).value, 10);
      this.controller?.setDifficultyFilter(val);
    });

    const puzzleCards = this.container.querySelectorAll('.puzzle-card');
    puzzleCards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-puzzle-id');
        if (id) this.controller?.enterTraining(id);
      });
    });

    initIcons(this.container);
  }

  private renderTrainingView(state: PuzzleState): void {
    if (!state.currentPuzzle) return;
    const p = state.currentPuzzle;
    const starsHtml = Array.from(
      { length: p.difficulty },
      () =>
        '<i data-lucide="star" class="icon" style="width: 13px; height: 13px; fill: var(--color-accent); color: var(--color-accent); display: inline-block; vertical-align: middle;"></i>'
    ).join(' ');
    const turnText = p.turn === 'white' ? '白方先行' : '黑方先行';

    this.container.innerHTML = `
      <div class="lesson-view-container">
        <!-- Top Breadcrumbs & Back -->
        <div class="lesson-top-bar">
          <div class="lesson-breadcrumbs">
            <a href="#/tactics" id="btn-tactic-breadcrumb-back" class="breadcrumb-link">核心战术训练营</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-link">${p.theme}</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">${p.title}</span>
          </div>

          <button id="btn-tactic-back-list" class="btn btn-secondary btn-sm">
            <i data-lucide="arrow-left" class="icon"></i>
            返回战术题库
          </button>
        </div>

        <!-- 2-Column Responsive Workspace -->
        <div class="lesson-workspace-grid">
          <!-- Left Column: Board & Toolbar -->
          <div class="lesson-board-column">
            <div class="lesson-board-card card">
              <div id="tactic-chessground-container" class="cg-board-square"></div>
            </div>

            <!-- Board Toolbar -->
            <div class="lesson-board-controls">
              <button id="btn-tactic-flip" class="btn btn-secondary btn-sm" title="翻转棋盘">
                <i data-lucide="refresh-cw" class="icon"></i>
                翻转棋盘
              </button>
              <button id="btn-tactic-retry" class="btn btn-secondary btn-sm" title="重新开始本题">
                <i data-lucide="rotate-ccw" class="icon"></i>
                重新开始
              </button>
              <button id="btn-tactic-hint" class="btn btn-outline btn-sm" title="查看提示">
                <i data-lucide="lightbulb" class="icon"></i>
                提示
              </button>
              <div style="margin-left: auto; display: flex; gap: var(--space-2);">
                <button id="btn-tactic-prev" class="btn btn-secondary btn-sm" ${state.puzzleIndex <= 0 ? 'disabled' : ''}>
                  <i data-lucide="chevron-left" class="icon"></i>
                  上一题
                </button>
                <button id="btn-tactic-next" class="btn btn-primary btn-sm" ${state.puzzleIndex >= state.totalPuzzlesInFilter - 1 ? 'disabled' : ''}>
                  下一题
                  <i data-lucide="chevron-right" class="icon"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column: Puzzle Info, Mission & Feedback -->
          <div class="lesson-info-column">
            <!-- Header Card -->
            <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-3);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="badge badge-accent">${p.theme}</span>
                  <span class="badge badge-muted" style="display: inline-flex; align-items: center; gap: 3px;">
                    难度: ${starsHtml}
                  </span>
                </div>
                <span class="lesson-step-pill">题目 ${state.puzzleIndex + 1} / ${state.totalPuzzlesInFilter}</span>
              </div>
              <h2 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-primary); margin: 0 0 var(--space-1) 0;">
                ${p.title}
              </h2>
              <div style="font-size: 0.88rem; color: var(--text-muted);">
                ${turnText} · 找出局面中最锐利的战术打击走法！
              </div>
            </div>

            <!-- Task & Feedback Card -->
            <div class="card lesson-task-card" style="padding: var(--space-5); margin-bottom: var(--space-3);">
              <div class="card-eyebrow" style="margin-bottom: var(--space-2); display: flex; align-items: center; gap: 6px;">
                <i data-lucide="target" class="icon" style="width: 15px; height: 15px; color: var(--color-accent);"></i>
                战术任务目标
              </div>
              <p style="font-size: 1rem; color: var(--text-main); line-height: 1.6; font-weight: 500; margin-bottom: var(--space-2);">
                请在棋盘上直接拖动或点击棋子行棋。
              </p>

              <!-- Feedback Banner -->
              <div id="tactic-feedback-banner" class="lesson-feedback-banner" style="${state.message ? 'display: block;' : 'display: none;'}">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <span>${state.message || ''}</span>
                  ${
                    state.isSolved && state.puzzleIndex < state.totalPuzzlesInFilter - 1
                      ? `<button id="btn-banner-next-puzzle" class="btn btn-accent btn-sm">下一题 <i data-lucide="arrow-right" class="icon"></i></button>`
                      : ''
                  }
                </div>
              </div>

              <!-- Collapsible Hint Box -->
              <div id="tactic-hint-box" class="lesson-hint-box" style="${state.hintRevealed ? 'display: block;' : 'display: none;'}">
                <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--color-accent); margin-bottom: 4px;">
                  <i data-lucide="lightbulb" class="icon" style="width: 16px; height: 16px;"></i>
                  战术线索提示
                </div>
                <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                  ${p.hint}
                </p>
              </div>

              <!-- Full Tactic Explanation on Success -->
              <div id="tactic-explanation-box" class="card" style="margin-top: var(--space-3); padding: var(--space-4); background-color: rgba(43, 122, 75, 0.08); border-left: 3px solid var(--color-success); display: ${state.isSolved ? 'block' : 'none'};">
                <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-success); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="check-circle" class="icon" style="width: 16px; height: 16px;"></i>
                  战术原理解析
                </div>
                <p style="font-size: 0.88rem; color: var(--text-main); line-height: 1.6; margin: 0;">
                  ${p.explanation}
                </p>
              </div>
            </div>

            <!-- Tactical Knowledge Sidebar Reference -->
            <div class="card" style="padding: var(--space-4); border-left: 3px solid var(--color-accent); background-color: var(--bg-surface-subtle);">
              <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-primary); margin-bottom: var(--space-1); display: flex; align-items: center; gap: 6px;">
                <i data-lucide="sparkles" class="icon" style="width: 16px; height: 16px; color: var(--color-accent);"></i>
                主题要领：${p.theme}
              </div>
              <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.5;">
                时刻留意对方未被保护的棋子（悬子）、与王同处一线/斜线的重子，以及关键防守者的连带关系。
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mount Board
    this.boardContainer = document.getElementById('tactic-chessground-container');
    if (this.boardContainer && this.controller) {
      this.controller.setBoardContainer(this.boardContainer);
      this.controller.initPuzzle();
    }

    // Bind Training View Events
    document.getElementById('btn-tactic-back-list')?.addEventListener('click', () => {
      this.controller?.backToList();
    });
    document.getElementById('btn-tactic-breadcrumb-back')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.controller?.backToList();
    });
    document.getElementById('btn-tactic-flip')?.addEventListener('click', () => {
      this.controller?.toggleOrientation();
    });
    document.getElementById('btn-tactic-retry')?.addEventListener('click', () => {
      this.controller?.retryPuzzle();
    });
    document.getElementById('btn-tactic-hint')?.addEventListener('click', () => {
      this.controller?.toggleHint();
    });
    document.getElementById('btn-tactic-prev')?.addEventListener('click', () => {
      this.controller?.prevPuzzle();
    });
    document.getElementById('btn-tactic-next')?.addEventListener('click', () => {
      this.controller?.nextPuzzle();
    });
    document.getElementById('btn-banner-next-puzzle')?.addEventListener('click', () => {
      this.controller?.nextPuzzle();
    });

    initIcons(this.container);
  }

  private updateTrainingUI(state: PuzzleState): void {
    if (!state.currentPuzzle) return;

    // Update feedback banner
    const feedbackBanner = document.getElementById('tactic-feedback-banner');
    if (feedbackBanner) {
      if (state.message) {
        feedbackBanner.style.display = 'block';
        feedbackBanner.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span>${state.message}</span>
            ${
              state.isSolved && state.puzzleIndex < state.totalPuzzlesInFilter - 1
                ? `<button id="btn-banner-next-puzzle" class="btn btn-accent btn-sm">下一题 <i data-lucide="arrow-right" class="icon"></i></button>`
                : ''
            }
          </div>
        `;
        document.getElementById('btn-banner-next-puzzle')?.addEventListener('click', () => {
          this.controller?.nextPuzzle();
        });
      } else {
        feedbackBanner.style.display = 'none';
      }
    }

    // Update hint box
    const hintBox = document.getElementById('tactic-hint-box');
    if (hintBox) {
      hintBox.style.display = state.hintRevealed ? 'block' : 'none';
    }

    // Update explanation box
    const explanationBox = document.getElementById('tactic-explanation-box');
    if (explanationBox) {
      explanationBox.style.display = state.isSolved ? 'block' : 'none';
    }

    // Update prev/next buttons
    const btnPrev = document.getElementById('btn-tactic-prev') as HTMLButtonElement | null;
    const btnNext = document.getElementById('btn-tactic-next') as HTMLButtonElement | null;
    if (btnPrev) btnPrev.disabled = state.puzzleIndex <= 0;
    if (btnNext) btnNext.disabled = state.puzzleIndex >= state.totalPuzzlesInFilter - 1;

    initIcons(this.container);
  }

  public destroy(): void {
    if (this.controller) {
      this.controller.destroy();
      this.controller = null;
    }
  }
}
