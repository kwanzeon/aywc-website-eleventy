/* Mobile navigation toggle. */
(function () {
  'use strict';
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.getElementById('nav-links');
  if (!toggle || !navLinks) return;

  function openNav() {
    navLinks.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    var first = navLinks.querySelector('a');
    if (first) first.focus();
  }
  function closeNav() {
    navLinks.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  }
  toggle.addEventListener('click', function () {
    if (navLinks.classList.contains('nav-open')) { closeNav(); } else { openNav(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navLinks.classList.contains('nav-open')) closeNav();
  });
})();
