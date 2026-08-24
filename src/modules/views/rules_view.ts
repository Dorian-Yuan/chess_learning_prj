import pieceLessons from '../../data/piece_lessons.json';
import specialRules from '../../data/special_rules.json';
import type { PieceLessonData, SpecialRuleData } from '../../types/lesson_types';
import { LessonUI } from '../lesson_viewer/lesson_ui';
import { initIcons } from '../../utils/icons';

let currentLessonUI: LessonUI | null = null;

export function renderRulesView(
  container: HTMLElement,
  subRoute: 'pieces' | 'specials' = 'pieces',
  targetId?: string
): void {
  // Clean up any active lesson UI instance
  if (currentLessonUI) {
    currentLessonUI.destroy();
    currentLessonUI = null;
  }

  // Parse URL query params if any (e.g. ?piece=knight or ?rule=castling)
  const currentHash = window.location.hash;
  let activeId = targetId;

  if (!activeId && currentHash.includes('?')) {
    const queryString = currentHash.split('?')[1];
    const params = new URLSearchParams(queryString);
    activeId = params.get('piece') || params.get('rule') || undefined;
  }

  // If a specific lesson is requested, render the interactive Lesson Viewer directly!
  if (activeId) {
    if (subRoute === 'pieces') {
      const pieceData = (pieceLessons as PieceLessonData[]).find((p) => p.id === activeId);
      if (pieceData) {
        currentLessonUI = new LessonUI(container, pieceData);
        return;
      }
    } else {
      const specialData = (specialRules as SpecialRuleData[]).find((s) => s.id === activeId);
      if (specialData) {
        currentLessonUI = new LessonUI(container, specialData);
        return;
      }
    }
  }

  // Otherwise, render the standard cards directory
  const isPieces = subRoute === 'pieces';

  // Read progress from localStorage
  let progress: Record<string, number> = {};
  try {
    const stored = localStorage.getItem('chess_learned_progress');
    if (stored) progress = JSON.parse(stored);
  } catch {}

  container.innerHTML = `
    <div>
      <div style="margin-bottom: var(--space-6);">
        <h1 style="font-size: 2rem; margin-bottom: var(--space-2);">国际象棋规则</h1>
        <p style="color: var(--text-muted); font-size: 1rem;">
          6 大棋子走法与 5 项特殊规则实操
        </p>
      </div>

      <!-- Sub Navigation Tabs -->
      <div class="sub-nav">
        <a href="#/rules/pieces" class="sub-nav-item ${isPieces ? 'active' : ''}">
          <i data-lucide="shield" class="icon" style="display: inline-block; vertical-align: middle; margin-right: 4px; width: 16px; height: 16px;"></i>
          基础走法 (6 大棋子)
        </a>
        <a href="#/rules/specials" class="sub-nav-item ${!isPieces ? 'active' : ''}">
          <i data-lucide="crown" class="icon" style="display: inline-block; vertical-align: middle; margin-right: 4px; width: 16px; height: 16px;"></i>
          特殊规则 (5 大专题)
        </a>
      </div>

      <!-- Content Grid -->
      <div class="rules-grid">
        ${
          isPieces
            ? (pieceLessons as PieceLessonData[])
                .map((piece) => {
                  const completedCount = progress[piece.id] || 0;
                  const totalCount = piece.levels.length;
                  const isDone = completedCount >= totalCount;

                  return `
                    <div class="card card-interactive piece-rule-card" data-piece-id="${piece.id}">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
                        <span class="card-eyebrow" style="margin: 0;">代号: ${piece.symbol} · 分值: ${piece.pieceValue}</span>
                        <span class="badge ${isDone ? 'badge-success' : completedCount > 0 ? 'badge-accent' : 'badge-muted'}">
                          ${isDone ? '已通关' : completedCount > 0 ? `进行中 ${completedCount}/${totalCount}` : '未开始'}
                        </span>
                      </div>

                      <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
                        <div class="piece-avatar-box">
                          <i data-lucide="${piece.icon}" class="icon" style="width: 24px; height: 24px; color: var(--color-accent);"></i>
                        </div>
                        <div>
                          <h3 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-primary); margin: 0;">
                            ${piece.nameZh}
                          </h3>
                          <span style="font-size: 0.85rem; color: var(--text-tertiary);">${piece.name}</span>
                        </div>
                      </div>

                      <p class="card-desc" style="font-size: 0.88rem; margin-bottom: var(--space-3);">
                        ${piece.shortDesc}
                      </p>

                      <!-- Tactical tip pill -->
                      <div class="rule-tip-pill" style="margin-bottom: var(--space-4);">
                        <span style="font-weight: 600; color: var(--color-accent); font-size: 0.8rem;">战术要点:</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${piece.pieceTips?.summary || piece.shortDesc}</span>
                      </div>

                      <div class="card-footer">
                        <span>共 ${totalCount} 关</span>
                        <button class="btn btn-primary btn-sm btn-start-lesson" data-piece-id="${piece.id}">
                          开始学习
                          <i data-lucide="arrow-right" class="icon"></i>
                        </button>
                      </div>
                    </div>
                  `;
                })
                .join('')
            : (specialRules as SpecialRuleData[])
                .map((rule) => {
                  const completedCount = progress[rule.id] || 0;
                  const totalCount = rule.levels.length;
                  const isDone = completedCount >= totalCount;

                  return `
                    <div class="card card-interactive special-rule-card" data-rule-id="${rule.id}">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
                        <span class="badge badge-accent">${rule.badge}</span>
                        <span class="badge ${isDone ? 'badge-success' : completedCount > 0 ? 'badge-accent' : 'badge-muted'}">
                          ${isDone ? '已通关' : completedCount > 0 ? `进行中 ${completedCount}/${totalCount}` : '未开始'}
                        </span>
                      </div>

                      <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
                        <div class="piece-avatar-box">
                          <i data-lucide="${rule.icon}" class="icon" style="width: 24px; height: 24px; color: var(--color-accent);"></i>
                        </div>
                        <div>
                          <h3 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-primary); margin: 0;">
                            ${rule.title}
                          </h3>
                          <span style="font-size: 0.85rem; color: var(--text-tertiary);">${rule.titleEn}</span>
                        </div>
                      </div>

                      <p class="card-desc" style="font-size: 0.88rem; margin-bottom: var(--space-3);">
                        ${rule.shortDesc}
                      </p>

                      <div class="rule-tip-pill" style="margin-bottom: var(--space-4);">
                        <span style="font-weight: 600; color: var(--color-accent); font-size: 0.8rem;">触发要点:</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${rule.conditionList[0]}</span>
                      </div>

                      <div class="card-footer">
                        <span>共 ${totalCount} 关</span>
                        <button class="btn btn-primary btn-sm btn-start-special" data-rule-id="${rule.id}">
                          专项训练
                          <i data-lucide="arrow-right" class="icon"></i>
                        </button>
                      </div>
                    </div>
                  `;
                })
                .join('')
        }
      </div>
    </div>
  `;

  // Attach card click handlers
  if (isPieces) {
    container.querySelectorAll('.piece-rule-card').forEach((card) => {
      const pieceId = card.getAttribute('data-piece-id');
      card.addEventListener('click', (e) => {
        // Avoid double trigger if button was clicked
        if ((e.target as HTMLElement).closest('.btn-start-lesson')) return;
        if (pieceId) {
          window.location.hash = `#/rules/pieces?piece=${pieceId}`;
        }
      });
    });

    container.querySelectorAll('.btn-start-lesson').forEach((btn) => {
      const pieceId = btn.getAttribute('data-piece-id');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pieceId) {
          window.location.hash = `#/rules/pieces?piece=${pieceId}`;
        }
      });
    });
  } else {
    container.querySelectorAll('.special-rule-card').forEach((card) => {
      const ruleId = card.getAttribute('data-rule-id');
      card.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.btn-start-special')) return;
        if (ruleId) {
          window.location.hash = `#/rules/specials?rule=${ruleId}`;
        }
      });
    });

    container.querySelectorAll('.btn-start-special').forEach((btn) => {
      const ruleId = btn.getAttribute('data-rule-id');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (ruleId) {
          window.location.hash = `#/rules/specials?rule=${ruleId}`;
        }
      });
    });
  }

  initIcons(container);
}
