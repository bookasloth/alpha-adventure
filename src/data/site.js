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
        children: [
          { label: "Maharashtra", href: "/treks/upcoming-treks/himalayan-treks/maharashtra" },
          { label: "Gujarat", href: "/treks/upcoming-treks/himalayan-treks/gujarat" },
          { label: "Madhya Pradesh", href: "/treks/upcoming-treks/himalayan-treks/madhya-pradesh" },
        ],
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
    children: [
      {
        label: "Maharashtra",
        href: "/treks/backpacking-trips/maharashtra",
        children: [
          { label: "Malvan-Tarkarli", href: "/treks/backpacking-trips/maharashtra/malvan-tarkarli" },
        ],
      },
      { label: "Gujarat", href: "/treks/backpacking-trips/gujarat" },
      { label: "Madhya Pradesh", href: "/treks/backpacking-trips/madhya-pradesh" },
      {
        label: "Rajasthan",
        href: "/treks/backpacking-trips/rajasthan",
        children: [
          { label: "Jodhpur-Jaisalmer", href: "/treks/backpacking-trips/rajasthan/jodhpur-jaisalmer" },
        ],
      },
      {
        label: "Himachal Pradesh",
        href: "/treks/backpacking-trips/himachal-pradesh",
        children: [{ label: "Spiti Valley", href: "/treks/backpacking-trips/himachal-pradesh/spiti-valley" }],
      },
      { label: "Ladakh", href: "/treks/backpacking-trips/ladakh" },
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
      { label: "Trek Calendar", href: "/trek-calendar" },
      { label: "Fitness Requirements", href: "/fitness-requirements" },
      { label: "Packing Checklist", href: "/packing-checklist" },
      { label: "Beginner Trek Guide", href: "/beginner-trek-guide" },
      { label: "Corporate Treks", href: "/corporate-treks" },
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
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-and-conditions" },
  { label: "Cancellation", href: "/cancellation-policy" },
  { label: "Responsible Travel", href: "/trek-disclaimer" },
];

export const copyright = "© 2026 Alpha Adventures";
