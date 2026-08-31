(function () {
  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var FORUM = 'https://forum.agniyogaworld.org';
  var SITE = 'https://agniyogaworld.org';

  /* Thread map is fetched once and shared by every swap. */
  var threadsPromise = null;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function localDateKey(date) {
    return pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function localLabel(date) {
    return monthNames[date.getMonth()] + ' ' + date.getDate();
  }

  function getThreads() {
    if (!threadsPromise) {
      threadsPromise = fetch('/assets/data/seed-thought-threads.json')
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; });
    }
    return threadsPromise;
  }

  function plainText(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function bookSlug(html) {
    var m = html.match(/<i>([^<]+)<\/i>/);
    if (!m) return '';
    return m[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  function composerUrl(key, label, html) {
    var text = plainText(html);
    // Trailing blank lines put the caret below the link rather than on the end
    // of it. Keep in sync with _data/seedThoughts.js.
    var body = text.slice(0, 480) + (text.length > 480 ? '…' : '') +
               '\n\n' + SITE + '/seed-thoughts/' + key + '/' +
               '\n\n\n';
    var slug = bookSlug(html);
    return FORUM + '/new-topic' +
      '?title=' + encodeURIComponent('Seed Thought — ' + label) +
      '&body=' + encodeURIComponent(body) +
      '&category=seed-thought' +
      (slug ? '&tags=' + encodeURIComponent(slug) : '');
  }

  /* The link is date-dependent, so it has to be rewritten whenever the passage
     is — otherwise a reader past local midnight, or in another timezone, gets
     today's passage beside yesterday's discussion. */
  function applyLink(root, key, label, html, threads) {
    var link = root.querySelector('[data-seed-thought-link]');
    if (!link) return;

    var thread = threads && threads[key];

    if (thread) {
      link.href = FORUM + '/t/' + encodeURIComponent(String(thread.slug)) + '/' +
                  encodeURIComponent(String(thread.id));
      link.classList.remove('seed-discuss-empty');
      link.textContent = 'Discuss this passage—' + thread.replies +
                         (thread.replies === 1 ? ' reply' : ' replies') + ' →';
    } else {
      link.href = composerUrl(key, label, html);
      link.classList.add('seed-discuss-empty');
      link.textContent = 'Be the first to reflect on this passage →';
    }

    var note = document.createElement('span');
    note.className = 'sr-only';
    note.textContent = ' (opens in new tab)';
    link.appendChild(note);
  }

  /* Same treatment the build applies to citations, for content swapped in
     after load. Done on the DOM rather than the HTML string.
     Keep in sync with externalLinks() in _data/seedThoughts.js. */
  function markExternal(container) {
    if (!container) return;
    container.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (a.hostname === window.location.hostname) return;
      if (a.target === '_blank') return;
      a.target = '_blank';
      a.rel = 'noopener';
      var note = document.createElement('span');
      note.className = 'sr-only';
      note.textContent = ' (opens in new tab)';
      a.appendChild(note);
    });
  }

  function applyThought(root, key, label, html, threads) {
    var title = root.querySelector('[data-seed-thought-date]');
    var content = root.querySelector('[data-seed-thought-content]');
    if (title) {
      title.textContent = 'Agni Yoga Seed Thought for ' + label;
    }
    if (content) {
      content.innerHTML = html;
      markExternal(content);
    }
    applyLink(root, key, label, html, threads);
  }

  function fetchAndApply(root, date) {
    var mm = pad(date.getMonth() + 1);
    var dd = pad(date.getDate());

    Promise.all([
      fetch('/assets/data/seed-thoughts/' + mm + '.json')
        .then(function (response) { return response.ok ? response.json() : null; }),
      getThreads()
    ])
      .then(function (results) {
        var data = results[0];
        if (!data) return;
        var html = data[dd] || '<p>Seed Thoughts unavailable at this time.</p>';
        applyThought(root, mm + '-' + dd, localLabel(date), html, results[1]);
      })
      .catch(function () {
        // Network failure: leave the build-time server-rendered thought in place.
      });
  }

  function syncSeedThought(root) {
    var now = new Date();
    if (root.getAttribute('data-seed-thought-built') !== localDateKey(now)) {
      fetchAndApply(root, now);
    }
  }

  function scheduleMidnightRefresh(root) {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 3, 0);
    window.setTimeout(function () {
      // Re-render in place rather than reloading the page, so a reader who
      // happens to have the page open at midnight doesn't lose their place.
      fetchAndApply(root, new Date());
      scheduleMidnightRefresh(root);
    }, next.getTime() - now.getTime());
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-seed-thought]').forEach(function (root) {
      syncSeedThought(root);
      scheduleMidnightRefresh(root);
    });
  });
})();
