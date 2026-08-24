import { initIcons } from '../../utils/icons';

export interface PgnModalOptions {
  mode: 'export' | 'import';
  pgnText?: string;
  onImport?: (pgn: string) => boolean;
}

export class PgnModalUI {
  private static activeModal: HTMLElement | null = null;

  public static showExport(pgnText: string): void {
    this.show({
      mode: 'export',
      pgnText,
    });
  }

  public static showImport(onImport: (pgn: string) => boolean): void {
    this.show({
      mode: 'import',
      onImport,
    });
  }

  private static show(options: PgnModalOptions): void {
    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay pgn-modal-overlay';
    overlay.id = 'pgn-modal-overlay';

    const isExport = options.mode === 'export';

    overlay.innerHTML = `
      <div class="modal-card pgn-modal-card card" style="max-width: 560px; width: 90%;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-3);">
          <div>
            <h3 style="font-size: 1.15rem; margin-bottom: 2px;">
              ${isExport ? '导出 PGN 棋谱记录' : '导入 PGN 棋谱'}
            </h3>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
              ${
                isExport
                  ? '便携式棋谱格式 (Portable Game Notation)，可直接导入各大国际象棋软件'
                  : '粘贴标准的 PGN 文本即可复盘或继续推演'
              }
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" id="pgn-modal-close" style="padding: 4px 8px;" title="关闭">
            <i data-lucide="x" class="icon" style="width: 16px; height: 16px;"></i>
          </button>
        </div>

        <div style="margin-bottom: var(--space-4);">
          <textarea
            id="pgn-modal-textarea"
            class="form-input"
            rows="9"
            style="font-family: var(--font-mono); font-size: 0.85rem; width: 100%; resize: vertical; line-height: 1.5;"
            placeholder="${isExport ? '' : '在此粘贴标准 PGN 格式文本，如：\n[Event \"Game\"]\n1. e4 e5 2. Nf3 Nc6 ...'}"
            ${isExport ? 'readonly' : ''}
          >${options.pgnText || ''}</textarea>
          <div id="pgn-modal-error" style="color: var(--color-danger); font-size: 0.8rem; margin-top: var(--space-1); display: none;"></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: flex-end; gap: var(--space-3);">
          ${
            isExport
              ? `
            <button id="btn-pgn-copy" class="btn btn-primary btn-sm">
              <i data-lucide="copy" class="icon"></i>
              <span id="btn-pgn-copy-text">复制到剪贴板</span>
            </button>
            <button id="btn-pgn-download" class="btn btn-secondary btn-sm">
              <i data-lucide="download" class="icon"></i>
              下载 .pgn 文件
            </button>
          `
              : `
            <button id="btn-pgn-submit-import" class="btn btn-primary btn-sm">
              <i data-lucide="upload" class="icon"></i>
              确认载入棋谱
            </button>
          `
          }
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.activeModal = overlay;
    initIcons(overlay);

    const closeBtn = overlay.querySelector('#pgn-modal-close');
    closeBtn?.addEventListener('click', () => this.close());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    if (isExport) {
      const copyBtn = overlay.querySelector('#btn-pgn-copy');
      const copyText = overlay.querySelector('#btn-pgn-copy-text');
      const downloadBtn = overlay.querySelector('#btn-pgn-download');
      const textarea = overlay.querySelector('#pgn-modal-textarea') as HTMLTextAreaElement;

      copyBtn?.addEventListener('click', () => {
        if (textarea) {
          navigator.clipboard.writeText(textarea.value).then(() => {
            if (copyText) {
              copyText.textContent = '已复制！';
              setTimeout(() => {
                if (copyText) copyText.textContent = '复制到剪贴板';
              }, 2000);
            }
          });
        }
      });

      downloadBtn?.addEventListener('click', () => {
        const text = textarea?.value || '';
        const blob = new Blob([text], { type: 'application/x-chess-pgn;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chess_match_${new Date().toISOString().slice(0, 10)}.pgn`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } else {
      const submitBtn = overlay.querySelector('#btn-pgn-submit-import');
      const textarea = overlay.querySelector('#pgn-modal-textarea') as HTMLTextAreaElement;
      const errorDiv = overlay.querySelector('#pgn-modal-error') as HTMLElement;

      submitBtn?.addEventListener('click', () => {
        const pgn = textarea?.value.trim() || '';
        if (!pgn) {
          if (errorDiv) {
            errorDiv.innerText = '请先输入或粘贴 PGN 文本！';
            errorDiv.style.display = 'block';
          }
          return;
        }

        if (options.onImport) {
          const success = options.onImport(pgn);
          if (success) {
            this.close();
          } else {
            if (errorDiv) {
              errorDiv.innerText = 'PGN 解析失败，请检查棋谱格式或走法是否合法！';
              errorDiv.style.display = 'block';
            }
          }
        }
      });
    }
  }

  public static close(): void {
    if (this.activeModal) {
      if (this.activeModal.parentNode) {
        this.activeModal.parentNode.removeChild(this.activeModal);
      }
      this.activeModal = null;
    }
  }
}

