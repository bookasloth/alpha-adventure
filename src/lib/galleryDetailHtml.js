import { VISIBLE_INITIAL } from "../data/gallery-details";

// Audit M1: album title/hero/hero_alt come from the DB (admin-editable), so
// every value interpolated into this HTML string must be escaped before it
// reaches dangerouslySetInnerHTML — otherwise a stored value is stored XSS.
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Renders the original live `gallery-detail.php` page body as an HTML string,
// parameterized by slug. Structure matches the site verbatim (CSS classes,
// lightbox markup, data-season hooks) so the shared init script works unchanged.
export function galleryDetailHtml(page) {
  const seasonPanels = page.seasons
    .map((season) => {
      const hiddenIdx = new Set();
      season.images.forEach((img, i) => {
        if (i >= VISIBLE_INITIAL) hiddenIdx.add(i);
      });

      const items = season.images
        .map(
          (img, i) =>
            `<div class="gd-item${hiddenIdx.has(i) ? " gd-hidden" : ""}" data-index="${i}"><img src="${esc(img.src)}" alt="${esc(img.alt)}"></div>`
        )
        .join("\n                ");

      return `        <!-- ─────── ${season.label.toUpperCase()} ─────── -->
        <section class="gd-panel${season.id === "summer" ? " active" : ""}" id="panel-${season.id}">
            <div class="gd-panel-head">
                <span class="gd-label">${esc(season.label)}</span>
                <h2 class="gd-heading">${esc(season.label)}</h2>
                <p class="gd-subtext">${esc(season.sub)}</p>
                <div class="gd-accent-line"></div>
            </div>
            <div class="gd-grid gd-grid--${season.id}" id="grid-${season.id}">
                ${items}
            </div>
            <div class="gd-cta-wrap">
                <button class="gd-view-btn" data-season="${season.id}">View All ${esc(season.label)} Photos <i class="bi bi-arrow-right"></i></button>
                <button class="gd-less-btn" data-season="${season.id}" style="display:none;">Show Less &uarr;</button>
            </div>
        </section>`;
    })
    .join("\n\n");

  const tabs = page.seasons
    .map(
      (season) =>
        `<button class="gd-tab${season.id === "summer" ? " active" : ""}" data-season="${season.id}"><i class="bi ${season.icon}"></i> ${esc(season.label)}</button>`
    )
    .join("\n                ");

  return `    <link rel="stylesheet" href="assets/css/gallery-detail.css?v=1788251568">
    <link rel="stylesheet" href="assets/css/card-custom.css">

    <!-- ═══════════════════════ FULL-WIDTH HERO IMAGE ═══════════════════════ -->
    <section class="gd-hero-img">
        <img src="${esc(page.hero)}" alt="${esc(page.heroAlt)}">
        <div class="gd-hero-img-overlay"></div>
        <div class="gd-hero-img-content">
            <nav class="gd-hero-bc">
                <a href="/">Home</a>
                <span>/</span>
                <a href="/gallery">Gallery</a>
                <span>/</span>
                <span>${esc(page.title)}</span>
            </nav>
            <h1 class="gd-hero-img-title">${esc(page.title)}</h1>
            <p class="gd-hero-img-sub">Explore ${esc(page.title)} through every season</p>
            <p class="gd-hero-img-desc">Discover the landscapes, trails, views and experiences across different seasons.</p>
        </div>
    </section>

    <!-- ═══════════════════════ SEASON NAVIGATION ═══════════════════════ -->
    <section class="gd-tabs-bar" id="gd-tabs-bar">
        <div class="container">
            <div class="gd-tabs">
                ${tabs}
            </div>
        </div>
    </section>

    <!-- ═══════════════════════ GALLERY PANELS ═══════════════════════ -->
    <main class="gd-gallery-area">

${seasonPanels}

    </main>

    <!-- ═══════════════════════ LIGHTBOX ═══════════════════════ -->
    <div class="gd-lb" id="gd-lb">
        <div class="gd-lb-bg" id="gd-lb-bg"></div>
        <button class="gd-lb-x" id="gd-lb-x" aria-label="Close">&times;</button>
        <button class="gd-lb-prev" id="gd-lb-prev" aria-label="Previous"><i class="bi bi-chevron-left"></i></button>
        <button class="gd-lb-next" id="gd-lb-next" aria-label="Next"><i class="bi bi-chevron-right"></i></button>
        <div class="gd-lb-stage">
            <img class="gd-lb-img" id="gd-lb-img" src="" alt="">
        </div>
        <div class="gd-lb-count" id="gd-lb-count">1 / 1</div>
    </div>`;
}