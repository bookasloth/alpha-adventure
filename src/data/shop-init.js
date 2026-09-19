
        (function () {
            var cartStorageKey = 'alpha-adventures-cart';
            var filterWrap = document.getElementById('shopCategoryFilters');
            var searchInput = document.getElementById('shopSearch');
            var sortSelect = document.getElementById('shopSort');
            var grid = document.getElementById('shopProductGrid');
            var cards = Array.prototype.slice.call(document.querySelectorAll('.shop-v2-item'));
            var resultCount = document.getElementById('shopResultCount');
            var cartCount = document.getElementById('shopCartCount');
            var noResultBlock = document.getElementById('shopNoResults');
            var productDetailsModal = document.getElementById('productDetailsModal');
            var modalSingleMedia = document.getElementById('shopModalSingleMedia');
            var modalImage = document.getElementById('shopModalImage');
            var modalCarousel = document.getElementById('shopModalCarousel');
            var modalCarouselWrapper = document.getElementById('shopModalCarouselWrapper');
            var modalCategory = document.getElementById('shopModalCategory');
            var modalTitle = document.getElementById('shopModalTitle');
            var modalPrice = document.getElementById('shopModalPrice');
            var modalDescription = document.getElementById('shopModalDescription');
            var modalSpecs = document.getElementById('shopModalSpecs');
            var modalAddButton = document.getElementById('shopModalAddBtn');
            var modalSwiper = null;
            var activeCategory = 'all';
            var productImageMap = {
                'rub-50-red': [
                    'assets/img/innerpages/product-img1.jpg',
                    'assets/img/innerpages/product-details-img1.jpg'
                ],
                'rub-50-blue': [
                    'assets/img/innerpages/product-img2.jpg',
                    'assets/img/innerpages/product-details-img2.jpg'
                ],
                'od-4-black': [
                    'assets/img/innerpages/product-img3.jpg',
                    'assets/img/innerpages/product-details-img3.jpg'
                ],
                'od-1-black': [
                    'assets/img/innerpages/product-img4.jpg'
                ],
                'od-1-brown': [
                    'assets/img/innerpages/product-img5.jpg'
                ],
                'trekking-pole': [
                    'assets/img/innerpages/product-img6.jpg'
                ]
            };

            function readCart() {
                try {
                    return JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
                } catch (error) {
                    return [];
                }
            }

            function writeCart(cart) {
                localStorage.setItem(cartStorageKey, JSON.stringify(cart));
            }

            function formatPriceLabel(card) {
                var priceNode = card.querySelector('.product-card-title-row span');
                return priceNode ? priceNode.textContent.trim() : '';
            }

            function parseSpecs(specValue) {
                return (specValue || '').split('|').map(function (item) {
                    return item.trim();
                }).filter(function (item) {
                    return item !== '';
                });
            }

            function buildSpecMarkup(specValue) {
                return parseSpecs(specValue).map(function (item) {
                    var parts = item.split(':');
                    var label = parts.shift();
                    var value = parts.join(':').trim();

                    if (!value) {
                        return '<li>' + item + '</li>';
                    }

                    return '<li><strong>' + label.trim() + ':</strong> <span>' + value + '</span></li>';
                }).join('');
            }

            function getProductImages(productId, fallbackImage) {
                return (productImageMap[productId] || [fallbackImage]).filter(function (imageSrc) {
                    return !!imageSrc;
                });
            }

            function destroyModalCarousel() {
                if (modalSwiper) {
                    modalSwiper.destroy(true, true);
                    modalSwiper = null;
                }
            }

            function showProductDetails(card, triggerButton) {
                var productButton = card.querySelector('.shop-add-btn');
                var productId = productButton ? productButton.getAttribute('data-product-id') : triggerButton.getAttribute('data-product-id');
                var productName = card.getAttribute('data-name') || triggerButton.getAttribute('data-product-name') || '';
                var description = card.getAttribute('data-description') || '';
                var priceLabel = formatPriceLabel(card);
                var specsValue = card.getAttribute('data-specs') || '';
                var fallbackImage = triggerButton.getAttribute('data-product-image') || card.querySelector('.product-card-img img')?.getAttribute('src') || '';
                var imageList = getProductImages(productId, fallbackImage);
                var firstImage = imageList[0] || fallbackImage;

                destroyModalCarousel();

                if (imageList.length > 1) {
                    modalSingleMedia.hidden = true;
                    modalCarousel.hidden = false;
                    modalCarouselWrapper.innerHTML = imageList.map(function (imageSrc) {
                        return '<div class="swiper-slide">' +
                            '<img src="' + imageSrc + '" alt="' + productName + '">' +
                        '</div>';
                    }).join('');
                } else {
                    modalCarouselWrapper.innerHTML = '';
                    modalCarousel.hidden = true;
                    modalSingleMedia.hidden = false;
                    modalImage.src = firstImage;
                    modalImage.alt = productName;
                }

                modalCategory.textContent = card.getAttribute('data-category') || 'Product details';
                modalTitle.textContent = productName;
                modalPrice.textContent = priceLabel;
                modalDescription.textContent = description;
                modalSpecs.innerHTML = buildSpecMarkup(specsValue);

                modalAddButton.setAttribute('data-product-id', productId);
                modalAddButton.setAttribute('data-product-name', productName);
                modalAddButton.setAttribute('data-product-price', card.getAttribute('data-price') || '0');
                modalAddButton.setAttribute('data-product-image', firstImage);

                if (window.bootstrap && productDetailsModal) {
                    var modalInstance = window.bootstrap.Modal.getOrCreateInstance(productDetailsModal);

                    productDetailsModal.addEventListener('shown.bs.modal', function onShown() {
                        productDetailsModal.removeEventListener('shown.bs.modal', onShown);

                        if (modalCarousel && !modalCarousel.hidden && window.Swiper) {
                            modalSwiper = new window.Swiper(modalCarousel, {
                                slidesPerView: 1,
                                loop: imageList.length > 1,
                                speed: 500,
                                watchOverflow: true,
                                pagination: {
                                    el: modalCarousel.querySelector('.swiper-pagination'),
                                    clickable: true
                                },
                                navigation: {
                                    nextEl: modalCarousel.querySelector('.swiper-button-next'),
                                    prevEl: modalCarousel.querySelector('.swiper-button-prev')
                                }
                            });
                        }
                    });

                    productDetailsModal.addEventListener('hidden.bs.modal', destroyModalCarousel, { once: true });
                    modalInstance.show();
                }
            }

            function updateCartCount() {
                var cart = readCart();
                var itemCount = cart.reduce(function (total, item) {
                    return total + Number(item.qty || 0);
                }, 0);

                cartCount.textContent = itemCount + (itemCount === 1 ? ' item' : ' items');
            }

            function addToCart(productData, button) {
                var cart = readCart();
                var existingItem = cart.find(function (item) {
                    return item.id === productData.id;
                });

                if (existingItem) {
                    existingItem.qty += 1;
                } else {
                    cart.push({
                        id: productData.id,
                        name: productData.name,
                        price: Number(productData.price),
                        image: productData.image,
                        qty: 1
                    });
                }

                writeCart(cart);
                updateCartCount();

                if (button) {
                    var originalText = button.textContent;
                    button.textContent = 'Added';
                    button.classList.add('is-added');
                    window.setTimeout(function () {
                        button.textContent = originalText;
                        button.classList.remove('is-added');
                    }, 1200);
                }
            }

            function renderProductCarousels() {
                cards.forEach(function (card) {
                    var button = card.querySelector('.shop-add-btn');
                    var mediaWrap = card.querySelector('.product-card-img-wrap');
                    var imageLink = mediaWrap ? mediaWrap.querySelector('.product-card-img') : null;

                    if (!button || !mediaWrap || !imageLink || mediaWrap.dataset.carouselReady === 'true') {
                        return;
                    }

                    var productId = button.getAttribute('data-product-id');
                    var productName = button.getAttribute('data-product-name') || card.getAttribute('data-name') || '';
                    var fallbackImage = button.getAttribute('data-product-image') || imageLink.querySelector('img')?.getAttribute('src') || '';
                    var imageList = productImageMap[productId] || [fallbackImage];
                    var swiperId = 'shop-swiper-' + productId;

                    mediaWrap.innerHTML = [
                        '<div class="swiper shop-card-swiper" id="' + swiperId + '">',
                        '<div class="swiper-wrapper">',
                        imageList.map(function (imageSrc) {
                            return '<div class="swiper-slide">' +
                                '<a href="product-details.html" class="product-card-img">' +
                                    '<img src="' + imageSrc + '" alt="' + productName + '">' +
                                '</a>' +
                            '</div>';
                        }).join(''),
                        '</div>',
                        '<div class="swiper-pagination shop-card-pagination"></div>',
                        '<div class="swiper-button-prev shop-card-prev"></div>',
                        '<div class="swiper-button-next shop-card-next"></div>',
                        '</div>'
                    ].join('');

                    mediaWrap.dataset.carouselReady = 'true';

                    new window.Swiper(mediaWrap.querySelector('.shop-card-swiper'), {
                        slidesPerView: 1,
                        loop: imageList.length > 1,
                        speed: 550,
                        watchOverflow: true,
                        pagination: {
                            el: mediaWrap.querySelector('.shop-card-pagination'),
                            clickable: true
                        },
                        navigation: {
                            nextEl: mediaWrap.querySelector('.shop-card-next'),
                            prevEl: mediaWrap.querySelector('.shop-card-prev')
                        }
                    });
                });
            }

            Array.prototype.forEach.call(document.querySelectorAll('.product-card-specs'), function (specsList) {
                specsList.hidden = true;
            });

            function getVisibleCards() {
                var searchValue = (searchInput.value || '').toLowerCase().trim();

                return cards.filter(function (card) {
                    var cardCategory = card.getAttribute('data-category');
                    var cardName = (card.getAttribute('data-name') || '').toLowerCase();
                    var cardDescription = (card.getAttribute('data-description') || '').toLowerCase();
                    var cardProperties = (card.getAttribute('data-properties') || '').toLowerCase();
                    var cardSpecs = (card.getAttribute('data-specs') || '').toLowerCase();
                    var categoryMatch = activeCategory === 'all' || activeCategory === cardCategory;
                    var searchMatch = searchValue === '' || cardName.indexOf(searchValue) > -1 || cardDescription.indexOf(searchValue) > -1 || cardProperties.indexOf(searchValue) > -1 || cardSpecs.indexOf(searchValue) > -1;
                    var show = categoryMatch && searchMatch;

                    card.style.display = show ? '' : 'none';
                    return show;
                });
            }

            function sortCards(visibleCards) {
                var sortValue = sortSelect.value;
                var sorted = visibleCards.slice();

                if (sortValue === 'name') {
                    sorted.sort(function (a, b) {
                        return a.getAttribute('data-name').localeCompare(b.getAttribute('data-name'));
                    });
                }

                if (sortValue === 'price-low') {
                    sorted.sort(function (a, b) {
                        return Number(a.getAttribute('data-price')) - Number(b.getAttribute('data-price'));
                    });
                }

                if (sortValue === 'price-high') {
                    sorted.sort(function (a, b) {
                        return Number(b.getAttribute('data-price')) - Number(a.getAttribute('data-price'));
                    });
                }

                sorted.forEach(function (card) {
                    grid.appendChild(card);
                });
            }

            function updateResultState(visibleCount) {
                resultCount.textContent = visibleCount + (visibleCount === 1 ? ' product' : ' products');
                noResultBlock.hidden = visibleCount > 0;
            }

            function applyFilters() {
                var visibleCards = getVisibleCards();
                sortCards(visibleCards);
                updateResultState(visibleCards.length);
            }

            grid.addEventListener('click', function (event) {
                var button = event.target.closest('.shop-add-btn');

                if (!button || !button.closest('.shop-v2-item')) {
                    return;
                }

                event.preventDefault();
                showProductDetails(button.closest('.shop-v2-item'), button);
            });

            modalAddButton.addEventListener('click', function () {
                addToCart({
                    id: modalAddButton.getAttribute('data-product-id'),
                    name: modalAddButton.getAttribute('data-product-name'),
                    price: modalAddButton.getAttribute('data-product-price'),
                    image: modalAddButton.getAttribute('data-product-image')
                }, modalAddButton);

                if (window.bootstrap && productDetailsModal) {
                    window.bootstrap.Modal.getOrCreateInstance(productDetailsModal).hide();
                }
            });

            filterWrap.addEventListener('click', function (event) {
                var target = event.target.closest('.filter-chip');

                if (!target) {
                    return;
                }

                Array.prototype.forEach.call(filterWrap.querySelectorAll('.filter-chip'), function (chip) {
                    chip.classList.remove('active');
                });

                target.classList.add('active');
                activeCategory = target.getAttribute('data-category') || 'all';
                applyFilters();
            });

            searchInput.addEventListener('input', applyFilters);
            sortSelect.addEventListener('change', applyFilters);

            updateCartCount();
            renderProductCarousels();
            applyFilters();
        })();
    