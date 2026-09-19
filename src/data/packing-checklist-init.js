/**
 * Alpha Adventures - Trekking Packing Checklist JS
 * Features: LocalStorage persistence, Custom items, Season filtering, Search filtering, Print layout formatting.
 * Wrapped in onReady() because the init script is injected after DOMContentLoaded has already fired.
 */

function onReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

onReady(function () {

const DEFAULT_CHECKLIST = {
    clothing: [
        { id: 'c1', name: 'Quick-dry trekking t-shirts (3-4)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'c2', name: 'Lightweight fleece jacket', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'c3', name: 'Padded or down jacket (sub-zero temperatures)', seasons: ['winter'], isEssential: true },
        { id: 'c4', name: 'Waterproof & windproof windcheater/jacket', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'c5', name: 'Quick-dry trekking pants (2-3 pairs)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'c6', name: 'Thermal innerwear (top & bottom)', seasons: ['winter'], isEssential: true },
        { id: 'c7', name: 'Poncho or rain jacket & rain pants', seasons: ['monsoon'], isEssential: true },
        { id: 'c8', name: 'Sun protection cap & neck balaclava', seasons: ['summer', 'winter'], isEssential: false },
        { id: 'c9', name: 'Woolen cap / beanie (covering ears)', seasons: ['winter'], isEssential: true }
    ],
    footwear: [
        { id: 'f1', name: 'Trekking shoes with high ankle support & good grip', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'f2', name: 'Cotton socks (3-4 pairs)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'f3', name: 'Thick woolen socks (2 pairs for night/cold)', seasons: ['winter'], isEssential: true },
        { id: 'f4', name: 'Camp sandals or lightweight slippers', seasons: ['summer', 'winter', 'monsoon'], isEssential: false },
        { id: 'f5', name: 'Waterproof gaiters (for snow or deep mud)', seasons: ['winter', 'monsoon'], isEssential: false }
    ],
    gear: [
        { id: 'g1', name: 'Main backpack (50-60 Liters) with waterproof rain cover', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'g2', name: 'Daypack (20-30 Liters, if offloading main bag)', seasons: ['summer', 'winter', 'monsoon'], isEssential: false },
        { id: 'g3', name: 'Adjustable trekking poles (1 pair)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'g4', name: 'LED Headlamp or Torch with spare batteries', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'g5', name: 'UV sunglasses (Category 3 or 4 protection)', seasons: ['summer', 'winter'], isEssential: true },
        { id: 'g6', name: 'Water bottles or Hydration bladder (Min 2 Liters)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true }
    ],
    toiletries: [
        { id: 't1', name: 'Sunscreen lotion (SPF 50+)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 't2', name: 'Lip balm / vaseline with SPF', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 't3', name: 'Moisturizer & cold cream', seasons: ['winter'], isEssential: false },
        { id: 't4', name: 'Hand sanitizer & biodegradable wet wipes', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 't5', name: 'Toothbrush & biodegradable toothpaste', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 't6', name: 'Quick-dry microfiber towel', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 't7', name: 'Toilet paper rolls (2 nos)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true }
    ],
    medical: [
        { id: 'm1', name: 'Personal prescription medications', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'm2', name: 'Band-aids, cotton rolls & sterile bandages', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'm3', name: 'Antiseptic cream & alcohol prep pads', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'm4', name: 'Pain relief gel/spray (Volini/Moov)', seasons: ['summer', 'winter', 'monsoon'], isEssential: false },
        { id: 'm5', name: 'ORS (Oral Rehydration Salts) or Electral packets', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'm6', name: 'Altitude sickness pills (Diamox - consult doctor)', seasons: ['winter'], isEssential: false },
        { id: 'm7', name: 'Insect repellent spray/cream', seasons: ['monsoon'], isEssential: false }
    ],
    documents: [
        { id: 'd1', name: 'Original Government ID (Aadhaar, Passport, DL) + 2 photocopies', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'd2', name: 'Trek permit, declaration forms & medical certificate', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'd3', name: 'Passport-size photographs (3 copies)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'd4', name: 'Cash (Adequate cash, as ATM & digital payments fail)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true }
    ],
    miscellaneous: [
        { id: 'x1', name: 'High-capacity power bank (10,000 - 20,000 mAh)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'x2', name: 'Thick garbage bags (to pack and carry back waste)', seasons: ['summer', 'winter', 'monsoon'], isEssential: true },
        { id: 'x3', name: 'Energy snacks: dry fruits, chocolate bars, energy gel', seasons: ['summer', 'winter', 'monsoon'], isEssential: false },
        { id: 'x4', name: 'Ziploc bags to protect electronics & documents', seasons: ['summer', 'winter', 'monsoon'], isEssential: true }
    ]
};

// Storage Keys
const STORAGE_CHECKED_KEY = 'alpha_checklist_checked';
const STORAGE_CUSTOM_KEY = 'alpha_checklist_custom';
const STORAGE_SEASON_KEY = 'alpha_checklist_season';

let checkedItems = {};
let customItems = {};
let currentSeason = 'all';
let searchQuery = '';

// Load state from localStorage
function loadState() {
    try {
        const storedChecked = localStorage.getItem(STORAGE_CHECKED_KEY);
        if (storedChecked) {
            checkedItems = JSON.parse(storedChecked);
        } else {
            checkedItems = {};
        }

        const storedCustom = localStorage.getItem(STORAGE_CUSTOM_KEY);
        if (storedCustom) {
            customItems = JSON.parse(storedCustom);
        } else {
            // Initialize empty categories for custom items
            Object.keys(DEFAULT_CHECKLIST).forEach(cat => {
                customItems[cat] = [];
            });
        }

        const storedSeason = localStorage.getItem(STORAGE_SEASON_KEY);
        if (storedSeason) {
            currentSeason = storedSeason;
        } else {
            currentSeason = 'all';
        }
    } catch (e) {
        console.error('Failed to load state from localStorage', e);
        checkedItems = {};
        customItems = {};
        Object.keys(DEFAULT_CHECKLIST).forEach(cat => {
            customItems[cat] = [];
        });
        currentSeason = 'all';
    }
}

// Save state to localStorage
function saveState() {
    try {
        localStorage.setItem(STORAGE_CHECKED_KEY, JSON.stringify(checkedItems));
        localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(customItems));
        localStorage.setItem(STORAGE_SEASON_KEY, currentSeason);
    } catch (e) {
        console.error('Failed to save state to localStorage', e);
    }
}

// Set up UI Event listeners
function setupEventListeners() {
    // Season Filters
    const seasonButtons = document.querySelectorAll('.season-filter-btn');
    seasonButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            seasonButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSeason = btn.dataset.season;
            saveState();
            renderChecklist();
        });
    });

    // Apply active class to loaded season
    const activeBtn = document.querySelector(`.season-filter-btn[data-season="${currentSeason}"]`);
    if (activeBtn) {
        seasonButtons.forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    // Search Input
    const searchInput = document.getElementById('checklist-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterChecklistItems();
        });
    }

    // Action Buttons
    const printBtn = document.getElementById('print-checklist-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            // Update printable meta details before print
            const trekNameVal = document.getElementById('print-trek-name-input')?.value.trim() || '';
            const trekDateVal = document.getElementById('print-trek-date-input')?.value.trim() || '';
            const trekkerNameVal = document.getElementById('print-trekker-name-input')?.value.trim() || '';

            document.getElementById('print-meta-trek-name').textContent = trekNameVal;
            document.getElementById('print-meta-trek-date').textContent = trekDateVal;
            document.getElementById('print-meta-trekker-name').textContent = trekkerNameVal;

            window.print();
        });
    }

    const resetBtn = document.getElementById('reset-checklist-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the checklist? All checked items and custom entries will be removed.')) {
                checkedItems = {};
                customItems = {};
                Object.keys(DEFAULT_CHECKLIST).forEach(cat => {
                    customItems[cat] = [];
                });
                currentSeason = 'all';
                saveState();

                // Reset season UI
                seasonButtons.forEach(b => b.classList.remove('active'));
                const defaultSeasonBtn = document.querySelector('.season-filter-btn[data-season="all"]');
                if (defaultSeasonBtn) defaultSeasonBtn.classList.add('active');

                // Clear search
                if (searchInput) searchInput.value = '';
                searchQuery = '';

                renderChecklist();
            }
        });
    }
}

// Render the checklist structure
function renderChecklist() {
    let totalItemsCount = 0;
    let totalCheckedCount = 0;

    Object.keys(DEFAULT_CHECKLIST).forEach(category => {
        const container = document.getElementById(`list-${category}`);
        if (!container) return;

        container.innerHTML = '';

        // Get default items that match current season
        const defaultList = DEFAULT_CHECKLIST[category].filter(item => {
            if (currentSeason === 'all') return true;
            return item.seasons.includes(currentSeason);
        });

        // Get custom items for this category
        const customList = customItems[category] || [];

        const categoryItems = [...defaultList, ...customList];

        let catItemsCount = 0;
        let catCheckedCount = 0;

        categoryItems.forEach(item => {
            const isChecked = !!checkedItems[item.id];

            // Increment overall counts
            totalItemsCount++;
            catItemsCount++;
            if (isChecked) {
                totalCheckedCount++;
                catCheckedCount++;
            }

            // Create checklist item DOM element
            const itemDiv = document.createElement('div');
            itemDiv.className = `checklist-item ${isChecked ? 'checked' : ''}`;
            itemDiv.dataset.itemId = item.id;
            itemDiv.dataset.itemName = item.name.toLowerCase();

            // Checkbox icon based on checked state
            const iconHTML = isChecked ? '<i class="bi bi-check-lg"></i>' : '';

            // Render badges
            let badgeHTML = '';
            if (item.isEssential) {
                badgeHTML += '<span class="checklist-item-badge essential ms-2">Essential</span>';
            }

            // Show season badges if viewing "all"
            if (currentSeason === 'all' && item.seasons) {
                if (item.seasons.length === 1) {
                    badgeHTML += `<span class="checklist-item-badge ${item.seasons[0]} ms-1">${item.seasons[0]}</span>`;
                }
            }

            // Check if this is a custom item
            const isCustom = item.id.startsWith('custom_');
            const actionHTML = isCustom
                ? `<button class="delete-custom-item" onclick="deleteCustomItem('${category}', '${item.id}')" title="Delete custom item"><i class="bi bi-trash"></i></button>`
                : '';

            itemDiv.innerHTML = `
                <div class="checklist-item-left" onclick="toggleItem('${item.id}', '${category}')">
                    <div class="checklist-item-checkbox">${iconHTML}</div>
                    <span class="checklist-item-label">${item.name} ${badgeHTML}</span>
                </div>
                <div class="checklist-item-actions">
                    ${actionHTML}
                </div>
            `;

            container.appendChild(itemDiv);
        });

        // Update category progress badge
        const catProgressBadge = document.getElementById(`progress-badge-${category}`);
        if (catProgressBadge) {
            catProgressBadge.textContent = `${catCheckedCount}/${catItemsCount}`;
        }

        // Add visual styling class if category is 100% completed
        const categoryCard = container.closest('.checklist-card');
        if (categoryCard) {
            if (catItemsCount > 0 && catCheckedCount === catItemsCount) {
                categoryCard.classList.add('category-completed');
            } else {
                categoryCard.classList.remove('category-completed');
            }
        }
    });

    // Update overall progress card
    const percentage = totalItemsCount > 0 ? Math.round((totalCheckedCount / totalItemsCount) * 100) : 0;

    const progressText = document.getElementById('overall-progress-text');
    if (progressText) {
        progressText.textContent = `${totalCheckedCount} of ${totalItemsCount} packed`;
    }

    const progressPercentage = document.getElementById('overall-progress-percentage');
    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }

    const progressBar = document.getElementById('overall-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    // Run search filtering if query exists
    if (searchQuery) {
        filterChecklistItems();
    }
}

// Toggle checkbox item state
window.toggleItem = function(id, category) {
    checkedItems[id] = !checkedItems[id];
    saveState();
    renderChecklist();
};

// Filter items in real-time via search input
function filterChecklistItems() {
    const categories = Object.keys(DEFAULT_CHECKLIST);
    categories.forEach(category => {
        const container = document.getElementById(`list-${category}`);
        if (!container) return;

        const items = container.querySelectorAll('.checklist-item');
        let visibleCount = 0;

        items.forEach(item => {
            const name = item.dataset.itemName;
            if (name.includes(searchQuery)) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Hide category card if search yields no results in this category
        const categoryCard = container.closest('.checklist-card');
        if (categoryCard) {
            if (visibleCount === 0 && searchQuery !== '') {
                categoryCard.style.display = 'none';
            } else {
                categoryCard.style.display = 'block';
            }
        }
    });
}

// Add a custom item to a category
window.addCustomItem = function(category) {
    const input = document.getElementById(`input-${category}`);
    if (!input) return;

    const nameVal = input.value.trim();
    if (!nameVal) return;

    const newItem = {
        id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: nameVal,
        seasons: ['summer', 'winter', 'monsoon'], // custom items default to all seasons
        isEssential: false
    };

    if (!customItems[category]) {
        customItems[category] = [];
    }

    customItems[category].push(newItem);
    input.value = '';

    saveState();
    renderChecklist();
};

// Handle enter key on custom item inputs
window.handleCustomInputKey = function(event, category) {
    if (event.key === 'Enter') {
        addCustomItem(category);
    }
};

// Delete a custom item from a category
window.deleteCustomItem = function(category, id) {
    event.stopPropagation(); // Prevent toggling the item when clicking delete

    if (customItems[category]) {
        customItems[category] = customItems[category].filter(item => item.id !== id);

        // Remove from checkedItems if it was checked
        if (checkedItems[id] !== undefined) {
            delete checkedItems[id];
        }

        saveState();
        renderChecklist();
    }
};

loadState();
setupEventListeners();
renderChecklist();

});