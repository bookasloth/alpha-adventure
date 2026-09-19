import { img } from "../lib/assets";

// ===========================================================================
// TOUR PACKAGES
// ===========================================================================
export const tourPackages = [
  {
    slug: "scenic-kerala-backwaters-hills",
    title: "Scenic Kerala Backwaters & Hills",
    type: "Domestic",
    duration: "6D/5N",
    price: 18500,
    image: img("home1/tour-package-img1.jpg"),
    description:
      "Houseboats in Alleppey, tea estates in Munnar and the heritage of Fort Kochi — God's Own Country in one relaxed loop.",
  },
  {
    slug: "royal-rajasthan-heritage",
    title: "Royal Rajasthan Heritage Experience",
    type: "Domestic",
    duration: "8D/7N",
    price: 24900,
    image: img("home1/tour-package-img3.jpg"),
    description:
      "Jaipur, Jodhpur and Jaisalmer with desert camps, lake palaces and the living heritage of the Rajputs.",
  },
  {
    slug: "switzerland-alps-paris-magic",
    title: "Switzerland Alps & Paris Magic",
    type: "International",
    duration: "9D/8N",
    price: 145000,
    image: img("home1/tour-package-img5.jpg"),
    description:
      "Interlaken's alpine peaks, Lucerne's lakes and the romance of Paris — a bucket-list Europe circuit.",
  },
];

export const getTourBySlug = (slug) => tourPackages.find((t) => t.slug === slug);
