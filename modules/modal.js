console.log('📦 modal.js (sin partículas)');

import { soundOpen, soundClose, soundTap } from './sonidos.js';

// No usamos partículas, así que eliminamos import y funciones relacionadas

export function initModal() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      btn.classList.remove('tap');
      void btn.offsetWidth;
      btn.classList.add('tap');
      const modalId = btn.dataset.modal;
      openModal(modalId);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeModal(ov);
    });
    const closeBtn = ov.querySelector('[data-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeModal(ov);
      });
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
    }
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  soundOpen();
}

function closeModal(el) {
  if (!el) return;
  el.classList.remove('open');
  soundClose();
}
