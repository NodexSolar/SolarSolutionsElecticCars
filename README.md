# Nodex E-Mobility

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

## Publicación
GitHub Pages desde la rama `main`, carpeta raíz.
