/* Opens the Netlify Identity login dialog when no user is signed in. */
if (window.netlifyIdentity) {
  window.netlifyIdentity.on("init", function (user) {
    if (!user) window.netlifyIdentity.open();
  });
}
