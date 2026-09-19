        $(document).ready(function () {
            // Tab switching logic
            $('.sidebar-menu-btn[data-target]').on('click', function () {
                const target = $(this).data('target');

                // Toggle active menu class
                $('.sidebar-menu-btn').removeClass('active');
                $(this).addClass('active');

                // Toggle active content panel
                $('.tab-panel').removeClass('active');
                $(target).addClass('active');

                // Scroll to top of content section on mobile
                if (window.innerWidth < 992) {
                    $('html, body').animate({
                        scrollTop: $('.dashboard-content').offset().top - 80
                    }, 200);
                }
            });

            // Booking Sub-tab filtering
            $('.booking-filter-btn[data-filter]').on('click', function () {
                const filter = $(this).data('filter');

                // Toggle active filter button class
                $('.booking-filter-btn').removeClass('active');
                $(this).addClass('active');

                let visibleCount = 0;

                if (filter === 'all') {
                    $('.item-booking-card').show();
                    visibleCount = $('.item-booking-card').length;
                } else {
                    $('.item-booking-card').hide();
                    const filteredCards = $(`.item-booking-card[data-category='${filter}']`);
                    filteredCards.show();
                    visibleCount = filteredCards.length;
                }

                if (visibleCount === 0) {
                    $('.booking-list').hide();
                    $('.booking-empty-state').show();

                    // Customize text based on filter
                    if (filter === 'upcoming') {
                        $('.booking-empty-state .empty-title').text('No Upcoming Treks');
                        $('.booking-empty-state .empty-desc').text('You don\'t have any upcoming adventures scheduled. Time to plan one!');
                    } else if (filter === 'past') {
                        $('.booking-empty-state .empty-title').text('No Past Treks');
                        $('.booking-empty-state .empty-desc').text('You haven\'t completed any treks with us yet. Start your first journey today!');
                    } else if (filter === 'cancelled') {
                        $('.booking-empty-state .empty-title').text('No Cancelled Treks');
                        $('.booking-empty-state .empty-desc').text('Great! You have no cancelled bookings.');
                    }
                } else {
                    $('.booking-empty-state').hide();
                    $('.booking-list').show();
                }
            });

            // Modal Popup Open
            $('.btn-view-details').on('click', function () {
                const ref = $(this).data('ref');
                const title = $(this).data('title');
                const dates = $(this).data('dates');

                const adults = parseInt($(this).data('adults'));
                const children = parseInt($(this).data('children'));
                const priceAdult = parseFloat($(this).data('price-adult'));
                const priceChild = parseFloat($(this).data('price-child'));

                const addonsTotal = parseFloat($(this).data('addons-total'));
                const subtotal = parseFloat($(this).data('subtotal'));
                const gst = parseFloat($(this).data('gst'));
                const grand = parseFloat($(this).data('grand'));

                const method = $(this).data('method');
                const status = $(this).data('status');
                const addonsJson = $(this).data('addons-json');

                // Populate Text
                $('#m-ref').text(ref);
                $('#m-title').text(title);
                $('#m-dates').text(dates);

                // Populate Adults
                if (adults > 0) {
                    $('#m-adults-label').text(`Adults (${adults} x ₹${priceAdult.toLocaleString()})`);
                    $('#m-adults-cost').text(`₹${(adults * priceAdult).toLocaleString()}`);
                    $('#m-adults-row').show();
                } else {
                    $('#m-adults-row').hide();
                }

                // Populate Children
                if (children > 0) {
                    $('#m-children-label').text(`Children (${children} x ₹${priceChild.toLocaleString()})`);
                    $('#m-children-cost').text(`₹${(children * priceChild).toLocaleString()}`);
                    $('#m-children-row').show();
                } else {
                    $('#m-children-row').hide();
                }

                // Populate Add-ons
                const addonsList = $('#m-addons-list');
                addonsList.empty();
                if (addonsJson && addonsJson.length > 0) {
                    addonsJson.forEach(function (addon) {
                        if (addon.addon_name) {
                            const addonTotalCost = parseFloat(addon.price) * parseInt(addon.quantity);
                            addonsList.append(`
                                <div class="receipt-addon-item receipt-row">
                                    <span>${addon.addon_name} (x${addon.quantity})</span>
                                    <span>₹${addonTotalCost.toLocaleString()}</span>
                                </div>
                            `);
                        }
                    });
                    $('#m-addons-total').text(`₹${addonsTotal.toLocaleString()}`);
                    $('#m-addons-section').show();
                } else {
                    $('#m-addons-section').hide();
                }

                // Populate Totals
                $('#m-subtotal').text(`₹${subtotal.toLocaleString()}`);
                $('#m-gst').text(`₹${gst.toLocaleString()}`);
                $('#m-method').text(method);
                $('#m-grand').text(`₹${grand.toLocaleString()}`);

                // Populate Status Badge
                const statusBadge = $('#m-status');
                statusBadge.text(status);
                statusBadge.removeClass('paid pending completed cancelled');
                if (status === 'paid' || status === 'confirmed') {
                    statusBadge.addClass('paid');
                } else if (status === 'pending') {
                    statusBadge.addClass('pending');
                } else {
                    statusBadge.addClass('cancelled');
                }

                // Open modal
                $('#detailsModal').css('display', 'flex');
                $('body').css('overflow', 'hidden');
            });

            // Modal Popup Close
            $('#modalClose, #detailsModal').on('click', function (e) {
                if (e.target === this || e.target.closest('#modalClose')) {
                    $('#detailsModal').hide();
                    $('body').css('overflow', 'auto');
                }
            });

            // Form Submit validation checks (change password)
            $('#pwdForm').on('submit', function (e) {
                const newPwd = $('#new_password').val();
                const confPwd = $('#confirm_password').val();

                if (newPwd.length < 6) {
                    e.preventDefault();
                    alert("New password must be at least 6 characters long.");
                } else if (newPwd !== confPwd) {
                    e.preventDefault();
                    alert("Passwords do not match. Please verify.");
                }
            });
        });
    