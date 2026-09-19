(function () {
                function initPackageReadMore() {
                    var leftCol = document.getElementById("package-main-left");
                    var rightCol = document.getElementById("package-main-right");
                    var leftContent = leftCol ? leftCol.querySelector(".package-details-warpper") : null;
                    var rightSidebar = rightCol ? rightCol.querySelector(".package-details-sidebar") : null;
                    var toggleBtn = document.getElementById("package-main-toggle");

                    if (!leftCol || !rightCol || !leftContent || !rightSidebar || !toggleBtn) {
                        return;
                    }

                    var expanded = false;

                    function applyClamp() {
                        var isDesktop = window.matchMedia("(min-width: 992px)").matches;

                        if (!isDesktop) {
                            leftContent.style.maxHeight = "";
                            leftContent.classList.remove("read-more-collapsed");
                            toggleBtn.style.display = "none";
                            return;
                        }

                        var targetHeight = rightCol.offsetHeight;
                        var contentHeight = leftContent.scrollHeight;

                        if (!expanded) {
                            if (contentHeight > targetHeight + 24) {
                                leftContent.style.maxHeight = targetHeight + "px";
                                leftContent.classList.add("read-more-collapsed");
                                toggleBtn.style.display = "inline-flex";
                                toggleBtn.textContent = "Read More";
                                toggleBtn.setAttribute("aria-expanded", "false");
                            } else {
                                leftContent.style.maxHeight = "";
                                leftContent.classList.remove("read-more-collapsed");
                                toggleBtn.style.display = "none";
                            }
                        } else {
                            leftContent.style.maxHeight = "";
                            leftContent.classList.remove("read-more-collapsed");
                            toggleBtn.style.display = "inline-flex";
                            toggleBtn.textContent = "Read Less";
                            toggleBtn.setAttribute("aria-expanded", "true");
                        }
                    }

                    toggleBtn.addEventListener("click", function () {
                        expanded = !expanded;
                        applyClamp();
                    });

                    window.addEventListener("resize", applyClamp);
                    window.addEventListener("load", applyClamp);
                    applyClamp();
                }

                function initAboutReadMore() {
                    var toggleBtn = document.getElementById("about-trek-toggle");
                    var extraContent = document.getElementById("about-trek-extra");

                    if (!toggleBtn || !extraContent) {
                        return;
                    }

                    toggleBtn.addEventListener("click", function () {
                        var collapsed = extraContent.classList.contains("is-collapsed");

                        if (collapsed) {
                            extraContent.classList.remove("is-collapsed");
                            toggleBtn.textContent = "Read Less";
                            toggleBtn.setAttribute("aria-expanded", "true");
                        } else {
                            extraContent.classList.add("is-collapsed");
                            toggleBtn.textContent = "Read More";
                            toggleBtn.setAttribute("aria-expanded", "false");
                        }
                    });
                }

                function initTrekItineraryToggle() {
                    if (typeof bootstrap === "undefined" || !bootstrap.Collapse) {
                        return;
                    }

                    function getAccordion() {
                        return document.getElementById("trekAccordion");
                    }

                    function getToggleBtn() {
                        return document.getElementById("trek-itinerary-toggle");
                    }

                    function updateLabelFromState() {
                        var btn = getToggleBtn();
                        if (!btn) {
                            return;
                        }
                        var accordion = getAccordion();
                        var nodes = accordion
                            ? Array.prototype.slice.call(accordion.querySelectorAll(".accordion-collapse"))
                            : [];
                        var expanded = nodes.length > 0 && nodes.every(function (node) {
                            return node.classList.contains("show");
                        });
                        btn.textContent = expanded ? "Collapse All -" : "Expand All +";
                        btn.setAttribute("aria-expanded", expanded ? "true" : "false");
                    }

                    // Keep the label in sync when a single day is manually opened/closed.
                    document.addEventListener("shown.bs.collapse", updateLabelFromState);
                    document.addEventListener("hidden.bs.collapse", updateLabelFromState);

                    // The shared trek-detail script binds its own Expand/Collapse handler
                    // directly on the button, so a second handler here would fight it
                    // (panels flash open then collapse). A capture-phase listener on
                    // document runs before any button-bound handler, so handle the bulk
                    // toggle here and stop propagation.
                    document.addEventListener("click", function (event) {
                        var target = event.target && event.target.closest
                            ? event.target.closest("#trek-itinerary-toggle")
                            : null;
                        if (!target) {
                            return;
                        }
                        event.preventDefault();
                        event.stopImmediatePropagation();

                        var accordion = getAccordion();
                        var toggleBtn = getToggleBtn();
                        if (!accordion || !toggleBtn) {
                            return;
                        }

                        var nodes = Array.prototype.slice.call(
                            accordion.querySelectorAll(".accordion-collapse")
                        );
                        if (!nodes.length) {
                            return;
                        }

                        var expand = !nodes.every(function (node) {
                            return node.classList.contains("show");
                        });

                        // Temporarily drop the accordion "one open at a time" parent so
                        // every panel can be expanded/collapsed together.
                        nodes.forEach(function (node) {
                            node.removeAttribute("data-bs-parent");
                        });

                        nodes.forEach(function (node) {
                            var instance = bootstrap.Collapse.getOrCreateInstance(node, {
                                toggle: false
                            });
                            if (instance._config) {
                                instance._config.parent = null;
                            }
                            if (expand) {
                                instance.show();
                            } else {
                                instance.hide();
                            }
                        });

                        nodes.forEach(function (node) {
                            node.setAttribute("data-bs-parent", "#trekAccordion");
                        });

                        toggleBtn.textContent = expand ? "Collapse All -" : "Expand All +";
                        toggleBtn.setAttribute("aria-expanded", expand ? "true" : "false");
                    }, true);

                    updateLabelFromState();
                }

                function initBrochureDownloadModal() {
                    var modal = document.getElementById("brochureModal");
                    var form = document.getElementById("brochure-download-form");

                    if (!modal || !form) {
                        return;
                    }

                    modal.addEventListener("show.bs.modal", function (event) {
                        var trigger = event.relatedTarget;
                        var downloadUrl = trigger && trigger.getAttribute ? trigger.getAttribute("data-download-url") : "";

                        if (downloadUrl) {
                            form.setAttribute("data-download-url", downloadUrl);
                        }
                    });

                    form.addEventListener("submit", function (event) {
                        event.preventDefault();

                        var downloadUrl = form.getAttribute("data-download-url") || "assets/company-desk.pdf";
                        var link = document.createElement("a");
                        link.href = downloadUrl;
                        link.download = "company-desk.pdf";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
                            var modalInstance = bootstrap.Modal.getOrCreateInstance(modal);
                            modalInstance.hide();
                        }

                        form.reset();
                    });
                }

                function initLocationImagePreviewModal() {
                    var modal = document.getElementById("packageLocationImageModal");
                    var previewImage = modal ? modal.querySelector("[data-location-preview-image]") : null;

                    if (!modal || !previewImage) {
                        return;
                    }

                    modal.addEventListener("show.bs.modal", function (event) {
                        var trigger = event.relatedTarget;
                        var imageSource = trigger && trigger.getAttribute ? trigger.getAttribute("data-location-image-src") : "";
                        var imageAlt = trigger && trigger.getAttribute ? trigger.getAttribute("data-location-image-alt") : "";

                        if (!imageSource && trigger && trigger.querySelector) {
                            var sourceImage = trigger.querySelector("img");
                            if (sourceImage) {
                                imageSource = sourceImage.getAttribute("src") || sourceImage.src || "";
                                imageAlt = sourceImage.getAttribute("alt") || imageAlt;
                            }
                        }

                        previewImage.src = imageSource || "";
                        previewImage.alt = imageAlt || "Location preview";
                    });

                    modal.addEventListener("hidden.bs.modal", function () {
                        previewImage.removeAttribute("src");
                        previewImage.alt = "Location preview";
                    });
                }

                if (document.readyState === "loading") {
                    document.addEventListener("DOMContentLoaded", initPackageReadMore);
                    document.addEventListener("DOMContentLoaded", initAboutReadMore);
                    document.addEventListener("DOMContentLoaded", initTrekItineraryToggle);
                    document.addEventListener("DOMContentLoaded", initBrochureDownloadModal);
                    document.addEventListener("DOMContentLoaded", initLocationImagePreviewModal);
                } else {
                    initPackageReadMore();
                    initAboutReadMore();
                    initTrekItineraryToggle();
                    initBrochureDownloadModal();
                    initLocationImagePreviewModal();
                }
            })();