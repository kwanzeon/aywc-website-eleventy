(function () {
  'use strict';

  var chips = document.querySelectorAll('.seed-chip');
  var rows = document.querySelectorAll('.seed-row');
  var months = document.querySelectorAll('.seed-month');
  var status = document.getElementById('seed-filter-status');
  if (!chips.length || !rows.length) return;

  function apply(book) {
    var shown = 0;

    rows.forEach(function (row) {
      var match = book === 'all' || row.getAttribute('data-book') === book;
      row.hidden = !match;
      if (match) shown++;
    });

    // Hide a month heading entirely when nothing in it survives the filter.
    months.forEach(function (month) {
      var any = month.querySelector('.seed-row:not([hidden])');
      month.hidden = !any;
    });

    chips.forEach(function (chip) {
      chip.classList.toggle('is-active', chip.getAttribute('data-book') === book);
    });

    if (status) {
      status.textContent = book === 'all'
        ? ''
        : 'Showing ' + shown + ' of ' + rows.length + ' Seed Thoughts.';
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      apply(chip.getAttribute('data-book'));
    });
  });

  // Deep link from a passage page: /seed-thoughts/?book=lomg-i
  var param = new URLSearchParams(window.location.search).get('book');
  if (param) apply(param);
})();
