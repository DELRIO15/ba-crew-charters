# B.A. Crew — Yacht Charter Co.

Charters privados en Cabo San Lucas. Flota de 15 embarcaciones, 22 a 68 pies.

Sitio estático generado: 29 páginas con URL propia, sin framework y sin
dependencias. El build es un script de Node que lee los datos y escribe HTML.

## Estructura

```
build.mjs        generador: lee src/, escribe dist/
src/data.mjs     las 15 embarcaciones — fuente única de verdad
src/posts.mjs    artículos del blog
src/styles.css   estilos
src/app.js       filtros del listado y calculadora de reserva
img/             hero + 2 fotos por embarcación
```

## Build

```
node build.mjs            # borrador: robots.txt bloquea, meta noindex
DRAFT=false node build.mjs  # listo para publicar
```

Sale en `dist/`. Vercel lo corre solo con la configuración de `vercel.json`.

## Cambiar una tarifa

Se edita en `src/data.mjs` y nada más. De ahí salen la ficha del barco, la
tabla de tarifas, el selector de reserva, la calculadora, el sitemap, el
`llms.txt` y el structured data de Google.

## URLs

```
/                                  home
/boats/                            listado de la flota
/boats/<slug>/                     15 fichas
/charters/  /rates/  /faq/
/reserve/                          reserva en 3 pasos con cálculo de precio
/contact/
/blog/                             índice de guías
/blog/<slug>/                      6 artículos
/sitemap.xml  /robots.txt  /llms.txt
```

## SEO

- Title, meta description y canonical únicos por página, bajo 62 caracteres
- Un solo `<h1>` por página
- `BreadcrumbList` en todas las interiores; `Product` + `Offer` con precio por
  hora en cada barco; `FAQPage`; `BlogPosting` en los artículos
- `llms.txt` con la flota y las guías, para los motores de IA
- Enlazado interno cruzado entre flota, tarifas y blog

## Antes de lanzar

- [ ] `DRAFT=false` en las variables de entorno de Vercel
- [ ] Quitar la barra `#demo-bar` de borrador
- [ ] Conectar Stripe Checkout al botón de depósito (`#pay-btn`)
- [ ] Conectar los formularios al CRM
- [ ] Teléfono, correo y número de muelle reales
- [ ] Definir y publicar el mínimo de horas por charter
- [ ] Dominio y Google Business Profile
- [ ] Enviar el sitemap en Search Console y Bing Webmaster Tools

Las tarifas provienen del catálogo *Luxury Yacht Collection 2026–2027*.
