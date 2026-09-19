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
                    var toggleBtn = document.getElementById("trek-itinerary-toggle");
                    var accordion = document.getElementById("trekAccordion");

                    if (!toggleBtn || !accordion || typeof bootstrap === "undefined" || !bootstrap.Collapse) {
                        return;
                    }

                    var collapseNodes = Array.prototype.slice.call(
                        accordion.querySelectorAll(".accordion-collapse")
                    );

                    if (!collapseNodes.length) {
                        return;
                    }

                    function allExpanded() {
                        return collapseNodes.every(function (node) {
                            return node.classList.contains("show");
                        });
                    }

                    function updateLabelFromState() {
                        var expanded = allExpanded();
                        toggleBtn.textContent = expanded ? "Collapse All -" : "Expand All +";
                        toggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
                    }

                    collapseNodes.forEach(function (node) {
                        node.addEventListener("shown.bs.collapse", updateLabelFromState);
                        node.addEventListener("hidden.bs.collapse", updateLabelFromState);
                    });

                    document.addEventListener(
                        "click",
                        function (event) {
                            var btn = event.target && event.target.closest
                                ? event.target.closest("#trekAccordion .accordion-button")
                                : null;

                            if (!btn) {
                                return;
                            }

                            var targetId = btn.getAttribute("data-bs-target");
                            if (!targetId && btn.getAttribute("href")) {
                                targetId = btn.getAttribute("href");
                            }

                            var target = targetId ? document.querySelector(targetId) : null;

                            if (!target || typeof bootstrap === "undefined" || !bootstrap.Collapse) {
                                return;
                            }

                            event.stopImmediatePropagation();
                            event.preventDefault();

                            bootstrap.Collapse.getOrCreateInstance(target).toggle();
                            btn.setAttribute(
                                "aria-expanded",
                                target.classList.contains("show") ? "true" : "false"
                            );
                        },
                        true
                    );

                    toggleBtn.addEventListener("click", function () {
                        var expand = !allExpanded();

                        collapseNodes.forEach(function (node) {
                            var instance = bootstrap.Collapse.getOrCreateInstance(node, {
                                toggle: false
                            });
                            if (expand) {
                                instance.show();
                            } else {
                                instance.hide();
                            }
                        });

                        updateLabelFromState();
                    });

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
        


