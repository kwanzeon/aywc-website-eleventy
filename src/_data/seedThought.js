/**
 * The build day's Seed Thought, server-rendered on the homepage.
 *
 * Reuses the parsed archive (seedThoughts.js) so the homepage and the archive
 * pages agree on the citation, the thread link and the composer fallback.
 */
const allThoughts = require("./seedThoughts.js");

module.exports = function () {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateKey = `${mm}-${dd}`;

  const data = allThoughts();
  const entry = data.all.find((e) => e.key === dateKey);

  if (!entry) {
    return {
      dateKey: dateKey,
      label: "",
      html: "<p>Seed Thoughts unavailable at this time.</p>",
      thread: null,
      composerUrl: "",
      total: data.total
    };
  }

  return {
    dateKey: entry.key,
    label: entry.label,
    html: entry.html,
    thread: entry.thread,
    composerUrl: entry.composerUrl,
    total: data.total
  };
};
