/**
 * Forum click-through events for GoatCounter (AYWC-180).
 *
 * The growth plan's one real question is whether the Daily Loop converts, so
 * pageviews alone are not enough — we need to know which surface sends people
 * to the forum. The homepage Seed Thought block converts people who already
 * return; the archive pages catch strangers arriving from search. Those are
 * different audiences and are counted separately.
 *
 * Delegated from document because the homepage Seed Thought link is rewritten
 * client-side by seed-thoughts.js (timezone / local midnight), so a listener
 * bound to the element at load would be lost on the first swap.
 *
 * CSP note: no inline handlers anywhere — see CLAUDE.md.
 */
(function () {
  'use strict';

  var FORUM_HOST = 'forum.agniyogaworld.org';

  /* Which surface did this click come from? Falls through to a generic bucket
     rather than guessing, so an unlabelled link never masquerades as a
     Seed Thought conversion. */
  function classify(link) {
    var onArchive = !!link.closest('.seed-page');
    var inHomeBlock = !!link.closest('[data-seed-thought]');

    if (link.classList.contains('seed-discuss')) {
      var composer = link.classList.contains('seed-discuss-empty');
      var where = onArchive ? 'archive' : (inHomeBlock ? 'home' : 'other');
      return composer
        ? 'forum-click/seed-composer/' + where
        : 'forum-click/seed-discuss/' + where;
    }
    if (link.classList.contains('forum-topic-link')) return 'forum-click/recent-topic';
    if (link.classList.contains('forum-see-all')) return 'forum-click/see-all';
    return 'forum-click/other';
  }

  function onClick(e) {
    // auxclick also fires for right-click (button 2); only middle-click
    // (button 1, "open in new tab") is a click-through.
    if (e.type === 'auxclick' && e.button !== 1) return;

    var link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;

    // Only outbound forum links. Same-origin navigation is already a pageview.
    var host;
    try { host = new URL(link.href, window.location.href).hostname; }
    catch (err) { return; }
    if (host !== FORUM_HOST) return;

    // count.js is deferred; by click time it has long since run. Stay silent if
    // it somehow hasn't — analytics must never break a navigation.
    if (!window.goatcounter || typeof window.goatcounter.count !== 'function') return;

    window.goatcounter.count({
      path: classify(link),
      title: 'Forum click-through',
      event: true
    });
  }

  document.addEventListener('click', onClick, false);
  document.addEventListener('auxclick', onClick, false);  // Middle click.
})();
