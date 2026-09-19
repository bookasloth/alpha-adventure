// ===========================================================================
// GALLERY DETAIL PAGES
// Each slug corresponds to a live `gallery-detail.php?slug=<slug>` page.
// The four season grids are shared placeholder/template images that are
// byte-identical across every gallery on the live site; only the hero image,
// page title and subtitle differ per slug. The first 8 images of each season
// are visible by default; the rest start hidden ("View All Photos" reveals them).
// ===========================================================================

const SEASONS = [
  {
    id: "summer",
    label: "Summer",
    icon: "bi-sun",
    sub: "Clear skies, warm trails & panoramic mountain views",
    images: [
      { src: "assets/img/home2/destination-img4.jpg", alt: "Kalsubai Peak summit view" },
      { src: "assets/img/home2/destination-img1.jpg", alt: "Rajgad Fort trail" },
      { src: "assets/img/home2/destination-img2.jpg", alt: "Torna Fort ridge" },
      { src: "assets/img/innerpages/destination-dt-location-img1.jpg", alt: "Mountain panorama" },
      { src: "assets/img/home2/destination-img3.jpg", alt: "Harishchandragad peak" },
      { src: "assets/img/innerpages/destination-dt-location-img2.jpg", alt: "Trekking trail" },
      { src: "assets/img/home2/destination-img5.jpg", alt: "Lohagad Fort approach" },
      { src: "assets/img/innerpages/destination-dt-location-img3.jpg", alt: "Valley view" },
      { src: "assets/img/home2/destination-img6.jpg", alt: "Visapur Fort landscape" },
      { src: "assets/img/innerpages/destination-dt-location-img4.jpg", alt: "Rocky summit" },
      { src: "assets/img/home2/gallery-img2-big.jpg", alt: "Mountain camp" },
      { src: "assets/img/innerpages/destination-dt-location-img5.jpg", alt: "Panoramic viewpoint" },
    ],
  },
  {
    id: "monsoon",
    label: "Monsoon",
    icon: "bi-cloud-rain",
    sub: "Lush green trails, misty mountains & dramatic waterfalls",
    images: [
      { src: "assets/img/innerpages/destination-img1.jpg", alt: "Misty mountain landscape" },
      { src: "assets/img/home2/destination-img3.jpg", alt: "Harishchandragad in monsoon" },
      { src: "assets/img/innerpages/destination-img2.jpg", alt: "Green monsoon valley" },
      { src: "assets/img/innerpages/destination-img3.jpg", alt: "Waterfall on trail" },
      { src: "assets/img/home2/destination-img7.jpg", alt: "Sinhagad in mist" },
      { src: "assets/img/innerpages/destination-img4.jpg", alt: "Wet rocks and green trail" },
      { src: "assets/img/innerpages/destination-img5.jpg", alt: "Monsoon trek route" },
      { src: "assets/img/home2/destination-img8.jpg", alt: "Cloud-covered peaks" },
      { src: "assets/img/innerpages/destination-img6.jpg", alt: "Lush green hills" },
      { src: "assets/img/home2/gallery-img6-big.jpg", alt: "Monsoon panorama" },
      { src: "assets/img/innerpages/destination-dt-location-img6.jpg", alt: "Misty trail" },
      { src: "assets/img/home2/gallery-img3-big.jpg", alt: "Fog over valley" },
    ],
  },
  {
    id: "winter",
    label: "Winter",
    icon: "bi-snow",
    sub: "Cool mountain air, crisp trails & spectacular views",
    images: [
      { src: "assets/img/home2/destination-img4.jpg", alt: "Kalsubai Peak in winter clarity" },
      { src: "assets/img/innerpages/tour-package-img1.jpg", alt: "Clear morning trek start" },
      { src: "assets/img/innerpages/tour-package-img2.jpg", alt: "Dry winter trail" },
      { src: "assets/img/home2/destination-img1.jpg", alt: "Rajgad Fort winter view" },
      { src: "assets/img/innerpages/tour-package-img3.jpg", alt: "Crisp mountain air" },
      { src: "assets/img/innerpages/tour-package-img4.jpg", alt: "Panoramic summit view" },
      { src: "assets/img/home2/destination-img2.jpg", alt: "Torna Fort ridge" },
      { src: "assets/img/innerpages/tour-package-img5.jpg", alt: "Group at summit" },
      { src: "assets/img/home2/gallery-img2-big.jpg", alt: "Wide winter landscape" },
      { src: "assets/img/innerpages/tour-package-img6.jpg", alt: "Early dawn trek" },
      { src: "assets/img/home2/destination-img5.jpg", alt: "Lohagad in winter" },
    ],
  },
  {
    id: "spring",
    label: "Spring",
    icon: "bi-flower1",
    sub: "Fresh landscapes, blooming trails & vibrant greenery",
    images: [
      { src: "assets/img/home2/destination-img4.jpg", alt: "Kalsubai with spring greenery" },
      { src: "assets/img/home2/gallery-img1-big.jpg", alt: "Fresh green landscape" },
      { src: "assets/img/innerpages/destination-dt-location-img5.jpg", alt: "Valley of Flowers trail" },
      { src: "assets/img/home2/destination-img6.jpg", alt: "Visapur Fort spring" },
      { src: "assets/img/innerpages/destination-dt-location-img2.jpg", alt: "Spring sunrise trek" },
      { src: "assets/img/innerpages/destination-dt-location-img3.jpg", alt: "Village landscape" },
      { src: "assets/img/home2/gallery-img5-big.jpg", alt: "Panoramic trail view" },
      { src: "assets/img/innerpages/destination-dt-location-img1.jpg", alt: "Trekking through hills" },
      { src: "assets/img/home2/destination-img7.jpg", alt: "Sinhagad spring" },
      { src: "assets/img/innerpages/destination-dt-location-img7.jpg", alt: "Kalsubai Peak spring" },
      { src: "assets/img/home2/gallery-img4-big.jpg", alt: "Spring meadow" },
    ],
  },
];

// Number of images visible by default per season (the rest start hidden).
export const VISIBLE_INITIAL = 8;

const PAGES = [
  {
    slug: "harishchandragad-trek",
    hero: "assets/img/innerpages/destination-dt-location-img6.jpg",
    heroAlt: "Harishchandragad Trek - Mountain summit landscape",
  },
  {
    slug: "kalsubai-peak-trek",
    hero: "assets/img/innerpages/destination-dt-location-img7.jpg",
    heroAlt: "Kalsubai Peak Trek - mountain summit landscape",
  },
  {
    slug: "rajmachi-fort-trek",
    hero: "assets/img/innerpages/destination-dt-location-img4.jpg",
    heroAlt: "Rajmachi Fort Trek - fort summit landscape",
  },
  {
    slug: "kedarkantha-trek",
    hero: "assets/img/innerpages/destination-dt-location-img2.jpg",
    heroAlt: "Kedarkantha Trek - snow summit landscape",
  },
  {
    slug: "hampta-pass-trek",
    hero: "assets/img/innerpages/destination-dt-location-img3.jpg",
    heroAlt: "Hampta Pass Trek - high altitude landscape",
  },
  {
    slug: "valley-of-flowers",
    hero: "assets/img/innerpages/destination-dt-location-img5.jpg",
    heroAlt: "Valley of Flowers - blooming meadow landscape",
  },
  {
    slug: "seven-sisters-hill-trek",
    hero: "assets/img/innerpages/about-video-img.jpg",
    heroAlt: "Seven Sisters Hill Trek - hill landscape",
  },
  {
    slug: "silver-falls",
    hero: "assets/img/innerpages/tour-package-img4.jpg",
    heroAlt: "Silver Falls - waterfall landscape",
  },
  {
    slug: "scenic-kerala-tour",
    hero: "assets/img/innerpages/tour-package-img2.jpg",
    heroAlt: "Scenic Kerala Tour - tropical landscape",
  },
];

function titleFor(slug) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .trim();
}

export const galleryPages = PAGES.map((p) => ({
  slug: p.slug,
  title: titleFor(p.slug),
  hero: p.hero,
  heroAlt: p.heroAlt,
  seasons: SEASONS,
}));

export const gallerySlugSet = new Set(PAGES.map((p) => p.slug));

export function getGalleryPage(slug) {
  return galleryPages.find((p) => p.slug === slug) || null;
}