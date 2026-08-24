import type { PieceType, BoardColor } from '../../types/chess_types';

/**
 * PromotionModal: Interactive modal allowing players to choose their promotion piece.
 */
export class PromotionModal {
  private static activeModal: HTMLElement | null = null;

  public static show(
    color: BoardColor,
    parentContainer: HTMLElement = document.body
  ): Promise<PieceType> {
    return new Promise((resolve) => {
      // Remove any existing modal
      PromotionModal.cleanup();

      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'promotion-modal-overlay';
      modalOverlay.id = 'promotion-modal';

      const modalBox = document.createElement('div');
      modalBox.className = 'promotion-modal-box';

      const title = document.createElement('h3');
      title.className = 'promotion-modal-title';
      title.innerText = '请选择兵的升变棋子';

      const desc = document.createElement('p');
      desc.className = 'promotion-modal-desc';
      desc.innerText = '兵已冲至底线，可升变为后、车、象、马任意强子';

      const pieceGrid = document.createElement('div');
      pieceGrid.className = 'promotion-piece-grid';

      const pieces: Array<{ type: PieceType; name: string; iconPath: string; desc: string }> = [
        {
          type: 'q',
          name: '皇后',
          iconPath: `/assets/pieces/${color === 'w' ? 'w' : 'b'}Q.svg`,
          desc: '全能最强战力',
        },
        {
          type: 'r',
          name: '城堡',
          iconPath: `/assets/pieces/${color === 'w' ? 'w' : 'b'}R.svg`,
          desc: '直线纵横控制',
        },
        {
          type: 'b',
          name: '主教',
          iconPath: `/assets/pieces/${color === 'w' ? 'w' : 'b'}B.svg`,
          desc: '斜线长虹攻击',
        },
        {
          type: 'n',
          name: '骑士',
          iconPath: `/assets/pieces/${color === 'w' ? 'w' : 'b'}N.svg`,
          desc: '日字八面越子',
        },
      ];

      pieces.forEach((p) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'promotion-piece-btn';
        item.setAttribute('data-piece', p.type);
        item.innerHTML = `
          <span class="promotion-piece-icon">
            <img src="${p.iconPath}" alt="${p.name}" class="promotion-piece-img" width="48" height="48" />
          </span>
          <span class="promotion-piece-name">${p.name}</span>
          <span class="promotion-piece-desc">${p.desc}</span>
        `;

        item.addEventListener('click', () => {
          PromotionModal.cleanup();
          resolve(p.type);
        });

        pieceGrid.appendChild(item);
      });

      modalBox.appendChild(title);
      modalBox.appendChild(desc);
      modalBox.appendChild(pieceGrid);
      modalOverlay.appendChild(modalBox);

      parentContainer.appendChild(modalOverlay);
      PromotionModal.activeModal = modalOverlay;
    });
  }

  public static cleanup(): void {
    if (PromotionModal.activeModal && PromotionModal.activeModal.parentNode) {
      PromotionModal.activeModal.parentNode.removeChild(PromotionModal.activeModal);
      PromotionModal.activeModal = null;
    }
  }
}
