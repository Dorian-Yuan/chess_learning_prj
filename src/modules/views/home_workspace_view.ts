import { PlayController, type PlayState, type GameOverResult, type HintInfo } from '../game_play/play_controller';
import { PgnModalUI } from '../game_play/pgn_modal_ui';
import { soundPlayer } from '../../lib/sound_player';
import { settingsManager } from '../../utils/settings_manager';
import { GameStorage, type SavedGameState } from '../../utils/game_storage';
import { PgnFormatter } from '../../utils/pgn_formatter';
import { initIcons } from '../../utils/icons';
import { DIFFICULTY_PRESETS, type EngineDifficulty } from '../../types/engine_types';

let activePlayController: PlayController | null = null;

export function renderHomeWorkspaceView(container: HTMLElement): void {
  // Clean up any existing controller
  if (activePlayController) {
    activePlayController.destroy();
    activePlayController = null;
  }

  const savedGame = GameStorage.loadSavedGame();

  if (savedGame) {
    renderResumeScreen(container, savedGame);
  } else {
    renderSetupScreen(container);
  }
}

// Backwards compatibility alias
export const renderPlayView = renderHomeWorkspaceView;

/**
 * Screen A: Resume Previous Game Banner
 */
function renderResumeScreen(container: HTMLElement, saved: SavedGameState): void {
  const preset = DIFFICULTY_PRESETS[saved.difficulty] || DIFFICULTY_PRESETS.intermediate;
  const colorName = saved.assignedColor === 'w' ? '执白 (先手)' : '执黑 (后手)';
  const turnName = saved.turn === 'w' ? '白方' : '黑方';
  const savedDate = new Date(saved.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const moveNum = Math.floor(saved.history.length / 2) + 1;

  container.innerHTML = `
    <div class="workbench-setup-wrap" style="max-width: 680px; margin: 0 auto;">
      <!-- Banner Card -->
      <div class="card" style="padding: var(--space-8); text-align: center; border-color: var(--color-accent); box-shadow: var(--shadow-card);">
        <div style="width: 64px; height: 64px; border-radius: var(--radius-pill); background: rgba(194, 155, 56, 0.15); border: 1px solid rgba(194, 155, 56, 0.35); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4) auto; color: var(--color-accent);">
          <i data-lucide="history" class="icon" style="width: 32px; height: 32px;"></i>
        </div>

        <div class="card-eyebrow" style="margin-bottom: var(--space-1);">对局恢复提醒</div>
        <h1 style="font-family: var(--font-serif); font-size: 1.85rem; color: var(--color-primary); margin-bottom: var(--space-2);">
          发现未完成的对局
        </h1>
        <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: var(--space-6);">
          系统检测到您此前有一局尚未结束的对弈快照，可一键恢复棋盘与完整走法记录继续对战。
        </p>

        <!-- Match Snapshot Details Summary -->
        <div class="grid grid-cols-2" style="gap: var(--space-3); margin-bottom: var(--space-6); text-align: left;">
          <div style="background: var(--bg-surface-subtle); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-light);">
            <div style="font-size: 0.78rem; color: var(--text-tertiary);">对战模式与难度</div>
            <div style="font-weight: 600; color: var(--color-primary); font-size: 0.92rem; margin-top: 2px;">
              ${saved.gameMode === 'vs_ai' ? `人机对弈 · ${preset.nameZh}` : '自由推演模式'}
            </div>
          </div>

          <div style="background: var(--bg-surface-subtle); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-light);">
            <div style="font-size: 0.78rem; color: var(--text-tertiary);">执子与当前局面</div>
            <div style="font-weight: 600; color: var(--color-primary); font-size: 0.92rem; margin-top: 2px;">
              ${colorName} · 轮到 ${turnName}
            </div>
          </div>

          <div style="background: var(--bg-surface-subtle); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-light);">
            <div style="font-size: 0.78rem; color: var(--text-tertiary);">对局进度</div>
            <div style="font-weight: 600; color: var(--color-primary); font-size: 0.92rem; margin-top: 2px;">
              第 ${moveNum} 回合 (${saved.history.length} 步走法)
            </div>
          </div>

          <div style="background: var(--bg-surface-subtle); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-light);">
            <div style="font-size: 0.78rem; color: var(--text-tertiary);">最后保存时间</div>
            <div style="font-weight: 600; color: var(--color-primary); font-size: 0.92rem; margin-top: 2px;">
              ${savedDate}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <button id="btn-resume-saved-game" class="btn btn-accent btn-lg" style="width: 100%;">
            <i data-lucide="play" class="icon"></i>
            继续上一局
          </button>
          <button id="btn-discard-saved-game" class="btn btn-outline btn-lg" style="width: 100%;">
            <i data-lucide="plus" class="icon"></i>
            放弃并开始新对局
          </button>
        </div>
      </div>
    </div>
  `;

  initIcons(container);

  container.querySelector('#btn-resume-saved-game')?.addEventListener('click', () => {
    renderActiveWorkbench(container, { resumeSaved: saved });
  });

  container.querySelector('#btn-discard-saved-game')?.addEventListener('click', () => {
    GameStorage.clearSavedGame();
    renderSetupScreen(container);
  });
}

/**
 * Screen B: New Game Setup Panel (待开局状态)
 */
function renderSetupScreen(container: HTMLElement): void {
  const defaultDiff = settingsManager.getDefaultAiDifficulty();
  let selectedMode: 'vs_ai' | 'free_play' = 'vs_ai';
  let selectedDifficulty: EngineDifficulty = defaultDiff;
  let selectedColor: 'white' | 'black' | 'random' = 'white';

  container.innerHTML = `
    <div class="workbench-setup-wrap" style="max-width: 720px; margin: 0 auto;">
      <!-- Title & Subtitle -->
      <div style="text-align: center; margin-bottom: var(--space-6);">
        <div class="card-eyebrow" style="margin-bottom: var(--space-1);">首页 / 对弈工作台</div>
        <h1 style="font-family: var(--font-serif); font-size: 2.2rem; color: var(--color-primary); margin-bottom: var(--space-2);">
          国际象棋对弈工作台
        </h1>
        <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 540px; margin: 0 auto; line-height: 1.6;">
          选择 AI 对弈难度或进入自由推演模式，搭载 Stockfish 17.1 智能引擎与实时评估分析。
        </p>
      </div>

      <!-- Setup Card -->
      <div class="card" style="padding: var(--space-6); box-shadow: var(--shadow-card);">
        <!-- Mode Switcher -->
        <div style="margin-bottom: var(--space-6);">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-bottom: var(--space-2);">
            选择对局模式
          </label>
          <div class="mode-toggle-container" style="display: flex; width: 100%;">
            <button id="setup-mode-ai" class="mode-toggle-btn active" style="flex: 1; justify-content: center; min-height: 42px;">
              <i data-lucide="bot" class="icon"></i>
              人机对弈模式 (VS Stockfish)
            </button>
            <button id="setup-mode-free" class="mode-toggle-btn" style="flex: 1; justify-content: center; min-height: 42px;">
              <i data-lucide="layout-grid" class="icon"></i>
              自由分析与推演模式
            </button>
          </div>
        </div>

        <!-- AI Difficulty Section -->
        <div id="setup-ai-section" style="margin-bottom: var(--space-6);">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-bottom: var(--space-2);">
            选择 AI 难度等级
          </label>
          <div class="difficulty-grid">
            <button class="difficulty-btn ${selectedDifficulty === 'beginner' ? 'active' : ''}" data-difficulty="beginner">
              <span class="difficulty-title" style="display: flex; align-items: center; gap: 6px;">
                <i data-lucide="sprout" class="icon" style="color: var(--color-success); width: 16px; height: 16px;"></i>
                入门
              </span>
              <span class="difficulty-sub">~800 Elo · 深度 2</span>
            </button>
            <button class="difficulty-btn ${selectedDifficulty === 'novice' ? 'active' : ''}" data-difficulty="novice">
              <span class="difficulty-title" style="display: flex; align-items: center; gap: 6px;">
                <i data-lucide="swords" class="icon" style="color: var(--color-accent); width: 16px; height: 16px;"></i>
                初级
              </span>
              <span class="difficulty-sub">~1300 Elo · 深度 6</span>
            </button>
            <button class="difficulty-btn ${selectedDifficulty === 'intermediate' ? 'active' : ''}" data-difficulty="intermediate">
              <span class="difficulty-title" style="display: flex; align-items: center; gap: 6px;">
                <i data-lucide="shield" class="icon" style="color: #3b82f6; width: 16px; height: 16px;"></i>
                中级
              </span>
              <span class="difficulty-sub">~1800 Elo · 深度 10</span>
            </button>
            <button class="difficulty-btn ${selectedDifficulty === 'advanced' ? 'active' : ''}" data-difficulty="advanced">
              <span class="difficulty-title" style="display: flex; align-items: center; gap: 6px;">
                <i data-lucide="crown" class="icon" style="color: #f59e0b; width: 16px; height: 16px;"></i>
                高级
              </span>
              <span class="difficulty-sub">~2500+ Elo · 深度 16</span>
            </button>
          </div>
        </div>

        <!-- Color Choice Section -->
        <div id="setup-color-section" style="margin-bottom: var(--space-8);">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-bottom: var(--space-2);">
            选择执子颜色
          </label>
          <div class="color-choice-group">
            <button class="color-choice-btn active" data-color="white">
              <i data-lucide="circle-dot" class="icon" style="width: 16px; height: 16px;"></i>
              执白 (先手)
            </button>
            <button class="color-choice-btn" data-color="black">
              <i data-lucide="circle" class="icon" style="width: 16px; height: 16px;"></i>
              执黑 (后手)
            </button>
            <button class="color-choice-btn" data-color="random">
              <i data-lucide="dices" class="icon" style="width: 16px; height: 16px;"></i>
              随机分配
            </button>
          </div>
        </div>

        <!-- Start Match CTA -->
        <button id="btn-start-workbench-match" class="btn btn-primary btn-lg" style="width: 100%; font-size: 1.05rem;">
          <i data-lucide="play" class="icon"></i>
          开始对局
        </button>
      </div>
    </div>
  `;

  initIcons(container);

  // Setup Event Listeners
  const modeAiBtn = container.querySelector('#setup-mode-ai');
  const modeFreeBtn = container.querySelector('#setup-mode-free');
  const aiSection = container.querySelector<HTMLElement>('#setup-ai-section');
  const colorSection = container.querySelector<HTMLElement>('#setup-color-section');

  modeAiBtn?.addEventListener('click', () => {
    selectedMode = 'vs_ai';
    modeAiBtn.classList.add('active');
    modeFreeBtn?.classList.remove('active');
    if (aiSection) aiSection.style.display = 'block';
    if (colorSection) colorSection.style.display = 'block';
  });

  modeFreeBtn?.addEventListener('click', () => {
    selectedMode = 'free_play';
    modeFreeBtn.classList.add('active');
    modeAiBtn?.classList.remove('active');
    if (aiSection) aiSection.style.display = 'none';
    if (colorSection) colorSection.style.display = 'none';
  });

  const diffBtns = container.querySelectorAll('.difficulty-btn');
  diffBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      diffBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.getAttribute('data-difficulty') as EngineDifficulty;
    });
  });

  const colorBtns = container.querySelectorAll('.color-choice-btn');
  colorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      colorBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = btn.getAttribute('data-color') as 'white' | 'black' | 'random';
    });
  });

  container.querySelector('#btn-start-workbench-match')?.addEventListener('click', () => {
    renderActiveWorkbench(container, {
      mode: selectedMode,
      difficulty: selectedDifficulty,
      playerColor: selectedColor,
    });
  });
}

/**
 * Screen C: Active Match Workbench (对局进行中)
 */
function renderActiveWorkbench(
  container: HTMLElement,
  options: {
    resumeSaved?: SavedGameState;
    mode?: 'vs_ai' | 'free_play';
    difficulty?: EngineDifficulty;
    playerColor?: 'white' | 'black' | 'random';
  }
): void {
  const isResume = !!options.resumeSaved;
  const initialMode = isResume ? options.resumeSaved!.gameMode : options.mode || 'vs_ai';
  const initialDiff = isResume ? options.resumeSaved!.difficulty : options.difficulty || 'intermediate';
  const initialColor = isResume ? options.resumeSaved!.playerColorChoice : options.playerColor || 'white';

  container.innerHTML = `
    <div class="play-view-container">
      <!-- Top Title & Navigation Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
        <div>
          <h1 style="font-size: 1.6rem; margin-bottom: 2px; color: var(--color-primary);">对弈工作台</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0;">
            Stockfish 引擎驱动 · 实时优势评估 · 自动保存对局
          </p>
        </div>

        <!-- Quick Match Actions -->
        <div style="display: flex; gap: var(--space-2); align-items: center;">
          <button id="btn-workbench-new-game" class="btn btn-secondary btn-sm" title="结束当前对局，重新开始或修改设置">
            <i data-lucide="plus" class="icon"></i>
            新对局 / 设置
          </button>
        </div>
      </div>

      <!-- Main Workbench Layout Grid -->
      <div class="play-workbench-grid">
        <!-- Left Column: Board + Eval Bar + Toolbar -->
        <div class="play-board-wrapper">
          <div class="card play-board-card">
            <div class="play-board-row">
              <!-- Evaluation Bar -->
              <div id="play-eval-bar-container"></div>

              <!-- Chessground Board -->
              <div id="play-chessground-container" class="cg-board-square"></div>
            </div>
          </div>

          <!-- Board Action Toolbar -->
          <div class="play-toolbar">
            <button id="btn-play-undo" class="btn btn-secondary btn-sm" title="悔棋（撤销走法）">
              <i data-lucide="rotate-ccw" class="icon"></i>
              悔棋
            </button>
            <button id="btn-play-hint" class="btn btn-accent btn-sm" title="请求 Stockfish 最佳走法建议">
              <i data-lucide="lightbulb" class="icon"></i>
              走法提示
            </button>
            <button id="btn-play-flip" class="btn btn-secondary btn-sm" title="翻转棋盘视角">
              <i data-lucide="refresh-cw" class="icon"></i>
              翻转
            </button>
            <button id="btn-play-sound" class="btn btn-secondary btn-sm" title="切换音效">
              <i data-lucide="${soundPlayer.getMuted() ? 'volume-x' : 'volume-2'}" class="icon" id="sound-icon"></i>
              <span id="sound-label">${soundPlayer.getMuted() ? '静音' : '音效'}</span>
            </button>
            <button id="btn-play-draw" class="btn btn-secondary btn-sm" title="向对手请求和棋">
              <i data-lucide="handshake" class="icon"></i>
              求和
            </button>
            <button id="btn-play-resign" class="btn btn-secondary btn-sm" title="认输本局">
              <i data-lucide="flag" class="icon"></i>
              认输
            </button>
          </div>

          <!-- Active Hint Message Box -->
          <div id="play-hint-box" class="hint-alert-box" style="display: none;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="sparkles" class="icon"></i>
              <span id="play-hint-text">Stockfish 建议走法: <strong>e4</strong></span>
            </div>
            <button id="btn-close-hint" class="btn btn-sm" style="padding: 2px 6px; background: transparent; border: none; color: inherit; cursor: pointer;">
              <i data-lucide="x" class="icon" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>

        <!-- Right Column: Match Status, Move History, Toolbox -->
        <div class="play-side-panel" style="display: flex; flex-direction: column;">
          <!-- Game Over Banner -->
          <div id="play-gameover-banner" class="game-over-banner" style="display: none;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
              <span id="gameover-title" style="font-size: 1.15rem; font-weight: 700;">对局结束</span>
              <span class="badge badge-accent" id="gameover-badge">MATCH OVER</span>
            </div>
            <p id="gameover-detail" style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: var(--space-3); line-height: 1.4;">
              恭喜获得胜利！
            </p>
            <div style="display: flex; gap: var(--space-2);">
              <button id="btn-gameover-rematch" class="btn btn-accent btn-sm" style="flex: 1;">
                <i data-lucide="play" class="icon"></i>
                再来一局
              </button>
              <button id="btn-gameover-export" class="btn btn-secondary btn-sm" style="flex: 1;">
                <i data-lucide="download" class="icon"></i>
                导出棋谱
              </button>
            </div>
          </div>

          <!-- Match Status Card -->
          <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
              <div class="card-eyebrow" style="margin: 0;" id="panel-mode-label">
                ${initialMode === 'vs_ai' ? '人机对弈 (VS STOCKFISH)' : '自由分析推演'}
              </div>
              <span id="ai-difficulty-badge" class="badge badge-accent" style="font-size: 0.75rem;">
                ${DIFFICY_BADGE_TEXT(initialDiff)}
              </span>
            </div>

            <div id="play-status-banner" class="play-status-banner banner-default" style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span id="status-pulse-dot" class="ai-pulse-dot" style="display: none;"></span>
                <span id="play-status-text" style="font-weight: 600;">白方走棋</span>
              </div>
              <span id="status-turn-badge" style="font-size: 0.78rem; color: var(--text-tertiary);">第 1 回合</span>
            </div>
          </div>

          <!-- Move History Table -->
          <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4); flex: 1; min-height: 200px; display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2); border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-2);">
              <span style="font-weight: 600; font-size: 0.9rem; color: var(--color-primary);">走法记录 (SAN)</span>
              <span id="play-move-count" style="font-size: 0.8rem; color: var(--text-tertiary);">0 步</span>
            </div>

            <div id="play-history-list" class="play-history-list" style="flex: 1;">
              <div style="color: var(--text-tertiary); font-size: 0.85rem; text-align: center; padding: var(--space-6) 0;">
                暂无走子记录，拖拽或点击棋子开始对弈
              </div>
            </div>
          </div>

          <!-- FEN / PGN Toolbox Card -->
          <div class="card" style="padding: var(--space-4);">
            <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-2);">
              <input
                type="text"
                id="play-fen-input"
                class="form-input"
                placeholder="输入 FEN 字符串加载局面..."
                style="font-family: var(--font-mono); font-size: 0.8rem; flex: 1;"
              />
              <button id="btn-play-load-fen" class="btn btn-secondary btn-sm">加载</button>
            </div>
            <div style="display: flex; gap: var(--space-2);">
              <button id="btn-play-copy-fen" class="btn btn-outline btn-sm" style="flex: 1;">
                <i data-lucide="copy" class="icon"></i>
                复制 FEN
              </button>
              <button id="btn-open-pgn-export" class="btn btn-secondary btn-sm" style="flex: 1;">
                <i data-lucide="download" class="icon"></i>
                导出 PGN
              </button>
              <button id="btn-open-pgn-import" class="btn btn-secondary btn-sm" style="flex: 1;">
                <i data-lucide="upload" class="icon"></i>
                导入 PGN
              </button>
            </div>
            <div id="fen-copy-feedback" style="font-size: 0.75rem; color: var(--color-success); margin-top: var(--space-1); display: none;">
              FEN 局面已复制到剪贴板！
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const boardContainer = document.getElementById('play-chessground-container');
  const evalBarContainer = document.getElementById('play-eval-bar-container');
  if (!boardContainer || !evalBarContainer) return;

  const statusText = document.getElementById('play-status-text');
  const statusBanner = document.getElementById('play-status-banner');
  const statusTurnBadge = document.getElementById('status-turn-badge');
  const statusPulseDot = document.getElementById('status-pulse-dot');
  const historyList = document.getElementById('play-history-list');
  const moveCount = document.getElementById('play-move-count');
  const fenInput = document.getElementById('play-fen-input') as HTMLInputElement | null;
  const fenFeedback = document.getElementById('fen-copy-feedback');
  const aiDifficultyBadge = document.getElementById('ai-difficulty-badge');
  const panelModeLabel = document.getElementById('panel-mode-label');

  const hintBox = document.getElementById('play-hint-box');
  const hintText = document.getElementById('play-hint-text');
  const gameOverBanner = document.getElementById('play-gameover-banner');
  const gameOverTitle = document.getElementById('gameover-title');
  const gameOverDetail = document.getElementById('gameover-detail');

  const updateUIFromState = (state: PlayState) => {
    if (fenInput) {
      fenInput.value = state.gameStatus.fen;
    }

    if (panelModeLabel) {
      panelModeLabel.innerText =
        state.gameMode === 'vs_ai' ? '人机对弈 (VS STOCKFISH)' : '自由分析推演';
    }

    if (aiDifficultyBadge) {
      if (state.gameMode === 'vs_ai') {
        const preset = DIFFICULTY_PRESETS[state.difficulty];
        aiDifficultyBadge.innerText = `${preset.nameZh} (${preset.eloEstimate})`;
        aiDifficultyBadge.style.display = 'inline-block';
      } else {
        aiDifficultyBadge.style.display = 'none';
      }
    }

    // Status Banner & Indicators
    if (statusText && statusBanner) {
      if (state.isGameOver) {
        statusPulseDot && (statusPulseDot.style.display = 'none');
        if (state.gameStatus.isCheckmate) {
          const winner = state.gameStatus.turn === 'w' ? '黑方' : '白方';
          statusText.innerText = `将死！${winner} 获得胜利！`;
          statusBanner.className = 'play-status-banner banner-success';
        } else if (state.gameStatus.isStalemate) {
          statusText.innerText = '逼和（平局）！无合法步且未受将';
          statusBanner.className = 'play-status-banner banner-info';
        } else {
          statusText.innerText = '对局结束（和棋）';
          statusBanner.className = 'play-status-banner banner-info';
        }
      } else if (state.isAiThinking) {
        statusPulseDot && (statusPulseDot.style.display = 'inline-block');
        const depth = DIFFICULTY_PRESETS[state.difficulty].depth;
        statusText.innerText = `Stockfish 正在思考中 (深度 ${depth})...`;
        statusBanner.className = 'play-status-banner banner-warning';
      } else if (state.gameStatus.isCheck) {
        statusPulseDot && (statusPulseDot.style.display = 'none');
        const who = state.gameStatus.turn === 'w' ? '白方' : '黑方';
        statusText.innerText = `将军！轮到 ${who} 应将`;
        statusBanner.className = 'play-status-banner banner-danger';
      } else {
        statusPulseDot && (statusPulseDot.style.display = 'none');
        if (state.gameMode === 'vs_ai') {
          const isPlayerTurn = state.gameStatus.turn === state.assignedColor;
          statusText.innerText = isPlayerTurn
            ? `轮到您走棋 (${state.assignedColor === 'w' ? '白方' : '黑方'})`
            : '等待 AI 响应...';
        } else {
          const who = state.gameStatus.turn === 'w' ? '白方' : '黑方';
          statusText.innerText = `轮到 ${who} 走棋`;
        }
        statusBanner.className = 'play-status-banner banner-default';
      }
    }

    if (statusTurnBadge) {
      const moveNum = Math.floor(state.history.length / 2) + 1;
      statusTurnBadge.innerText = `第 ${moveNum} 回合 · ${state.history.length} 步`;
    }

    // Move History Table
    if (historyList && moveCount) {
      moveCount.innerText = `${state.history.length} 步`;
      if (state.history.length === 0) {
        historyList.innerHTML = `
          <div style="color: var(--text-tertiary); font-size: 0.85rem; text-align: center; padding: var(--space-6) 0;">
            暂无走子记录，拖拽或点击棋子开始对弈
          </div>
        `;
      } else {
        const pairs = PgnFormatter.getMovePairs(state.history);
        historyList.innerHTML = `
          <table class="history-table">
            <thead>
              <tr>
                <th style="width: 25%;">#</th>
                <th style="width: 37%;">白方</th>
                <th style="width: 38%;">黑方</th>
              </tr>
            </thead>
            <tbody>
              ${pairs
                .map(
                  (p) => `
                <tr>
                  <td class="history-step-num">${p.number}.</td>
                  <td class="history-san-cell">${p.white}</td>
                  <td class="history-san-cell">${p.black || ''}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `;
        historyList.scrollTop = historyList.scrollHeight;
      }
    }

    // Undo button state: disabled when AI thinking
    const undoBtn = document.getElementById('btn-play-undo') as HTMLButtonElement | null;
    if (undoBtn) {
      undoBtn.disabled = state.isAiThinking;
    }
  };

  // Instantiate PlayController
  activePlayController = new PlayController({
    boardContainer,
    evalBarContainer,
    onStatusChange: (state) => {
      updateUIFromState(state);
    },
    onGameOver: (result: GameOverResult) => {
      if (gameOverBanner && gameOverTitle && gameOverDetail) {
        gameOverTitle.innerText = result.titleZh;
        gameOverDetail.innerText = result.detailZh;
        gameOverBanner.style.display = 'block';
      }
    },
    onHintUpdate: (hint: HintInfo | null) => {
      if (hintBox && hintText) {
        if (hint) {
          const evalStr = hint.score ? ` (评估 ${hint.score.formatted})` : '';
          hintText.innerHTML = `Stockfish 建议走法: <strong>${hint.from} 至 ${hint.to}</strong>${evalStr}`;
          hintBox.style.display = 'flex';
        } else {
          hintBox.style.display = 'none';
        }
      }
    },
  });
  (window as any).__activePlayController = activePlayController;

  // Start or resume game
  if (isResume && options.resumeSaved) {
    activePlayController.resumeSavedGame(options.resumeSaved);
  } else {
    activePlayController.startNewGame({
      mode: initialMode,
      difficulty: initialDiff,
      playerColor: initialColor,
    });
  }

  // Header "New Game / Setup" button
  container.querySelector('#btn-workbench-new-game')?.addEventListener('click', () => {
    const history = activePlayController?.getState().history || [];
    if (history.length > 0 && !activePlayController?.getState().isGameOver) {
      if (confirm('当前对局仍在进行中，确定要返回设置面板并开始新对局吗？')) {
        GameStorage.clearSavedGame();
        renderSetupScreen(container);
      }
    } else {
      GameStorage.clearSavedGame();
      renderSetupScreen(container);
    }
  });

  // Toolbar Actions
  document.getElementById('btn-play-undo')?.addEventListener('click', () => {
    activePlayController?.undoMove();
  });

  document.getElementById('btn-play-hint')?.addEventListener('click', () => {
    activePlayController?.requestHint();
  });

  document.getElementById('btn-close-hint')?.addEventListener('click', () => {
    activePlayController?.clearHintShapes();
  });

  document.getElementById('btn-play-flip')?.addEventListener('click', () => {
    activePlayController?.toggleOrientation();
  });

  document.getElementById('btn-play-sound')?.addEventListener('click', () => {
    const isMuted = soundPlayer.toggleMute();
    const soundIcon = document.getElementById('sound-icon');
    const soundLabel = document.getElementById('sound-label');
    if (soundIcon) {
      soundIcon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
    }
    if (soundLabel) {
      soundLabel.innerText = isMuted ? '静音' : '音效';
    }
    initIcons(container);
  });

  document.getElementById('btn-play-resign')?.addEventListener('click', () => {
    if (confirm('确定要认输本局对弈吗？')) {
      activePlayController?.resign();
    }
  });

  document.getElementById('btn-play-draw')?.addEventListener('click', () => {
    const accepted = activePlayController?.offerDraw();
    if (!accepted && activePlayController?.getState().gameMode === 'vs_ai') {
      alert('AI 评估当前局面或回合数尚不足以接受和棋提议，请继续对弈！');
    }
  });

  // Game Over Rematch & Export
  document.getElementById('btn-gameover-rematch')?.addEventListener('click', () => {
    if (gameOverBanner) gameOverBanner.style.display = 'none';
    activePlayController?.startNewGame({
      mode: initialMode,
      difficulty: initialDiff,
      playerColor: initialColor,
    });
  });

  document.getElementById('btn-gameover-export')?.addEventListener('click', () => {
    if (activePlayController) {
      const pgn = activePlayController.getPgnString();
      PgnModalUI.showExport(pgn);
    }
  });

  // PGN Export & Import Dialog Triggers
  document.getElementById('btn-open-pgn-export')?.addEventListener('click', () => {
    if (activePlayController) {
      const pgn = activePlayController.getPgnString();
      PgnModalUI.showExport(pgn);
    }
  });

  document.getElementById('btn-open-pgn-import')?.addEventListener('click', () => {
    PgnModalUI.showImport((pgn) => {
      if (activePlayController) {
        const ok = activePlayController.loadPgnString(pgn);
        if (ok && gameOverBanner) {
          gameOverBanner.style.display = 'none';
        }
        return ok;
      }
      return false;
    });
  });

  // FEN Copy & Load
  document.getElementById('btn-play-copy-fen')?.addEventListener('click', () => {
    if (activePlayController) {
      const fen = activePlayController.getBoardAdapter().getEngine().getFen();
      navigator.clipboard.writeText(fen).then(() => {
        if (fenFeedback) {
          fenFeedback.style.display = 'block';
          setTimeout(() => {
            if (fenFeedback) fenFeedback.style.display = 'none';
          }, 2500);
        }
      });
    }
  });

  document.getElementById('btn-play-load-fen')?.addEventListener('click', () => {
    if (fenInput && activePlayController) {
      const fen = fenInput.value.trim();
      if (fen) {
        const ok = activePlayController.getBoardAdapter().setPosition(fen);
        if (ok) {
          if (gameOverBanner) gameOverBanner.style.display = 'none';
          activePlayController.getBoardAdapter().syncBoard();
        } else {
          alert('输入的 FEN 格式不合法，请检查！');
        }
      }
    }
  });

  initIcons(container);
}

function DIFFICY_BADGE_TEXT(diff: EngineDifficulty): string {
  const preset = DIFFICULTY_PRESETS[diff] || DIFFICULTY_PRESETS.intermediate;
  return `${preset.nameZh} (${preset.eloEstimate})`;
}
