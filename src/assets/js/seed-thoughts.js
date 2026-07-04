(function () {
  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function localDateKey(date) {
    return pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function localLabel(date) {
    return monthNames[date.getMonth()] + ' ' + date.getDate();
  }

  function applyThought(root, label, html) {
    var title = root.querySelector('[data-seed-thought-date]');
    var content = root.querySelector('[data-seed-thought-content]');
    if (title) {
      title.textContent = 'Agni Yoga Seed Thought for ' + label;
    }
    if (content) {
      content.innerHTML = html;
    }
  }

  function fetchAndApply(root, date) {
    var mm = pad(date.getMonth() + 1);
    var dd = pad(date.getDate());
    fetch('/assets/data/seed-thoughts/' + mm + '.json')
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (!data) return;
        var html = data[dd] || '<p>Seed Thoughts unavailable at this time.</p>';
        applyThought(root, localLabel(date), html);
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
