/**
 * All 366 Seed Thoughts, parsed once at build time (AYWC-182).
 *
 * The monthly JSON files under assets/data/seed-thoughts are the source of
 * truth and stay untouched — this just reads them, pulls the citation out of
 * each entry, and builds the neighbouring-day links the archive pages need.
 */
const fs = require("fs");
const path = require("path");

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Citation abbreviation -> full title. The URL in each entry already points at
// the Agni Yoga Society's edition; we only need the display name here.
const BOOKS = {
  "AY":      "Agni Yoga",
  "Aum":     "Aum",
  "BR":      "Brotherhood",
  "FW I":    "Fiery World I",
  "FW II":   "Fiery World II",
  "FW III":  "Fiery World III",
  "HIER":    "Hierarchy",
  "Heart":   "Heart",
  "INF I":   "Infinity I",
  "INF II":  "Infinity II",
  "LOHR I":  "Letters of Helena Roerich I",
  "LOMG I":  "Leaves of Morya's Garden I",
  "LOMG II": "Leaves of Morya's Garden II",
  "NEC":     "New Era Community"
};

const FORUM = "https://forum.agniyogaworld.org";
const SITE = "https://agniyogaworld.org";

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;|&rdquo;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function readThreads() {
  const p = path.join(__dirname, "../assets/data/seed-thought-threads.json");
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return {};
  }
}

module.exports = function () {
  const dir = path.join(__dirname, "../assets/data/seed-thoughts");
  const threads = readThreads();
  const entries = [];

  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const data = JSON.parse(fs.readFileSync(path.join(dir, `${mm}.json`), "utf8"));

    Object.keys(data).sort().forEach(function (dd) {
      const html = data[dd];
      const key = `${mm}-${dd}`;
      const label = `${monthNames[m - 1]} ${parseInt(dd, 10)}`;

      // Citation: <a href="…"><i>ABBR</i></a>, 229)
      const cite = html.match(/href="([^"]+)"><i>([^<]+)<\/i><\/a>,?\s*([^)]*)\)/);
      const abbr = cite ? cite[2].trim() : "";
      const text = stripTags(html);

      // Body for the "start the discussion" composer, kept short enough to sit
      // comfortably in a URL.
      const composerBody =
        text.slice(0, 480) +
        (text.length > 480 ? "…" : "") +
        `\n\n${SITE}/seed-thoughts/${key}/`;

      entries.push({
        key: key,
        mm: mm,
        dd: dd,
        month: monthNames[m - 1],
        day: parseInt(dd, 10),
        label: label,
        html: html,
        text: text,
        excerpt: text.length > 155 ? text.slice(0, 152).trim() + "…" : text,
        teaser: text.length > 72 ? text.slice(0, 69).trim() + "…" : text,
        bookAbbr: abbr,
        bookTitle: BOOKS[abbr] || abbr,
        bookSlug: abbr.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        bookUrl: cite ? cite[1] : "",
        reference: cite ? cite[3].trim() : "",
        thread: threads[key] || null,
        composerUrl:
          FORUM + "/new-topic" +
          "?title=" + encodeURIComponent(`Seed Thought — ${label}`) +
          "&body=" + encodeURIComponent(composerBody) +
          "&category=seed-thought" +
          (abbr ? "&tags=" + encodeURIComponent(abbr.toLowerCase().replace(/[^a-z0-9]+/g, "-")) : "")
      });
    });
  }

  // Neighbour links wrap around the year, so 31 December leads to 1 January.
  entries.forEach(function (e, i) {
    const prev = entries[(i - 1 + entries.length) % entries.length];
    const next = entries[(i + 1) % entries.length];
    e.prev = { key: prev.key, label: prev.label };
    e.next = { key: next.key, label: next.label };
  });

  const books = {};
  entries.forEach(function (e) {
    if (!books[e.bookAbbr]) {
      books[e.bookAbbr] = { abbr: e.bookAbbr, title: e.bookTitle, slug: e.bookSlug, url: e.bookUrl, count: 0 };
    }
    books[e.bookAbbr].count++;
  });

  return {
    all: entries,
    total: entries.length,
    books: Object.values(books).sort((a, b) => b.count - a.count)
  };
};
