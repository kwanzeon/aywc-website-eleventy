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
      // A filter change reflows which cards share a row, so any row-mate
      // stretch override left over from an expanded card no longer applies.
      card.style.alignSelf = '';
      card.style.height = '';
      card.style.transition = '';
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

  /* ── Card description accordions ────────────────────────────────────── */
  var TRUNCATE_AT = 220;
  var MIN_SENTENCE_CUT = TRUNCATE_AT * 0.5;

  // Descriptions with no sentence break before the limit (e.g. one long
  // clause strung together with em-dashes) fall back to a word-boundary
  // cut, which can still land right after a weak trailing word like "and"
  // or "their" and read as an abrupt cutoff. Trim those off too.
  var TRAILING_STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'of', 'to', 'in', 'on',
    'at', 'with', 'their', 'his', 'her', 'its', 'our', 'your', 'my',
    'that', 'which', 'who', 'for', 'as', 'by', 'from', 'is', 'are', 'was', 'were'
  ]);

  function trimTrailingStopwords(text) {
    var words = text.split(' ');
    var trims = 0;
    while (words.length > 1 && trims < 5 && TRAILING_STOPWORDS.has(words[words.length - 1].toLowerCase().replace(/[^a-z]/gi, ''))) {
      words.pop();
      trims++;
    }
    return words.join(' ');
  }

  function truncateDescription(full) {
    var head = full.slice(0, TRUNCATE_AT);
    var sentenceEnd = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
    if (sentenceEnd >= MIN_SENTENCE_CUT) {
      return full.slice(0, sentenceEnd + 1);
    }
    var cut = full.lastIndexOf(' ', TRUNCATE_AT);
    if (cut < 0) cut = TRUNCATE_AT;
    return trimTrailingStopwords(full.slice(0, cut)) + '…';
  }

  // .card-grid-2 relies on the default align-items: stretch so same-row
  // cards match height at rest (a card with no "Show more" button
  // shouldn't look shorter than its neighbor just because it has less
  // text). Stretch is exactly what caused AYWC-155's original bug though:
  // expanding a card grows the whole row, and stretch then force-grows the
  // shorter sibling's own box into that space.
  //
  // align-self itself can't be transitioned, and toggling it mid-animation
  // doesn't reliably re-track a sibling's height smoothly either way (it
  // snapped on both directions, worse on collapse) — so instead we measure
  // the row-mate's two real states (its current stretched height, and its
  // own natural unstretched height) and animate its explicit height
  // between them directly, in sync with the expanding card's own
  // max-height transition.
  function getRowMates(card) {
    var top = card.offsetTop;
    return Array.prototype.filter.call(document.querySelectorAll('#community-list .card'), function (c) {
      return c !== card && c.offsetParent !== null && Math.abs(c.offsetTop - top) < 2;
    });
  }

  var TRANSITION_MS = 300;

  function animateMateHeight(mate, toHeight, onDone) {
    var fromHeight = mate.getBoundingClientRect().height;
    mate.style.transition = 'none';
    mate.style.alignSelf = 'start';
    mate.style.height = fromHeight + 'px';
    mate.offsetHeight; // force reflow so the transition below animates from fromHeight
    mate.style.transition = 'height ' + TRANSITION_MS + 'ms ease';
    mate.style.height = toHeight + 'px';
    window.setTimeout(function () {
      mate.style.transition = '';
      if (onDone) onDone();
    }, TRANSITION_MS);
  }

  document.querySelectorAll('.card-desc').forEach(function (p) {
    if (p.closest('[data-has-page]')) return;
    var full = p.textContent;
    if (full.length <= TRUNCATE_AT) return;

    var preview = truncateDescription(full);
    p.textContent = preview;
    p.style.maxHeight = p.scrollHeight + 'px';

    var card = p.closest('.card');
    var restHeight = null; // row-mate height at rest (both cards stretched, collapsed state)

    var btn = document.createElement('button');
    btn.className = 'card-desc-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Show more';
    p.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var mates = getRowMates(card);

      if (!expanded) {
        // About to expand: record the shared rest height, then animate
        // each mate down to its own natural (unstretched) height.
        restHeight = card.getBoundingClientRect().height;
        mates.forEach(function (m) {
          var natural = (function () {
            var prevAlign = m.style.alignSelf, prevHeight = m.style.height;
            m.style.alignSelf = 'start';
            m.style.height = 'auto';
            var h = m.getBoundingClientRect().height;
            m.style.alignSelf = prevAlign;
            m.style.height = prevHeight;
            return h;
          })();
          animateMateHeight(m, natural);
        });
      }

      // Swap the text first so scrollHeight reflects the new content's
      // natural height, then apply it as max-height so the row transitions
      // smoothly instead of jumping (AYWC-155).
      p.textContent = expanded ? preview : full;
      p.style.maxHeight = p.scrollHeight + 'px';
      btn.textContent = expanded ? 'Show more' : 'Show less';
      btn.setAttribute('aria-expanded', String(!expanded));

      if (expanded && restHeight !== null) {
        // Collapsing again: animate mates back up to the shared rest
        // height, then release them back to normal stretch.
        mates.forEach(function (m) {
          animateMateHeight(m, restHeight, function () {
            m.style.alignSelf = '';
            m.style.height = '';
          });
        });
      }
    });
  });

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
