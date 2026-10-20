# Nodex Charging Solutions · Cargadores de autos eléctricos + energía solar

Sitio estático (HTML + CSS + JS, sin build) que presenta la unidad de negocio de cargadores de autos eléctricos con energía solar de Nodex: packs cerrados, cobro por QR, simulador de potencia contratada y calculadora de rentabilidad.

## Qué incluye
- **Simulador de potencia**: reparte el día hora por hora entre consumo del local, solar y carga de autos, y muestra cómo el gestor dinámico evita superar la potencia contratada.
- **Demo de cobro por QR**: pantalla de celular interactiva (elegir kWh → pagar → cargar → liberar el lugar).
- **Rotación**: reglas para que no dejen el auto ocupando el cargador.
- **Compatibilidad**: Tipo 2, CCS2, CHAdeMO, Tipo 1, OCPP.
- **Packs**: Start, Solar, Carport Solar y Hub DC.
- **Calculadora de rentabilidad** y formulario de contacto que abre WhatsApp.

## Qué hay que configurar
Todo está al principio de [`js/main.js`](js/main.js), en el objeto `CONFIG`:

| Campo | Qué es |
|---|---|
| `whatsapp` | Número de WhatsApp con código de país (sin `+`). Hoy: 54 9 11 7643-8672. Lo usan el botón flotante y el formulario. |
| `priceArsPerKwh` | Tarifa de ejemplo de la demo de cobro |
| `graceMin`, `overstayArsPerMin` | Minutos de gracia y tarifa de ocupación de ejemplo |

Los precios de los packs están en [`index.html`](index.html) (sección `#packs`) y en el selector de la calculadora (`#rPack`). Son valores de referencia, hay que validarlos.

## Ver en local
```bash
python -m http.server 3100
```
Y abrir http://localhost:3100.

## Publicación
GitHub Pages desde la rama `main`, carpeta raíz.

## Fotos
Las imágenes de `assets/` son fotos reales de una instalación (carport solar con cargadores y auto eléctrico).
