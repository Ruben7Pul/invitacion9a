# 🌹 Invitación XV - Estructura (actualizada)

## Por qué está dividida en 3 páginas

Antes, `index.html` cargaba a la vez 3 videos (reja, fondo de app, y el de
transición al abrir la reja) y arrancaba la música de fondo desde el
principio. En celular eso causaba lag al decodificar varios videos al mismo
tiempo, y a veces la música se pisaba con el audio del video de transición.

La solución fue copiar el mismo patrón que ya usaba el juego (`juego1/`):
en vez de mostrar/ocultar secciones con CSS dentro de una sola página, cada
pantalla es una **navegación real** a otra página. Así el navegador destruye
por completo el video/audio anterior antes de cargar el siguiente — nunca
coexisten, y nunca se pueden pisar entre sí.

## 📂 Estructura actual

```
invitacion9a-main/
├── index.html                  ← PORTAL: reja + video de transición (mar2.mp4, incbella.mp4)
├── script-portal.js            ← Lógica de la reja. Al terminar, navega a principal/index.html
│
├── principal/
│   ├── index.html               ← APP: secciones, calendario, collage, música (mar1.mp4)
│   └── script-principal.js      ← Lógica de la app. El botón "volver" navega a ../index.html
│
├── juego1/
│   ├── index.html                ← Juego Breakout (sin cambios)
│   └── h.js                      ← Al terminar, navega a ../principal/index.html?volver=1
│
├── modules/
│   ├── musica.js                 ← Música de fondo (compartido, solo se usa desde principal/)
│   ├── sonidos.js
│   ├── contador.js
│   ├── modal.js
│   └── juego.js
├── archivos/                     ← Videos, audio, imágenes (compartido)
├── config.json                   ← Datos del evento (compartido)
└── style-principal.css           ← Estilos, compartidos por index.html y principal/index.html
```

## 🔀 Flujo de navegación

1. `index.html` (portal) — el usuario toca la reja.
2. Se reproduce `incbella.mp4` con audio (video de transición).
3. Al terminar (o si el usuario lo salta), navega a `principal/index.html`.
4. Ahí arranca `mar1.mp4` de fondo y la música (`cancion.mp3`), con fundido de entrada.
5. Si el usuario toca el nombre → navega a `juego1/`.
6. Al terminar el juego → navega a `principal/index.html?volver=1` (se muestra
   la app de inmediato, sin ningún parpadeo, gracias a la clase `sin-reja`).
7. Botón "←" (volver) en la app → navega de vuelta a `../index.html` (portal).

## 📝 Rutas compartidas

Como `principal/` está un nivel más adentro, todo lo que carga desde ahí usa
`../`: `../style-principal.css`, `../config.json`, `../archivos/...`,
`../modules/...`. Es el mismo criterio que ya usaba `juego1/`.

## 📝 Configuración (config.json)

```json
{
  "nombre": "Melina",
  "fechaTexto": "10 de octubre de 2026",
  "fechaISO": "2026-10-10T13:00:00",
  "frase": "Con la bendición de Dios...",
  "horaMisa": "3:00 pm",
  "ubicacionMisa": "Iglesia",
  "mapaMisa": "https://maps.google.com/...",
  "horaFiesta": "1:00 pm",
  "ubicacionFiesta": "Salón",
  "mapaFiesta": "https://maps.google.com/...",
  "padre": "Papá",
  "madre": "Mamá",
  "padrino": "Padrino",
  "madrina": "Madrina",
  "audioFile": "../archivos/cancion.mp3"
}
```

⚠️ `audioFile` debe llevar `../` porque `config.json` ahora se consume desde
`principal/index.html`.

---

**Actualizado**: 2026-08-05
**Estado**: ✅ Portal, app y juego separados en páginas independientes
