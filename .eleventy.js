module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "admin": "admin" });

  eleventyConfig.addFilter("limit", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("htmlDateString", (dateObj) => new Date(dateObj).toISOString().split("T")[0]);

  eleventyConfig.addCollection("news", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/news/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // Community cards are listed alphabetically by title (AYWC-193). This replaced the
  // curated flagship-first order from AYWC-164; the `order` front-matter field
  // is no longer used for sorting.
  function byTitle(a, b) {
    return a.data.title.localeCompare(b.data.title);
  }

  eleventyConfig.addCollection("community", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/community/*.md")
      .sort(byTitle);
  });

  eleventyConfig.addCollection("communityPages", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/community/*.md")
      .filter(item => item.data.has_page === true)
      .sort(byTitle);
  });

  eleventyConfig.addCollection("studyGroups", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/community/*.md")
      .filter(item => item.data.types && item.data.types.includes("Study Group"))
      .sort(byTitle);
  });

  eleventyConfig.addCollection("resources", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/resources/*.md")
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
