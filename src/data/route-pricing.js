// ---------------------------------------------------------------------------
// PER-TREK ROUTE PRICING (incl. GST) — rendered on the trek detail page by
// RoutePricingCards as the "Trek Cost" and "Trip Cost" cards.
//
// The two maps are deliberately separate so Trek Cost and Trip Cost can never
// share rows or notes. Kalsubai has hand-authored, real route pricing; all
// other treks below use MOCK route options derived from each trek's own base
// camp and base price (clearly marked). Replace the mock entries with real
// per-trek data as it becomes available.
// ---------------------------------------------------------------------------

export const trekCostBySlug = {
  // --- Real data -----------------------------------------------------------
  "kalsubai-peak-trek": {
    rows: [
      { route: "Igatpuri - Kasara", price: "Rs. 3300" },
      { route: "Kasara - Kasara", price: "Rs. 3300" },
      {
        route: "Nagpur - Nagpur",
        sub: "SL Class Duronto Express",
        subItalic: "subject to availability",
        price: "Rs. 4750",
      },
    ],
    notes: [
      "If travelling from Nagpur, contact the trek expert to check train availability before booking.",
      "Upgrading to 3 AC class depends on availability; check add-on charges.",
    ],
  },

  // --- Mock data (derived from each trek's own base camp + base price) ------
  "amarkantak-trek": mockTrek("Amarkantak", "Nagpur - Nagpur", "Rs. 9499"),
  "andharban-jungle-trek": mockTrek("Pimpri", "Pune - Pune", "Rs. 999"),
  "diu": mockTrek("Diu", "Ahmedabad - Ahmedabad", "Rs. 9499"),
  "harihar-fort-trek": mockTrek("Nashik", "Nashik - Nashik", "Rs. 1099"),
  "harishchandragad-trek": mockTrek("Khireshwar", "Pune - Pune", "Rs. 1299"),
  "himalayan-gujarat": mockTrek("Gujarat", "Ahmedabad - Ahmedabad", "Rs. 14999"),
  "himalayan-madhya-pradesh": mockTrek("Madhya Pradesh", "Nagpur - Nagpur", "Rs. 13999"),
  "himalayan-maharashtra": mockTrek("Western Himalayan Foothills", "Nagpur - Nagpur", "Rs. 18999"),
  "jaipur": mockTrek("Jaipur", "Nagpur - Nagpur", "Rs. 13999"),
  "jodhpur-jaisalmer": mockTrek("Rajasthan", "Nagpur - Nagpur", "Rs. 19999"),
  "karwaan-camping": mockTrek("Near Nagpur", "Nagpur - Nagpur", "Rs. 1799"),
  "kasol": mockTrek("Himachal Pradesh", "Nagpur - Nagpur", "Rs. 16999"),
  "khajuraho": mockTrek("Madhya Pradesh", "Nagpur - Nagpur", "Rs. 9499"),
  "lavasa": mockTrek("Maharashtra", "Pune - Pune", "Rs. 6999"),
  "leh": mockTrek("Ladakh", "Nagpur - Nagpur", "Rs. 29999"),
  "lohagad-fort-trek": mockTrek("Lonavala", "Lonavala - Lonavala", "Rs. 699"),
  "mahabaleshwar": mockTrek("Maharashtra", "Pune - Pune", "Rs. 8999"),
  "malvan-tarkarli": mockTrek("Maharashtra", "Nagpur - Nagpur", "Rs. 11999"),
  "manali": mockTrek("Himachal Pradesh", "Nagpur - Nagpur", "Rs. 17999"),
  "nubra-valley": mockTrek("Ladakh", "Nagpur - Nagpur", "Rs. 34999"),
  "orchha": mockTrek("Madhya Pradesh", "Nagpur - Nagpur", "Rs. 8999"),
  "pachmarhi-trek": mockTrek("Satpura", "Nagpur - Nagpur", "Rs. 9999"),
  "pangong": mockTrek("Ladakh", "Nagpur - Nagpur", "Rs. 32999"),
  "rajgad-fort-trek": mockTrek("Pune", "Pune - Pune", "Rs. 899"),
  "rann-of-kutch": mockTrek("Gujarat", "Ahmedabad - Ahmedabad", "Rs. 13999"),
  "ratangad-fort-trek": mockTrek("Bhandardara", "Nashik - Nashik", "Rs. 899"),
  "saputara": mockTrek("Gujarat", "Ahmedabad - Ahmedabad", "Rs. 9999"),
  "seven-sisters-hill-trek": mockTrek("Near Nagpur", "Nagpur - Nagpur", "Rs. 1499"),
  "silver-falls": mockTrek("Near Nagpur", "Nagpur - Nagpur", "Rs. 799"),
  "sinhagad-fort-trek": mockTrek("Pune", "Pune - Pune", "Rs. 599"),
  "sinhagad-sunset-trek": mockTrek("Pune", "Pune - Pune", "Rs. 649"),
  "spiti-valley": mockTrek("Himachal Pradesh", "Nagpur - Nagpur", "Rs. 28999"),
  "torna-fort-trek": mockTrek("Pune", "Pune - Pune", "Rs. 849"),
  "udaipur": mockTrek("Rajasthan", "Nagpur - Nagpur", "Rs. 14999"),
  "visapur-fort-trek": mockTrek("Lonavala", "Lonavala - Lonavala", "Rs. 749"),
};

export const tripCostBySlug = {
  // --- Real data -----------------------------------------------------------
  "kalsubai-peak-trek": {
    rows: [
      { route: "Jammu - Jammu", price: "Rs. 16499" },
      { route: "Delhi - Delhi", price: "Rs. 18999" },
      {
        route: "Nagpur - Nagpur",
        sub: "3 AC Train, subject to availability",
        price: "Rs. 21999",
      },
    ],
    notes: [
      "If travelling from Nagpur, contact the trek expert to check train availability before booking.",
      "Double-sharing room options are available; check add-ons.",
      "The listed pricing applies only to Superfast Express category trains; premium trains such as Duronto and Rajdhani are excluded.",
    ],
  },

  // --- Mock data (derived from each trek's own base camp + base price) ------
  "amarkantak-trek": mockTrip("Amarkantak", "Nagpur - Nagpur", "Rs. 13499"),
  "andharban-jungle-trek": mockTrip("Pimpri", "Pune - Pune", "Rs. 1499"),
  "diu": mockTrip("Diu", "Ahmedabad - Ahmedabad", "Rs. 16499"),
  "harihar-fort-trek": mockTrip("Nashik", "Nashik - Nashik", "Rs. 1599"),
  "harishchandragad-trek": mockTrip("Khireshwar", "Pune - Pune", "Rs. 1899"),
  "himalayan-gujarat": mockTrip("Gujarat", "Delhi - Delhi", "Rs. 24999"),
  "himalayan-madhya-pradesh": mockTrip("Madhya Pradesh", "Delhi - Delhi", "Rs. 22999"),
  "himalayan-maharashtra": mockTrip("Western Himalayan Foothills", "Delhi - Delhi", "Rs. 27999"),
  "jaipur": mockTrip("Jaipur", "Nagpur - Nagpur", "Rs. 18999"),
  "jodhpur-jaisalmer": mockTrip("Rajasthan", "Nagpur - Nagpur", "Rs. 24999"),
  "karwaan-camping": mockTrip("Near Nagpur", "Nagpur - Nagpur", "Rs. 1799"),
  "kasol": mockTrip("Himachal Pradesh", "Delhi - Delhi", "Rs. 22999"),
  "khajuraho": mockTrip("Madhya Pradesh", "Nagpur - Nagpur", "Rs. 13499"),
  "lavasa": mockTrip("Maharashtra", "Pune - Pune", "Rs. 9999"),
  "leh": mockTrip("Ladakh", "Delhi - Delhi", "Rs. 39999"),
  "lohagad-fort-trek": mockTrip("Lonavala", "Lonavala - Lonavala", "Rs. 999"),
  "mahabaleshwar": mockTrip("Maharashtra", "Pune - Pune", "Rs. 12999"),
  "malvan-tarkarli": mockTrip("Maharashtra", "Nagpur - Nagpur", "Rs. 16999"),
  "manali": mockTrip("Himachal Pradesh", "Delhi - Delhi", "Rs. 23999"),
  "nubra-valley": mockTrip("Ladakh", "Delhi - Delhi", "Rs. 44999"),
  "orchha": mockTrip("Madhya Pradesh", "Nagpur - Nagpur", "Rs. 12999"),
  "pachmarhi-trek": mockTrip("Satpura", "Nagpur - Nagpur", "Rs. 13999"),
  "pangong": mockTrip("Ladakh", "Delhi - Delhi", "Rs. 42999"),
  "rajgad-fort-trek": mockTrip("Pune", "Pune - Pune", "Rs. 1299"),
  "rann-of-kutch": mockTrip("Gujarat", "Ahmedabad - Ahmedabad", "Rs. 18999"),
  "ratangad-fort-trek": mockTrip("Bhandardara", "Nashik - Nashik", "Rs. 1299"),
  "saputara": mockTrip("Gujarat", "Ahmedabad - Ahmedabad", "Rs. 13999"),
  "seven-sisters-hill-trek": mockTrip("Near Nagpur", "Nagpur - Nagpur", "Rs. 1999"),
  "silver-falls": mockTrip("Near Nagpur", "Nagpur - Nagpur", "Rs. 999"),
  "sinhagad-fort-trek": mockTrip("Pune", "Pune - Pune", "Rs. 899"),
  "sinhagad-sunset-trek": mockTrip("Pune", "Pune - Pune", "Rs. 899"),
  "spiti-valley": mockTrip("Himachal Pradesh", "Delhi - Delhi", "Rs. 38999"),
  "torna-fort-trek": mockTrip("Pune", "Pune - Pune", "Rs. 1199"),
  "udaipur": mockTrip("Rajasthan", "Nagpur - Nagpur", "Rs. 19999"),
  "visapur-fort-trek": mockTrip("Lonavala", "Lonavala - Lonavala", "Rs. 999"),
};

// Trip Cost for TOUR PACKAGES (keyed by tour slug, not trek slug). Rendered on
// the tour detail page sidebar by RoutePricingCard variant="tour". MOCK values
// derived from each tour's base price — replace with real per-tour data.
export const tourTripCostBySlug = {
  "scenic-kerala-backwaters-hills": mockTourTrip("Nagpur - Nagpur", "Rs. 22999", "Mumbai - Mumbai", "Rs. 20999"),
  "royal-rajasthan-heritage": mockTourTrip("Nagpur - Nagpur", "Rs. 28999", "Mumbai - Mumbai", "Rs. 26999"),
  "switzerland-alps-paris-magic": mockTourTrip("Nagpur - Nagpur", "Rs. 164999", "Mumbai - Mumbai", "Rs. 159999"),
  "kashmir-backpacking-trip": mockTourTrip("Nagpur - Nagpur", "Rs. 24999", "Delhi - Delhi", "Rs. 22999"),
};

// Mock Trek Cost: region pickup/drop at base price, plus a Nagpur-collection
// row (train). Kept as a helper so every mock entry stays consistent.
function mockTrek(region, mainRoute, mainPrice) {
  return {
    mock: true,
    rows: [
      { route: mainRoute, price: mainPrice },
      {
        route: "Nagpur - Nagpur",
        sub: "SL Class, subject to availability",
        price: mainPrice,
      },
    ],
    notes: [
      "If travelling from Nagpur, contact the trek expert to check train availability before booking.",
      "Upgrading to a higher class depends on availability; check add-on charges.",
    ],
  };
}

// Mock Trip Cost: region pickup/drop with a stay-inclusive trip price.
function mockTrip(region, mainRoute, mainPrice) {
  return {
    mock: true,
    rows: [
      { route: mainRoute, price: mainPrice },
      {
        route: `Nagpur - Nagpur`,
        sub: "3 AC Train, subject to availability",
        price: mainPrice,
      },
    ],
    notes: [
      "If travelling from Nagpur, contact the trek expert to check train availability before booking.",
      "Double-sharing room options are available; check add-ons.",
      "Listed pricing applies to Superfast Express category trains; premium trains such as Duronto and Rajdhani are excluded.",
    ],
  };
}

// Mock Trip Cost for tour packages: departure-city pickup/drop, per person.
function mockTourTrip(cityA, priceA, cityB, priceB) {
  return {
    mock: true,
    rows: [
      { route: cityA, price: priceA },
      { route: cityB, price: priceB },
    ],
    notes: [
      "Prices are per person on twin-sharing basis, including GST.",
      "Flights/trains to the departure city are quoted separately unless mentioned.",
      "Contact the travel desk for custom dates, group discounts and single-supplement rates.",
    ],
  };
}
