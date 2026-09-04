# WebPocket · cv_start

`cv_start` es la aplicación pública de **WebPocket, la página web de bolsillo**. Cuando una persona ingresa directamente, ve ocho ejemplos interactivos y un solo botón para inscribirse. Cuando abre una URL de QR con `?perfil=CODIGO`, la aplicación consulta `cv_admin` y muestra únicamente ese perfil si está activo.

| Ruta | Comportamiento |
| --- | --- |
| `https://TU-USUARIO.github.io/cv_start/` | Ocho ejemplos de WebPocket y botón **Inscríbete**. |
| `https://TU-USUARIO.github.io/cv_start/?perfil=WP-XXXX` | Perfil público individual. No muestra los ejemplos de otros clientes. |
| QR de un perfil pendiente | Mensaje de espera de validación de pago. |

## Configuración necesaria

Edita solo `config.js` antes de publicar. `cvAdminUrl` debe llevar al formulario de registro de `cv_admin`; `apiBaseUrl` debe ser el dominio publicado de la aplicación funcional `cv_admin`, por ejemplo `https://cv-admin.tudominio.pe`. **Nunca agregues claves de Supabase ni OpenRouter en este repositorio.**

```js
window.WEBPOCKET_CONFIG = {
  cvAdminUrl: "https://TU-USUARIO.github.io/cv_admin/?registro=1",
  apiBaseUrl: "https://cv-admin.tudominio.pe"
};
```

## Publicación en GitHub Pages

1. Crea el repositorio `cv_start` en GitHub y sube todos los archivos de esta carpeta, incluyendo los ocho MP4 y las cuatro imágenes de producto.
2. En GitHub activa **Settings → Pages → Deploy from a branch → main / root**.
3. Edita `config.js` con las URLs reales antes de probar los QR.

> GitHub Pages sirve la parte visual de `cv_start`, pero no ejecuta el servidor, las escrituras en Supabase ni el chat IA. Para que el perfil individual, el registro, la activación, las cargas y el chat funcionen, publica la aplicación full-stack `cv_admin` en un dominio con servidor; allí las claves quedan privadas.

## Funciones incluidas

La vista de ejemplo contiene perfiles profesionales con preguntas ya respondidas, chat IA médico de demostración con aviso informativo, carritos interactivos, cantidades, apertura de WhatsApp con pedido armado y una galería de enlaces de YouTube para el taller Torque Andino. Los perfiles reales publicados por QR solo reciben datos desde el endpoint público de `cv_admin` después de que `clientes.activo` sea verdadero.
