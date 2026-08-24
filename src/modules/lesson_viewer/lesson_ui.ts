import { LessonController, type LessonState } from './lesson_controller';
import type { PieceLessonData, SpecialRuleData } from '../../types/lesson_types';
import { initIcons } from '../../utils/icons';

export class LessonUI {
  private container: HTMLElement;
  private controller: LessonController | null = null;
  private boardEl: HTMLElement | null = null;
  private lessonData: PieceLessonData | SpecialRuleData;
  private isPieceLesson: boolean;

  constructor(container: HTMLElement, lessonData: PieceLessonData | SpecialRuleData) {
    this.container = container;
    this.lessonData = lessonData;
    this.isPieceLesson = 'nameZh' in lessonData;

    this.renderLayout();
  }

  private renderLayout(): void {
    const isPiece = this.isPieceLesson;
    const backRoute = isPiece ? '#/rules/pieces' : '#/rules/specials';
    const backText = '返回列表';
    const title = isPiece
      ? `${(this.lessonData as PieceLessonData).nameZh} (${(this.lessonData as PieceLessonData).name})`
      : (this.lessonData as SpecialRuleData).title;
    const badge = this.lessonData.badge;

    this.container.innerHTML = `
      <div class="lesson-view-container">
        <!-- Breadcrumb & Top Bar -->
        <div class="lesson-top-bar">
          <div class="lesson-breadcrumbs">
            <a href="#/rules" class="breadcrumb-link">规则</a>
            <span class="breadcrumb-separator">/</span>
            <a href="${backRoute}" class="breadcrumb-link">${isPiece ? '基础走法' : '特殊规则'}</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">${title}</span>
          </div>

          <a href="${backRoute}" class="btn btn-secondary btn-sm">
            <i data-lucide="arrow-left" class="icon"></i>
            ${backText}
          </a>
        </div>

        <!-- Main 2-Column Responsive Workspace -->
        <div class="lesson-workspace-grid">
          <!-- Left Column: Board & Board Controls -->
          <div class="lesson-board-column">
            <div class="lesson-board-card card">
              <div id="lesson-chessground-container" class="cg-board-square"></div>
            </div>

            <!-- Board Toolbar -->
            <div class="lesson-board-controls">
              <button id="btn-lesson-flip" class="btn btn-secondary btn-sm" title="翻转棋盘">
                <i data-lucide="refresh-cw" class="icon"></i>
                翻转
              </button>
              <button id="btn-lesson-retry" class="btn btn-secondary btn-sm" title="重新开始本关">
                <i data-lucide="rotate-ccw" class="icon"></i>
                重开
              </button>
              <button id="btn-lesson-hint" class="btn btn-outline btn-sm" title="查看提示">
                <i data-lucide="help-circle" class="icon"></i>
                提示
              </button>
              <div style="margin-left: auto; display: flex; gap: var(--space-2);">
                <button id="btn-lesson-prev" class="btn btn-secondary btn-sm">
                  <i data-lucide="chevron-left" class="icon"></i>
                  上一关
                </button>
                <button id="btn-lesson-next" class="btn btn-primary btn-sm">
                  下一关
                  <i data-lucide="chevron-right" class="icon"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column: Lesson Content & Guidance -->
          <div class="lesson-info-column">
            <!-- Header Card -->
            <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
                <span class="badge badge-accent">${badge}</span>
                <span id="lesson-step-indicator" class="lesson-step-pill">关卡 1 / 4</span>
              </div>
              <h2 id="lesson-level-title" style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-primary); margin-bottom: var(--space-1);">
                关卡加载中...
              </h2>
              <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">
                ${this.lessonData.shortDesc}
              </p>
            </div>

            <!-- Current Level Task Card -->
            <div class="card lesson-task-card" style="padding: var(--space-5); margin-bottom: var(--space-4);">
              <div class="card-eyebrow" style="margin-bottom: var(--space-2); display: flex; align-items: center; gap: 6px;">
                <i data-lucide="target" class="icon" style="width: 14px; height: 14px;"></i>
                当前任务目标
              </div>
              <p id="lesson-instruction" style="font-size: 1rem; color: var(--text-main); line-height: 1.6; font-weight: 500; margin-bottom: var(--space-3);">
                请根据规则走子。
              </p>

              <!-- Feedback / Message Banner -->
              <div id="lesson-feedback-banner" class="lesson-feedback-banner" style="display: none;"></div>

              <!-- Collapsible Hint Box -->
              <div id="lesson-hint-box" class="lesson-hint-box" style="display: none;">
                <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--color-accent); margin-bottom: 4px;">
                  <i data-lucide="lightbulb" class="icon" style="width: 16px; height: 16px;"></i>
                  过关提示
                </div>
                <p id="lesson-hint-text" style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; margin: 0;"></p>
              </div>
            </div>

            <!-- Tactical Knowledge Box (for pieces) -->
            ${
              isPiece
                ? `
              <div class="card" style="padding: var(--space-4); border-left: 3px solid var(--color-accent); background-color: var(--bg-surface-subtle); margin-bottom: var(--space-4);">
                <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.9rem; color: var(--color-primary); margin-bottom: var(--space-2);">
                  <i data-lucide="sparkles" class="icon" style="width: 16px; height: 16px; color: var(--color-accent);"></i>
                  棋子实战精要
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
                  <ul style="padding-left: 1.2rem; margin: 0 0 6px 0;">
                    ${((this.lessonData as PieceLessonData).pieceTips?.keyPoints || [])
                      .map((d) => `<li>${d}</li>`)
                      .join('')}
                  </ul>
                  <div style="font-size: 0.8rem; color: var(--color-accent); font-weight: 500;">
                    ${(this.lessonData as PieceLessonData).pieceTips?.summary || ''}
                  </div>
                </div>
              </div>
            `
                : `
              <div class="card" style="padding: var(--space-4); border-left: 3px solid var(--color-accent); background-color: var(--bg-surface-subtle); margin-bottom: var(--space-4);">
                <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.9rem; color: var(--color-primary); margin-bottom: var(--space-2);">
                  <i data-lucide="info" class="icon" style="width: 16px; height: 16px; color: var(--color-accent);"></i>
                  规则触发核心条件
                </div>
                <ul style="font-size: 0.85rem; color: var(--text-muted); padding-left: 1.2rem; margin: 0; line-height: 1.6;">
                  ${(this.lessonData as SpecialRuleData).conditionList
                    .map((c) => `<li>${c}</li>`)
                    .join('')}
                </ul>
              </div>
            `
            }

            <!-- All Levels Quick Selector -->
            <div class="card" style="padding: var(--space-4);">
              <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-2);">
                关卡导航
              </div>
              <div id="lesson-level-pills" class="lesson-level-pills"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.boardEl = document.getElementById('lesson-chessground-container');
    if (!this.boardEl) return;

    this.controller = new LessonController(
      this.lessonData,
      this.boardEl,
      (state) => this.updateUI(state)
    );

    this.bindEvents();
    initIcons(this.container);
  }

  private bindEvents(): void {
    const btnFlip = document.getElementById('btn-lesson-flip');
    const btnRetry = document.getElementById('btn-lesson-retry');
    const btnHint = document.getElementById('btn-lesson-hint');
    const btnPrev = document.getElementById('btn-lesson-prev');
    const btnNext = document.getElementById('btn-lesson-next');

    btnFlip?.addEventListener('click', () => this.controller?.toggleBoardOrientation());
    btnRetry?.addEventListener('click', () => this.controller?.retryLevel());
    btnHint?.addEventListener('click', () => this.controller?.toggleHint());
    btnPrev?.addEventListener('click', () => this.controller?.prevLevel());
    btnNext?.addEventListener('click', () => this.controller?.nextLevel());
  }

  private updateUI(state: LessonState): void {
    const levelTitle = document.getElementById('lesson-level-title');
    const stepIndicator = document.getElementById('lesson-step-indicator');
    const instruction = document.getElementById('lesson-instruction');
    const feedbackBanner = document.getElementById('lesson-feedback-banner');
    const hintBox = document.getElementById('lesson-hint-box');
    const hintText = document.getElementById('lesson-hint-text');
    const levelPills = document.getElementById('lesson-level-pills');
    const btnPrev = document.getElementById('btn-lesson-prev') as HTMLButtonElement | null;
    const btnNext = document.getElementById('btn-lesson-next') as HTMLButtonElement | null;

    if (levelTitle) levelTitle.innerText = state.currentLevel.title;
    if (stepIndicator) {
      stepIndicator.innerText = `关卡 ${state.levelIndex + 1} / ${state.totalLevels}`;
    }
    if (instruction) instruction.innerText = state.currentLevel.instruction;

    // Hint box update
    if (hintBox && hintText) {
      hintText.innerText = state.currentLevel.hint;
      hintBox.style.display = state.hintRevealed ? 'block' : 'none';
    }

    // Feedback banner update
    if (feedbackBanner) {
      if (state.message) {
        feedbackBanner.style.display = 'block';
        feedbackBanner.className = `lesson-feedback-banner ${
          state.messageType === 'success'
            ? 'banner-success'
            : state.messageType === 'error'
            ? 'banner-error'
            : 'banner-info'
        }`;
        feedbackBanner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>${state.message}</span>
            ${
              state.isLevelPassed && state.levelIndex < state.totalLevels - 1
                ? `<button id="btn-banner-next" class="btn btn-accent btn-sm" style="margin-left: auto;">进入下一关 <i data-lucide="arrow-right" class="icon"></i></button>`
                : ''
            }
          </div>
        `;
        const bannerNext = document.getElementById('btn-banner-next');
        bannerNext?.addEventListener('click', () => this.controller?.nextLevel());
      } else {
        feedbackBanner.style.display = 'none';
      }
    }

    // Prev / Next button states
    if (btnPrev) {
      btnPrev.disabled = state.levelIndex === 0;
    }
    if (btnNext) {
      btnNext.disabled = state.levelIndex === state.totalLevels - 1 && !state.isLevelPassed;
      if (state.isLevelPassed) {
        btnNext.className = 'btn btn-accent btn-sm';
      } else {
        btnNext.className = 'btn btn-primary btn-sm';
      }
    }

    // Level Pills
    if (levelPills) {
      levelPills.innerHTML = '';
      for (let i = 0; i < state.totalLevels; i++) {
        const pill = document.createElement('button');
        pill.className = `lesson-pill-btn ${i === state.levelIndex ? 'active' : ''}`;
        pill.innerText = `第 ${i + 1} 关`;
        pill.addEventListener('click', () => {
          this.controller?.setLevel(i);
        });
        levelPills.appendChild(pill);
      }
    }

    initIcons(this.container);
  }

  public destroy(): void {
    if (this.controller) {
      this.controller.destroy();
      this.controller = null;
    }
  }
}
