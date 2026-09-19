/**
 * Header Search Autocomplete Functionality
 * Integrates search across static pages, treks, and tours.
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const searchConfigs = [
            {
                inputSelector: '#desktop-search-input',
                formSelector: '.search-area', // wrapper form
                containerClass: 'desktop-results'
            },
            {
                inputSelector: '#mobile-search-input',
                formSelector: '#mobile-search-form', // wrapper form
                containerClass: 'mobile-results'
            }
        ];

        searchConfigs.forEach(config => {
            initSearchAutocomplete(config);
        });
    });

    /**
     * Initialize autocomplete logic for a specific input configuration.
     */
    function initSearchAutocomplete(config) {
        const input = document.querySelector(config.inputSelector);
        if (!input) return;

        const form = input.closest('form') || document.querySelector(config.formSelector);
        if (!form) return;

        // Ensure form and input do not use default browser autofill
        input.setAttribute('autocomplete', 'off');
        form.setAttribute('autocomplete', 'off');

        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.className = `search-dropdown-results ${config.containerClass}`;
        form.appendChild(dropdown);

        let debounceTimer = null;
        let activeIndex = -1; // Index of the highlighted item for keyboard navigation

        // Listen for input changes
        input.addEventListener('input', function() {
            const query = input.value.trim();

            clearTimeout(debounceTimer);

            if (query.length < 2) {
                hideDropdown();
                return;
            }

            debounceTimer = setTimeout(() => {
                fetchSearchResults(query);
            }, 300);
        });

        // Listen for keyboard navigation
        input.addEventListener('keydown', function(e) {
            const items = dropdown.querySelectorAll('.search-result-item');
            if (dropdown.style.display !== 'block' || items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex++;
                if (activeIndex >= items.length) activeIndex = 0;
                highlightItem(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex--;
                if (activeIndex < 0) activeIndex = items.length - 1;
                highlightItem(items);
            } else if (e.key === 'Enter') {
                if (activeIndex > -1 && items[activeIndex]) {
                    e.preventDefault();
                    items[activeIndex].click();
                }
            } else if (e.key === 'Escape') {
                hideDropdown();
            }
        });

        // Prevent form submission on enter if we just selected an autocomplete item
        form.addEventListener('submit', function(e) {
            // If the user presses enter with a keyboard-active autocomplete item, let keydown handle it
            if (activeIndex > -1) {
                e.preventDefault();
                return;
            }
            
            // Otherwise, if they just submitted the search form, redirect to custom treks page with search term
            const query = input.value.trim();
            if (query.length > 0) {
                e.preventDefault();
                // Redirect to category treks page or search page
                // Let's redirect to upcoming-treks or category-treks with a search/filter parameter
                window.location.href = `upcoming-treks?search=${encodeURIComponent(query)}`;
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!form.contains(e.target)) {
                hideDropdown();
            }
        });

        // Re-open dropdown when focusing input (if it has query)
        input.addEventListener('focus', function() {
            const query = input.value.trim();
            if (query.length >= 2) {
                fetchSearchResults(query);
            }
        });

        /**
         * Fetch search results from the Admin API.
         */
        function fetchSearchResults(query) {
            showLoading();

            const apiUrl = `Admin/api/v1/search?q=${encodeURIComponent(query)}`;

            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(res => {
                    if (res.success && res.data) {
                        renderResults(res.data, query);
                    } else {
                        renderEmpty();
                    }
                })
                .catch(err => {
                    console.error('[SearchAutocomplete] Fetch error:', err);
                    renderError();
                });
        }

        /**
         * Render the search results inside the dropdown.
         */
        function renderResults(data, query) {
            dropdown.innerHTML = '';
            activeIndex = -1;

            const { pages, treks, tours } = data;
            const totalCount = pages.length + treks.length + tours.length;

            if (totalCount === 0) {
                renderEmpty();
                return;
            }

            // Render Treks
            if (treks.length > 0) {
                renderSection('Treks', treks, 'type-trek', 'bi bi-compass', query);
            }

            // Render Tours
            if (tours.length > 0) {
                renderSection('Tours & Packages', tours, 'type-tour', 'bi bi-geo-alt', query);
            }

            // Render Static Pages
            if (pages.length > 0) {
                renderSection('Information & Pages', pages, 'type-page', 'bi bi-file-earmark-text', query);
            }

            dropdown.style.display = 'block';
        }

        /**
         * Render a specific section (Treks, Tours, Pages) of results.
         */
        function renderSection(title, items, typeClass, iconClass, query) {
            const section = document.createElement('div');
            section.className = 'search-results-section';

            const header = document.createElement('div');
            header.className = 'search-section-header';
            header.innerHTML = `
                <span>${escapeHTML(title)}</span>
                <span class="section-count">${items.length}</span>
            `;
            section.appendChild(header);

            items.forEach(item => {
                const link = document.createElement('a');
                link.className = 'search-result-item';
                link.href = item.url;

                // Build meta information (e.g. Price or Duration)
                let metaHtml = '';
                if (item.days) {
                    metaHtml = `<span class="item-meta">${item.days}D/${item.nights}N</span>`;
                }

                // If trek has location, append to description
                let desc = item.description || '';
                if (item.location) {
                    desc = `[${item.location}] ${desc}`;
                }

                link.innerHTML = `
                    <div class="item-icon-wrapper ${typeClass}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="item-content">
                        <div class="item-title-row">
                            <span class="item-title">${highlightQuery(item.title, query)}</span>
                            ${metaHtml}
                        </div>
                        <div class="item-desc">${escapeHTML(desc)}</div>
                    </div>
                `;

                section.appendChild(link);
            });

            dropdown.appendChild(section);
        }

        /**
         * Highlight a dropdown item when navigating with keys.
         */
        function highlightItem(items) {
            items.forEach((item, index) => {
                if (index === activeIndex) {
                    item.classList.add('keyboard-active');
                    // Scroll item into view if container overflows
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('keyboard-active');
                }
            });
        }

        function showLoading() {
            dropdown.innerHTML = `
                <div class="search-dropdown-loading">
                    <div class="spinner"></div>
                    <span>Searching...</span>
                </div>
            `;
            dropdown.style.display = 'block';
        }

        function renderEmpty() {
            dropdown.innerHTML = `
                <div class="search-dropdown-empty">
                    <i class="bi bi-search"></i>
                    <p>No results found. Try another keyword!</p>
                </div>
            `;
            dropdown.style.display = 'block';
        }

        function renderError() {
            dropdown.innerHTML = `
                <div class="search-dropdown-empty">
                    <i class="bi bi-exclamation-circle text-danger"></i>
                    <p>Search failed. Please try again later.</p>
                </div>
            `;
            dropdown.style.display = 'block';
        }

        function hideDropdown() {
            dropdown.style.display = 'none';
            activeIndex = -1;
        }

        // Helpers
        function escapeHTML(str) {
            if (!str) return '';
            return str.replace(/[&<>'"]/g, 
                tag => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    "'": '&#39;',
                    '"': '&quot;'
                }[tag] || tag)
            );
        }

        function highlightQuery(text, query) {
            if (!query) return escapeHTML(text);
            const escapedText = escapeHTML(text);
            const escapedQuery = escapeHTML(query);
            // Replace regex special chars to prevent syntax errors
            const escapedRegexQuery = escapedQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`(${escapedRegexQuery})`, 'gi');
            return escapedText.replace(regex, '<span class="search-highlight">$1</span>');
        }
    }
})();
