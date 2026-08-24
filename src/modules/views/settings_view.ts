import { initIcons } from '../../utils/icons';
import { settingsManager } from '../../utils/settings_manager';
import type { BoardTheme, AnimationSpeed } from '../../utils/settings_manager';
import type { EngineDifficulty } from '../../types/engine_types';
import { soundPlayer } from '../../lib/sound_player';
import pkg from '../../../package.json';

export function renderSettingsView(container: HTMLElement): void {
  const currentSettings = settingsManager.getSettings();
  const appVersion = pkg.version || '0.1.9';

  container.innerHTML = `
    <div class="settings-view-container">
      <div class="settings-header" style="margin-bottom: var(--space-6);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <h1 style="font-size: 2rem; margin-bottom: var(--space-2); color: var(--color-primary);">设置</h1>
            <p style="color: var(--text-muted); font-size: 1rem;">
              外观、音效与对弈偏好
            </p>
          </div>
          <button id="btn-reset-settings" class="btn btn-outline btn-sm" title="恢复默认设置">
            <i data-lucide="rotate-ccw" class="icon"></i>
            恢复默认
          </button>
        </div>
      </div>

      <div class="settings-grid" style="display: flex; flex-direction: column; gap: var(--space-6);">
        
        <!-- Section 1: Appearance & Board Theme -->
        <div class="card settings-card" style="padding: var(--space-6);">
          <div class="card-eyebrow" style="margin-bottom: var(--space-2);">外观</div>

          <div style="margin-bottom: var(--space-6);">
            <label style="display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-main); margin-bottom: var(--space-3);">
              外观模式
            </label>
            <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
              <button class="mode-toggle-btn ${currentSettings.themeMode === 'light' ? 'active' : ''}" data-theme-mode="light">浅色</button>
              <button class="mode-toggle-btn ${currentSettings.themeMode === 'dark' ? 'active' : ''}" data-theme-mode="dark">深色</button>
              <button class="mode-toggle-btn ${currentSettings.themeMode === 'system' ? 'active' : ''}" data-theme-mode="system">跟随系统</button>
            </div>
          </div>

          <h2 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-primary); margin-bottom: var(--space-4);">
            棋盘与坐标
          </h2>

          <div style="margin-bottom: var(--space-6);">
            <label style="display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-main); margin-bottom: var(--space-3);">
              棋盘配色
            </label>
            <div class="theme-options-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4);">
              
              <!-- Wood Theme -->
              <div class="theme-card ${currentSettings.boardTheme === 'wood' ? 'active' : ''}" data-theme="wood">
                <div class="theme-mini-board" style="background-color: #F0D9B5;">
                  <div class="mini-sq mini-sq-dark" style="background-color: #B58863;"></div>
                  <div class="mini-sq mini-sq-light" style="background-color: #F0D9B5;"></div>
                  <div class="mini-sq mini-sq-light" style="background-color: #F0D9B5;"></div>
                  <div class="mini-sq mini-sq-dark" style="background-color: #B58863;"></div>
                </div>
                <div class="theme-card-info">
                  <div class="theme-card-title">经典木纹</div>
                  <div class="theme-card-desc">枫木与胡桃木（默认）</div>
                </div>
              </div>

              <!-- Slate Blue Theme -->
              <div class="theme-card ${currentSettings.boardTheme === 'blue' ? 'active' : ''}" data-theme="blue">
                <div class="theme-mini-board" style="background-color: #DEE3E6;">
                  <div class="mini-sq mini-sq-dark" style="background-color: #8CA2AD;"></div>
                  <div class="mini-sq mini-sq-light" style="background-color: #DEE3E6;"></div>
                  <div class="mini-sq mini-sq-light" style="background-color: #DEE3E6;"></div>
                  <div class="mini-sq mini-sq-dark" style="background-color: #8CA2AD;"></div>
                </div>
                <div class="theme-card-info">
                  <div class="theme-card-title">石板蓝</div>
                  <div class="theme-card-desc">冷灰与石板蓝</div>
                </div>
              </div>

              <!-- Forest Green Theme -->
              <div class="theme-card ${currentSettings.boardTheme === 'green' ? 'active' : ''}" data-theme="green">
                <div class="theme-mini-board" style="background-color: #FFFFDD;">
                  <div class="mini-sq mini-sq-dark" style="background-color: #86A666;"></div>
                  <div class="mini-sq mini-sq-light" style="background-color: #FFFFDD;"></div>
                  <div class="mini-sq mini-sq-light" style="background-color: #FFFFDD;"></div>
                  <div class="mini-sq mini-sq-dark" style="background-color: #86A666;"></div>
                </div>
                <div class="theme-card-info">
                  <div class="theme-card-title">森林绿</div>
                  <div class="theme-card-desc">暖黄与草木绿</div>
                </div>
              </div>

              <!-- Charcoal Classic Theme -->
              <div class="theme-card ${currentSettings.boardTheme === 'classic' ? 'active' : ''}" data-theme="classic">
                <div class="theme-mini-board" style="background-color: #ECECEC;">
                  <div class="mini-sq mini-sq-dark" style="background-color: #556270;"></div>
                  <div class="mini-sq mini-sq-light" style="background-color: #ECECEC;"></div>
                  <div class="mini-sq mini-sq-light" style="background-color: #ECECEC;"></div>
                  <div class="mini-sq mini-sq-dark" style="background-color: #556270;"></div>
                </div>
                <div class="theme-card-info">
                  <div class="theme-card-title">简约灰</div>
                  <div class="theme-card-desc">极简素雅灰</div>
                </div>
              </div>

            </div>
          </div>

          <!-- Coordinate Display Setting -->
          <div class="setting-item-row" style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-light); padding-top: var(--space-4);">
            <div>
              <div style="font-weight: 600; font-size: 0.95rem; color: var(--color-primary); margin-bottom: 2px;">
                棋盘坐标
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                棋盘边缘显示字母 (a-h) 与数字 (1-8)
              </div>
            </div>
            <label class="switch" title="显示棋盘坐标">
              <input type="checkbox" id="switch-coords" ${currentSettings.showCoordinates ? 'checked' : ''} />
              <span class="switch-track"><span class="switch-thumb"></span></span>
            </label>
          </div>
        </div>

        <!-- Section 2: Sound & Audio Feedback -->
        <div class="card settings-card" style="padding: var(--space-6);">
          <div class="card-eyebrow" style="margin-bottom: var(--space-2);">声音</div>
          <h2 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-primary); margin-bottom: var(--space-4);">
            落子音效
          </h2>

          <div class="setting-item-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
            <div>
              <div style="font-weight: 600; font-size: 0.95rem; color: var(--color-primary); margin-bottom: 2px;">
                走棋音效
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                合成棋类音效
              </div>
            </div>
            <label class="switch" title="走棋音效">
              <input type="checkbox" id="switch-sound" ${!currentSettings.soundMuted ? 'checked' : ''} />
              <span class="switch-track"><span class="switch-thumb"></span></span>
            </label>
          </div>

          <!-- Volume Slider -->
          <div class="setting-item-row" style="border-top: 1px solid var(--border-light); padding-top: var(--space-4); margin-bottom: var(--space-4);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
              <span style="font-weight: 600; font-size: 0.9rem; color: var(--color-primary);">音量</span>
              <span id="volume-val-label" style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-accent); font-weight: 600;">
                ${Math.round(currentSettings.soundVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              id="setting-volume-slider"
              min="0"
              max="100"
              value="${Math.round(currentSettings.soundVolume * 100)}"
              style="width: 100%; accent-color: var(--color-accent); cursor: pointer;"
            />
          </div>

          <!-- Audio Test Buttons -->
          <div style="border-top: 1px solid var(--border-light); padding-top: var(--space-4);">
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: var(--space-2);">
              音效试听
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
              <button class="btn btn-secondary btn-sm sound-test-btn" data-sound="move">
                <i data-lucide="play" class="icon" style="width: 13px; height: 13px;"></i>
                走子
              </button>
              <button class="btn btn-secondary btn-sm sound-test-btn" data-sound="capture">
                <i data-lucide="zap" class="icon" style="width: 13px; height: 13px;"></i>
                吃子
              </button>
              <button class="btn btn-secondary btn-sm sound-test-btn" data-sound="check">
                <i data-lucide="alert-triangle" class="icon" style="width: 13px; height: 13px;"></i>
                将军
              </button>
              <button class="btn btn-secondary btn-sm sound-test-btn" data-sound="promote">
                <i data-lucide="sparkles" class="icon" style="width: 13px; height: 13px;"></i>
                升变
              </button>
              <button class="btn btn-secondary btn-sm sound-test-btn" data-sound="gameEnd">
                <i data-lucide="trophy" class="icon" style="width: 13px; height: 13px;"></i>
                终局
              </button>
            </div>
          </div>
        </div>

        <!-- Section 3: Gameplay Preferences -->
        <div class="card settings-card" style="padding: var(--space-6);">
          <div class="card-eyebrow" style="margin-bottom: var(--space-2);">对弈偏好</div>
          <h2 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-primary); margin-bottom: var(--space-4);">
            动画与难度
          </h2>

          <!-- Animation Speed -->
          <div class="setting-item-row" style="margin-bottom: var(--space-5);">
            <div style="margin-bottom: var(--space-2);">
              <div style="font-weight: 600; font-size: 0.95rem; color: var(--color-primary);">动画速度</div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                棋子移动过渡时长
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2);">
              <button class="speed-btn ${currentSettings.animationSpeed === 'slow' ? 'active' : ''}" data-speed="slow">
                <div style="font-weight: 600; font-size: 0.9rem;">慢速 (350ms)</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">适合观察轨迹</div>
              </button>
              <button class="speed-btn ${currentSettings.animationSpeed === 'standard' ? 'active' : ''}" data-speed="standard">
                <div style="font-weight: 600; font-size: 0.9rem;">标准 (200ms)</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">顺滑平衡（默认）</div>
              </button>
              <button class="speed-btn ${currentSettings.animationSpeed === 'fast' ? 'active' : ''}" data-speed="fast">
                <div style="font-weight: 600; font-size: 0.9rem;">极速 (80ms)</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">适合快速解谜</div>
              </button>
            </div>
          </div>

          <!-- Default AI Difficulty -->
          <div class="setting-item-row" style="border-top: 1px solid var(--border-light); padding-top: var(--space-4);">
            <div style="margin-bottom: var(--space-2);">
              <div style="font-weight: 600; font-size: 0.95rem; color: var(--color-primary);">默认 AI 难度</div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                人机对弈默认 Stockfish 难度
              </div>
            </div>
            <div class="difficulty-grid">
              <button class="difficulty-btn ${currentSettings.defaultAiDifficulty === 'beginner' ? 'active' : ''}" data-diff="beginner">
                <span class="difficulty-title" style="display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="sprout" class="icon" style="color: #15803d; width: 15px; height: 15px;"></i>
                  入门
                </span>
                <span class="difficulty-sub">~800 Elo · 深度 2</span>
              </button>
              <button class="difficulty-btn ${currentSettings.defaultAiDifficulty === 'novice' ? 'active' : ''}" data-diff="novice">
                <span class="difficulty-title" style="display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="swords" class="icon" style="color: var(--color-accent); width: 15px; height: 15px;"></i>
                  初级
                </span>
                <span class="difficulty-sub">~1300 Elo · 深度 6</span>
              </button>
              <button class="difficulty-btn ${currentSettings.defaultAiDifficulty === 'intermediate' ? 'active' : ''}" data-diff="intermediate">
                <span class="difficulty-title" style="display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="shield" class="icon" style="color: #2563eb; width: 15px; height: 15px;"></i>
                  中级
                </span>
                <span class="difficulty-sub">~1800 Elo · 深度 10</span>
              </button>
              <button class="difficulty-btn ${currentSettings.defaultAiDifficulty === 'advanced' ? 'active' : ''}" data-diff="advanced">
                <span class="difficulty-title" style="display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="crown" class="icon" style="color: #d97706; width: 15px; height: 15px;"></i>
                  高级
                </span>
                <span class="difficulty-sub">~2500+ Elo · 深度 16</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Section 4: About -->
        <div class="card settings-card" style="padding: var(--space-6);">
          <div class="card-eyebrow" style="margin-bottom: var(--space-2);">关于</div>
          <div style="display: flex; align-items: center; gap: var(--space-4); margin-top: var(--space-2);">
            <img src="${import.meta.env.BASE_URL}assets/logo/logo.png" alt="应用 Logo" style="width: 56px; height: 56px; border-radius: var(--radius-md, 12px); object-fit: contain; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />
            <div>
              <h2 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-primary); margin: 0 0 var(--space-1) 0;">
                国际象棋研习
              </h2>
              <div style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 2px;">
                版本 v${appVersion}
              </div>
              <div style="font-size: 0.82rem; color: var(--text-muted);">
                纯前端 · Stockfish 引擎 · 离线可用
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Feedback Toast Banner -->
      <div id="settings-toast" class="settings-toast-banner" style="display: none;">
        <i data-lucide="check-circle" class="icon" style="color: var(--color-success);"></i>
        <span id="settings-toast-msg">设置已更新</span>
      </div>
    </div>
  `;

  initIcons(container);
  bindSettingsEvents(container);
}

function showToast(container: HTMLElement, message: string): void {
  const toast = container.querySelector<HTMLElement>('#settings-toast');
  const msgEl = container.querySelector<HTMLElement>('#settings-toast-msg');
  if (toast && msgEl) {
    msgEl.textContent = message;
    toast.style.display = 'flex';
    setTimeout(() => {
      if (toast) toast.style.display = 'none';
    }, 2000);
  }
}

function bindSettingsEvents(container: HTMLElement): void {
  // 0. Theme Mode (light / dark / system)
  const modeBtns = container.querySelectorAll<HTMLElement>('[data-theme-mode]');
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-theme-mode') as 'light' | 'dark' | 'system';
      if (mode) {
        settingsManager.setThemeMode(mode);
        modeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const label = mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '跟随系统';
        showToast(container, `界面外观模式已切换: ${label}`);
      }
    });
  });

  // 1. Theme Selection
  const themeCards = container.querySelectorAll<HTMLElement>('.theme-card');
  themeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const theme = card.getAttribute('data-theme') as BoardTheme;
      if (theme) {
        settingsManager.setBoardTheme(theme);
        themeCards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        showToast(container, `棋盘主题已切换为: ${getThemeNameZh(theme)}`);
      }
    });
  });

  // 2. Coordinate Switch
  const switchCoords = container.querySelector<HTMLInputElement>('#switch-coords');

  switchCoords?.addEventListener('change', () => {
    const on = switchCoords.checked;
    settingsManager.setShowCoordinates(on);
    showToast(container, on ? '棋盘坐标已设置为显示' : '棋盘坐标已设置为隐藏');
  });

  // 3. Sound Switch
  const switchSound = container.querySelector<HTMLInputElement>('#switch-sound');

  switchSound?.addEventListener('change', () => {
    const on = switchSound.checked;
    settingsManager.setSoundMuted(!on);
    if (on) {
      soundPlayer.play('move');
    }
    showToast(container, on ? '音效已开启' : '音效已静音');
  });

  // 4. Volume Slider
  const slider = container.querySelector<HTMLInputElement>('#setting-volume-slider');
  const volLabel = container.querySelector<HTMLElement>('#volume-val-label');

  slider?.addEventListener('input', () => {
    const val = parseInt(slider.value, 10) || 0;
    const vol = val / 100;
    if (volLabel) volLabel.textContent = `${val}%`;
    settingsManager.setSoundVolume(vol);
  });

  slider?.addEventListener('change', () => {
    soundPlayer.play('move');
  });

  // 5. Sound Test Buttons
  const testBtns = container.querySelectorAll<HTMLElement>('.sound-test-btn');
  testBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const effect = btn.getAttribute('data-sound');
      if (effect) {
        soundPlayer.play(effect as any);
      }
    });
  });

  // 6. Animation Speed
  const speedBtns = container.querySelectorAll<HTMLElement>('.speed-btn');
  speedBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const speed = btn.getAttribute('data-speed') as AnimationSpeed;
      if (speed) {
        settingsManager.setAnimationSpeed(speed);
        speedBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        showToast(container, `动画速度已更新为: ${getSpeedNameZh(speed)}`);
      }
    });
  });

  // 7. Default AI Difficulty
  const diffBtns = container.querySelectorAll<HTMLElement>('.difficulty-btn');
  diffBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const diff = btn.getAttribute('data-diff') as EngineDifficulty;
      if (diff) {
        settingsManager.setDefaultAiDifficulty(diff);
        diffBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        showToast(container, `默认 AI 难度已更新为: ${getDifficultyNameZh(diff)}`);
      }
    });
  });

  // 8. Reset Button
  const btnReset = container.querySelector<HTMLButtonElement>('#btn-reset-settings');
  btnReset?.addEventListener('click', () => {
    settingsManager.resetDefaults();
    renderSettingsView(container);
    showToast(container, '所有设置已恢复为初始默认值');
  });
}

function getThemeNameZh(theme: BoardTheme): string {
  switch (theme) {
    case 'wood': return '经典木纹';
    case 'blue': return '石板蓝';
    case 'green': return '森林绿';
    case 'classic': return '简约灰';
  }
}

function getSpeedNameZh(speed: AnimationSpeed): string {
  switch (speed) {
    case 'slow': return '慢速 (350ms)';
    case 'fast': return '极速 (80ms)';
    case 'standard': return '标准 (200ms)';
  }
}

function getDifficultyNameZh(diff: EngineDifficulty): string {
  switch (diff) {
    case 'beginner': return '入门 (~800 Elo)';
    case 'novice': return '初级 (~1300 Elo)';
    case 'intermediate': return '中级 (~1800 Elo)';
    case 'advanced': return '高级 (~2500+ Elo)';
  }
}
