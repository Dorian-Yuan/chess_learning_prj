# 更新日志 (CHANGELOG)

本文档记录国际象棋学习网页（Chess Learning App）项目的所有重要版本迭代与规划变更。

格式规范遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [v0.1.17] - 2026-08-24

### 修复与优化 (Fixed & Optimized)
- **品牌 Logo 边缘白边根治清除**：通过逐像素色彩直方图分析与 BFS 连通区域洪泛算法，彻底清除 Logo 外边缘与圆角残留的 1-2px 浅色/半透明毛边（清除 12,218 个边缘杂色像素），确保深色背景下与 4px 环边缘 100% 呈现纯净深蓝（#072D50），并同步高保真重构全套应用图标（icon-180/192/512.png、favicon.png 128、icon-maskable-512.png 带 15% 安全区）。

---

## [v0.1.6] - 2026-08-24

### 新增 (Added)
- **PWA 应用化与离线预缓存 (Task 1)**：
  - 集成 `vite-plugin-pwa` (Workbox) 自动化离线 Service Worker，支持 `skipWaiting` 与 `clientsClaim` 即时热接管。
  - 生成并配置标准多尺寸 PWA 图标（180x180 `icon-180.png`、192x192 `icon-192.png`、512x512 `icon-512.png`、512x512 maskable `icon-maskable-512.png`）。
  - 配置 `manifest.webmanifest`（包含应用名『国际象棋研习』、主题色 `#14213D`、背景色 `#F9F8F6`、standalone 独立窗口模式）。
  - 设置 16MB 大文件缓存上限，将 7.28MB 的 Stockfish 17.1 WASM 引擎、全部 cburnett SVG 棋子、品牌 Logo、音效与全站资源纳入离线预缓存（Precache 49 个核心资源，首访后 100% 断网无缝可用）。
  - `src/index.html` 补齐 `manifest` 链接、`apple-touch-icon`、`apple-mobile-web-app-capable` 等 iOS/Android 全端标准元标签。
- **全功能设置中心与全局状态管理 (Task 2)**：
  - `src/utils/settings_manager.ts`：全局设置单例管理器，统一接管棋盘主题、音效、动画速度、坐标显示与默认 AI 难度，所有配置通过 `localStorage` 自动持久化。
  - **4 套棋盘配色主题**：经典木纹（枫木乳白/胡桃木棕）、石板蓝（冷灰/灰蓝石板）、森林绿（象牙黄/松石草绿）、简约灰（素雅白/炭黑），基于 CSS 变量动态驱动 Chessground 棋盘渐变格与走法高亮，全局实时切换无需刷新。
  - **音效与音量调控**：落子与吃子音效一键静音/开启、0~100% 音量滑块与 5 项拟真音效即时试听。
  - **走子动画速度调节**：慢速 (350ms)、标准 (200ms)、极速 (80ms)，`BoardAdapter` 实例动态订阅响应。
  - **默认 AI 对战难度**：设置页选定后，人机对弈工作台自动继承对应难度梯度。
  - **显示棋盘坐标开关**：一键控制全站棋盘 a-h 与 1-8 坐标标注的显隐。
  - **重置默认偏好**：一键恢复初始推荐配置。

### 修复与优化 (Fixed & Optimized)
- **全站间距与留白修复 (Task 3)**：
  - 全面贯彻 4px 乘数间距体系与 Editorial 排版标准。
  - 扩大所有棋盘外框卡片（`.lesson-board-card`、`.play-board-card`、`.opening-board-card`）内边距至 `var(--space-4)`（16px），解决棋盘与边框紧贴问题。
  - 优化走法记录表（`.history-table`）行高与内边距（`8px 14px`），提升棋谱记号阅读舒适度。
  - 优化兵升变选择弹窗（`.promotion-modal-box`）与 PGN 模态弹窗（`.modal-card`）内边距至 `var(--space-8)`（32px）。
  - 规范全局按钮内边距（标准按钮 `10px 20px`、小按钮 `6px 14px`、大按钮 `14px 28px`），杜绝文字紧贴边框。

---

## [v0.1.5] - 2026-08-24

### 新增 (Added)
- **主流开局浏览器 (Step 4)**：
  - `src/data/opening_book.json`：收录 15 大经典主流开局（意大利开局、西班牙开局、苏格兰开局、西西里防御等），包含 ECO 编号、分类体系、原理评注、战略目标与多步主线谱。
  - `src/modules/opening_explorer/`：交互式开局树浏览器与推演面板，支持逐步前进/后退/自动演示、键盘快捷键（方向键、空格、Home/End、F）、分支走法选择、局面 FEN 复制与深度链接。
- **核心战术训练营 (Step 4)**：
  - `src/data/tactics_puzzles.json`：精选 54 道核心战术谜题（击双、牵制、抽将、闪击、串击、消除保护 6 大杀手级主题各 9 题），涵盖 1~3 级难度、单步与连环战术。
  - `src/modules/tactic_trainer/`：沉浸式战术解谜工作台，支持智能对手应手反击、即时走法判定、战术线索提示、原理解析展示、localStorage 刷题进度持久化。
- **自动化数据校验测试体系**：
  - `scripts/validate_data.cjs`：全量校验教学关卡（20 关）、特殊规则（12 关）与战术题目（54 题）的 FEN 合法性、着法有效性与行棋方一致性，保证 100% 验证通过。
- **生产级启动脚本**：
  - 项目根目录新增 `start.bat`，一键自动构建生产产物并以 `0.0.0.0:4173` 启动 Vite Preview 服务，便于 Tailscale 与局域网设备远程访问。

### 修复与优化 (Fixed & Optimized)
- **全站 Emoji 与特殊符号清零**：
  - 清理战术题库全部 54 处 `🎉` 成功文案前缀及生成脚本，保持纯粹典雅正文。
  - 升变选择弹窗（`promotion_modal_ui.ts`）全面废弃 Unicode 棋子符号（`♕♛♖♜♗♝♘♞`），重构为引用标准的 cburnett 官方矢量 SVG 素材（`wQ.svg` / `bQ.svg` 等），并优化阴影与触控交互。
  - 清理开局浏览器与对战界面的 Unicode 箭头符号（`←`、`→` 改为键盘方向键说明与自然语言）。
- **棋盘视角与行棋方核查**：
  - 核实战术训练营及教学关卡视角渲染机制，确认白方先行题严格以白方视角（白方在下）呈现、黑方先行题以黑方视角（黑方在下）呈现，逻辑完全一致。
- **数据严谨性修复**：
  - 修正吃过路兵教学关卡（`en_passant_1`）与逼和关卡（`stalemate_1`）的 FEN 与目标判定逻辑，确保与规则完全契合。

---

## [v0.1.4] - 2026-08-24

### 新增 (Added)
- **Stockfish WASM 智能人机对弈与对战工作台 (Step 5)**：
  - **Stockfish WASM 引擎集成**：采用 `stockfish` 17.1.0 lite single-threaded WASM 引擎（`public/engine/stockfish.js` & `stockfish.wasm`），100% 纯本地离线运行，无需跨域隔离标头即可在各大浏览器标准 Web Worker 中流畅工作。
  - **UCI 协议控制器 (`src/lib/stockfish_worker.ts`)**：全套 UCI 协议生命周期（握手 `uci` / `uciok`、就绪 `isready` / `readyok`、配置 `setoption Skill Level`、`position fen`、`go depth`、`info` 算力流式解析、`bestmove` 回调、超时保护与资源清理）。
  - **四档难度体系与拟人化思考延迟**：
    - 入门 (Beginner)：Skill Level 0 · 深度 2 · 延迟 300~800ms · ~800 Elo
    - 初级 (Novice)：Skill Level 8 · 深度 6 · 延迟 500~1000ms · ~1300 Elo
    - 中级 (Intermediate)：Skill Level 15 · 深度 10 · 延迟 600~1200ms · ~1800 Elo
    - 高级 (Advanced)：Skill Level 20 · 深度 16 · 延迟 800~1500ms · ~2500+ Elo
  - **实时局势评估条 (`src/modules/game_play/eval_bar_ui.ts`)**：棋盘左侧纵向实时评估条，基于 Sigmoid 算法平滑转换百分比，支持将死杀法（`M#n`）标记，支持随黑白棋盘视角自适应翻转。
  - **走法提示系统 (Hint)**：点击请求 Stockfish 引擎推荐走法，在 Chessground 上绘制高亮箭头并在面板显示评估分值。
  - **全能对战控制器 (`src/modules/game_play/play_controller.ts`)**：
    - 完整支持人机对弈与自由推演双模切换。
    - 玩家执黑时 AI 自动先手出子；AI 行棋期间棋盘锁定与动态脉冲指示。
    - 胜负与和棋判定（将死、逼和、三次重复局面、50步规则、子力不足、认输、AI 动态评估求和）。
    - 智能悔棋（AI 对战时回退整回合，自由模式回退单步）。
  - **PGN 棋谱导入/导出 (`src/modules/game_play/pgn_modal_ui.ts`)**：
    - PGN 导出：标准头信息（Event、Site、Date、Round、White、Black、Elo、Result）与完整 SAN 走法，支持一键复制与 `.pgn` 文件下载。
    - PGN 导入：校验并载入已有棋谱进行复盘推演。
  - **Editorial 风格工作台 UI (`src/modules/views/play_view.ts`)**：左侧棋盘+评估条+操作工具栏，右侧 AI 状态卡+走法记录表+新局/PGN/FEN 选项卡，对局结束大横幅。

---

## [v0.1.3] - 2026-08-24

### 新增 (Added)
- **核心引擎与棋盘适配系统 (Step 2)**：
  - `src/types/chess_types.ts`、`src/types/lesson_types.ts`、`src/types/engine_types.ts`：完备的 TypeScript 强类型定义体系。
  - `src/lib/chess_engine.ts`：全量封装 `chess.js`，包含走法合法性验证、FEN 读写、将军/将死/逼和/三次重复/50步判定、PGN 记录与撤销、升变检测、`getDests()` 映射。
  - `src/lib/board_adapter.ts`：封装 `@lichess-org/chessground`，实现棋盘初始化、双向 FEN/着法同步、合法落点高亮、拖拽与点击双模移动、升变弹窗拦截与回调、事件分发。
  - `src/lib/sound_player.ts`：基于 Web Audio API 的纯合成音效系统（走子木质 thock、吃子 snap、将军 alert、升变 fanfare、将死/胜局 chord、非法步 buzz），零外部音频文件依赖，支持音量与静音持久化。
  - `src/utils/uci_parser.ts` 与 `src/utils/pgn_formatter.ts`：UCI 引擎分值/最佳步解析与 PGN 标准棋谱格式化。
  - `src/modules/game_play/promotion_modal_ui.ts`：兵升变选择模态弹窗（皇后/城堡/主教/骑士）。
  - `/play` 视图升级：全功能自由交互工作台，含合法点/上一步/将军高亮、走法记录列表（SAN 对局表）、翻转棋盘、悔棋、新局、FEN 复制与指定局面加载。
- **规则教学模块 (Step 3)**：
  - `src/data/piece_lessons.json`：6 大棋子（兵/马/象/车/后/王）教学题库，每子配有中英文代号、分值、规则说明、中象对比要点及 3~4 关交互实操练习（共 20 关）。
  - `src/data/special_rules.json`：5 大特殊规则专题（王车易位、兵升变、吃过路兵、将军/应将/将死、逼和与和棋），配有条件清单、中象异同分析及 13 关专项练习。
  - `src/modules/lesson_viewer/lesson_controller.ts` 与 `lesson_ui.ts`：通用交互式教学关卡组件，支持多种目标判定（`make_move`、`escape_check`、`checkmate`、`reach_target` 等）、即时对错反馈、过关提示、关卡切换与 localStorage 进度记忆。
  - `/rules` 路由与目录页完善：`/rules/pieces`（6 大棋子卡片与进入关卡）与 `/rules/specials`（5 大特殊规则卡片与进入关卡），支持直接通过 URL Query 参数深度链接进入具体关卡。

---

## [v0.1.2] - 2026-08-24

### 新增 (Added)
- **工程骨架与构建系统 (Step 1)**：
  - 初始化 Vite 6 + TypeScript 5.8 纯前端工程（`package.json`, `vite.config.ts`, `tsconfig.json`）。
  - 配置 `vite.config.ts` 的 `host: true`（支持 Tailscale 局域网及私有 IP 远程访问）与 `src` 源码根路径。
  - 一次性安装并验证全套核心依赖：`chess.js` (v1.4.0)、`@lichess-org/chessground` (v10.1.1)、`lucide` (v1.33.0)、`stockfish` (v17.1.0)。
- **Editorial 视觉与样式体系**：
  - `src/styles/tokens.css`：完整实现 Design Tokens（羊皮纸暖白 `#F9F8F6`、牛津墨蓝 `#14213D`、典雅复古金 `#C29B38`、棋盘色阶与字体系统）。
  - `src/styles/reset.css`、`src/styles/layout.css`、`src/styles/components.css`、`src/styles/chessground.css`。
  - 严格落实 Editorial 风格：1px 细线边框、4px 微圆角、克制阴影、全站严禁 Emoji，统一采用 Lucide SVG 矢量图标。
- **SPA 轻量 Hash 路由与多视图导航**：
  - 自实现零框架 Hash 路由（`src/utils/router.ts`），支持路径规范化与实时激活状态同步。
  - 顶部导航栏 `NavBar`（32px Logo + 衬线体标题 + Lucide 图标导航项 + 移动端折叠）。
  - 首页视图（Hero 品牌区 + 4 个快捷入口卡片）及 `/rules`（含 `/rules/pieces` 与 `/rules/specials` 子路由）、`/openings`、`/tactics`、`/play`、`/settings` 占位视图。
- **官方 cburnett 矢量棋子素材**：
  - 提取并导入 Lichess 官方标准 cburnett 12 种棋子 SVG（wP wN wB wR wQ wK bP bN bB bR bQ bK）至 `public/assets/pieces/`。

---

## [v0.1.1] - 2026-08-24

### 变更 (Changed)
- **精简学习定位与架构**：全面移除『中国象棋 vs 国际象棋异同对照』专区及相关功能，聚焦国际象棋纯粹且完整的系统化学习路径。
  - 移除原第 2.3 节『中象 vs 国象异同对比专区』。
  - 架构图主模块从 6 个重整精简为 5 个（棋子基础、特殊规则、开局原理、核心战术、人机对弈）。
  - 文件结构规划中移除 `src/data/xiangqi_comparison.json` 与 `src/modules/comparison_viewer/`。
  - 重新理顺开发里程碑（由原 Step 0~7 调整为 Step 0~6），同步更新验收标准（DoD）。

### 新增 (Added)
- **Logo 与品牌标识规范**：在规划文档第 5.6 节新增品牌视觉资产规划。
  - 确立 Editorial 编辑部复古美学、羊皮纸暖白（`#F9F8F6`）、牛津墨蓝（`#14213D`）与典雅复古金（`#C29B38`）设计规范。
  - 规划 `public/assets/logo/` 目录结构（`logo.png`、`favicon.png`）与矢量 SVG Favicon 方案。
- **Logo 资产生成**：通过 AI 生图工具定制生成项目高清 Logo 并归档至 `public/assets/logo/logo.png`。

---

## [v0.1.0] - 2026-08-24

### 新增 (Added)
- **初始规划文档创建**：确立项目技术架构与产品定义（`docs/plan-v0.1.0.md`）。
  - 确定纯前端零后端架构（Vite + TypeScript + Stockfish 18 WASM + Chessground + chess.js）。
  - 确立 StyleKit `Editorial` 编辑杂志风格 UI 规范与 Design Tokens。
  - 规划 6 大教学与对战模块（含基础走法、特殊规则、开局库、战术解谜、中象对照、人机对战）。
  - 制定 7 步开发里程碑与 Definition of Done 验收清单。

## [v0.1.7] - 2026-08-24

### 变更 (Changed)
- **Service Worker 改为手写实现**：弃用 `vite-plugin-pwa`（其 workbox 模块加载机制在实测中安装成功但预缓存为空、离线失败），改为 `public/sw.js` 手写 SW（install 预缓存引擎/棋子/Logo/入口页 + fetch 缓存优先 + SPA 导航回退），`manifest.webmanifest` 手写，主入口 `main.ts` 直接注册。实测：预缓存 25 条、真离线整页刷新可用、离线可正常进行 Stockfish 对战。

### 新增 (Added)
- **设置中心功能化**：棋盘主题切换（经典木纹/石板蓝/森林绿/简约灰，全局实时生效 + localStorage 持久化）、显示/隐藏坐标、音效开关与分项音量、恢复默认设置。

### 修复 (Fixed)
- **全站间距与留白优化**（组件级，`components.css`/`tokens.css`）：按钮统一切 `min-height 40px`、卡片内边距 24px、筛选标签与 feature 标签内边距加宽、/play 工具栏与状态面板间距加大；视觉质检复核达标。

## [v0.1.8] - 2026-08-24

### 变更 (Changed)
- **Logo 全套重新生成**：按 5.6 品牌规范（Editorial 学院纹章风、马头+王冠+书卷+月桂花环三层边框、三色纯色块、无文字、方正对称）由 AI 生图重绘，potrace 矢量化产出新 `logo.svg`（12.7KB）；同步更新 `logo.png`（1024）、`favicon.svg/png`、`icon-180/192/512/maskable-512.png` 全部品牌资产；导航 32px 与 favicon 小尺寸清晰度多模态质检合格。
- **Service Worker 缓存版本**：`CACHE_NAME` 升至 `chess-learning-v2`，强制已安装用户刷新获取新资产。

## [v0.1.9] - 2026-08-24

### 变更 (Changed)
- **主 Logo 改用 Agnes AI 生图**：调用中国区生图模型 `agnes-image-2.1-flash`（OpenAI 兼容，api.agnes-ai.cn）按品牌规范（学院纹章风、马头+王冠+书卷+盾徽+月桂环、严格三色系、无文字无 emoji、方正对称）生成 1024x1024 主图并覆盖 `public/assets/logo/logo.png`（930KB）；导航栏与首页 Hero 均引用 PNG 主图（不再使用 SVG 作为主展示）；多模态质检合格。
- **Service Worker 缓存版本**：`CACHE_NAME` 升至 `chess-learning-v4`，已安装用户自动刷新获取新 Logo。

## [v0.1.10] - 2026-08-24

### 修复 (Fixed)
- **教学点位一致性全面核查**：新增 `scripts/check_lesson_coords.cjs` 自动校验全部 20 个棋子关卡 + 12 个特殊规则关卡 + 54 道战术题中指令/提示文本坐标与 FEN、题解的一致性，修正描述性坐标偏差并复核战术提示（knight_4 等）。
- **教学与战术棋盘开启坐标显示**（a-h / 1-8），消除无坐标数格导致的点位误读；此前用户看到的"点位偏移"源于旧 SW 缓存页面 + 无坐标，非数据系统性错位。
- **全站去除不必要英文**：新增 `scripts/find_english.cjs` 扫描，清理开局库/战术库/升变弹窗/主题标签/对战文案中全部括号英文翻译（如 击双 (Fork)、皇后 (Queen)、(Giuoco Pianissimo) 等）；保留 Stockfish/PGN/FEN/Elo 等必要术语。扫描结果为 0 残留。
- **package.json 版本号同步**至 0.1.9（与 CHANGELOG 一致），后续迭代同步维护。

### 新增 (Added)
- **设置中心"关于"分组**：显示应用 Logo、应用名、当前版本（自动读取 package.json）、特性说明；`tsconfig` 开启 resolveJsonModule。
- **Service Worker 缓存版本**：`CACHE_NAME` 升至 `chess-learning-v5`。

## [v0.1.11] - 2026-08-24

### 修复 (Fixed)
- **棋盘坐标显示位置**：坐标 a-h 与 1-8 从棋盘外缘（曾被误读为贴邻格、造成点位错觉）改为**叠加显示在各自格子内部**（底行格子内字母、右列格子内数字，各占一格宽高，沿用 4px 内边距对齐）。教学/战术/对战三处棋盘共用样式全部生效；计算样式与像素实测确认字母、数字与格子一一对应。SW `CACHE_NAME` 升至 `chess-learning-v6`。

## [v0.1.12] - 2026-08-24

### 变更 (Changed)
- **PWA Logo 扁平化重制**（Agnes AI 生图 agnes-image-2.1-flash）：改为成熟 App 图标风格——深海军蓝圆角方块底色 + 居中白色 Staunton 马头剪影 + 顶部金色小皇冠点缀，纯平面无渐变、无文字、极简高辨识，48px 级小尺寸清晰；同步重渲染全套 PWA 图标（icon-180/192/512、maskable 带安全区、favicon.png 128px）。SW `CACHE_NAME` 升至 `chess-learning-v7`。

## [v0.1.13] - 2026-08-24

### 变更 (Changed)
- **胶囊 Tab 架构**：移除旧首页（Hero 大页面）与顶部导航，改为底部胶囊 Tab 栏（首页/学习/训练/设置），顶部仅保留 Logo 与应用名；旧 hash 路由兼容（/play 等直达对应 Tab）。
- **首页 = 对局工作台**（原 /play 能力重构）：默认"待开局"新对局设置面板（4 档难度 + 执白/执黑/随机）；**对局自动保存**（每步写入 localStorage `chess_saved_game_v1`，含 FEN/历史/难度/执色/回合），意外退出后回到首页显示"继续上一局"（完整恢复并可继续）或"开始新对局"；对局正常结束自动清除快照。
- **训练聚合**：开局浏览与战术训练页面顶部新增互跳分段按钮。
- **设置页新增"界面外观模式"**：浅色 / 深色 / 跟随系统 三选一（settings_manager 持久化 + prefers-color-scheme 监听；tokens.css 深色调色板 data-theme="dark" 全站生效）。
- SW `CACHE_NAME` 升至 `chess-learning-v8`。

## [v0.1.14] - 2026-08-24

### 变更 (Changed)
- **Logo 去除外围白色勾边**：移除深蓝圆角方块外的一圈浅色描边（生成图自带勾边），深蓝边缘直接与透明背景相接（flood-fill 边缘清除 + 圆角透明化；多模态灰底复核确认无残留）；同步从清理版重渲染全套 PWA 图标。SW `CACHE_NAME` 升至 `chess-learning-v9`。

## [v0.1.15] - 2026-08-24

### 变更 (Changed)
- **底部胶囊 Tab 栏**：仅保留图标（移除"首页/学习/训练/设置"文字，改用 title/aria-label 标识）；从悬浮改为**固定贴底**（bottom: 0 + safe-area），内容区底部留白同步加大。
- **首页对局设置简化**：对局模式明确为"人机对弈 / 自由推演"两个入口；执子按钮简化为"执白 / 执黑 / 随机"；页头描述精简。
- **设置页开关重构**："显示棋盘坐标"与"落子与走棋音效"由并排按钮改为**标准滑动开关（Switch）**，标题居左、开关居右；切换即时生效并 Toast 提示。
- SW `CACHE_NAME` 升至 `chess-learning-v10`。
