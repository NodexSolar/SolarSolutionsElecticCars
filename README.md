# Nodex Solar Mobility

Página estática (HTML + CSS + JS, sin build) de cargadores para autos eléctricos y carport solar para empresas con estacionamiento. Sitio: https://mobility.nodexsolar.com.ar

## Estructura
Hero con diagrama de 3 pasos → rubros → cómo funciona → beneficios → sistema → mapa de puntos de carga → packs (sin precios) → preguntas frecuentes → contacto.

## Configuración (`js/main.js`, objeto `CONFIG`)
| Campo | Qué es |
|---|---|
| `whatsapp` / `waMessage` | Número (54 9 11 7643-8672) y mensaje genérico que se envía |
| `gaId` | Google Analytics 4 (`G-XXXXXXXXXX`) |
| `adsId` y `adsLeadLabel` | Google Ads (`AW-…`) y etiqueta de la conversión |
| `metaPixelId` | Meta Pixel |

Mientras estén vacíos no se carga ninguna etiqueta. Eventos que se envían: `whatsapp_click` (Contact en Meta), `generate_lead` (Lead en Meta), `select_rubro`, `map_view`. Se guardan `utm_*`, `gclid` y `fbclid`, y el origen viaja en el mensaje del formulario.

## SEO y buscadores con IA
- `canonical`, Open Graph, Twitter Card e imagen para compartir (`assets/og-image.jpg`).
- Datos estructurados JSON-LD (Organization, WebSite, Service, FAQPage) en `index.html`.
- `robots.txt`, `sitemap.xml` y `llms.txt`. Cloudflare antepone su bloque administrado, que bloquea a los rastreadores de entrenamiento de IA (GPTBot, ClaudeBot, Google-Extended…) y no a los de búsqueda (Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot…).
- Política de privacidad en `/privacidad`.

## Mapa
`data/estaciones-ev-buenos-aires.json`: puntos de carga de CABA y provincia de Buenos Aires, de © OpenStreetMap contributors (ODbL), descargados el 26/10/2026 con Overpass (`amenity=charging_station`). Para actualizar, volver a descargar y regenerar el archivo. El mapa usa Leaflet y se carga al acercarse a la sección.

## Publicación
Cloudflare (Worker con assets estáticos `solarsolutionselecticcars`) conectado a este repo, rama `main`. Dominio personalizado `mobility.nodexsolar.com.ar`. Cada push a `main` publica solo. `_headers` define caché y seguridad; `404.html` es la página de error.

## Ver en local
```bash
python -m http.server 3100
```
