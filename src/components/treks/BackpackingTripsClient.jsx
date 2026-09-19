"use client";

import { useEffect, useRef } from "react";

/* Faithful replica of the live /treks/backpacking-trips page.
 * The live category API returns exactly ONE trek ("Spiti Backpacking Trip")
 * with no subcategories and an empty category description, so the page renders
 * a single card, no subcategory chips and no SEO section — matching the live
 * page data exactly. */

const PAGE_SLUG = "backpacking-trips";
const CATEGORY = {
  name: "Backpacking Trips",
  description: "",
  image: null,
  seo_title: "Backpacking Trips | Alpha Adventures",
  breadcrumb: [{ name: "Backpacking Trips", slug: "backpacking-trips" }],
};

// Mirrors the live API response for this category's single trek.
const TREKS = [
  {
    title: "Spiti Backpacking Trip",
    slug: "spiti-backpacking-trip",
    days: 8,
    nights: 7,
    banner_image: null,
    location: null,
    original_price: 0,
    discount_price: 0,
    difficulty: "moderate",
    highest_altitude: "15050 ft",
    category: { name: "Backpacking Trips", slug: "backpacking-trips", path: "backpacking-trips" },
    subcategory: null,
  },
];

const IMG_BASE = "https://alpha.thegreyhawks.com/assets/img";
const DEFAULT_BANNER = IMG_BASE + "/home2/banner-img1.jpg";

export default function BackpackingTripsClient() {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    document.body.classList.add("category-treks-page");

    function formatPrice(val) {
      if (!val || val <= 0) return null;
      return "₹" + Number(val).toLocaleString("en-IN");
    }

    function difficultyBadgeClass(difficulty) {
      if (!difficulty) return "";
      const d = difficulty.toLowerCase();
      if (d === "easy") return "badge-easy";
      if (d === "difficult") return "badge-difficult";
      return "badge-moderate";
    }

    function buildImageSrc(bannerImage) {
      if (!bannerImage) return DEFAULT_BANNER;
      if (bannerImage.startsWith("http") || bannerImage.startsWith("/")) return bannerImage;
      return IMG_BASE + "/" + bannerImage;
    }

    /* ------------------------------------------------ HERO
     * Static gallery-style breadcrumb hero — the title and breadcrumb list are
     * hydrated from category data into the server-rendered markup. */
    function renderHero() {
      const breadcrumbEl = document.getElementById("hero-breadcrumb");
      if (breadcrumbEl) {
        let html = '<li><a href="/">Home</a></li>';
        const crumbs = CATEGORY.breadcrumb || [];
        if (crumbs.length) {
          html += "<li>" + crumbs[crumbs.length - 1].name + "</li>";
        }
        breadcrumbEl.innerHTML = html;
      }

      const titleEl = document.getElementById("hero-title");
      if (titleEl) {
        titleEl.textContent = CATEGORY.name || "Treks";
        document.title = CATEGORY.seo_title || CATEGORY.name;
      }

      // SEO section is only populated when the category has a description.
      if (CATEGORY.description) {
        const seoArea = document.getElementById("seo-content-area");
        const seoWrap = document.getElementById("seo-content-wrap");
        if (seoArea && seoWrap) {
          seoWrap.innerHTML =
            "<h2>" + CATEGORY.name + "</h2>" +
            "<p>" + CATEGORY.description.replace(/\n/g, "</p><p>") + "</p>";
          seoArea.style.display = "";
        }
      }
    }

    /* ------------------------------------------------ SUBCATEGORIES
     * The live category has no subcategories, so only the skeleton chips are
     * removed and nothing is rendered. */
    function renderSubcategories() {
      const container = document.getElementById("subcategory-list");
      if (!container) return;
      container.querySelectorAll(".subcategory-chip-skeleton-wrap").forEach((el) => el.remove());
    }

    /* ------------------------------------------------ TREK CARD (matches live renderTrekCard) */
    function renderTrekCard(trek) {
      const displayPrice = trek.discount_price > 0 ? trek.discount_price : trek.original_price;
      const priceStr = formatPrice(displayPrice);

      const difficulty = trek.difficulty || "";
      let badgeClass = difficultyBadgeClass(difficulty);
      let badgeLabel = difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : "";

      if (trek.subcategory && trek.subcategory.name) {
        badgeLabel = trek.subcategory.name;
        badgeClass = "badge-moderate";
      }

      const duration = (trek.nights != null && trek.days != null) ? trek.nights + "N/" + trek.days + "D" : "";
      const altitude = trek.highest_altitude ? trek.highest_altitude : null;
      const location = trek.location || (trek.category ? trek.category.name : "");
      const imgSrc = buildImageSrc(trek.banner_image);
      const categoryPath = (trek.category && trek.category.path) ? trek.category.path : "upcoming-treks";
      const detailUrl = "/" + categoryPath + "/detail/" + encodeURIComponent(trek.slug);

      return (
        '<div class="trek-card">' +
          '<div class="trek-card-img-wrap">' +
            (badgeLabel ? '<span class="trek-badge ' + badgeClass + '">' + badgeLabel + "</span>" : "") +
            '<a href="' + detailUrl + '">' +
              '<img src="' + imgSrc + '" alt="' + trek.title + '" loading="lazy" onerror="this.src=\'' + DEFAULT_BANNER + "'\">" +
            "</a>" +
          "</div>" +
          '<div class="trek-card-content">' +
            '<a href="' + detailUrl + '" class="trek-title">' + trek.title + "</a>" +
            '<div class="trek-location">' +
              '<i class="bi bi-geo-alt-fill text-primary"></i> ' + (location || "&mdash;") +
            "</div>" +
            '<div class="trek-stats">' +
              '<span class="trek-stat-item"><i class="bi bi-clock"></i> ' + duration + "</span>" +
              (badgeLabel ? '<span class="trek-stat-item"><i class="bi bi-activity"></i> ' + badgeLabel + "</span>" : "") +
              (altitude ? '<span class="trek-stat-item"><i class="bi bi-triangle"></i> ' + altitude + "</span>" : "") +
            "</div>" +
            '<div class="trek-card-footer">' +
              "<div>" +
                '<span class="trek-price-label">Starting from</span>' +
                '<span class="trek-price-value">' + (priceStr || "Contact Us") + "</span>" +
              "</div>" +
              '<a href="' + detailUrl + '" class="btn-view-trek">View Trek</a>' +
            "</div>" +
          "</div>" +
        "</div>"
      );
    }

    /* ------------------------------------------------ RENDER TREKS */
    function renderTreks(list) {
      const grid = document.getElementById("treks-grid");
      const countLbl = document.getElementById("trek-count-label");
      if (!grid) return;

      grid.querySelectorAll(".trek-skeleton-col").forEach((el) => el.remove());

      if (!list || list.length === 0) {
        grid.innerHTML =
          '<div class="col-12">' +
            '<div class="treks-empty-state">' +
              '<i class="bi bi-compass"></i>' +
              "<h5>No treks found</h5>" +
              "<p>Try adjusting your filters or explore another category.</p>" +
            "</div>" +
          "</div>";
        if (countLbl) countLbl.textContent = "0 Treks Found";
        return;
      }

      if (countLbl) countLbl.textContent = list.length + " Trek" + (list.length !== 1 ? "s" : "") + " Found";

      grid.innerHTML = "";

      list.forEach((trek) => {
        const col = document.createElement("div");
        col.className = "col-lg-4 col-md-6";
        col.innerHTML = renderTrekCard(trek);
        grid.appendChild(col);
      });
    }

    /* ------------------------------------------------ FILTER / SORT (client-side on single trek) */
    const getFilters = () => ({
      difficulty: document.getElementById("trekDifficulty").value,
      location: document.getElementById("trekLocation").value,
      duration: document.getElementById("trekDuration").value,
      sort: document.getElementById("trekSort").value,
    });

    function filterTreks() {
      const { difficulty, location, duration, sort } = getFilters();

      let list = TREKS.slice();

      if (difficulty && difficulty !== (list[0] && list[0].difficulty)) {
        list = [];
      }
      if (location) {
        const catName = (list[0] && list[0].category && list[0].category.name || "").toLowerCase();
        if (catName !== location.toLowerCase()) list = [];
      }
      if (duration) {
        const trek = list[0];
        const days = trek ? trek.days : null;
        if (days == null) list = [];
        else if (duration === "short" && !(days <= 3)) list = [];
        else if (duration === "medium" && !(days >= 4 && days <= 6)) list = [];
        else if (duration === "long" && !(days >= 7)) list = [];
      }

      if (sort === "price_asc") list = list.sort((a, b) => (a.original_price || 0) - (b.original_price || 0));
      else if (sort === "price_desc") list = list.sort((a, b) => (b.original_price || 0) - (a.original_price || 0));
      else if (sort === "duration_asc") list = list.sort((a, b) => (a.days || 0) - (b.days || 0));

      return list;
    }

    /* ------------------------------------------------ CONTROLS */
    function bindFilterControls() {
      const difficultySelect = document.getElementById("trekDifficulty");
      const locationSelect = document.getElementById("trekLocation");
      const durationSelect = document.getElementById("trekDuration");
      const sortSelect = document.getElementById("trekSort");
      const resetBtn = document.getElementById("resetFilters");

      if (!difficultySelect || !locationSelect || !durationSelect || !sortSelect) return;

      function onFilterChange() {
        const grid = document.getElementById("treks-grid");
        Array.from(grid.children).forEach((child) => {
          if (!child.classList.contains("trek-skeleton-col")) {
            child.remove();
          }
        });

        renderTreks(filterTreks());
      }

      difficultySelect.addEventListener("change", onFilterChange);
      locationSelect.addEventListener("change", onFilterChange);
      durationSelect.addEventListener("change", onFilterChange);
      sortSelect.addEventListener("change", onFilterChange);

      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          difficultySelect.value = "";
          locationSelect.value = "";
          durationSelect.value = "";
          sortSelect.value = "featured";
          onFilterChange();
        });
      }
    }

    /* ------------------------------------------------ INIT */
    renderHero();
    renderSubcategories();
    renderTreks(filterTreks());
    bindFilterControls();
  }, []);

  return null;
}
