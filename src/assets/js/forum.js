(function () {
  'use strict';

  /* ── Join accordion ──────────────────────────────────────────────────── */
  var btn = document.getElementById('join-accordion-btn');
  var body = document.getElementById('join-accordion-body');
  var icon = document.getElementById('join-accordion-icon');
  if (btn && body && icon) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      body.hidden = expanded;
      icon.textContent = expanded ? '+' : '−';
    });
  }

  /* ── Recent discussions (Discourse) ──────────────────────────────────── */
  var container = document.getElementById('forum-topics');
  if (!container) return;

  var FORUM_URL = 'https://forum.agniyogaworld.org';

  function renderFallback() {
    var p = document.createElement('p');
    p.className = 'forum-topics-fallback';
    p.textContent = 'Visit the forum to see the latest discussions.';
    container.replaceChildren(p);
  }

  fetch(FORUM_URL + '/latest.json?per_page=8')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      var topics = (data && data.topic_list && data.topic_list.topics) || [];
      if (!topics.length) { renderFallback(); return; }

      var list = document.createElement('ul');
      list.className = 'forum-topic-list';

      topics.forEach(function (t) {
        if (!t || typeof t.title !== 'string') return;

        var li = document.createElement('li');

        var a = document.createElement('a');
        // Never build markup from remote strings: assign href/text via DOM APIs only.
        a.href = FORUM_URL + '/t/' + encodeURIComponent(String(t.slug || 'topic')) + '/' + encodeURIComponent(String(t.id || ''));
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'forum-topic-link';
        a.textContent = t.title;

        var srNote = document.createElement('span');
        srNote.className = 'sr-only';
        srNote.textContent = ' (opens in new tab)';
        a.appendChild(srNote);

        var replies = Number(t.reply_count) || 0;
        var replyText = replies === 1 ? '1 reply' : replies + ' replies';
        var date = '';
        if (t.last_posted_at) {
          var d = new Date(t.last_posted_at);
          if (!isNaN(d)) {
            date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
        }
        var meta = document.createElement('span');
        meta.className = 'forum-topic-meta';
        meta.textContent = replyText + (date ? ' · ' + date : '');

        li.appendChild(a);
        li.appendChild(meta);
        list.appendChild(li);
      });

      var seeAll = document.createElement('p');
      seeAll.className = 'forum-see-all';
      var seeAllLink = document.createElement('a');
      seeAllLink.href = FORUM_URL + '/';
      seeAllLink.target = '_blank';
      seeAllLink.rel = 'noopener';
      seeAllLink.textContent = 'See all discussions →';
      var seeAllSr = document.createElement('span');
      seeAllSr.className = 'sr-only';
      seeAllSr.textContent = ' (opens in new tab)';
      seeAllLink.appendChild(seeAllSr);
      seeAll.appendChild(seeAllLink);

      container.replaceChildren(list, seeAll);
    })
    .catch(renderFallback);
})();
