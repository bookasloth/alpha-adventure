function onReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}
onReady(function(){
    var subnav = document.getElementById('sg-subnav');
    var links  = subnav ? subnav.querySelectorAll('.sg-subnav-link') : [];
    var ids    = Array.prototype.map.call(links, function(a){ return a.getAttribute('href').replace('#',''); });
    var targets = ids.map(function(id){ return document.getElementById(id); }).filter(Boolean);

    function setHeaderHeight(){
        var wrap = document.querySelector('.header-topbar-wrap');
        var h = wrap ? wrap.offsetHeight : 70;
        document.documentElement.style.setProperty('--sg-header-h', h + 'px');
    }
    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);

    if(subnav){
        var observer0 = new IntersectionObserver(function(entries){
            entries.forEach(function(e){
                subnav.classList.toggle('is-stuck', !e.isIntersecting);
            });
        },{threshold:0, rootMargin:'-1px 0px 0px 0px'});
        var sentinel = document.createElement('div');
        sentinel.style.height='1px';sentinel.style.width='100%';sentinel.style.position='absolute';sentinel.style.top='0';sentinel.style.pointerEvents='none';
        subnav.parentNode.insertBefore(sentinel, subnav);
        observer0.observe(sentinel);
    }

    if(targets.length){
        var current = ids[0];
        function setActive(id){
            if(id === current) return;
            current = id;
            links.forEach(function(a){
                a.classList.toggle('active', a.getAttribute('href') === '#'+id);
            });
            var active = subnav.querySelector('.sg-subnav-link.active');
            if(active && subnav.scrollWidth > subnav.offsetWidth){
                var l = active.offsetLeft - subnav.offsetWidth/2 + active.offsetWidth/2;
                subnav.scrollTo({left:l, behavior:'smooth'});
            }
        }

        var headerH = 70;
        function getOffset(){ return headerH + 60; }

        var observer = new IntersectionObserver(function(entries){
            entries.forEach(function(e){
                if(e.isIntersecting){
                    setActive(e.target.id);
                }
            });
        },{rootMargin: '-' + getOffset() + 'px 0px -60% 0px', threshold:0});

        targets.forEach(function(t){ observer.observe(t); });
    }

    links.forEach(function(a){
        a.addEventListener('click', function(e){
            e.preventDefault();
            var id = this.getAttribute('href').replace('#','');
            var el = document.getElementById(id);
            if(!el) return;
            var offset = headerH + 60;
            var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({top:y, behavior:'smooth'});
            history.replaceState(null,'','#'+id);
        });
    });
});