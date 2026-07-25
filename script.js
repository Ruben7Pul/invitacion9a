// script.js - ORQUESTADOR PRINCIPAL
import { CONFIG } from './config.js';
import { initContador } from './modules/contador.js';
import { initJuego } from './modules/juego.js';
import { initSonidos } from './modules/sonidos.js';
import { initParticulas } from './modules/particulas.js';
import { initModal } from './modules/modal.js';
import { initMusica, playMusic, toggleMusic } from './modules/musica.js';

// Hacer CONFIG global para que otros módulos lo usen
window.CONFIG = CONFIG;

// 1. Rellenar el HTML con los datos
function rellenarDatos() {
  document.getElementById('nombre-hero').textContent = CONFIG.nombre;
  document.getElementById('fecha-fija').textContent = CONFIG.fechaTexto;
  document.getElementById('frase-texto').textContent = CONFIG.frase;
  document.getElementById('hora-misa').textContent = CONFIG.horaMisa;
  document.getElementById('lugar-misa').textContent = CONFIG.ubicacionMisa;
  document.getElementById('mapa-misa').href = CONFIG.mapaMisa;
  document.getElementById('hora-fiesta').textContent = CONFIG.horaFiesta;
  document.getElementById('lugar-fiesta').textContent = CONFIG.ubicacionFiesta;
  document.getElementById('mapa-fiesta').href = CONFIG.mapaFiesta;
  document.getElementById('padre1').textContent = CONFIG.padre;
  document.getElementById('padre2').textContent = CONFIG.madre;
  document.getElementById('padrino1').textContent = CONFIG.padrino;
  document.getElementById('padrino2').textContent = CONFIG.madrina;
  document.title = `Mis XV años · ${CONFIG.nombre}`;
}

// 2. Inicializar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  rellenarDatos();

  // Inicializar módulos (pasan el CONFIG)
  initSonidos();
  initParticulas();
  initContador(CONFIG);
  initModal();
  initMusica(CONFIG);

  // Portal: al tocar rosa, cerrar portal y empezar música
  document.getElementById('rose-btn').addEventListener('click', () => {
    document.getElementById('portal').classList.add('hide');
    document.getElementById('app').classList.add('show');
    playMusic();
  });

  // Botón de música
  document.getElementById('music-toggle').addEventListener('click', toggleMusic);

  // Juego se inicia al hacer clic en el nombre
  initJuego(CONFIG);
});

console.log('✅ Invitación cargada correctamente');
console.log('📝 Editá config.js para personalizar tus datos.');
