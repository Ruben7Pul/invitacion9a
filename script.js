// script.js - ORQUESTADOR PRINCIPAL
import { initContador } from './modules/contador.js';
import { initJuego } from './modules/juego.js';
import { initSonidos } from './modules/sonidos.js';
import { initParticulas } from './modules/particulas.js';
import { initModal } from './modules/modal.js';
import { initMusica, playMusic, toggleMusic } from './modules/musica.js';

// 1. Cargar configuración
let CONFIG = {};

async function cargarConfig() {
  try {
    const res = await fetch('config.json');
    CONFIG = await res.json();
    console.log('✅ Configuración cargada:', CONFIG);
    return CONFIG;
  } catch (e) {
    console.error('❌ Error cargando config.json:', e);
    // Fallback para desarrollo local
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
      youtubeId: 'CXZ7Nz69OPg'
    };
  }
}

// 2. Rellenar el HTML con los datos
function rellenarDatos(config) {
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
}

// 3. Inicializar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  const config = await cargarConfig();
  window.CONFIG = config; // para que otros módulos lo usen
  rellenarDatos(config);

  // Inicializar módulos (pasan el config)
  initSonidos();
  initParticulas();
  initContador(config);
  initModal();
  initMusica(config);

  // Portal: al tocar rosa, cerrar portal y empezar música
  document.getElementById('rose-btn').addEventListener('click', () => {
    document.getElementById('portal').classList.add('hide');
    document.getElementById('app').classList.add('show');
    playMusic();
  });

  // Botón de música
  document.getElementById('music-toggle').addEventListener('click', toggleMusic);

  // Juego se inicia al hacer clic en el nombre
  initJuego(config);
});
