/* Forwards Netlify Identity tokens (from invite/recovery/confirmation emails,
   which land on the site root) to the admin app. Loaded in <head> so it runs
   before the page renders. The hash is only ever appended to the fixed
   /admin/ path — never interpolated into markup. */
(function () {
  var h = window.location.hash;
  if (h && (h.indexOf('invite_token=') > -1 || h.indexOf('recovery_token=') > -1 || h.indexOf('confirmation_token=') > -1)) {
    window.location.replace('/admin/' + h);
  }
})();
