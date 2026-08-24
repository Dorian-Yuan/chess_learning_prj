import { UciParser } from '../utils/uci_parser';
import type {
  EngineDifficulty,
  EngineState,
  BestMoveInfo,
  DifficultyPreset,
} from '../types/engine_types';
import { DIFFICULTY_PRESETS } from '../types/engine_types';

export interface StockfishWorkerOptions {
  workerPath?: string;
  defaultDifficulty?: EngineDifficulty;
}

export type InfoCallback = (info: Partial<BestMoveInfo>) => void;

export class StockfishWorker {
  private static instance: StockfishWorker | null = null;
  private worker: Worker | null = null;
  private workerPath: string;
  private state: EngineState = 'uninitialized';
  private currentDifficulty: EngineDifficulty = 'intermediate';
  private currentPreset: DifficultyPreset = DIFFICULTY_PRESETS.intermediate;
  
  private initPromise: Promise<boolean> | null = null;
  private isReadyPromiseResolver: (() => void) | null = null;
  
  private currentSearchResolve: ((info: BestMoveInfo) => void) | null = null;
  private currentSearchReject: ((reason: Error) => void) | null = null;
  private currentSearchTimeout: number | null = null;
  private currentInfoCallback: InfoCallback | null = null;
  private latestPartialInfo: Partial<BestMoveInfo> = {};

  private stateChangeListeners: Array<(state: EngineState) => void> = [];

  constructor(options?: StockfishWorkerOptions) {
    this.workerPath = options?.workerPath || import.meta.env.BASE_URL + 'engine/stockfish.js';
    if (options?.defaultDifficulty) {
      this.currentDifficulty = options.defaultDifficulty;
      this.currentPreset = DIFFICULTY_PRESETS[options.defaultDifficulty];
    }
  }

  public static getInstance(): StockfishWorker {
    if (!StockfishWorker.instance) {
      StockfishWorker.instance = new StockfishWorker();
    }
    return StockfishWorker.instance;
  }

  public getState(): EngineState {
    return this.state;
  }

  public isAvailable(): boolean {
    return typeof Worker !== 'undefined';
  }

  public onStateChange(listener: (state: EngineState) => void): () => void {
    this.stateChangeListeners.push(listener);
    listener(this.state);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter((l) => l !== listener);
    };
  }

  private setState(newState: EngineState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateChangeListeners.forEach((l) => l(newState));
    }
  }

  /**
   * Initializes the Stockfish Web Worker and negotiates UCI protocol
   */
  public async init(): Promise<boolean> {
    if (this.state === 'ready') return true;
    if (this.initPromise) return this.initPromise;

    if (!this.isAvailable()) {
      console.warn('[StockfishWorker] Web Workers are not supported in this environment');
      this.setState('error');
      return false;
    }

    this.setState('initializing');

    this.initPromise = new Promise<boolean>((resolve) => {
      try {
        this.worker = new Worker(this.workerPath);

        const initTimeout = window.setTimeout(() => {
          console.warn('[StockfishWorker] Engine initialization timed out after 10s');
          this.setState('error');
          resolve(false);
        }, 10000);

        let uciOk = false;

        this.worker.onmessage = (event: MessageEvent) => {
          const line = typeof event.data === 'string' ? event.data.trim() : '';
          if (!line) return;

          if (line === 'uciok') {
            uciOk = true;
            this.send('setoption name Threads value 1');
            this.send('setoption name Hash value 16');
            this.applyDifficultyOptions(this.currentPreset);
            this.send('isready');
          } else if (line === 'readyok') {
            if (this.state === 'initializing' && uciOk) {
              window.clearTimeout(initTimeout);
              this.setState('ready');
              resolve(true);
            } else if (this.isReadyPromiseResolver) {
              this.isReadyPromiseResolver();
              this.isReadyPromiseResolver = null;
            }
          }

          this.handleWorkerMessage(line);
        };

        this.worker.onerror = (err) => {
          console.error('[StockfishWorker] Worker error:', err);
          window.clearTimeout(initTimeout);
          this.setState('error');
          if (this.currentSearchReject) {
            this.currentSearchReject(new Error(String(err)));
            this.currentSearchReject = null;
            this.currentSearchResolve = null;
          }
          resolve(false);
        };

        // Start UCI handshake
        this.send('uci');
      } catch (err) {
        console.error('[StockfishWorker] Failed to create Worker:', err);
        this.setState('error');
        resolve(false);
      }
    });

    return this.initPromise;
  }

  private send(cmd: string): void {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  private handleWorkerMessage(line: string): void {
    // 1. Check for 'info' evaluation output
    if (line.startsWith('info ')) {
      const parsed = UciParser.parseInfoLine(line);
      this.latestPartialInfo = { ...this.latestPartialInfo, ...parsed };
      if (this.currentInfoCallback) {
        this.currentInfoCallback(this.latestPartialInfo);
      }
      return;
    }

    // 2. Check for 'bestmove' output
    if (line.startsWith('bestmove')) {
      const parsed = UciParser.parseBestMoveLine(line);
      const result: BestMoveInfo = {
        bestMove: parsed.bestMove,
        ponder: parsed.ponder,
        score: this.latestPartialInfo.score,
        depth: this.latestPartialInfo.depth,
        pv: this.latestPartialInfo.pv,
      };

      if (this.currentSearchTimeout !== null) {
        window.clearTimeout(this.currentSearchTimeout);
        this.currentSearchTimeout = null;
      }

      const resolver = this.currentSearchResolve;
      this.currentSearchResolve = null;
      this.currentSearchReject = null;
      this.currentInfoCallback = null;

      if (this.state === 'thinking') {
        this.setState('ready');
      }

      if (resolver) {
        resolver(result);
      }
    }
  }

  /**
   * Sets the engine difficulty level and updates UCI options
   */
  public setDifficulty(difficulty: EngineDifficulty): void {
    this.currentDifficulty = difficulty;
    this.currentPreset = DIFFICULTY_PRESETS[difficulty];
    if (this.state === 'ready' || this.state === 'thinking') {
      this.applyDifficultyOptions(this.currentPreset);
    }
  }

  public getDifficulty(): EngineDifficulty {
    return this.currentDifficulty;
  }

  public getDifficultyPreset(): DifficultyPreset {
    return this.currentPreset;
  }

  private applyDifficultyOptions(preset: DifficultyPreset): void {
    this.send(`setoption name Skill Level value ${preset.skillLevel}`);
  }

  /**
   * Waits for the engine to acknowledge 'isready'
   */
  public async waitUntilReady(): Promise<void> {
    if (this.state === 'uninitialized' || this.state === 'error') {
      await this.init();
    }
    return new Promise<void>((resolve) => {
      this.isReadyPromiseResolver = resolve;
      this.send('isready');
    });
  }

  /**
   * Signals a new game to the engine
   */
  public async newGame(): Promise<void> {
    if (this.state === 'thinking') {
      this.stop();
    }
    this.send('ucinewgame');
    await this.waitUntilReady();
  }

  /**
   * Immediately stops any ongoing search
   */
  public stop(): void {
    if (this.worker) {
      this.send('stop');
    }
    if (this.currentSearchTimeout !== null) {
      window.clearTimeout(this.currentSearchTimeout);
      this.currentSearchTimeout = null;
    }
    if (this.currentSearchResolve) {
      const resolver = this.currentSearchResolve;
      this.currentSearchResolve = null;
      this.currentSearchReject = null;
      this.currentInfoCallback = null;
      resolver({
        bestMove: this.latestPartialInfo.bestMove || '',
        score: this.latestPartialInfo.score,
        depth: this.latestPartialInfo.depth,
        pv: this.latestPartialInfo.pv,
      });
    }
    if (this.state === 'thinking') {
      this.setState('ready');
    }
  }

  /**
   * Calculates the best move for a given position FEN
   */
  public async getBestMove(
    fen: string,
    options?: {
      depth?: number;
      timeLimitMs?: number;
      onInfo?: InfoCallback;
    }
  ): Promise<BestMoveInfo> {
    await this.init();
    if (this.state !== 'ready' && this.state !== 'thinking') {
      throw new Error(`Engine is not ready (state: ${this.state})`);
    }

    if (this.state === 'thinking') {
      this.stop();
    }

    this.setState('thinking');
    this.latestPartialInfo = {};
    this.currentInfoCallback = options?.onInfo || null;

    const depth = options?.depth ?? this.currentPreset.depth;
    const timeoutMs = options?.timeLimitMs ?? Math.max(15000, depth * 1500);

    return new Promise<BestMoveInfo>((resolve, reject) => {
      this.currentSearchResolve = resolve;
      this.currentSearchReject = reject;

      this.currentSearchTimeout = window.setTimeout(() => {
        console.warn(`[StockfishWorker] Search timed out after ${timeoutMs}ms, stopping...`);
        this.stop();
      }, timeoutMs);

      this.send(`position fen ${fen}`);
      if (options?.timeLimitMs) {
        this.send(`go movetime ${options.timeLimitMs}`);
      } else {
        this.send(`go depth ${depth}`);
      }
    });
  }

  /**
   * Gets AI play move with natural humanized thinking delay
   */
  public async getPlayMove(
    fen: string,
    options?: {
      onInfo?: InfoCallback;
    }
  ): Promise<{ bestMove: string; info: BestMoveInfo; durationMs: number }> {
    const startTime = performance.now();
    const preset = this.currentPreset;

    // Calculate natural delay within preset range
    const targetDelayMs =
      preset.minDelayMs + Math.random() * (preset.maxDelayMs - preset.minDelayMs);

    const info = await this.getBestMove(fen, {
      depth: preset.depth,
      onInfo: options?.onInfo,
    });

    const elapsed = performance.now() - startTime;
    const remainingDelay = Math.max(0, targetDelayMs - elapsed);

    if (remainingDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }

    return {
      bestMove: info.bestMove,
      info,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Evaluates the position indefinitely or up to a specified depth for real-time analysis
   */
  public async evaluate(
    fen: string,
    depth: number = 14,
    onInfo?: InfoCallback
  ): Promise<BestMoveInfo> {
    return this.getBestMove(fen, { depth, onInfo });
  }

  /**
   * Terminates the worker and cleans up resources
   */
  public terminate(): void {
    if (this.worker) {
      this.send('quit');
      this.worker.terminate();
      this.worker = null;
    }
    this.setState('uninitialized');
    this.initPromise = null;
    this.isReadyPromiseResolver = null;
    this.currentSearchResolve = null;
    this.currentSearchReject = null;
    if (this.currentSearchTimeout !== null) {
      window.clearTimeout(this.currentSearchTimeout);
      this.currentSearchTimeout = null;
    }
  }
}

export const stockfishWorker = StockfishWorker.getInstance();
