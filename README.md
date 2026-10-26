# Nodex Solar Mobility

Página estática (HTML + CSS + JS, sin build) para ofrecer cargadores de autos eléctricos y carport solar a empresas con estacionamiento: hoteles, restaurantes, tiendas, shoppings, supermercados, parques industriales y oficinas.

## Estructura
Hero → rubros → cómo funciona (3 pasos) → ingresos / ahorro / más clientes / fidelidad → el sistema → packs → contacto.

## Qué configurar
Al principio de [`js/main.js`](js/main.js), objeto `CONFIG`:

| Campo | Qué es |
|---|---|
| `whatsapp` | Número con código de país, sin `+` (hoy 54 9 11 7643-8672). Lo usan el botón flotante, los "Cotizar" y el formulario. |

Los precios de los packs ("desde USD …") están en [`index.html`](index.html), sección `#packs`. Son valores de referencia, hay que validarlos.

## Ver en local
```bash
python -m http.server 3100
```
y abrir http://localhost:3100.

## Publicación con Cloudflare Pages
El sitio es estático: no necesita build.

1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autorizar GitHub y elegir el repo `NodexSolar/SolarSolutionsElecticCars`, rama `main`.
3. Framework preset: **None**. Build command: vacío. Build output directory: `/` (o vacío).
4. **Save and Deploy**. Desde ahí, cada `git push` a `main` publica solo.
5. En el proyecto: **Custom domains** → **Set up a custom domain** → escribir el dominio.

Archivos pensados para Cloudflare: [`_headers`](_headers) (caché y seguridad), [`404.html`](404.html) y [`robots.txt`](robots.txt).
Dominio actual: https://mobility.nodexsolar.com.ar (Worker con assets estáticos `solarsolutionselecticcars`, dominio personalizado sobre la zona `nodexsolar.com.ar`). Ya incluye `canonical`, `sitemap.xml` y `robots.txt` con ese dominio.
