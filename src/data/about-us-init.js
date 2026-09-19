    (function () {
        var timeline = document.querySelector('.timeline');
        if (!timeline) return;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            timeline.classList.add('animated');
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    timeline.classList.add('animated');
                    observer.unobserve(timeline);
                }
            });
        }, { threshold: 0.25 });

        observer.observe(timeline);
    })();
    