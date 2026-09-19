(function () {
  'use strict';

  var VISIBLE_INITIAL = 8;
  var currentSeason = 'summer';
  var lbPhotos = [];
  var lbIndex = 0;

  /* ═══════════════════════════════════════════════════════════
     TAB SWITCHING
     ═══════════════════════════════════════════════════════════ */
  var tabs = document.querySelectorAll('.gd-tab');
  var panels = document.querySelectorAll('.gd-panel');

  function switchSeason(seasonId) {
    if (seasonId === currentSeason) return;
    currentSeason = seasonId;
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-season') === seasonId);
    });
    panels.forEach(function (p) {
      var isTarget = p.id === 'panel-' + seasonId;
      p.classList.toggle('active', isTarget);
    });
    window.scrollTo({ top: document.querySelector('.gd-tabs-bar').offsetTop, behavior: 'smooth' });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchSeason(this.getAttribute('data-season'));
    });
  });

  /* ═══════════════════════════════════════════════════════════
     VIEW ALL / SHOW LESS
     ═══════════════════════════════════════════════════════════ */
  document.addEventListener('click', function (e) {
    var viewBtn = e.target.closest('.gd-view-btn');
    if (viewBtn) {
      var season = viewBtn.getAttribute('data-season');
      var grid = document.getElementById('grid-' + season);
      if (!grid) return;
      grid.querySelectorAll('.gd-item.gd-hidden').forEach(function (item) {
        item.classList.remove('gd-hidden');
      });
      viewBtn.style.display = 'none';
      var lessBtn = viewBtn.parentElement.querySelector('.gd-less-btn');
      if (lessBtn) lessBtn.style.display = 'inline-flex';
      return;
    }

    var lessBtn = e.target.closest('.gd-less-btn');
    if (lessBtn) {
      var season = lessBtn.getAttribute('data-season');
      var grid = document.getElementById('grid-' + season);
      if (!grid) return;
      var items = grid.querySelectorAll('.gd-item');
      items.forEach(function (item, i) {
        if (i >= VISIBLE_INITIAL) item.classList.add('gd-hidden');
      });
      lessBtn.style.display = 'none';
      var viewBtn = lessBtn.parentElement.querySelector('.gd-view-btn');
      if (viewBtn) viewBtn.style.display = 'inline-flex';
      var panel = document.getElementById('panel-' + season);
      if (panel) {
        var head = panel.querySelector('.gd-panel-head');
        if (head) {
          head.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  });

  /* ═══════════════════════════════════════════════════════════
     LIGHTBOX
     ═══════════════════════════════════════════════════════════ */
  var lb = document.getElementById('gd-lb');
  var lbImg = document.getElementById('gd-lb-img');
  var lbCount = document.getElementById('gd-lb-count');

  function collectVisible() {
    lbPhotos = [];
    var activePanel = document.getElementById('panel-' + currentSeason);
    if (!activePanel) return;
    activePanel.querySelectorAll('.gd-item:not(.gd-hidden)').forEach(function (item) {
      var img = item.querySelector('img');
      if (img) lbPhotos.push({ src: img.src, alt: img.alt });
    });
  }

  function openLb(index) {
    collectVisible();
    if (index < 0 || index >= lbPhotos.length) return;
    lbIndex = index;
    lbImg.src = lbPhotos[index].src;
    lbImg.alt = lbPhotos[index].alt;
    lbCount.textContent = (index + 1) + ' / ' + lbPhotos.length;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  function nextLb() {
    if (!lbPhotos.length) return;
    openLb((lbIndex + 1) % lbPhotos.length);
  }

  function prevLb() {
    if (!lbPhotos.length) return;
    openLb((lbIndex - 1 + lbPhotos.length) % lbPhotos.length);
  }

  // Click on any gallery item
  document.addEventListener('click', function (e) {
    var item = e.target.closest('.gd-item');
    if (!item || item.classList.contains('gd-hidden')) return;
    var img = item.querySelector('img');
    if (!img) return;
    collectVisible();
    for (var i = 0; i < lbPhotos.length; i++) {
      if (lbPhotos[i].src === img.src) {
        openLb(i);
        break;
      }
    }
  });

  document.getElementById('gd-lb-x').addEventListener('click', closeLb);
  document.getElementById('gd-lb-bg').addEventListener('click', closeLb);
  document.getElementById('gd-lb-next').addEventListener('click', nextLb);
  document.getElementById('gd-lb-prev').addEventListener('click', prevLb);

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') nextLb();
    if (e.key === 'ArrowLeft') prevLb();
  });

})();