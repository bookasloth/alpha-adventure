        $(document).ready(function() {
            // Full category tree from PHP
            const categoryTree = [{"name":"Upcoming Treks","slug":"upcoming-treks","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[{"name":"Sahyadri Treks","slug":"sahyadri-treks","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]},{"name":"Himalayan Treks","slug":"himalayan-treks","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[{"name":"Maharashtra","slug":"maharashtra","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]},{"name":"Gujarat","slug":"gujarat","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]},{"name":"Madhya Pradesh","slug":"madhya-pradesh","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]}]},{"name":"Central India Treks","slug":"central-india-treks","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]}]},{"name":"Backpacking Trips","slug":"backpacking-trips","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[{"name":"Maharashtra","slug":"maharashtra-1781965363","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[{"name":"Malvan-Tarkarli","slug":"malvan-tarkarli","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]}]},{"name":"Gujarat","slug":"gujarat-1781965392","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]},{"name":"Madhya Pradesh","slug":"madhya-pradesh-1781965402","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]},{"name":"Rajasthan","slug":"rajasthan","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[{"name":"Jodhpur-Jaisalmer","slug":"jodhpur-jaisalmer","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]}]},{"name":"Himachal Pradesh","slug":"himachal-pradesh","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[{"name":"Spiti Valley","slug":"spiti-valley","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]}]},{"name":"Ladakh","slug":"ladakh","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]}]},{"name":"Trips Near Nagpur","slug":"trips-near-nagpur","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[{"name":"Seven Sisters Hill Trek","slug":"seven-sisters-hill-trek","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]},{"name":"Silver Falls","slug":"silver-falls","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]},{"name":"Karwaan Camping","slug":"karwaan-camping","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]}]},{"name":"Tour Packages","slug":"tour-packages","description":"","image":null,"seo_title":"","meta_description":"","canonical_url":"","schema_type":"","noindex":0,"subcategories":[]}];

            // Helper to recursively get all subcategories of a category slug
            function getSubcategoriesRecursive(slug, list = []) {
                const findAndAdd = (nodes) => {
                    for (const node of nodes) {
                        if (node.slug === slug) {
                            if (node.subcategories && node.subcategories.length > 0) {
                                flattenSubcategories(node.subcategories, list);
                            }
                            return true;
                        }
                        if (node.subcategories && node.subcategories.length > 0) {
                            if (findAndAdd(node.subcategories)) return true;
                        }
                    }
                    return false;
                };

                const flattenSubcategories = (nodes, targetList, prefix = '') => {
                    for (const node of nodes) {
                        const displayName = prefix ? `${prefix} › ${node.name}` : node.name;
                        targetList.push({ slug: node.slug, name: displayName });
                        if (node.subcategories && node.subcategories.length > 0) {
                            flattenSubcategories(node.subcategories, targetList, displayName);
                        }
                    }
                };

                findAndAdd(categoryTree);
                return list;
            }

            // Populate Subcategory dropdown based on selected Category
            $('#gallery-category-select').on('change', function() {
                const categorySlug = $(this).val();
                const $subSelect = $('#gallery-subcategory-select');

                // Clear previous options
                $subSelect.html('<option value="all">All Subcategories</option>');

                if (categorySlug === 'all') {
                    $subSelect.prop('disabled', true);
                } else {
                    const subs = getSubcategoriesRecursive(categorySlug);
                    if (subs.length > 0) {
                        subs.forEach(function(sub) {
                            $subSelect.append($('<option>', {
                                value: sub.slug,
                                text: sub.name
                            }));
                        });
                        $subSelect.prop('disabled', false);
                    } else {
                        $subSelect.prop('disabled', true);
                    }
                }

                // Apply filtering
                applyFilters();
            });

            // Trigger filter apply on subcategory or search change
            $('#gallery-subcategory-select').on('change', applyFilters);
            $('#gallery-search-input').on('input', applyFilters);

            // Reset Button handler
            $('#gallery-reset-btn').on('click', function() {
                $('#gallery-search-input').val('');
                $('#gallery-category-select').val('all').trigger('change');
            });

            // Master Filter Function
            function applyFilters() {
                const searchQuery = $('#gallery-search-input').val().toLowerCase().trim();
                const selectedCategory = $('#gallery-category-select').val();
                const selectedSubcategory = $('#gallery-subcategory-select').val();

                $('.gallery-card-wrapper').each(function() {
                    const cardTitle = $(this).find('.gallery-item-title').text().toLowerCase();
                    const cardCategory = $(this).attr('data-category') || '';
                    const cardSubcategory = $(this).attr('data-subcategory') || '';

                    // Match logic
                    const matchesCategory = (selectedCategory === 'all' || cardCategory === selectedCategory);
                    const matchesSubcategory = (selectedSubcategory === 'all' || cardSubcategory === selectedSubcategory);
                    const matchesSearch = (searchQuery === '' || cardTitle.includes(searchQuery));

                    if (matchesCategory && matchesSubcategory && matchesSearch) {
                        $(this).stop(true, true).fadeIn(400).css({
                            'transform': 'scale(1)'
                        });
                    } else {
                        $(this).stop(true, true).fadeOut(300).css({
                            'transform': 'scale(0.95)'
                        });
                    }
                });
            }
        });
    