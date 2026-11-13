# WebPocket · cv_admin (separado)

## Estructura

| Archivo | Función |
|---------|---------|
| `index.html` | UI, estilos y carga de scripts |
| `js/config.js` | EDGE URL, demos, formatos |
| `js/cart.js` | Avisos de pedidos, pitido, push, guardar config carrito |
| `js/ia.js` | Submenú IA, carga/limpieza de avatar (fotogramas JPG) |
| `js/app.js` | Login, panel admin, cuenta, render, resto de la app |

## Orden de carga
1. config.js → 2. cart.js → 3. ia.js → 4. app.js

Sube **toda la carpeta** al repo `cv_admin` (index.html en la raíz + carpeta `js/`).
