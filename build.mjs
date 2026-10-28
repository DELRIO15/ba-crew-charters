/* Generador estático. Lee src/data.mjs y src/posts.mjs y escribe dist/
   con una URL real por página. Sin framework y sin dependencias.
   node build.mjs */

import fs from "node:fs";
import path from "node:path";
import { FLEET, EXPERIENCES, INCLUDES, FAQS } from "./src/data.mjs";
import { POSTS } from "./src/posts.mjs";

const SITE = "https://caboyachtcharterco.com";
const BRAND = "B.A. Crew Yacht Charter Co.";
const OUT = "dist";
const DRAFT = process.env.DRAFT !== "false";   // noindex hasta que se lance

/* En estos tres la primera foto del catálogo era interior: la tarjeta
   del listado debe mostrar el barco por fuera. */
const EXTERIOR_IS_B = { "02": 1, "07": 1, "09": 1 };
const shotA = y => (EXTERIOR_IS_B[y.n] ? "b" : "a");
const shotB = y => (EXTERIOR_IS_B[y.n] ? "a" : "b");

const usd = n => "$" + n.toLocaleString("en-US");
const mxn = n => "$" + n.toLocaleString("en-US") + " MXN";
const unitLabel = y => (y.unit === "hour" ? "per hour" : y.unitNote || "per trip");
const sizeBand = ft => (ft <= 39 ? "s" : ft <= 49 ? "m" : "l");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const altA = y => `${y.name} ${y.feet} ft yacht charter in Cabo San Lucas`;
const altB = y => `${y.name} ${y.feet} ft — on board, private charter in Cabo San Lucas`;

/* Google corta el title alrededor de 60 caracteres: el sufijo de marca
   solo se añade si cabe, en vez de truncar lo que importa. */
const pageTitle = core => (core.length <= 46 ? core + " | B.A. Crew" : core);

const fmtDate = iso =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/* ───────────────────────── shell ───────────────────────── */

const NAV = [
  ["/boats/", "Boats"],
  ["/charters/", "Charters"],
  ["/rates/", "Rates"],
  ["/blog/", "Guides"],
  ["/faq/", "FAQ"],
  ["/contact/", "Contact"],
];

function crumbSchema(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem", position: i + 1, name: t[1],
      item: SITE + t[0],
    })),
  };
}

function shell({ url, title, desc, image, body, schema = [], trail = [], bodyClass = "", needsFleet = false }) {
  const canonical = SITE + url;
  const og = image || "/img/hero.jpg";
  const graph = [...schema];
  if (trail.length) graph.push(crumbSchema(trail));

  const crumbs = trail.length > 1
    ? `<nav class="crumbs" aria-label="Breadcrumb">${trail
        .map((t, i) => (i === trail.length - 1 ? esc(t[1]) : `<a href="${t[0]}">${esc(t[1])}</a>`))
        .join("<span>/</span>")}</nav>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
${DRAFT ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(BRAND)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}${og}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}${og}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230F3052'/%3E%3Cpath d='M5 20h22l-2 5H7z' fill='%23fff'/%3E%3Cpath d='M9 20V12h11l3 8' fill='none' stroke='%23fff' stroke-width='1.6'/%3E%3C/svg%3E">
<link rel="stylesheet" href="__REL__styles.css">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 0)}</script>
</head>
<body class="${bodyClass}">
<div id="demo-bar">Draft · B.A. Crew · caboyachtcharterco.com · payment not connected yet</div>

<header class="site">
  <div class="wrap navrow">
    <a href="/" class="brand" aria-label="${esc(BRAND)} home">
      <span class="mark">B.A. CREW</span>
      <span class="sub">Yacht Charter Co. · Cabo San Lucas</span>
    </a>
    <nav class="main" aria-label="Main">
      ${NAV.map(([h, l]) =>
        `<a href="${h}"${url.startsWith(h) && h !== "/" ? ' aria-current="page"' : ""}>${l}</a>`).join("\n      ")}
    </nav>
    <a href="/reserve/" class="btn btn-solid btn-sm">Reserve</a>
  </div>
</header>

<main>
${crumbs ? `<div class="wrap" style="padding-top:34px">${crumbs}</div>` : ""}
${body}
</main>

<footer class="site">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <span class="brand" style="display:block;margin-bottom:16px">
          <span class="mark" style="font-size:1.2rem">B.A. CREW</span>
          <span class="sub">Yacht Charter Co. · Cabo San Lucas</span>
        </span>
        <p style="font-size:.87rem;max-width:32ch">Private boat and yacht charters in Cabo San Lucas. Fifteen boats, 22 to 68 ft, leaving daily from Marina Cabo San Lucas, Baja California Sur.</p>
      </div>
      <div><h4>Boats</h4>
        ${FLEET.slice(0, 8).map(y => `<a href="/boats/${y.slug}/">${y.name} · ${y.feet} ft</a>`).join("\n        ")}
        <a href="/boats/">All fifteen boats</a>
      </div>
      <div><h4>Charters</h4>
        <a href="/charters/">Sunset cruise</a>
        <a href="/charters/">Snorkeling and beaches</a>
        <a href="/charters/">Bachelorette charter</a>
        <a href="/charters/">Corporate and events</a>
        <a href="/charters/">Sportfishing</a>
        <a href="/charters/">Whale watching</a>
      </div>
      <div><h4>Guides</h4>
        ${POSTS.slice(0, 4).map(p => `<a href="/blog/${p.slug}/">${esc(p.title.replace(/\?$/, ""))}</a>`).join("\n        ")}
        <a href="/blog/">All guides</a>
      </div>
      <div><h4>Information</h4>
        <a href="/rates/">Charter rates</a>
        <a href="/faq/">FAQ</a>
        <a href="/reserve/">Reserve</a>
        <a href="/contact/">Contact</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 B.A. CREW YACHT CHARTER CO. · CABOYACHTCHARTERCO.COM</span>
      <span>MARINA CABO SAN LUCAS, BCS, MEXICO</span>
    </div>
  </div>
</footer>
${needsFleet ? `<script>window.__FLEET=${JSON.stringify(
  FLEET.map(y => ({ n: y.n, slug: y.slug, name: y.name, feet: y.feet, guests: y.guests,
                    max: y.max, extraUsd: y.extraUsd, usd: y.usd, usdAll: y.usdAll,
                    unit: y.unit, unitNote: y.unitNote || null, shot: shotA(y) })))};</script>` : ""}
<script src="__REL__app.js" defer></script>
</body>
</html>`;
}

/* ───────────────────────── fragmentos ───────────────────────── */

const BUSINESS = {
  "@type": ["LocalBusiness", "TouristAttraction"],
  "@id": SITE + "/#business",
  name: BRAND,
  description: "Private crewed boat and yacht charters in Cabo San Lucas. Fifteen boats from 22 to 68 ft leaving Marina Cabo San Lucas.",
  url: SITE + "/",
  telephone: "+52-624-000-0000",
  email: "hello@caboyachtcharterco.com",
  priceRange: "$$",
  currenciesAccepted: "USD, MXN",
  address: { "@type": "PostalAddress", streetAddress: "Marina Cabo San Lucas",
    addressLocality: "Cabo San Lucas", addressRegion: "Baja California Sur",
    postalCode: "23450", addressCountry: "MX" },
  geo: { "@type": "GeoCoordinates", latitude: 22.888, longitude: -109.9114 },
  areaServed: [
    { "@type": "City", name: "Cabo San Lucas" },
    { "@type": "City", name: "San José del Cabo" },
    { "@type": "Place", name: "Los Cabos Corridor" },
  ],
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "08:00", closes: "20:00" }],
};

function boatProduct(y) {
  const offer = (name, price) => ({
    "@type": "Offer", name, priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: `${SITE}/boats/${y.slug}/`,
    seller: { "@id": SITE + "/#business" },
    priceSpecification: {
      "@type": "UnitPriceSpecification", price, priceCurrency: "USD",
      unitCode: y.unit === "hour" ? "HUR" : "E48",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: y.unit === "hour" ? "HUR" : "E48" },
    },
  });
  return {
    "@type": "Product",
    name: `${y.name} ${y.feet} ft`,
    url: `${SITE}/boats/${y.slug}/`,
    description: `${y.seoTitle}. ${y.blurb}`,
    image: [`${SITE}/img/y${y.n}${shotA(y)}.jpg`, `${SITE}/img/y${y.n}${shotB(y)}.jpg`],
    brand: { "@type": "Brand", name: y.name },
    category: y.type === "fishing" ? "Sportfishing charter" : "Boat charter",
    additionalProperty: [
      { "@type": "PropertyValue", name: "Length overall", value: y.feet, unitCode: "FOT" },
      { "@type": "PropertyValue", name: "Guests included", value: y.guests },
      { "@type": "PropertyValue", name: "Maximum guests", value: y.max },
    ],
    offers: [offer("Boat only", y.usd), offer("All inclusive", y.usdAll)],
  };
}

function listCard(y, eager) {
  return `<article class="lcard" data-type="${y.type}" data-size="${sizeBand(y.feet)}" data-max="${y.max}">
  <a href="/boats/${y.slug}/" class="shot-link" aria-label="${esc(y.seoTitle)}"><div class="shot">
    <img src="/img/y${y.n}${shotA(y)}.jpg" alt="${esc(altA(y))}" width="1200" height="900"${eager ? "" : ' loading="lazy"'}>
    ${y.flag ? `<span class="flag">${y.flag}</span>` : ""}
  </div></a>
  <p class="nmark" style="margin-top:15px">N° ${y.n}</p>
  <div class="lhead"><h3><a href="/boats/${y.slug}/">${y.name}</a></h3><span class="lfeet">${y.feet} FT</span></div>
  <div class="meta">${y.guests} guests included · up to ${y.max} aboard</div>
  <div class="lprice">
    <span class="amt">${usd(y.usd)} <span class="per">USD · ${unitLabel(y)}</span></span>
    <a href="/boats/${y.slug}/" class="rule-link">View</a>
  </div>
</article>`;
}

const expCard = e => `<div class="exp"><h3>${e.t}</h3><p>${e.d}</p><div class="dur">${e.dur}</div></div>`;
const faqHTML = l => l.map(f => `<details><summary>${f.q}</summary><div class="ans">${f.a}</div></details>`).join("\n");
const faqSchema = l => ({ "@type": "FAQPage", mainEntity: l.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });

const SEARCH_BAR = `<form class="search" id="search-bar">
  <div class="sfield"><label for="s-date">Date</label><input type="date" id="s-date"></div>
  <div class="sfield"><label for="s-guests">Guests</label><input type="number" id="s-guests" min="1" max="28" value="8"></div>
  <div class="sfield"><label for="s-hours">Hours</label>
    <select id="s-hours"><option>3 hours</option><option selected>4 hours</option><option>5 hours</option><option>6 hours</option><option>8 hours</option></select></div>
  <div class="sfield"><label for="s-occasion">Occasion</label>
    <select id="s-occasion"><option>Day cruise</option><option>Birthday</option><option>Bachelorette</option><option>Corporate</option><option>Sportfishing</option><option>Whale watching</option></select></div>
  <button type="submit" class="btn btn-solid">Check availability</button>
</form>`;

const FILTERS = `<div class="filterbar">
  <div class="fgroup"><span>Charter type</span>
    <div class="chips" id="f-type" role="group" aria-label="Filter by charter type">
      <button type="button" data-type="all" aria-pressed="true">All</button>
      <button type="button" data-type="cruise" aria-pressed="false">Cruising</button>
      <button type="button" data-type="fishing" aria-pressed="false">Sportfishing</button>
    </div></div>
  <div class="fgroup"><span>Length</span>
    <div class="chips" id="f-size" role="group" aria-label="Filter by length">
      <button type="button" data-size="all" aria-pressed="true">All</button>
      <button type="button" data-size="s" aria-pressed="false">22–39 ft</button>
      <button type="button" data-size="m" aria-pressed="false">40–49 ft</button>
      <button type="button" data-size="l" aria-pressed="false">60–68 ft</button>
    </div></div>
</div>
<p class="count" id="count"></p>`;

const ROUTE_MAP = `<div class="route-wrap">
<svg viewBox="0 0 840 300" role="img" aria-label="Route map of a Cabo San Lucas boat charter: Marina Cabo San Lucas, El Arco, Lover's Beach, Pelican Rock, Chileno Bay and Santa María Bay">
  <path d="M28 240 L122 212 L216 200 L338 178 L480 152 L622 128 L800 114" fill="none" stroke="#13293F" stroke-opacity=".09" stroke-width="26" stroke-linecap="square"/>
  <path d="M40 264 Q 124 246 206 242 T 410 216 T 634 172 T 806 142" fill="none" stroke="#A8762F" stroke-width="1.8" stroke-dasharray="6 7"/>
  <path d="M124 260 Q 174 230 234 254" fill="none" stroke="#0F3052" stroke-width="2"/>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#4B6678" letter-spacing="1.2">
    <rect x="39" y="259" width="7" height="7" fill="#0F3052"/><text x="42" y="286" text-anchor="middle">MARINA</text>
    <rect x="130" y="249" width="7" height="7" fill="#0F3052"/><text x="133" y="236" text-anchor="middle">EL ARCO</text>
    <rect x="230" y="247" width="7" height="7" fill="#0F3052"/><text x="233" y="280" text-anchor="middle">LOVER'S BEACH</text>
    <rect x="324" y="222" width="7" height="7" fill="#0E7490"/><text x="327" y="210" text-anchor="middle">PELICAN ROCK</text>
    <rect x="568" y="178" width="7" height="7" fill="#0E7490"/><text x="571" y="208" text-anchor="middle">CHILENO BAY</text>
    <rect x="748" y="146" width="7" height="7" fill="#0E7490"/><text x="751" y="134" text-anchor="middle">SANTA MARÍA</text>
  </g>
  <text x="806" y="286" font-family="IBM Plex Mono, monospace" font-size="9" fill="#4B6678" text-anchor="end" opacity=".8">≈ 14 NAUTICAL MILES</text>
</svg>
<div class="route-legend">
  <span><span class="dot" style="background:#0F3052"></span>3 to 4 hour charters</span>
  <span><span class="dot" style="background:#0E7490"></span>6 to 8 hour charters</span>
</div></div>`;

const CTA = `<section class="cta-band"><div class="wrap cta-row">
  <div style="min-width:0"><h2>Got a date in mind?</h2>
  <p>Pick your boat and the price is on screen before you give us a single detail. No waiting on a quote.</p></div>
  <div style="display:flex;gap:14px;flex-wrap:wrap">
    <a href="/reserve/" class="btn btn-gold">Reserve now</a>
    <a href="/contact/" class="btn btn-line">Ask a question</a>
  </div>
</div></section>`;

/* ───────────────────────── páginas ───────────────────────── */

const pages = [];
const add = (url, html) => pages.push({ url, html });

/* home */
add("/", shell({
  url: "/", needsFleet: false,
  title: pageTitle("Private Boat & Yacht Charters in Cabo San Lucas"),
  desc: "Fifteen private charter boats in Cabo San Lucas, 22 to 68 ft, with captain and crew. Published hourly rates from $75. Sunset cruises, snorkeling, sportfishing and group charters.",
  schema: [BUSINESS,
    { "@type": "WebSite", "@id": SITE + "/#website", url: SITE + "/", name: BRAND,
      inLanguage: "en-US", publisher: { "@id": SITE + "/#business" } },
    { "@type": "ItemList", name: "Boats for charter in Cabo San Lucas",
      numberOfItems: FLEET.length,
      itemListElement: FLEET.map((y, i) => ({ "@type": "ListItem", position: i + 1, item: boatProduct(y) })) },
    faqSchema(FAQS.slice(0, 4))],
  body: `
<div class="hero">
  <div class="hero-photo"><img src="/img/hero.jpg" alt="A yacht anchored at El Arco, Land's End, Cabo San Lucas" width="1900" height="1425" fetchpriority="high"></div>
  <div class="wrap hero-inner">
    <p class="kicker">Private charters · Marina Cabo San Lucas</p>
    <h1>Your own boat for the day, from $75 an hour</h1>
    <p class="lede">Fifteen boats, 22 to 68 ft, with a captain and crew on every charter. No crowded group tours, no quote-on-request — the hourly rate is right here.</p>
  </div>
</div>
<div class="wrap search-mount">${SEARCH_BAR}</div>

<section class="band" id="boats">
  <div class="wrap">
    <div class="sec-head"><div><p class="kicker">Pick your boat</p><h2>Our boats</h2></div>
      <a href="/rates/" class="rule-link">All charter rates</a></div>
    ${FILTERS}
    <div class="listing" id="listing">${FLEET.map((y, i) => listCard(y, i < 3)).join("\n")}</div>
  </div>
</section>

<section class="band lined paper"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Charter types</p><h2>What people book</h2>
    <p>Same marina, same crews. What changes is the route, the hour you leave and what comes aboard.</p></div>
    <a href="/charters/" class="rule-link">All charter types</a></div>
  <div class="exp-grid">${EXPERIENCES.slice(0, 3).map(expCard).join("\n")}</div>
</div></section>

<section class="band lined"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Two ways to book</p><h2>What&rsquo;s included</h2>
    <p>Every boat is priced both ways, by the hour. Boat-only covers the vessel, captain, crew and fuel. All-inclusive adds the bar, the food and the service — and on some boats it costs only $20 an hour more.</p></div></div>
  <ul class="incl">${INCLUDES.map((t, i) => `<li><span class="ix">${String(i + 1).padStart(2, "0")}</span>${t}</li>`).join("\n")}</ul>
</div></section>

<section class="band lined"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Itinerary</p><h2>Where you&rsquo;ll go</h2>
    <p>The standard route leaves the marina, rounds Land&rsquo;s End past El Arco, and runs up the Sea of Cortez coast. Six hours or more reaches Santa María and Chileno Bay.</p></div></div>
  ${ROUTE_MAP}
</div></section>

<section class="band lined paper"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Guides</p><h2>Planning a day on the water</h2>
    <p>What a charter costs, when to come, and how to pick the right boat — written from fifteen boats&rsquo; worth of actual bookings.</p></div>
    <a href="/blog/" class="rule-link">All guides</a></div>
  <div class="post-grid">${POSTS.slice(0, 3).map(p => `<a class="post-card" href="/blog/${p.slug}/"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="pm">${p.readMin} min read</span></a>`).join("\n")}</div>
</div></section>

<section class="band lined"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Questions</p><h2>Common questions</h2></div>
    <a href="/faq/" class="rule-link">All questions</a></div>
  <div class="faq">${faqHTML(FAQS.slice(0, 4))}</div>
</div></section>
${CTA}`,
}));

/* listado de barcos */
add("/boats/", shell({
  url: "/boats/",
  title: pageTitle("Charter Boats in Cabo San Lucas — 22 to 68 ft"),
  desc: "Every boat we charter in Cabo San Lucas, from a 22 ft Sea Ray at $75 an hour to a 68 ft Azimut. Capacity, specs and hourly rates for all fifteen.",
  trail: [["/", "Home"], ["/boats/", "Boats"]],
  schema: [{ "@type": "ItemList", name: "Charter boat fleet in Cabo San Lucas",
    numberOfItems: FLEET.length,
    itemListElement: FLEET.map((y, i) => ({ "@type": "ListItem", position: i + 1, item: boatProduct(y) })) }],
  body: `<section class="band" style="padding-top:18px"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Available to charter</p>
    <h1 style="font-size:clamp(1.6rem,3.2vw,2.2rem);font-weight:600;letter-spacing:-.012em;margin-top:11px">Boat and yacht charters in Cabo San Lucas</h1>
    <p>Fifteen boats from 22 to 68 ft, all leaving from Marina Cabo San Lucas with a captain and crew. The rate is hourly and covers the whole boat, however many of you come.</p></div></div>
  ${FILTERS}
  <div class="listing" id="listing">${FLEET.map((y, i) => listCard(y, i < 3)).join("\n")}</div>
</div></section>${CTA}`,
}));

/* ficha por barco */
for (const y of FLEET) {
  const specs = [
    ["Length", y.feet + " ft"],
    ["Guests included", y.guests],
    ["Maximum aboard", y.max],
    ["Charter type", y.type === "fishing" ? "Sportfishing" : "Cruising"],
    ["Rate basis", y.unit === "hour" ? "Per hour" : y.unitNote || "Per trip"],
  ];
  if (y.extraUsd > 0) specs.push(["Additional guest", `${usd(y.extraUsd)} / ${mxn(y.extraMxn)}`]);

  const lblA = y.unit === "hour" ? "Boat only" : "Boat only" + (y.unitNote === "5 hrs / 8 hrs" ? " · 5 hrs" : "");
  const lblB = y.unit === "hour" ? "All inclusive" : "All inclusive" + (y.unitNote === "5 hrs / 8 hrs" ? " · 8 hrs" : "");

  const related = FLEET
    .filter(o => o.slug !== y.slug && o.type === y.type)
    .sort((a, b) => Math.abs(a.feet - y.feet) - Math.abs(b.feet - y.feet))
    .slice(0, 3);

  add(`/boats/${y.slug}/`, shell({
    url: `/boats/${y.slug}/`,
    title: pageTitle(y.seoTitle),
    desc: `${y.name} ${y.feet} ft in Cabo San Lucas: ${y.guests} guests included, up to ${y.max} aboard, from ${usd(y.usd)} ${unitLabel(y)}. ${y.best}.`,
    image: `/img/y${y.n}${shotA(y)}.jpg`,
    trail: [["/", "Home"], ["/boats/", "Boats"], [`/boats/${y.slug}/`, `${y.name} ${y.feet} ft`]],
    schema: [boatProduct(y)],
    body: `<section class="band" style="padding-top:18px"><div class="wrap">
<div class="detail-top">
  <div>
    <div class="gallery">
      <figure><img src="/img/y${y.n}${shotA(y)}.jpg" alt="${esc(altA(y))}" width="1200" height="900">
        ${y.flag ? `<span class="flagtag">${y.flag}</span>` : ""}</figure>
      <figure><img src="/img/y${y.n}${shotB(y)}.jpg" alt="${esc(altB(y))}" width="1200" height="900" loading="lazy"></figure>
    </div>
    <p class="nmark" style="margin-top:30px">N° ${y.n}</p>
    <h1 style="font-size:clamp(1.7rem,3.8vw,2.5rem);font-weight:600;letter-spacing:-.012em;margin-top:12px">${esc(y.seoTitle)}</h1>
    <p class="soft" style="margin-top:18px;max-width:60ch">${y.blurb}</p>
    <p style="margin-top:16px;font-size:.95rem"><strong style="font-weight:600">Best for:</strong> ${y.best}</p>
    <h2 class="kicker" style="margin-top:36px;margin-bottom:16px">On board</h2>
    <div class="aboard">${y.aboard.map(a => `<div>${a}</div>`).join("")}</div>
    ${related.length ? `<h2 class="kicker" style="margin-top:40px;margin-bottom:14px">Similar boats</h2>
    <div class="next-read" style="border-top:1px solid var(--line);margin-top:0;padding-top:4px;max-width:none">
      ${related.map(o => `<a href="/boats/${o.slug}/">${o.name} ${o.feet} ft<span>${o.guests} guests included · from ${usd(o.usd)} ${unitLabel(o)}</span></a>`).join("\n      ")}
    </div>` : ""}
    <p class="soft" style="margin-top:30px;font-size:.95rem">See the <a href="/boats/" style="color:var(--accent)">full fleet</a>, compare <a href="/rates/" style="color:var(--accent)">every charter rate</a>, or read <a href="/blog/how-much-does-a-yacht-charter-cost-in-cabo-san-lucas/" style="color:var(--accent)">what a charter actually costs</a>.</p>
  </div>
  <div class="side-block">
    <div class="ratecard">
      <h3>Charter rates · ${y.unit === "hour" ? "per hour" : "per trip"}</h3>
      <div class="raterow"><span class="lbl">${lblA}</span>
        <span class="val"><span class="usd">${usd(y.usd)}</span><span class="cur">USD</span><span class="mx">${mxn(y.mxn)}</span></span></div>
      <div class="raterow"><span class="lbl">${lblB}</span>
        <span class="val"><span class="usd">${usd(y.usdAll)}</span><span class="cur">USD</span><span class="mx">${mxn(y.mxnAll)}</span></span></div>
    </div>
    <div class="side-pad">
      <h2 class="kicker">Specifications</h2>
      <table class="spec-table">${specs.map(r => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</table>
      <p class="hint">Whole boat, not per person. Includes captain and crew, fuel, permits and marina fees.</p>
      <a href="/reserve/?boat=${y.slug}" class="btn btn-solid">Reserve this boat</a>
      <a href="/contact/" class="btn btn-line" style="margin-top:-8px">Ask a question</a>
    </div>
  </div>
</div>
</div></section>`,
  }));
}

/* charters */
add("/charters/", shell({
  url: "/charters/",
  title: pageTitle("Charter Types in Cabo San Lucas"),
  desc: "Sunset cruises at El Arco, morning snorkeling at Pelican Rock, bachelorette charters, corporate days, sportfishing and whale watching — all private, all from Marina Cabo San Lucas.",
  trail: [["/", "Home"], ["/charters/", "Charters"]],
  body: `<section class="band" style="padding-top:18px"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Charter types</p>
    <h1 style="font-size:clamp(1.6rem,3.2vw,2.2rem);font-weight:600;letter-spacing:-.012em;margin-top:11px">Ways to spend the day</h1>
    <p>Every charter leaves from the same marina and gets built around your group. Pick whichever is closest to your day and we adjust from there — nothing here is a fixed package.</p></div></div>
  <div class="exp-grid">${EXPERIENCES.map(expCard).join("\n")}</div>
  <div class="sec-head" style="margin-top:62px"><div><p class="kicker">Itinerary</p><h2>Where you&rsquo;ll go</h2></div></div>
  ${ROUTE_MAP}
</div></section>${CTA}`,
}));

/* tarifas */
add("/rates/", shell({
  url: "/rates/",
  title: pageTitle("Cabo San Lucas Charter Rates 2026–2027"),
  desc: "Published hourly charter rates for every boat in Cabo San Lucas, boat-only and all-inclusive, in USD and MXN. From $75 an hour. No hidden fees.",
  trail: [["/", "Home"], ["/rates/", "Rates"]],
  schema: [{ "@type": "ItemList", name: "Charter rates in Cabo San Lucas",
    itemListElement: FLEET.map((y, i) => ({ "@type": "ListItem", position: i + 1, item: boatProduct(y) })) }],
  body: `<section class="band" style="padding-top:18px"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">2026 – 2027 rates · no hidden fees</p>
    <h1 style="font-size:clamp(1.6rem,3.2vw,2.2rem);font-weight:600;letter-spacing:-.012em;margin-top:11px">What a charter costs</h1>
    <p>Hourly rate for the whole boat, in dollars and pesos. Split between your group it works out lower than most shared tours. Fishing boats go by the trip instead of by the hour.</p></div></div>
  <div class="table-scroll"><table class="rates">
    <caption class="vh">Hourly charter rates in Cabo San Lucas, boat-only and all-inclusive, in US dollars and Mexican pesos</caption>
    <thead><tr><th scope="col">Boat</th><th scope="col">Length</th><th scope="col">Guests</th>
      <th scope="col">Boat only</th><th scope="col">All inclusive</th><th scope="col">Extra guest</th></tr></thead>
    <tbody>${FLEET.map(y => `<tr>
      <td class="name"><a href="/boats/${y.slug}/">${y.name}</a></td>
      <td class="n">${y.feet} ft</td><td class="n">${y.guests} / ${y.max}</td>
      <td class="n">${usd(y.usd)}<span class="mxn">${mxn(y.mxn)} · ${unitLabel(y)}</span></td>
      <td class="n">${usd(y.usdAll)}<span class="mxn">${mxn(y.mxnAll)}</span></td>
      <td class="n">${y.extraUsd > 0 ? usd(y.extraUsd) : "—"}</td></tr>`).join("\n")}</tbody>
  </table></div>
  <div style="margin-top:38px;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:32px">
    <div><h2 class="kicker" style="margin-bottom:12px">Boat only</h2>
      <p class="soft" style="font-size:.95rem">Covers the vessel, captain and crew, fuel, port permits and marina fees. You bring your own food and drinks; there is no corkage.</p></div>
    <div><h2 class="kicker" style="margin-bottom:12px">All inclusive</h2>
      <p class="soft" style="font-size:.95rem">Adds the domestic open bar, food prepared aboard, ice and service. The difference per hour is listed for every boat above.</p></div>
    <div><h2 class="kicker" style="margin-bottom:12px">Not in the rate</h2>
      <p class="soft" style="font-size:.95rem">Crew gratuity, 15 to 20%, cash at the end. High season surcharge of 20% from December 15 to January 5 and Easter week. Extras like a private chef or jet ski.</p></div>
  </div>
  <p class="soft" style="margin-top:36px;font-size:.95rem;max-width:68ch">For a worked example of what a real four-hour day comes to once gratuity is added, read <a href="/blog/how-much-does-a-yacht-charter-cost-in-cabo-san-lucas/" style="color:var(--accent)">how much a charter costs in Cabo San Lucas</a>.</p>
</div></section>${CTA}`,
}));

/* faq */
add("/faq/", shell({
  url: "/faq/",
  title: pageTitle("Cabo San Lucas Boat Charter FAQ"),
  desc: "Whether rates are per person, what happens if the port closes, how much to tip the crew, which boats have air conditioning and how far ahead to book in Cabo San Lucas.",
  trail: [["/", "Home"], ["/faq/", "FAQ"]],
  schema: [faqSchema(FAQS)],
  body: `<section class="band" style="padding-top:18px"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Questions</p>
    <h1 style="font-size:clamp(1.6rem,3.2vw,2.2rem);font-weight:600;letter-spacing:-.012em;margin-top:11px">Cabo San Lucas charter FAQ</h1></div></div>
  <div class="faq">${faqHTML(FAQS)}</div>
  <p class="soft" style="margin-top:38px;font-size:.95rem;max-width:68ch">Still deciding? The guides go deeper on <a href="/blog/how-much-does-a-yacht-charter-cost-in-cabo-san-lucas/" style="color:var(--accent)">cost</a>, <a href="/blog/best-time-of-year-yacht-charter-cabo-san-lucas/" style="color:var(--accent)">when to come</a> and <a href="/blog/how-many-people-fit-on-a-charter-boat-cabo/" style="color:var(--accent)">how many people fit</a>.</p>
</div></section>${CTA}`,
}));

/* reserva */
add("/reserve/", shell({
  url: "/reserve/", needsFleet: true,
  title: pageTitle("Reserve a Private Charter in Cabo"),
  desc: "Pick your boat, date and package and see the total before giving us any details. A 50% deposit holds the date.",
  trail: [["/", "Home"], ["/reserve/", "Reserve"]],
  body: `<section class="band" style="padding-top:18px"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Reservation</p>
    <h1 style="font-size:clamp(1.6rem,3.2vw,2.2rem);font-weight:600;letter-spacing:-.012em;margin-top:11px">Reserve your charter</h1>
    <p>Pick the boat, the date and the package. The price updates as you go, and half up front holds the date.</p></div></div>

  <div class="steps" id="steps">
    <div aria-current="step" data-step="1"><span class="sn">01</span>Charter</div>
    <div data-step="2"><span class="sn">02</span>Details</div>
    <div data-step="3"><span class="sn">03</span>Payment</div>
  </div>

  <div class="book-layout">
    <div>
      <div class="step-panel on" data-panel="1">
        <h2 class="step-title">Choose your boat</h2>
        <p class="soft" style="font-size:.95rem">Fifteen boats, 22 to 68 ft. The rate covers the whole boat, not each person.</p>
        <div class="ypick" id="ypick"></div>

        <h2 class="step-title" style="margin-top:44px">Date and duration</h2>
        <div class="field-grid" style="margin-top:20px">
          <div class="field"><label for="r-date">Charter date</label><input type="date" id="r-date" required></div>
          <div class="field"><label for="r-time">Departure</label>
            <select id="r-time"><option>09:00</option><option selected>13:00</option><option>16:30</option></select></div>
          <div class="field"><label for="r-hours">Hours</label>
            <select id="r-hours"><option>3</option><option selected>4</option><option>5</option><option>6</option><option>8</option></select></div>
          <div class="field"><label for="r-guests">Guests</label><input type="number" id="r-guests" min="1" max="28" value="8"></div>
        </div>
        <p class="hint" id="cap-warn" hidden style="color:var(--gold);margin-top:14px"></p>

        <h2 class="step-title" style="margin-top:44px">Package</h2>
        <div class="pack" id="pack">
          <label><input type="radio" name="rp" value="only"><span class="pk">
            <span class="pk-name">Boat only</span>
            <span class="pk-desc">Vessel, captain and crew, fuel, permits and marina fees. Bring your own food and drinks, no corkage.</span>
            <span class="pk-rate" id="pk-rate-only">—</span></span></label>
          <label><input type="radio" name="rp" value="all" checked><span class="pk">
            <span class="pk-name">All inclusive</span>
            <span class="pk-desc">Adds the domestic open bar, food prepared aboard, ice and service.</span>
            <span class="pk-rate" id="pk-rate-all">—</span></span></label>
        </div>

        <div class="navbtns">
          <button type="button" class="btn btn-solid" data-go="2">Continue</button>
          <a href="/contact/" class="rule-link">Rather ask a question first?</a>
        </div>
      </div>

      <div class="step-panel" data-panel="2">
        <h2 class="step-title">Your details</h2>
        <p class="soft" style="font-size:.95rem">We use these to confirm availability and send the charter agreement.</p>
        <form id="reserve-form" novalidate>
          <div class="field-grid" style="margin-top:24px">
            <div class="field"><label for="r-name">Full name</label><input type="text" id="r-name" autocomplete="name" required></div>
            <div class="field"><label for="r-email">Email</label><input type="email" id="r-email" autocomplete="email" required></div>
            <div class="field"><label for="r-phone">WhatsApp or phone</label><input type="tel" id="r-phone" autocomplete="tel" placeholder="+1 555 000 0000" required></div>
            <div class="field"><label for="r-occasion">Occasion</label>
              <select id="r-occasion"><option>Day cruise</option><option>Birthday</option><option>Bachelorette or bachelor party</option><option>Anniversary or proposal</option><option>Corporate event</option><option>Sportfishing</option><option>Whale watching</option></select></div>
            <div class="field full"><label for="r-pickup">Hotel or villa for pickup</label><input type="text" id="r-pickup" placeholder="Included in Cabo San Lucas, the Corridor and San José del Cabo"></div>
            <div class="field full"><label for="r-notes">Anything we should know</label><textarea id="r-notes" placeholder="Allergies, kids aboard, decoration, music…"></textarea></div>
          </div>
        </form>
        <div class="navbtns">
          <button type="button" class="btn btn-solid" data-go="3">Continue to payment</button>
          <button type="button" class="btn btn-line" data-go="1">Back</button>
        </div>
      </div>

      <div class="step-panel" data-panel="3">
        <h2 class="step-title">Secure the date</h2>
        <p class="soft" style="font-size:.95rem">A 50% deposit holds your charter. The balance is due on the day, aboard or by transfer.</p>
        <div class="checkout">
          <div class="checkout-head"><h3>Deposit due now</h3><span class="amt" id="pay-amount">—</span></div>
          <div class="checkout-body">
            <div id="pay-recap" style="font-size:.92rem;color:var(--ink-2);line-height:1.9"></div>
            <button type="button" class="btn btn-solid" id="pay-btn" style="margin-top:22px;width:100%">Continue to secure checkout</button>
            <div class="securerow">
              <svg width="13" height="15" viewBox="0 0 13 15" fill="none" aria-hidden="true">
                <rect x="1" y="6" width="11" height="8" stroke="currentColor" stroke-width="1.2"/>
                <path d="M3.5 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.2"/></svg>
              Card details are handled by Stripe · we never see them
            </div>
            <div class="paynote" id="pay-note" hidden></div>
          </div>
        </div>
        <div class="navbtns"><button type="button" class="btn btn-line" data-go="2">Back</button></div>
      </div>
    </div>

    <aside class="summary" id="summary">
      <div class="sum-head"><h2>Your charter</h2>
        <div class="sum-yacht" id="sum-yacht">—</div>
        <div class="sum-sub" id="sum-sub">Select a boat to begin</div></div>
      <div class="sum-body" id="sum-body"></div>
    </aside>
  </div>
</div></section>`,
}));

/* contacto */
add("/contact/", shell({
  url: "/contact/",
  title: pageTitle("Contact — Cabo San Lucas Charters"),
  desc: "Ask about a charter in Cabo San Lucas. Same-day reply, 8am to 8pm Cabo time. WhatsApp is fastest.",
  trail: [["/", "Home"], ["/contact/", "Contact"]],
  body: `<section class="band" style="padding-top:18px"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Get in touch</p>
    <h1 style="font-size:clamp(1.6rem,3.2vw,2.2rem);font-weight:600;letter-spacing:-.012em;margin-top:11px">Send us a question</h1>
    <p>Not ready to book yet? Ask whatever you need and we answer the same day, no obligation. If you already know what you want, <a href="/reserve/" style="color:var(--accent)">reserve directly</a> and see the price on screen.</p></div></div>
  <div class="form-layout">
    <form id="quote-form" novalidate>
      <div class="field-grid">
        <div class="field"><label for="q-date">Charter date</label><input type="date" id="q-date"></div>
        <div class="field"><label for="q-hours">Hours</label>
          <select id="q-hours"><option>3 hours</option><option selected>4 hours</option><option>5 hours</option><option>6 hours</option><option>8 hours</option><option>Multi-day</option></select></div>
        <div class="field"><label for="q-guests">Number of guests</label><input type="number" id="q-guests" min="1" max="28" value="8"></div>
        <div class="field"><label for="q-yacht">Boat</label>
          <select id="q-yacht"><option value="No preference">No preference</option>
            ${FLEET.map(y => `<option value="${y.name} ${y.feet} ft">${y.name} ${y.feet} ft · up to ${y.max} guests</option>`).join("\n            ")}</select></div>
        <div class="field full"><label for="q-occasion">Occasion</label>
          <select id="q-occasion"><option>Day cruise</option><option>Birthday</option><option>Bachelorette or bachelor party</option><option>Anniversary or proposal</option><option>Corporate event</option><option>Sportfishing</option><option>Whale watching</option></select></div>
        <div class="field"><label for="q-name">Name</label><input type="text" id="q-name" autocomplete="name" required></div>
        <div class="field"><label for="q-email">Email</label><input type="email" id="q-email" autocomplete="email" required></div>
        <div class="field full"><label for="q-phone">WhatsApp or phone</label><input type="tel" id="q-phone" autocomplete="tel" placeholder="+1 555 000 0000"></div>
        <div class="field full"><label for="q-notes">Your question</label><textarea id="q-notes" placeholder="Allergies, kids aboard, preferred departure time, decoration…"></textarea></div>
      </div>
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-top:32px">
        <button type="submit" class="btn btn-solid">Send</button>
        <span class="hint">Same-day reply, 8am to 8pm Cabo time.</span>
      </div>
      <div id="quote-result" hidden>
        <p class="kicker">Ready to send</p>
        <p class="soft" style="font-size:.92rem;margin-top:11px">This draft does not send email yet. Copy the summary and send it over WhatsApp until the form is wired up.</p>
        <div id="quote-summary"></div>
        <button type="button" class="btn btn-line btn-sm" id="copy-btn" style="margin-top:17px">Copy summary</button>
      </div>
    </form>
    <aside class="side-block"><div class="side-pad">
      <div><h2 class="kicker">Direct contact</h2>
        <p style="margin-top:11px;font-size:.95rem" class="soft">WhatsApp gets a faster answer than email.</p></div>
      <div class="contact-line"><span class="lbl">WhatsApp</span><span class="val">+52 624 000 0000</span></div>
      <div class="contact-line"><span class="lbl">Email</span><span class="val">hello@caboyachtcharterco.com</span></div>
      <div class="contact-line"><span class="lbl">Departure</span><span class="val">Marina Cabo San Lucas<br>Dock number TBC</span></div>
      <div style="border-top:1px solid var(--line);padding-top:19px">
        <p class="soft" style="font-size:.9rem">Charters leave at 9:00, 13:00 and 16:30. The sunset departure shifts by month.</p></div>
    </div></aside>
  </div>
</div></section>`,
}));

/* blog índice */
add("/blog/", shell({
  url: "/blog/",
  title: pageTitle("Cabo San Lucas Charter Guides"),
  desc: "Practical guides to chartering a boat in Cabo San Lucas: what it costs, when to come, private versus group tours, El Arco, whale season and how many people fit.",
  trail: [["/", "Home"], ["/blog/", "Guides"]],
  schema: [{ "@type": "Blog", "@id": SITE + "/blog/#blog", name: "Cabo charter guides",
    url: SITE + "/blog/", publisher: { "@id": SITE + "/#business" },
    blogPost: POSTS.map(p => ({ "@type": "BlogPosting", headline: p.title,
      url: `${SITE}/blog/${p.slug}/`, datePublished: p.published, dateModified: p.updated })) }],
  body: `<section class="band" style="padding-top:18px"><div class="wrap">
  <div class="sec-head"><div><p class="kicker">Guides</p>
    <h1 style="font-size:clamp(1.6rem,3.2vw,2.2rem);font-weight:600;letter-spacing:-.012em;margin-top:11px">Planning a day on the water</h1>
    <p>What a charter costs, when to come, and how to pick the right boat — written from fifteen boats&rsquo; worth of actual bookings, with the numbers left in.</p></div></div>
  <div class="post-grid">${POSTS.map(p => `<a class="post-card" href="/blog/${p.slug}/">
    <h2 style="font-size:1.14rem;font-weight:600;letter-spacing:-.008em">${esc(p.title)}</h2>
    <p>${esc(p.description)}</p><span class="pm">${p.readMin} min read · ${fmtDate(p.updated)}</span></a>`).join("\n")}</div>
</div></section>${CTA}`,
}));

/* artículos */
POSTS.forEach((p, i) => {
  const others = POSTS.filter(o => o.slug !== p.slug).slice(0, 3);
  add(`/blog/${p.slug}/`, shell({
    url: `/blog/${p.slug}/`,
    title: pageTitle(p.title),
    desc: p.description,
    trail: [["/", "Home"], ["/blog/", "Guides"], [`/blog/${p.slug}/`, p.title]],
    schema: [{
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.published,
      dateModified: p.updated,
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${p.slug}/` },
      image: [`${SITE}/img/hero.jpg`],
      author: { "@type": "Organization", name: BRAND, url: SITE + "/" },
      publisher: { "@id": SITE + "/#business" },
      isPartOf: { "@id": SITE + "/blog/#blog" },
    }],
    body: `<section class="band" style="padding-top:18px"><div class="wrap">
  <div class="article-head">
    <p class="kicker">Guide</p>
    <h1 style="font-size:clamp(1.75rem,3.6vw,2.5rem);font-weight:600;letter-spacing:-.016em;margin-top:12px">${esc(p.title)}</h1>
    <div class="article-meta">
      <span>${p.readMin} min read</span>
      <span>Updated ${fmtDate(p.updated)}</span>
      <span>Cabo San Lucas</span>
    </div>
  </div>
  <div class="prose article-body" style="margin-top:34px">${p.body.trim()}</div>
  <div class="next-read">
    <h2>Keep reading</h2>
    ${others.map(o => `<a href="/blog/${o.slug}/">${esc(o.title)}<span>${esc(o.description)}</span></a>`).join("\n    ")}
  </div>
</div></section>${CTA}`,
  }));
});

/* ───────────────────────── escribir ───────────────────────── */

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/* Los enlaces se escriben absolutos ("/boats/") porque así se leen mejor,
   y aquí se convierten a relativos según la profundidad de cada página.
   Las URL absolutas del schema y del canonical no se tocan: llevan https. */
function relativize(html, url) {
  const depth = url === "/" ? 0 : url.replace(/^\/|\/$/g, "").split("/").length;
  const rel = depth === 0 ? "./" : "../".repeat(depth);
  return html
    .replace(/__REL__/g, rel)
    .replace(/(href|src)="\/(?!\/)/g, `$1="${rel}`)
    .replace(new RegExp(`(href|src)="${rel}"`, "g"), `$1="${rel}index.html"`);
}

for (const { url, html } of pages) {
  const dir = path.join(OUT, url === "/" ? "" : url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), relativize(html, url));
}

/* estáticos */
fs.copyFileSync("src/styles.css", path.join(OUT, "styles.css"));
fs.copyFileSync("src/app.js", path.join(OUT, "app.js"));
fs.cpSync("img", path.join(OUT, "img"), { recursive: true });

/* sitemap */
const today = new Date().toISOString().slice(0, 10);
const prio = u => (u === "/" ? "1.0" : /^\/(boats|rates|reserve)\/$/.test(u) ? "0.9"
                 : u.startsWith("/boats/") ? "0.8" : u.startsWith("/blog/") ? "0.7" : "0.6");
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(({ url }) => {
  const post = POSTS.find(p => url === `/blog/${p.slug}/`);
  return `  <url>
    <loc>${SITE}${url}</loc>
    <lastmod>${post ? post.updated : today}</lastmod>
    <changefreq>${url.startsWith("/blog/") ? "monthly" : "weekly"}</changefreq>
    <priority>${prio(url)}</priority>
  </url>`;
}).join("\n")}
</urlset>
`);

/* robots */
fs.writeFileSync(path.join(OUT, "robots.txt"),
DRAFT
? `# Borrador: fuera de los buscadores hasta el lanzamiento.
# Para publicar: DRAFT=false node build.mjs
User-agent: *
Disallow: /
`
: `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

/* llms.txt — para los motores de IA */
fs.writeFileSync(path.join(OUT, "llms.txt"),
`# ${BRAND}

> Private boat and yacht charters in Cabo San Lucas, Baja California Sur, Mexico.
> Fifteen boats from 22 to 68 ft, crewed, leaving from Marina Cabo San Lucas.
> Rates are hourly and cover the whole boat, not per person. Published, not quote-on-request.

Departures: 09:00, 13:00 and 16:30 daily. Round-trip hotel transfer included in Cabo San
Lucas, the Corridor and San José del Cabo. Two packages on every boat: boat-only (vessel,
captain and crew, fuel, permits, marina fees) and all-inclusive (adds domestic open bar,
food prepared aboard, ice and service). Crew gratuity of 15–20% is not included. A 20%
surcharge applies December 15 – January 5 and Easter week.

## Fleet

${FLEET.map(y => `- [${y.name} ${y.feet} ft](${SITE}/boats/${y.slug}/): ${y.guests} guests included, up to ${y.max} aboard. Boat only ${usd(y.usd)} ${unitLabel(y)}, all inclusive ${usd(y.usdAll)}. ${y.best}.`).join("\n")}

## Guides

${POSTS.map(p => `- [${p.title}](${SITE}/blog/${p.slug}/): ${p.description}`).join("\n")}

## Pages

- [Fleet](${SITE}/boats/): all fifteen boats with capacity and rates
- [Rates](${SITE}/rates/): every rate side by side, USD and MXN
- [Charter types](${SITE}/charters/): sunset, snorkeling, bachelorette, corporate, fishing, whales
- [FAQ](${SITE}/faq/): pricing basis, weather policy, tipping, air conditioning, booking lead time
- [Reserve](${SITE}/reserve/): pick a boat and see the total before giving any details
- [Contact](${SITE}/contact/)
`);

console.log(`${pages.length} páginas en ${OUT}/`);
console.log(`  ${FLEET.length} fichas de barco · ${POSTS.length} artículos`);
console.log(`  robots.txt: ${DRAFT ? "noindex (borrador)" : "indexable"}`);
