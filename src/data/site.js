import { img } from "../lib/assets";

// ---------------------------------------------------------------------------
// SITE-WIDE CONFIG
// Edit this file to change branding, contact details, navigation and footer.
// ---------------------------------------------------------------------------

export const site = {
  name: "Alpha Adventures",
  logo: img("logo/logo.png"),
  tagline: "Trekking In The Sahyadris Made Easy.",
  description:
    "Curated treks across Maharashtra with batches, guides, stays and transport sorted in one place.",
  location: "Nagpur, Maharashtra, India",
  email: "info@alphaadventures.in",
  phone: "+91 8180001597",
  whatsapp: "https://wa.me/918180001597",
  rating: "4.8/5",
  ratingNote: "rating from 5000+ trekkers",
  experience: "6+ years of trekking experience",
  social: {
    facebook: "https://www.facebook.com/",
    youtube: "https://www.youtube.com/",
    instagram: "https://www.instagram.com/",
  },
  paymentMethods: [
    img("home1/icon/mastar-card-icon.svg"),
    img("home1/icon/visa-icon.svg"),
    img("home1/icon/paypal-icon.svg"),
    img("home1/icon/gpay-icon.svg"),
  ],
};

// Top navigation. `children` renders as a mega-menu dropdown.
export const navLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Upcoming Treks",
    href: "/treks/upcoming-treks",
    children: [
      {
        label: "Sahyadri Treks",
        href: "/treks/upcoming-treks/sahyadri-treks",
      },
      {
        label: "Himalayan Treks",
        href: "/treks/upcoming-treks/himalayan-treks",
      },
      {
        label: "Central India Treks",
        href: "/treks/upcoming-treks/central-india-treks",
      },
    ],
  },
  {
    label: "Backpacking Trips",
    href: "/treks/backpacking-trips",
    // Per-region backpacking routes don't exist yet (Phase 3 adds filtering);
    // point each region at the real backpacking listing so no link dead-ends.
    children: [
      { label: "Maharashtra", href: "/treks/backpacking-trips" },
      { label: "Gujarat", href: "/treks/backpacking-trips" },
      { label: "Madhya Pradesh", href: "/treks/backpacking-trips" },
      { label: "Rajasthan", href: "/treks/backpacking-trips" },
      {
        label: "Himachal Pradesh",
        href: "/treks/backpacking-trips",
        children: [{ label: "Spiti Valley", href: "/backpacking-trips/detail/spiti-backpacking-trip" }],
      },
      { label: "Ladakh", href: "/treks/backpacking-trips" },
    ],
  },
  {
    label: "Trips Near Nagpur",
    href: "/treks/trips-near-nagpur",
    children: [
      { label: "Seven Sisters Hill Trek", href: "/trips-near-nagpur/detail/seven-sisters-hill-trek" },
      { label: "Silver Falls", href: "/trips-near-nagpur/detail/silver-falls" },
      { label: "Karwaan Camping", href: "/trips-near-nagpur/detail/karwaan-camping" },
    ],
  },
  { label: "Tour Packages", href: "/tour-packages" },
  { label: "Corporate Programmes", href: "/corporate-programmes" },
  { label: "Student Programmes", href: "/student-programmes" },
  { label: "Why Us", href: "/about-us" },
  { label: "Need Help?", href: "/contact" },
];

export const footerColumns = [
  {
    title: "Explore Treks",
    links: [
      { label: "Upcoming Treks", href: "/treks/upcoming-treks" },
      { label: "Weekend Treks", href: "/treks/upcoming-treks/weekend-treks" },
      { label: "Himalayan Treks", href: "/treks/upcoming-treks/himalayan-treks" },
      { label: "Sahyadri Treks", href: "/treks/upcoming-treks/sahyadri-treks" },
      { label: "Beginner Friendly Treks", href: "/beginner-trek-guide" },
      { label: "Monsoon Treks", href: "/gallery" },
    ],
  },
  {
    title: "Plan Your Trek",
    links: [
      { label: "Trek Calendar", href: "/travel-calendar" },
      { label: "Fitness Requirements", href: "/fitness-requirements" },
      { label: "Packing Checklist", href: "/packing-checklist" },
      { label: "Beginner Trek Guide", href: "/beginner-trek-guide" },
      { label: "Corporate Treks", href: "/corporate-programmes" },
    ],
  },
  {
    title: "Help & Support",
    links: [
      { label: "About Alpha Adventures", href: "/about-us" },
      { label: "Responsible Travel", href: "/responsible-travel" },
      { label: "Safety Guidelines", href: "/safety-guidelines" },
      { label: "Cancellation Policy", href: "/cancellation-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

export const footerLegal = [
  // Privacy page doesn't exist yet — add in the CMS phase, then restore this link.
  { label: "Terms", href: "/terms-and-conditions" },
  { label: "Cancellation", href: "/cancellation-policy" },
  { label: "Responsible Travel", href: "/responsible-travel" },
];

export const copyright = "© 2026 Alpha Adventures";
