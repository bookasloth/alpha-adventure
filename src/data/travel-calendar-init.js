(function () {
const searchInput = document.getElementById('trekSearch');
            const categoryFilter = document.getElementById('categoryFilter');
            const durationFilter = document.getElementById('durationFilter');
            const budgetMin = document.getElementById('budgetMin');
            const budgetMax = document.getElementById('budgetMax');
            const budgetMinLabel = document.getElementById('budgetMinLabel');
            const budgetMaxLabel = document.getElementById('budgetMaxLabel');
            const monthChips = document.querySelectorAll('.month-chip');
            const resetBtn = document.getElementById('resetFilters');
            const emptyState = document.getElementById('emptyState');

            const mobileFilterToggle = document.getElementById('mobileFilterToggle');
            const calendarSidebar = document.getElementById('calendarSidebar');
            const sidebarClose = document.getElementById('sidebarClose');
            const filterOverlay = document.getElementById('filterOverlay');

            function formatCurrency(val) {
                return '₹' + Number(val).toLocaleString('en-IN');
            }

            function updateBudgetLabels() {
                let minVal = parseInt(budgetMin.value);
                let maxVal = parseInt(budgetMax.value);
                if (minVal > maxVal) {
                    budgetMin.value = maxVal;
                    minVal = maxVal;
                }
                budgetMinLabel.textContent = formatCurrency(minVal);
                budgetMaxLabel.textContent = formatCurrency(maxVal);
            }

            function getDurationRange(val) {
                switch (val) {
                    case '1-2': return [1, 2];
                    case '3-5': return [3, 5];
                    case '6-8': return [6, 8];
                    case '9-12': return [9, 12];
                    case '13+': return [13, Infinity];
                    default: return null;
                }
            }

            function filterTreks() {
                const searchTerm = searchInput.value.toLowerCase().trim();
                const catFilter = categoryFilter.value;
                const durFilter = durationFilter.value;
                const minPrice = parseInt(budgetMin.value) || 0;
                const maxPrice = parseInt(budgetMax.value) || 50000;
                const activeMonthChip = document.querySelector('.month-chip.active');
                const monthVal = activeMonthChip ? activeMonthChip.getAttribute('data-month') : 'all';

                const cards = document.querySelectorAll('.trek-card');
                let visibleCount = 0;

                cards.forEach(card => {
                    const searchData = card.getAttribute('data-search') || '';
                    const dest = card.getAttribute('data-destination') || '';
                    const duration = parseInt(card.getAttribute('data-duration')) || 0;
                    const price = parseInt(card.getAttribute('data-price')) || 0;
                    const month = parseInt(card.getAttribute('data-month')) || 0;
                    const category = card.getAttribute('data-category') || '';

                    const cardText = card.textContent.toLowerCase();
                    const matchesSearch = searchTerm === '' ||
                        searchData.includes(searchTerm) ||
                        dest.includes(searchTerm) ||
                        cardText.includes(searchTerm);

                    const matchesCategory = catFilter === 'all' || category === catFilter;

                    let matchesDuration = true;
                    if (durFilter !== 'all') {
                        const range = getDurationRange(durFilter);
                        if (range) matchesDuration = duration >= range[0] && duration <= range[1];
                    }

                    const matchesMonth = monthVal === 'all' || month === parseInt(monthVal);

                    const effectiveMin = Math.min(minPrice, maxPrice);
                    const effectiveMax = Math.max(minPrice, maxPrice);
                    const matchesBudget = price >= effectiveMin && price <= effectiveMax;

                    if (matchesSearch && matchesCategory && matchesDuration && matchesMonth && matchesBudget) {
                        card.style.display = 'flex';
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
            }

            if (searchInput) searchInput.addEventListener('input', filterTreks);
            if (categoryFilter) categoryFilter.addEventListener('change', filterTreks);
            if (durationFilter) durationFilter.addEventListener('change', filterTreks);

            if (budgetMin) {
                budgetMin.addEventListener('input', function () {
                    updateBudgetLabels();
                    filterTreks();
                });
            }
            if (budgetMax) {
                budgetMax.addEventListener('input', function () {
                    updateBudgetLabels();
                    filterTreks();
                });
            }

            monthChips.forEach(chip => {
                chip.addEventListener('click', function () {
                    monthChips.forEach(c => c.classList.remove('active'));
                    this.classList.add('active');
                    filterTreks();
                });
            });

            if (resetBtn) {
                resetBtn.addEventListener('click', function () {
                    searchInput.value = '';
                    categoryFilter.value = 'all';
                    durationFilter.value = 'all';
                    budgetMin.value = 0;
                    budgetMax.value = 50000;
                    monthChips.forEach(c => c.classList.remove('active'));
                    monthChips[0].classList.add('active');
                    updateBudgetLabels();
                    filterTreks();
                });
            }

            function openSidebar() {
                calendarSidebar.classList.add('open');
                filterOverlay.classList.add('open');
                document.body.style.overflow = 'hidden';
            }

            function closeSidebar() {
                calendarSidebar.classList.remove('open');
                filterOverlay.classList.remove('open');
                document.body.style.overflow = '';
            }

            if (mobileFilterToggle) mobileFilterToggle.addEventListener('click', openSidebar);
            if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
            if (filterOverlay) filterOverlay.addEventListener('click', closeSidebar);

            updateBudgetLabels();
        
})();