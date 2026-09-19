import { img } from "../lib/assets";

// ===========================================================================
// TREKS DATA
// One master list powers the homepage, listing pages and dynamic detail pages.
// Add / edit a trek here and it appears everywhere automatically.
// ===========================================================================

// `group` -> which section it belongs to: "sahyadri" | "himalayan" | "central" | "backpacking"
// `tags`  -> filter tags from categories: beginner | moderate | difficult | night | fort
// `state` -> Indian state / region used for the Region filter

export const treks = [
  // ---- Popular / Sahyadri fort treks -------------------------------------
  {
    slug: "harishchandragad-trek",
    title: "Harishchandragad Trek",
    location: "Ahmednagar, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["moderate", "fort"],
    duration: "02 Days/01 Night",
    price: 1299,
    badge: "Adventure!",
    image: img("home2/trek-harishchandragad.jpg"),
    description:
      "Ancient fort with the famous Konkan Kada cliff — a dramatic crescent-shaped edge offering jaw-dropping sunset views over the Sahyadri range.",
  },
  {
    slug: "rajgad-fort-trek",
    title: "Rajgad Fort Trek",
    location: "Pune, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["historical", "fort", "moderate"],
    duration: "01 Day Trek",
    price: 899,
    badge: "Historical!",
    image: img("home2/trek-rajgad.jpg"),
    gallery: [img("home2/trek-rajgad.jpg"), img("home2/trek-rajgad2.jpg"), img("home2/trek-rajgad3.jpg")],
    description:
      "Former capital of the Maratha Empire. Rajgad is a sprawling fort with multiple plateaus, secret doors and centuries of history waiting to be explored.",
  },
  {
    slug: "kalsubai-peak-trek",
    title: "Kalsubai Peak Trek",
    location: "Igatpuri, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["moderate", "fort"],
    duration: "01 Day Trek",
    price: 799,
    badge: "",
    image: img("home2/trek-kalsubai.jpg"),
    description:
      "The highest peak in Maharashtra at 1,646m. A rewarding climb with a temple at the summit and panoramic views of the surrounding ranges.",
  },
  {
    slug: "andharban-jungle-trek",
    title: "Andharban Jungle Trek",
    location: "Pimpri, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["beginner", "monsoon"],
    duration: "01 Day Trek",
    price: 999,
    badge: "Monsoon Special!",
    image: img("home2/trek-andharban.jpg"),
    description:
      "A 'dark forest' descent through dense evergreen woods, waterfalls and valleys — one of the most scenic monsoon trails in the Sahyadris.",
  },
  {
    slug: "sinhagad-fort-trek",
    title: "Sinhagad Fort Trek",
    location: "Pune, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["beginner", "fort", "half-day"],
    duration: "Half Day Trek",
    price: 599,
    badge: "",
    image: img("home2/trek-sinhagad.jpg"),
    description:
      "A short, beginner-friendly fort trek packed with history and the famous 'Kanda Bhaji' at the top. Perfect for a quick weekend escape.",
  },
  {
    slug: "torna-fort-trek",
    title: "Torna Fort Trek",
    location: "Pune, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["moderate", "fort"],
    duration: "01 Day Trek",
    price: 849,
    badge: "",
    image: img("home2/destination-img2.jpg"),
    description:
      "The first fort captured by Chhatrapati Shivaji Maharaj. Torna offers massive ramparts, water cisterns and sweeping valley views.",
  },
  {
    slug: "lohagad-fort-trek",
    title: "Lohagad Fort Trek",
    location: "Lonavala, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["beginner", "fort"],
    duration: "01 Day Trek",
    price: 699,
    badge: "",
    image: img("home2/destination-img3.jpg"),
    description:
      "An easy, scenic fort trek near Lonavala with the iconic 'Vinchu Kata' (scorpion tail) formation. Great for families and first-timers.",
  },
  {
    slug: "visapur-fort-trek",
    title: "Visapur Fort Trek",
    location: "Lonavala, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["beginner", "fort", "monsoon"],
    duration: "01 Day Trek",
    price: 749,
    badge: "",
    image: img("home2/destination-img5.jpg"),
    description:
      "A monsoon favourite with gushing waterfalls cascading over the fort walls. The twin of Lohagad, bigger and bolder.",
  },
  {
    slug: "ratangad-fort-trek",
    title: "Ratangad Fort Trek",
    location: "Bhandardara, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["moderate", "fort"],
    duration: "01 Day Trek",
    price: 899,
    badge: "",
    image: img("innerpages/breadcrumb-bg3.jpg"),
    description:
      "A 400-year-old fort famous for its natural rock-carved 'Needle Hole' (Ratangad means jewel of the fort) and views of Bhandardara dam.",
  },
  {
    slug: "harihar-fort-trek",
    title: "Harihar Fort Trek",
    location: "Nashik, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["difficult", "fort"],
    duration: "01 Day Trek",
    price: 1099,
    badge: "",
    image: img("innerpages/breadcrumb-bg4.jpg"),
    description:
      "Famed for its nearly vertical 80-degree rock-cut staircase — a thrilling climb for experienced trekkers seeking an adrenaline rush.",
  },
  {
    slug: "sinhagad-sunset-trek",
    title: "Sinhagad Sunset Trek",
    location: "Pune, Maharashtra",
    state: "Maharashtra",
    group: "sahyadri",
    tags: ["beginner", "night", "fort"],
    duration: "Evening Trek",
    price: 649,
    badge: "",
    image: img("home2/destination-img7.jpg"),
    description:
      "A serene evening climb to catch the golden sunset from Sinhagad, followed by stars and local snacks at the top.",
  },

  // ---- Himalayan treks ---------------------------------------------------
  {
    slug: "himalayan-maharashtra",
    title: "Maharashtra Himalayan Foothills",
    location: "Western Himalayan Foothills",
    state: "Maharashtra",
    group: "himalayan",
    tags: ["moderate"],
    duration: "05 Days/04 Nights",
    price: 18999,
    badge: "",
    image: img("innerpages/breadcrumb-bg5.jpg"),
    description:
      "Explore the western Himalayan foothills with alpine meadows, pine forests and high-altitude villages on curated multi-day circuits.",
  },
  {
    slug: "himalayan-gujarat",
    title: "Gujarat Mountain Trails",
    location: "Gujarat",
    state: "Gujarat",
    group: "himalayan",
    tags: ["beginner", "moderate"],
    duration: "04 Days/03 Nights",
    price: 14999,
    badge: "",
    image: img("innerpages/breadcrumb-bg6.jpg"),
    description:
      "Gujarat's lesser-known mountain trails blend tribal culture, sacred hills and green escarpments away from the crowds.",
  },
  {
    slug: "himalayan-madhya-pradesh",
    title: "Madhya Pradesh Central Highland Treks",
    location: "Madhya Pradesh",
    state: "Madhya Pradesh",
    group: "himalayan",
    tags: ["moderate"],
    duration: "04 Days/03 Nights",
    price: 13999,
    badge: "",
    image: img("innerpages/breadcrumb-bg7.jpg"),
    description:
      "Central highland treks through the Satpura and Vindhya ranges — forests, waterfalls and ancient heritage in the heart of India.",
  },

  // ---- Central India treks ----------------------------------------------
  {
    slug: "pachmarhi-trek",
    title: "Pachmarhi Trek",
    location: "Satpura, Madhya Pradesh",
    state: "Madhya Pradesh",
    group: "central",
    tags: ["beginner", "moderate"],
    duration: "03 Days/02 Nights",
    price: 9999,
    badge: "",
    image: img("innerpages/breadcrumb-bg8.png"),
    description:
      "The Queen of Satpura — waterfalls, ancient caves (Buddhist rock shelters) and the highest point in MP, Dhupgarh.",
  },
  {
    slug: "amarkantak-trek",
    title: "Amarkantak Trek",
    location: "Madhya Pradesh",
    state: "Madhya Pradesh",
    group: "central",
    tags: ["moderate"],
    duration: "03 Days/02 Nights",
    price: 9499,
    badge: "",
    image: img("innerpages/breadcrumb-bg9.jpg"),
    description:
      "The source of the Narmada and Sone rivers, set amid misty hills, temples and dense forests — a spiritual and scenic trek.",
  },

  // ---- Backpacking: Maharashtra -----------------------------------------
  {
    slug: "malvan-tarkarli",
    title: "Malvan–Tarkarli",
    location: "Maharashtra",
    state: "Maharashtra",
    group: "backpacking",
    tags: ["beach", "beginner"],
    duration: "04 Days/03 Nights",
    price: 11999,
    badge: "",
    image: img("innerpages/destination-img1.jpg"),
    description:
      "Crystal-clear waters, scuba diving, Sindhudurg fort and beach shacks — the perfect coastal backpacking escape.",
  },
  {
    slug: "mahabaleshwar",
    title: "Mahabaleshwar",
    location: "Maharashtra",
    state: "Maharashtra",
    group: "backpacking",
    tags: ["hill-station", "beginner"],
    duration: "03 Days/02 Nights",
    price: 8999,
    badge: "",
    image: img("innerpages/destination-img2.jpg"),
    description:
      "Strawberry farms, panoramic viewpoints and the source of the Krishna river — a classic hill-station getaway.",
  },
  {
    slug: "lavasa",
    title: "Lavasa",
    location: "Maharashtra",
    state: "Maharashtra",
    group: "backpacking",
    tags: ["hill-station", "beginner"],
    duration: "02 Days/01 Night",
    price: 6999,
    badge: "",
    image: img("innerpages/destination-img3.jpg"),
    description:
      "India's planned hill city by the lake — boating, cycling trails and a relaxed weekend vibe.",
  },

  // ---- Backpacking: Gujarat ---------------------------------------------
  {
    slug: "rann-of-kutch",
    title: "Rann of Kutch",
    location: "Gujarat",
    state: "Gujarat",
    group: "backpacking",
    tags: ["desert", "beginner"],
    duration: "04 Days/03 Nights",
    price: 13999,
    badge: "",
    image: img("innerpages/destination-img4.jpg"),
    description:
      "The vast white salt desert of Kutch — full-moon nights, mirror reflections and the vibrant Rann Utsav.",
  },
  {
    slug: "saputara",
    title: "Saputara",
    location: "Gujarat",
    state: "Gujarat",
    group: "backpacking",
    tags: ["hill-station", "beginner"],
    duration: "03 Days/02 Nights",
    price: 9999,
    badge: "",
    image: img("innerpages/destination-img5.jpg"),
    description:
      "Gujarat's only hill station — lush forests, the Saputara lake and tribal culture in the Western Ghats' northern edge.",
  },
  {
    slug: "diu",
    title: "Diu",
    location: "Gujarat",
    state: "Gujarat",
    group: "backpacking",
    tags: ["beach", "beginner"],
    duration: "03 Days/02 Nights",
    price: 9499,
    badge: "",
    image: img("innerpages/destination-img6.jpg"),
    description:
      "A peaceful island fort, Portuguese heritage and quiet beaches — a laid-back coastal break.",
  },

  // ---- Backpacking: Madhya Pradesh --------------------------------------
  {
    slug: "orchha",
    title: "Orchha",
    location: "Madhya Pradesh",
    state: "Madhya Pradesh",
    group: "backpacking",
    tags: ["heritage", "beginner"],
    duration: "03 Days/02 Nights",
    price: 8999,
    badge: "",
    image: img("innerpages/tour-package-img2.jpg"),
    description:
      "Medieval Bundela architecture, riverside cenotaphs and the Betwa river — a heritage backpacking gem.",
  },
  {
    slug: "khajuraho",
    title: "Khajuraho",
    location: "Madhya Pradesh",
    state: "Madhya Pradesh",
    group: "backpacking",
    tags: ["heritage", "beginner"],
    duration: "03 Days/02 Nights",
    price: 9499,
    badge: "",
    image: img("innerpages/tour-package-img3.jpg"),
    description:
      "World-famous temple sculptures, a UNESCO site and a window into India's artistic heritage.",
  },

  // ---- Backpacking: Rajasthan -------------------------------------------
  {
    slug: "jodhpur-jaisalmer",
    title: "Jodhpur–Jaisalmer",
    location: "Rajasthan",
    state: "Rajasthan",
    group: "backpacking",
    tags: ["desert", "heritage"],
    duration: "06 Days/05 Nights",
    price: 19999,
    badge: "",
    image: img("innerpages/tour-package-img4.jpg"),
    description:
      "The Blue City and the Golden Fort — desert camps, dunes, forts and timeless Rajputana heritage.",
  },
  {
    slug: "udaipur",
    title: "Udaipur",
    location: "Rajasthan",
    state: "Rajasthan",
    group: "backpacking",
    tags: ["heritage", "beginner"],
    duration: "04 Days/03 Nights",
    price: 14999,
    badge: "",
    image: img("innerpages/tour-package-img5.jpg"),
    description:
      "The City of Lakes and Palaces — boat rides on Lake Pichola and the grand City Palace.",
  },
  {
    slug: "jaipur",
    title: "Jaipur",
    location: "Rajasthan",
    state: "Rajasthan",
    group: "backpacking",
    tags: ["heritage", "beginner"],
    duration: "04 Days/03 Nights",
    price: 13999,
    badge: "",
    image: img("innerpages/tour-package-img6.jpg"),
    description:
      "The Pink City — Amber Fort, Hawa Mahal and bustling bazaars packed with colour and history.",
  },

  // ---- Backpacking: Himachal Pradesh ------------------------------------
  {
    slug: "spiti-valley",
    title: "Spiti Valley",
    location: "Himachal Pradesh",
    state: "Himachal Pradesh",
    group: "backpacking",
    tags: ["difficult", "high-altitude"],
    duration: "08 Days/07 Nights",
    price: 28999,
    badge: "",
    image: img("innerpages/tour-package-img7.jpg"),
    description:
      "A cold-desert mountain valley with monasteries, moon-landscapes and surreal high-altitude villages.",
  },
  {
    slug: "kasol",
    title: "Kasol",
    location: "Himachal Pradesh",
    state: "Himachal Pradesh",
    group: "backpacking",
    tags: ["beginner", "hill-station"],
    duration: "05 Days/04 Nights",
    price: 16999,
    badge: "",
    image: img("innerpages/breadcrumb-bg5.jpg"),
    description:
      "Mini Israel of India — riverside cafes, Parvati valley treks and a chilled backpacker vibe.",
  },
  {
    slug: "manali",
    title: "Manali",
    location: "Himachal Pradesh",
    state: "Himachal Pradesh",
    group: "backpacking",
    tags: ["beginner", "hill-station"],
    duration: "05 Days/04 Nights",
    price: 17999,
    badge: "",
    image: img("innerpages/breadcrumb-bg6.jpg"),
    description:
      "The adventure capital of Himachal — snow points, Solang valley and gateway to higher Himalayan treks.",
  },

  // ---- Backpacking: Ladakh ----------------------------------------------
  {
    slug: "pangong",
    title: "Pangong Lake",
    location: "Ladakh",
    state: "Ladakh",
    group: "backpacking",
    tags: ["high-altitude", "difficult"],
    duration: "07 Days/06 Nights",
    price: 32999,
    badge: "",
    image: img("innerpages/breadcrumb-bg7.jpg"),
    description:
      "The colour-changing high-altitude lake that shifts from blue to green — a Ladakh icon.",
  },
  {
    slug: "nubra-valley",
    title: "Nubra Valley",
    location: "Ladakh",
    state: "Ladakh",
    group: "backpacking",
    tags: ["high-altitude", "difficult"],
    duration: "07 Days/06 Nights",
    price: 34999,
    badge: "",
    image: img("innerpages/breadcrumb-bg8.png"),
    description:
      "The valley of flowers, Bactrian (double-humped) camels and the sand dunes of Hunder.",
  },
  {
    slug: "leh",
    title: "Leh",
    location: "Ladakh",
    state: "Ladakh",
    group: "backpacking",
    tags: ["high-altitude", "beginner"],
    duration: "06 Days/05 Nights",
    price: 29999,
    badge: "",
    image: img("innerpages/breadcrumb-bg9.jpg"),
    description:
      "The gateway to Ladakh — monasteries, palaces and acclimatisation rides to Khardung La.",
  },

  // ---- Trips Near Nagpur ------------------------------------------------
  {
    slug: "seven-sisters-hill-trek",
    title: "Seven Sisters Hill Trek",
    location: "Near Nagpur",
    state: "Maharashtra",
    group: "near-nagpur",
    tags: ["beginner", "weekend"],
    duration: "02 Days/01 Night",
    price: 1499,
    badge: "",
    image: img("innerpages/destination-img4.jpg"),
    gallery: [
      img("innerpages/destination-dt-location-img7.jpg"),
      img("innerpages/destination-dt-location-img6.jpg"),
      img("innerpages/destination-dt-location-img4.jpg"),
      img("innerpages/destination-dt-location-img2.jpg"),
      img("innerpages/destination-dt-location-img3.jpg"),
      img("innerpages/destination-dt-location-img5.jpg"),
      img("innerpages/destination-details-gallery-img1.jpg"),
      img("innerpages/destination-details-gallery-img2.jpg"),
      img("innerpages/destination-details-gallery-img3.jpg"),
    ],
    rating: "4.5/5",
    reviewCount: 138,
    description:
      "A scenic weekend getaway from Nagpur through rolling hills and tribal villages — perfect for a quick reset.",
    about:
      "We understand the need for space and solitude to enrich your body and mind. We bring together like-minded, adventurous people to interact in a serene and peaceful setting, where thoughts flow in a judgment-free zone.",
    overview: {
      duration: "1 Days / 0 Nights",
      difficulty: "moderate",
      ageGroup: "12-60 yrs",
      highestAltitude: "",
      basecamp: "N/A",
      accommodation: "Tents / Guest House",
      fitness: "Basic Fitness",
    },
    itinerary: [
      {
        day: "1",
        title: "Full Day",
        description: "",
        slots: [
          { time: "06:30 AM", activity: "Pickup from Mankapur Stadium" },
          { time: "07:00 AM", activity: "Pickup from Freedom Park" },
          { time: "07:30 AM", activity: "Pickup from Bada Taj Bagh" },
          { time: "08:00 AM", activity: "Journey Begins" },
          { time: "08:30 AM", activity: "Sing Journey Songs In The Bus" },
          { time: "11:00 AM", activity: "Reach Base Village" },
          { time: "11:30 AM", activity: "Trek Begins. YAYYY!" },
          { time: "12:30 PM", activity: "You Did It! We Are On Top" },
          { time: "12:30 PM", activity: "Let's Appreciate The Nature" },
          { time: "02:00 PM", activity: "Start Descending" },
          { time: "03:00 PM", activity: "Reach Base" },
          { time: "03:15 PM", activity: "Let's Have Lunch" },
          { time: "04:00 PM", activity: "Games and Activities" },
          { time: "05:00 PM", activity: "Time to Go Back" },
          { time: "05:30 PM", activity: "Share Pictures" },
          { time: "07:30 PM", activity: "Reach Nagpur" },
          { time: "08:00 PM", activity: "Kaafi Accha Trek Tha, Phirse Aayenge!" },
        ],
      },
    ],
    inclusions: [
      "Travel (Nagpur to Nagpur)",
      "Morning Tea & Breakfast",
      "Lunch",
      "Evening Tea & Snacks",
      "Trek Charges",
      "Local Transportation",
      "Medals & Certificate",
    ],
    exclusions: [
      "Bottled Water",
      "Personal Expenses",
      "Personal Medications",
      "Insurance",
      "Anything not mentioned in inclusions",
    ],
  },
  {
    slug: "silver-falls",
    title: "Silver Falls",
    location: "Near Nagpur",
    state: "Maharashtra",
    group: "near-nagpur",
    tags: ["beginner", "monsoon"],
    duration: "01 Day Trek",
    price: 799,
    badge: "",
    image: img("innerpages/destination-img1.jpg"),
    description:
      "Nature's hidden cascade nestled in the lush forests near Nagpur — a refreshing monsoon trail.",
  },
  {
    slug: "karwaan-camping",
    title: "Karwaan Camping",
    location: "Near Nagpur",
    state: "Maharashtra",
    group: "near-nagpur",
    tags: ["camping", "weekend"],
    duration: "02 Days/01 Night",
    price: 1799,
    badge: "",
    image: img("innerpages/tour-package-img4.jpg"),
    description:
      "Riverside camping with bonfire nights and stargazing under clear skies — a relaxed outdoor escape.",
  },
];

// Quick lookup helper
export const getTrekBySlug = (slug) => treks.find((t) => t.slug === slug);

// ---------------------------------------------------------------- DERIVED
export const popularTreks = treks.filter((t) =>
  ["harishchandragad-trek", "rajgad-fort-trek", "kalsubai-peak-trek", "andharban-jungle-trek", "sinhagad-fort-trek"].includes(t.slug)
);

// "Search your adventure" list (with batch counts shown on the homepage)
export const searchTreks = [
  { title: "Rajgad Fort Trek", location: "Pune Maharashtra", count: 12, slug: "rajgad-fort-trek" },
  { title: "Torna Fort Trek", location: "Pune Maharashtra", count: 10, slug: "torna-fort-trek" },
  { title: "Lohagad Fort Trek", location: "Lonavala Maharashtra", count: 18, slug: "lohagad-fort-trek" },
  { title: "Visapur Fort Trek", location: "Lonavala Maharashtra", count: 15, slug: "visapur-fort-trek" },
  { title: "Sinhagad Fort Trek", location: "Pune Maharashtra", count: 20, slug: "sinhagad-fort-trek" },
  { title: "Harishchandragad Trek", location: "Ahmednagar Maharashtra", count: 14, slug: "harishchandragad-trek" },
  { title: "Kalsubai Peak Trek", location: "Ahmednagar Maharashtra", count: 16, slug: "kalsubai-peak-trek" },
  { title: "Harihar Fort Trek", location: "Nashik Maharashtra", count: 9, slug: "harihar-fort-trek" },
  { title: "Ratangad Fort Trek", location: "Bhandardara Maharashtra", count: 11, slug: "ratangad-fort-trek" },
  { title: "Alang Madan Kulang Trek", location: "Igatpuri Maharashtra", count: 6, slug: "rajgad-fort-trek" },
];

// Cabins list
export const cabins = [
  { code: "PU", title: "Rajgad Fort Cabins", location: "Pune Maharashtra", slug: "rajgad-fort-trek" },
  { code: "PU", title: "Torna Fort Cabins", location: "Pune Maharashtra", slug: "torna-fort-trek" },
  { code: "LV", title: "Lohagad Fort Cabins", location: "Lonavala Maharashtra", slug: "lohagad-fort-trek" },
  { code: "VS", title: "Visapur Fort Cabins", location: "Lonavala Maharashtra", slug: "visapur-fort-trek" },
  { code: "SN", title: "Sinhagad Fort Cabins", location: "Pune Maharashtra", slug: "sinhagad-fort-trek" },
  { code: "HG", title: "Harishchandragad Cabins", location: "Ahmednagar Maharashtra", slug: "harishchandragad-trek" },
  { code: "RG", title: "Raigad Fort Cabins", location: "Raigad Maharashtra", slug: "rajgad-fort-trek" },
  { code: "PM", title: "Pratapgad Fort Cabins", location: "Satara Maharashtra", slug: "rajgad-fort-trek" },
  { code: "RM", title: "Rajmachi Cabins", location: "Lonavala Maharashtra", slug: "lohagad-fort-trek" },
];

// Filter options used by the search/filter widgets
export const filterOptions = {
  categories: [
    "All Treks",
    "Beginner Friendly",
    "Moderate",
    "Difficult",
    "Night Trek",
    "Fort Trek",
  ],
  regions: [
    "Maharashtra",
    "Himachal Pradesh",
    "Uttarakhand",
    "Karnataka",
    "Goa",
    "Jammu and Kashmir",
    "Nepal Himalayas",
    "Bhutan",
  ],
  permits: [
    "Trekking Permit",
    "Forest Entry Permit",
    "Camping Permit",
    "Night Stay / Fort Cabin Permit",
    "Wildlife / National Park Permit",
    "Vehicle / Parking Permit",
    "Photography / Filming Permit",
  ],
  visitors: [
    "Solo Trekker",
    "Small Trek Group",
    "Family Group",
    "Corporate / Team Group",
    "School / College Group",
    "Adventure Organisation",
    "International Tourists",
    "Research / Documentary Team",
  ],
  forests: [
    "Sahyadri Tiger Reserve",
    "Bhimashankar Wildlife Sanctuary",
    "Tamhini Ghat Forest Region",
    "Harishchandragad – Kalsubai Landscape",
    "Rajgad – Torna Fort Belt",
    "Raigad – Pratapgad Region",
    "Sanctuary / National Park (Other)",
  ],
};

// Group labels for listing pages
export const trekGroups = {
  sahyadri: {
    title: "Sahyadri Treks",
    blurb:
      "Explore the rugged beauty of the Western Ghats with treks through ancient forts, lush valleys, and cascading waterfalls.",
  },
  himalayan: {
    title: "Himalayan Treks",
    blurb:
      "Journey through towering peaks, alpine meadows, and sacred high-altitude trails across the Himalayas.",
  },
  central: {
    title: "Central India Treks",
    blurb:
      "Discover wilderness trails, ancient heritage sites, and untamed forests across the heart of India.",
  },
  backpacking: {
    title: "Backpacking Trips",
    blurb:
      "Coastal escapes, desert circuits, hill stations and Himalayan valleys — curated backpacking across India.",
  },
  "near-nagpur": {
    title: "Trips Near Nagpur",
    blurb: "Quick weekend getaways, waterfalls and camping close to Nagpur.",
  },
};
