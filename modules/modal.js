console.log('📦 módulo modal.js cargado');

import { soundOpen, soundClose, soundTap } from './sonidos.js';
import { burst } from './particulas.js';

export function initModal() {
  console.log('📋 Iniciando modales...');
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      btn.classList.remove('tap');
      void btn.offsetWidth;
      btn.classList.add('tap');
      const r = btn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 16);
      const modalId = btn.dataset.modal;
      openModal(modalId);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(ov => {
    // El modal de pausa NO se cierra con clic fuera
    if (ov.id === 'modal-pausa') return;

    ov.addEventListener('click', (e) => {
      if (e.target === ov) {
        closeModal(ov);
      }
    });

    const closeBtn = ov.querySelector('[data-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 10);
        closeModal(ov);
      });
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
    }
  });
  console.log('✅ Modales listos');
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
