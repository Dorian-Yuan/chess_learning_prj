import { initIcons } from '../../utils/icons';

export function renderHomeView(container: HTMLElement): void {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-logo-box">
        <img src="${import.meta.env.BASE_URL}assets/logo/logo.png" alt="Chess Learning Logo" class="hero-logo-img" />
      </div>
      <h1 class="hero-title">国际象棋研习</h1>
      <p class="hero-subtitle">
        沉浸式、交互式国际象棋自主学习与对弈平台。纯前端无后端依赖，搭载 Stockfish 智能引擎与标准 cburnett 矢量棋盘。
      </p>

      <div class="hero-features-bar">
        <div class="hero-feature-pill">
          <i data-lucide="cpu" class="icon"></i>
          <span>Stockfish 引擎驱动</span>
        </div>
        <div class="hero-feature-pill">
          <i data-lucide="wifi-off" class="icon"></i>
          <span>零后端 · 100% 离线计算</span>
        </div>
        <div class="hero-feature-pill">
          <i data-lucide="smartphone" class="icon"></i>
          <span>多端响应式 · Tailscale 随身学</span>
        </div>
      </div>
    </section>

    <!-- Quick Entry Cards -->
    <section class="grid grid-cols-4">
      <!-- Card 1: 规则学习 -->
      <a href="#/rules/pieces" class="card card-interactive">
        <div class="card-eyebrow">01 / 规则基石</div>
        <h2 class="card-title">
          <span>规则与走法</span>
          <i data-lucide="book-open" class="icon" style="color: var(--color-accent);"></i>
        </h2>
        <p class="card-desc">
          兵、马、象、车、后、王单子走法，王车易位、吃过路兵、兵升变等特殊规则动态演示与上手实操。
        </p>
        <div class="card-footer">
          <span class="badge badge-accent">10+ 互动关卡</span>
          <span style="display: flex; align-items: center; gap: 4px; color: var(--color-primary); font-weight: 500;">
            进入学习 <i data-lucide="chevron-right" class="icon" style="width: 14px; height: 14px;"></i>
          </span>
        </div>
      </a>

      <!-- Card 2: 经典开局 -->
      <a href="#/openings" class="card card-interactive">
        <div class="card-eyebrow">02 / 经典开局</div>
        <h2 class="card-title">
          <span>开局大全</span>
          <i data-lucide="compass" class="icon" style="color: var(--color-accent);"></i>
        </h2>
        <p class="card-desc">
          开局三大黄金原则，精选意大利、西班牙、西西里防御、后翼弃兵等经典开局谱系与战略意图解析。
        </p>
        <div class="card-footer">
          <span class="badge badge-muted">主流谱系树</span>
          <span style="display: flex; align-items: center; gap: 4px; color: var(--color-primary); font-weight: 500;">
            探索开局 <i data-lucide="chevron-right" class="icon" style="width: 14px; height: 14px;"></i>
          </span>
        </div>
      </a>

      <!-- Card 3: 战术训练 -->
      <a href="#/tactics" class="card card-interactive">
        <div class="card-eyebrow">03 / 战术进阶</div>
        <h2 class="card-title">
          <span>战术训练</span>
          <i data-lucide="target" class="icon" style="color: var(--color-accent);"></i>
        </h2>
        <p class="card-desc">
          击双、绝对/相对牵制、抽将、闪击、消除防守等 50+ 典型残局与战术组合解谜，实时对错反馈。
        </p>
        <div class="card-footer">
          <span class="badge badge-success">50+ 题库</span>
          <span style="display: flex; align-items: center; gap: 4px; color: var(--color-primary); font-weight: 500;">
            开始刷题 <i data-lucide="chevron-right" class="icon" style="width: 14px; height: 14px;"></i>
          </span>
        </div>
      </a>

      <!-- Card 4: 人机对战 -->
      <a href="#/play" class="card card-interactive">
        <div class="card-eyebrow">04 / 实战博弈</div>
        <h2 class="card-title">
          <span>人机对弈</span>
          <i data-lucide="swords" class="icon" style="color: var(--color-accent);"></i>
        </h2>
        <p class="card-desc">
          4 档梯度难度 Stockfish AI，实时局势优势评估条、走法提示、悔棋、FEN/PGN 棋谱导入与导出。
        </p>
        <div class="card-footer">
          <span class="badge badge-accent">Elo 800 ~ 2000+</span>
          <span style="display: flex; align-items: center; gap: 4px; color: var(--color-primary); font-weight: 500;">
            立即对局 <i data-lucide="chevron-right" class="icon" style="width: 14px; height: 14px;"></i>
          </span>
        </div>
      </a>
    </section>
  `;

  initIcons(container);
}
