# DarkZone V3

Sitio estático listo para GitHub Pages.

## Publicación rápida

Subí **el contenido de esta carpeta** a la raíz de tu repositorio de GitHub Pages:

- `index.html`
- `styles.css`
- `script.js`
- `config.js`
- `assets/`
- `setup/`
- `CNAME`
- `.nojekyll`

El dominio configurado es `www.darkzonebet.win`.

## Datos principales

La línea, canal, dominio y URLs de plataformas están centralizados en `config.js` para que puedas cambiarlos sin tocar el HTML.

## Funciones incluidas

- Diseño responsive para celular y PC.
- Hero y material visual DarkZone optimizado en WebP.
- Plataformas Bet30 / Ganamos + próximas plataformas.
- Generador de invitaciones de 3 amigos.
- Botón nativo **Compartir invitación** con link de referido + web + canal.
- Progreso de referidos confirmados 0/3 → 3/3.
- Contador total de visitas y usuarios conectados.
- Información de acumulación, cargas/retiros, condiciones de bonus y reglas.
- Canal oficial, WhatsApp principal y avisos de cambios de línea.
- Galería con modal para ampliar flyers.
- Menú móvil, animaciones, scroll progress, FAQ y acceso +18.

## Backend

La parte dinámica de contadores y referidos requiere la configuración indicada en:

`setup/COMO-ACTIVAR-CONTADORES-Y-REFERIDOS.md`

## Actualización · 5 plataformas

La versión actual incluye accesos para:

- Ganamos
- Bet30
- Trébol
- DeUna Bet
- Apostamos

Los enlaces se administran desde `config.js`. El estado de bonificación también se deja centralizado ahí para facilitar futuros cambios.

### Bonos mostrados actualmente

- Ganamos: sin bono activo publicado.
- Bet30: sin bono activo publicado.
- Trébol: bono disponible para consultar.
- DeUna Bet: bono disponible para consultar.
- Apostamos: bono disponible para consultar.

La web no fija un porcentaje para estas tres promociones: deriva al WhatsApp oficial para confirmar el beneficio vigente y sus condiciones.

### Analítica opcional

La parte final de `setup/supabase.sql` agrega `dz_platform_events` y la función `dz_track_platform_event`. Si la base ya estaba configurada con una versión anterior, ejecutá solamente el bloque **ANALÍTICA DE PLATAFORMAS** para comenzar a registrar clics en accesos y botones de bono.
