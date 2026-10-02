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

/**
 * Source citations are stored as plain <a> tags in the JSON. Open them in a new
 * tab so a reader following a citation doesn't lose the page they were reading,
 * matching the convention used everywhere else on the site (target + rel, plus
 * a screen-reader note).
 * Keep in sync with markExternal() in assets/js/seed-thoughts.js.
 */
function externalLinks(html) {
  return html.replace(
    /<a href="(https?:\/\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/g,
    function (match, href, attrs, inner) {
      if (/agniyogaworld\.org/.test(href)) return match;
      if (/target=/.test(attrs)) return match;
      return '<a href="' + href + '"' + attrs +
             ' target="_blank" rel="noopener">' + inner +
             '<span class="sr-only"> (opens in new tab)</span></a>';
    }
  );
}

/**
 * Plain text of one paragraph. Tags are removed without inserting spaces, so a
 * citation like "(<i>FW II</i>, 8)" stays "(FW II, 8)" rather than "( FW II , 8)".
 */
function paragraphText(chunk) {
  return chunk
    .replace(/<span class="sr-only">[\s\S]*?<\/span>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The passage as it should appear in a new forum topic.
 *
 * The whole passage goes in, never an excerpt: this is the post that opens the
 * discussion, and a partial quote is a poor thing to think about. Measured
 * across all 366, the longest resulting URL is ~3.1k characters, well inside
 * nginx's 8k request line and every browser's limit, so there is nothing to
 * save by trimming.
 *
 * Two other things this has to get right:
 *  - quote the passage, so the writer's own words are visually theirs
 *  - link with markdown, NOT a bare URL. A bare URL alone on a line makes
 *    Discourse onebox it, which shows a broken-preview error while the page is
 *    not yet in production, and a heavy preview card once it is.
 *
 * Takes the raw stored HTML, not the version with external-link attributes
 * added, so the "(opens in new tab)" note never reaches the quote.
 */
function buildComposerBody(raw, key, label) {
  const quoted = raw
    .split(/<\/p>/i)
    .map(paragraphText)
    .filter(function (line) { return line.length > 0; })
    .map(function (line) { return "> " + line; })
    .join("\n> \n");

  return quoted +
    `\n\nFrom [Seed Thought for ${label}](${SITE}/seed-thoughts/${key}/)` +
    // Discourse trims trailing whitespace, so a newline alone would not hold
    // this line open. A zero-width space is not whitespace to trim().
    "\n\n\u200B";
}

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
      const raw = data[dd];
      const html = externalLinks(raw);
      const key = `${mm}-${dd}`;
      const label = `${monthNames[m - 1]} ${parseInt(dd, 10)}`;

      // Citation: <a href="…"><i>ABBR</i></a>, 229)
      const cite = html.match(/href="([^"]+)"[^>]*><i>([^<]+)<\/i>(?:<span[^>]*>[^<]*<\/span>)?<\/a>,?\s*([^)]*)\)/);
      const abbr = cite ? cite[2].trim() : "";
      const text = stripTags(html);

      // Body for the "start the discussion" composer.
      // Keep in sync with composerUrl() in assets/js/seed-thoughts.js.
      const composerBody = buildComposerBody(raw, key, label);

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
        // One place decides where "Discuss this passage" goes. A thread entry
        // without an id has no real topic yet, so fall back to the forum home
        // rather than guessing an id — Discourse resolves /t/slug/ID by the
        // number and ignores the slug, so a wrong id lands on a real, unrelated
        // topic instead of erroring.
        threadUrl: (function () {
          const t = threads[key];
          if (t && t.id) {
            return `${FORUM}/t/${t.slug || "topic"}/${t.id}`;
          }
          return `${FORUM}/`;
        })(),
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
