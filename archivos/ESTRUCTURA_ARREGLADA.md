# 🌹 Invitación XV - Estructura Arreglada

## Problema Original
El HTML del juego estaba revueltometido en el script y style principales, causando conflictos al tratar de separar los módulos.

## Solución Implementada
Se dividieron los archivos en **dos capas completamente independientes**:

### 1️⃣ CAPA PRINCIPAL (index.html + script-principal.js + style-principal.css)
- **Responsabilidad**: Portal, reja, invitación, modales, música, partículas
- **archivos**:
  - `index.html` - HTML de la invitación principal
  - `script-principal.js` - Lógica de la invitación (carga perezosa del juego)
  - `style-principal.css` - Estilos de la invitación (sin nada del juego)

#### Cómo funciona:
1. Al cargar `index.html`, se carga **script-principal.js** 
2. El usuario abre la reja (click en el nombre) → se crea un **iframe** que carga `juegos1.html`
3. El juego se ejecuta **completamente aislado** en el iframe
4. El usuario puede cerrar el iframe y volver a la invitación

**Ventaja**: Cero conflictos entre CSS/JS de la invitación y el juego.

---

### 2️⃣ CAPA DEL JUEGO (juegos1.html + script-juego.js + style-juego.css)
- **Responsabilidad**: Juego de breakout, bolas, ladrillos, puntuaciones
- **archivos**:
  - `juegos1.html` - HTML del juego (completo e independiente)
  - `script-juego.js` - Lógica del juego (carga `modules/juego.js`)
  - `style-juego.css` - Estilos del juego (solo juego)

#### Cómo funciona:
1. `juegos1.html` se abre en un iframe desde `script-principal.js`
2. Carga `script-juego.js`, que carga el módulo `modules/juego.js`
3. El juego se ejecuta sin interferencias

---

## 📂 Estructura Actual

```
invitacion-quinceañera/
├── index.html                    ← PRINCIPAL: Invitación
├── juegos1.html                  ← JUEGO: Breakout (en iframe)
├── script-principal.js           ← Script principal (SIN juego)
├── script-juego.js               ← Script juego (importa modules/juego.js)
├── script.js                     ← Script original (OBSOLETO)
├── style-principal.css           ← Estilos principales (SIN juego)
├── style-juego.css               ← Estilos juego (SOLO juego)
├── style.css                     ← Estilos originales (OBSOLETO)
├── modules/
│   ├── juego.js                  ← Lógica del juego (bolas, ladrillos, etc)
│   ├── contador.js               ← Contador regresivo
│   ├── modal.js                  ← Modales
│   ├── musica.js                 ← Música de fondo
│   └── sonidos.js                ← Efectos de sonido
├── archivos/
│   ├── bella.jpg                 ← Imagen de fondo
│   ├── centro.gif                ← GIF central
│   ├── cancion.mp3               ← Música
│   ├── mar1.mp4 / mar2.mp4       ← Videos
│   └── griet*.png, jueg1.png     ← Texturas del juego
└── config.json                   ← Configuración (nombre, fechas, etc)
```

---

## 🔧 Cambios Realizados

### ✅ index.html
- Cambió de `script.js` → `script-principal.js`
- Cambió de `style.css` → `style-principal.css`
- Eliminados todos los estilos del juego de CSS

### ✅ script-principal.js (NUEVO)
- Copia de `script.js` pero **sin cargar módulos de juego directamente**
- Al hacer clic en el nombre, **crea un iframe** que carga `juegos1.html`
- El iframe se añade como hermano de `#portal` y `#app`

### ✅ style-principal.css (NUEVO)
- Contiene SOLO los estilos de:
  - Portal / Reja
  - APP principal
  - Modales
  - Contador
  - Familia
  - Responsive

### ✅ juegos1.html
- Agregados `viewport-fit=cover` y `v=` de versionado
- Mantenido íntegro sin cambios estructurales

### ✅ script-juego.js
- Mantenido igual (carga `modules/juego.js` correctamente)

### ✅ style-juego.css
- Mantenido igual (estilos solo del juego)

---

## 🚀 Cómo Usar

### Desarrollo Local
```bash
# Sirve los archivos con un servidor (Python, Node.js, etc)
python -m http.server 8000

# O con Node.js
npx http-server

# Abre en el navegador: http://localhost:8000/index.html
```

### Producción
- Sube todos los archivos al servidor
- El flujo es:
  1. Usuario abre `index.html`
  2. Ve la invitación con reja
  3. Toca el nombre para jugar (carga iframe con `juegos1.html`)
  4. Juega el breakout
  5. Puede cerrar el juego y volver a la invitación

---

## ⚠️ ARCHIVOS OBSOLETOS (puedes eliminar)
- `script.js` - Reemplazado por `script-principal.js`
- `style.css` - Reemplazado por `script-principal.css` y `style-juego.css`

---

## 🐛 Solución de Problemas

### El juego no aparece al hacer clic en el nombre
1. Abre la consola (F12)
2. Busca errores de red (¿existe `juegos1.html`?)
3. Verifica que `config.json` existe
4. Mira si hay errores en la carga de `modules/juego.js`

### El CSS del juego afecta la invitación o viceversa
- **Imposible**: Están en archivos separados (`style-principal.css` y `style-juego.css`)
- Si ocurre, limpia el cache del navegador (Ctrl+Shift+Supr)

### El contador regresivo no funciona
- Verifica que `config.json` tiene `fechaISO` en formato ISO 8601
- Revisa `modules/contador.js` está presente

---

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
  "audioFile": "archivos/cancion.mp3"
}
```

---

## 💡 Próximas Mejoras Opcionales

1. **Service Worker** para cachear assets
2. **Animaciones CSS** más suaves en transiciones
3. **Dark Mode** automático basado en hora del día
4. **Compartir en redes** con og:image dinámico
5. **Analytics** para saber quién abrió la invitación

---

**Creado**: 2026-08-03  
**Arreglado por**: Claude  
**Estado**: ✅ Funcional y separado en dos capas
