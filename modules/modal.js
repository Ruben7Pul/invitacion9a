console.log('📦 modal.js (con delegación de eventos)');

import { soundOpen, soundClose, soundTap } from './sonidos.js';

export function initModal() {
  // Delegación de eventos en el documento para los botones .nav-btn
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;
    const modalId = btn.dataset.modal;
    if (modalId) {
      e.preventDefault();
      openModal(modalId);
    }
  });

  // Delegación para cerrar modales (clics en overlay y botón de cierre)
  document.addEventListener('click', (e) => {
    // Clic en overlay
    const overlay = e.target.closest('.modal-overlay');
    if (overlay && e.target === overlay) {
      closeModal(overlay);
      return;
    }
    // Clic en botón de cierre
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      const overlay2 = closeBtn.closest('.modal-overlay');
      if (overlay2) closeModal(overlay2);
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-overlay.open');
      if (openModal) closeModal(openModal);
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
