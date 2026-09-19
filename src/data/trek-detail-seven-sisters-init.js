
            (function () {
                var path = window.location.pathname.replace(/\/$/, '');
                var parts = path.split('/');
                var slug = parts[parts.length - 1] || parts[parts.length - 2] || '';
                window.TREK_SLUG = slug;
            })();
        

            
