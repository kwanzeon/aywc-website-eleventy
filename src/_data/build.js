/**
 * Build-environment flags.
 *
 * Netlify sets CONTEXT to "production", "deploy-preview" or "branch-deploy".
 * Analytics (AYWC-180) is only rendered into production builds, so staging,
 * deploy previews and local builds never pollute the GoatCounter numbers —
 * GoatCounter records paths, not hostnames, so those hits could not be
 * filtered out afterwards.
 */
module.exports = {
  production: process.env.CONTEXT === "production",
};
