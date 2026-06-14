/* Community directory: type/region filters + "add your group" accordion. */
(function () {
  'use strict';

  /* ── Filters ─────────────────────────────────────────────────────────── */
  var activeType = 'all';
  var activeRegion = 'all';
  var cards = document.querySelectorAll('#community-list .card');

  function applyFilters() {
    var visible = 0;
    cards.forEach(function (card) {
      var types = card.dataset.types || '';
      var typeMatch = activeType === 'all' || types.indexOf(activeType) > -1;
      var regionMatch = activeRegion === 'all' || card.dataset.region === activeRegion;
      var show = typeMatch && regionMatch;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    var status = document.getElementById('community-filter-status');
    if (status) {
      if (activeType === 'all' && activeRegion === 'all') {
        status.textContent = 'Showing all ' + cards.length + ' entries.';
      } else if (visible === 0) {
        status.textContent = 'No entries match these filters. Try a different type or region.';
      } else {
        status.textContent = 'Showing ' + visible + ' entr' + (visible !== 1 ? 'ies' : 'y') + '.';
      }
    }
  }

  var typeBtns = document.querySelectorAll('.community-filters [data-type]');
  var regionBtns = document.querySelectorAll('.community-filters [data-region]');

  typeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      typeBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      activeType = this.dataset.type;
      applyFilters();
    });
  });

  regionBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      regionBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      activeRegion = this.dataset.region;
      applyFilters();
    });
  });

  if (cards.length) applyFilters();

  /* ── Register accordion ──────────────────────────────────────────────── */
  var btn = document.getElementById('register-accordion-btn');
  var body = document.getElementById('register-accordion-body');
  var icon = document.getElementById('register-accordion-icon');
  if (btn && body && icon) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      body.hidden = expanded;
      icon.textContent = expanded ? '+' : '−';
    });
  }
})();
