# B.A. Crew — Yacht Charter Co.

Sitio de charters privados en Cabo San Lucas. Flota de 15 embarcaciones, 22 a 68 pies.

Sitio estático: un `index.html` sin build, sin dependencias y sin framework.
Se despliega arrastrando la carpeta a cualquier hosting estático.

## Estructura

```
index.html     todo el sitio: markup, estilos y lógica
img/           hero + 2 fotos por embarcación (y01a … y15b)
```

## Despliegue

Netlify, Vercel o Cloudflare Pages, sin configuración:

- **Build command:** ninguno
- **Publish directory:** la raíz del repo

## Antes de lanzar

- [ ] Quitar `<meta name="robots" content="noindex, nofollow">` del `<head>`
- [ ] Quitar la barra `#demo-bar` de prototipo
- [ ] Conectar Stripe Checkout al botón de depósito (`#pay-btn`)
- [ ] Conectar el formulario de inquiry (`#quote-form`) al CRM
- [ ] Sustituir teléfono, correo y número de muelle por los reales
- [ ] Definir y publicar el mínimo de horas por charter
- [ ] Dar de alta el dominio y el Google Business Profile

## Datos de la flota

Las 15 embarcaciones viven en el array `FLEET` dentro de `index.html`.
Cada entrada lleva eslora, huéspedes incluidos y máximos, tarifa por hora
en dos niveles (yacht only / all inclusive) en USD y MXN, costo por huésped
adicional y equipamiento a bordo.

El schema de Google (`Product` + `Offer` con precio por hora, `FAQPage`,
`LocalBusiness`) se genera desde ese mismo array: al cambiar una tarifa ahí,
el structured data se actualiza solo.

Las tarifas provienen del catálogo *Luxury Yacht Collection 2026–2027*.
