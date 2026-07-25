// script.js - ORQUESTADOR PRINCIPAL
console.log('🚀 script.js cargado');

let CONFIG = {};

async function cargarConfig() {
  console.log('📡 Cargando config.json...');
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    CONFIG = await res.json();
    console.log('✅ config.json cargado:', CONFIG);
    return CONFIG;
  } catch (e) {
    console.error('❌ Error cargando config.json:', e);
    return {
      nombre: 'Dania',
      fechaTexto: '24 de octubre de 2026',
      fechaISO: '2026-10-24T13:00:00',
      frase: 'Frase de ejemplo',
      horaMisa: '3:00 pm',
      ubicacionMisa: 'Iglesia',
      mapaMisa: '#',
      horaFiesta: '1:00 pm',
      ubicacionFiesta: 'Salón',
      mapaFiesta: '#',
      padre: 'Papá',
      madre: 'Mamá',
      padrino: 'Padrino',
      madrina: 'Madrina',
      audioFile: 'archivos/cancion.mp3'
    };
  }
}

function rellenarDatos(config) {
  console.log('📝 Rellenando datos en HTML...');
  document.getElementById('nombre-hero').textContent = config.nombre;
  document.getElementById('fecha-fija').textContent = config.fechaTexto;
  document.getElementById('frase-texto').textContent = config.frase;
  document.getElementById('hora-misa').textContent = config.horaMisa;
  document.getElementById('lugar-misa').textContent = config.ubicacionMisa;
  document.getElementById('mapa-misa').href = config.mapaMisa;
  document.getElementById('hora-fiesta').textContent = config.horaFiesta;
  document.getElementById('lugar-fiesta').textContent = config.ubicacionFiesta;
  document.getElementById('mapa-fiesta').href = config.mapaFiesta;
  document.getElementById('padre1').textContent = config.padre;
  document.getElementById('padre2').textContent = config.madre;
  document.getElementById('padrino1').textContent = config.padrino;
  document.getElementById('padrino2').textContent = config.madrina;
  document.title = `Mis XV años · ${config.nombre}`;
  console.log('✅ Datos rellenados');
}

// Inicializar todo
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌐 DOM listo, cargando configuración...');
  const config = await cargarConfig();
  window.CONFIG = config;
  rellenarDatos(config);

  // Importar y ejecutar módulos
  try {
    const { initContador } = await import('./modules/contador.js');
    initContador(config);
    console.log('✅ Módulo contador iniciado');
  } catch (e) { console.error('❌ Error en contador:', e); }

  try {
    const { initSonidos } = await import('./modules/sonidos.js');
    initSonidos();
    console.log('✅ Módulo sonidos iniciado');
  } catch (e) { console.error('❌ Error en sonidos:', e); }

  try {
    const { initParticulas } = await import('./modules/particulas.js');
    initParticulas();
    console.log('✅ Módulo particulas iniciado');
  } catch (e) { console.error('❌ Error en particulas:', e); }

  try {
    const { initModal } = await import('./modules/modal.js');
    initModal();
    console.log('✅ Módulo modal iniciado');
  } catch (e) { console.error('❌ Error en modal:', e); }

  try {
    const { initMusica, playMusic, toggleMusic } = await import('./modules/musica.js');
    initMusica(config);
    window.playMusic = playMusic;
    window.toggleMusic = toggleMusic;
    console.log('✅ Módulo musica iniciado (audio local)');
  } catch (e) { console.error('❌ Error en musica:', e); }

  try {
    const { initJuego } = await import('./modules/juego.js');
    initJuego(config);
    console.log('✅ Módulo juego iniciado');
  } catch (e) { console.error('❌ Error en juego:', e); }

  // ---------------- MANEJO DE LA ROSA ----------------
  const roseBtn = document.getElementById('rose-btn');
  const portal = document.getElementById('portal');
  const app = document.getElementById('app');

  if (!roseBtn) console.error('❌ Botón rosa NO encontrado');
  if (!portal) console.error('❌ Portal NO encontrado');
  if (!app) console.error('❌ App NO encontrada');

  if (roseBtn && portal && app) {
    console.log('✅ Elementos para la rosa encontrados');

    // Reemplazar para evitar duplicados
    const newBtn = roseBtn.cloneNode(true);
    roseBtn.parentNode.replaceChild(newBtn, roseBtn);
    const finalBtn = document.getElementById('rose-btn');

    finalBtn.addEventListener('click', function(e) {
      console.log('🌹 CLIC EN ROSA detectado');
      e.preventDefault();

      portal.classList.add('hide');
      app.classList.add('show');
      console.log('🔓 Portal cerrado, App visible');

      // Reproducir música local
      if (window.playMusic) {
        try {
          window.playMusic();
          console.log('🎵 Música local iniciada');
        } catch (err) {
          console.error('❌ Error al reproducir música:', err);
        }
      } else {
        console.warn('⚠️ playMusic no disponible');
      }

      // Efectos sonoros y chispas
      import('./modules/sonidos.js').then(module => {
        try { module.soundOpen(); } catch (e) {}
      }).catch(() => {});
      import('./modules/particulas.js').then(module => {
        try {
          const rect = this.getBoundingClientRect();
          module.burst(rect.left + rect.width/2, rect.top + rect.height/2, 30);
        } catch (e) {}
      }).catch(() => {});
    });

    console.log('✅ Evento click asignado a la rosa');
  } else {
    console.error('❌ NO se pudo asignar evento a la rosa');
  }
});

console.log('✅ script.js terminó de cargarse');
