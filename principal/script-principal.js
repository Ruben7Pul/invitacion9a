// ===== AJUSTES EN EL CONTADOR Y PARALLAX =====

// Dentro de initContadorCircular, modificar la frecuencia de actualización:
function initContadorCircular(config) {
  // ... (código existente)
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const intervalo = isMobile ? 1000 : 200; // 1 segundo en móvil, 200ms en PC
  
  // En lugar de setInterval(actualizarContador, 200), usar la variable intervalo:
  actualizarContador();
  setInterval(actualizarContador, intervalo);
}

// ===== DESACTIVAR PARALLAX EN MÓVILES =====
document.addEventListener('DOMContentLoaded', function() {
  // ... (código existente)
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  
  // Si es móvil, desactivar parallax completamente
  if (isMobile) {
    window.__parallaxDesactivado = true;
    if (appInner) {
      appInner.style.transform = 'none';
      appInner.style.transition = 'none';
    }
    console.log('🔄 Parallax desactivado en móvil');
  } else {
    // Solo en PC se activa el parallax (código existente)
    // ... (todo el código de parallax que ya tenías)
  }

  // ===== AJUSTE DE INTERSECTION OBSERVER =====
  if ('IntersectionObserver' in window) {
    var secciones = document.querySelectorAll('.seccion');
    // En móvil usamos umbral más bajo (5%) para que aparezcan antes
    var umbralAparicion = isMobile ? 0.05 : 0.15;
    var umbralDesaparicion = isMobile ? 0.02 : 0.04;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.intersectionRatio >= umbralAparicion) {
          entry.target.classList.add('visible');
        } else if (entry.intersectionRatio <= umbralDesaparicion) {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: isMobile ? [0, 0.02, 0.05, 0.10] : [0, 0.02, 0.04, 0.08, 0.15, 0.25, 0.4] });
    secciones.forEach(function(sec) { observer.observe(sec); });
  } else {
    document.querySelectorAll('.seccion').forEach(function(sec) { sec.classList.add('visible'); });
  }
});
