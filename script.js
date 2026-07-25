console.log('🚀 script.js');

let CONFIG = null;

async function cargarConfig() {
  try {
    const res = await fetch(`config.json?t=${Date.now()}`);
    if (!res.ok) throw new Error('No se pudo cargar config.json');
    CONFIG = await res.json();
    console.log('✅ Configuración cargada:', CONFIG);
    return CONFIG;
  } catch (e) {
    console.error('❌ Error crítico: no se pudo cargar config.json', e);
    // Mostrar mensaje en pantalla
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0b0818;color:#f0d9a3;font-family:sans-serif;text-align:center;padding:2rem;">
        <div>
          <h1>⚠️ Error de configuración</h1>
          <p>No se pudo cargar el archivo <strong>config.json</strong>.</p>
          <p style="font-size:0.8rem;opacity:0.7;">Asegúrate de que exista en la raíz del proyecto.</p>
        </div>
      </div>
    `;
    throw e;
  }
}

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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const config = await cargarConfig();
    window.CONFIG = config;
    rellenarDatos(config);

    // Importar y ejecutar módulos (todos usan window.CONFIG)
    const modules = [
      { name: 'contador', path: './modules/contador.js' },
      { name: 'sonidos', path: './modules/sonidos.js' },
      { name: 'particulas', path: './modules/particulas.js' },
      { name: 'modal', path: './modules/modal.js' },
      { name: 'musica', path: './modules/musica.js' },
      { name: 'juego', path: './modules/juego.js' }
    ];

    for (const mod of modules) {
      try {
        const module = await import(mod.path);
        if (mod.name === 'musica') {
          module.initMusica(config);
          window.playMusic = module.playMusic;
          window.toggleMusic = module.toggleMusic;
        } else if (mod.name === 'juego') {
          module.initJuego(config);
        } else if (mod.name === 'contador') {
          module.initContador(config);
        } else if (typeof module.init === 'function') {
          module.init();
        } else if (typeof module.initParticulas === 'function') {
          module.initParticulas();
        } else if (typeof module.initModal === 'function') {
          module.initModal();
        } else if (typeof module.initSonidos === 'function') {
          module.initSonidos();
        }
        console.log(`✅ Módulo ${mod.name} iniciado`);
      } catch (e) {
        console.error(`❌ Error en módulo ${mod.name}:`, e);
      }
    }

    // Portal / rosa
    const roseBtn = document.getElementById('rose-btn');
    const portal = document.getElementById('portal');
    const app = document.getElementById('app');

    if (roseBtn && portal && app) {
      roseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        portal.classList.add('hide');
        app.classList.add('show');
        if (window.playMusic) window.playMusic();
      });
    } else {
      console.warn('⚠️ Elementos del portal no encontrados');
    }

  } catch (e) {
    // El error ya se mostró en pantalla desde cargarConfig
  }
});
