module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "admin": "admin" });

  eleventyConfig.addFilter("limit", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("htmlDateString", (dateObj) => new Date(dateObj).toISOString().split("T")[0]);

  eleventyConfig.addCollection("news", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/news/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // Founding/flagship organizations keep their curated order (1-10); everything
  // else (default order: 99, e.g. new community submissions) sorts alphabetically
  // by title instead of falling out in arbitrary filename order (AYWC-164).
  function byOrderThenTitle(a, b) {
    const orderDiff = (a.data.order || 99) - (b.data.order || 99);
    if (orderDiff !== 0) return orderDiff;
    return a.data.title.localeCompare(b.data.title);
  }

  eleventyConfig.addCollection("community", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/community/*.md")
      .sort(byOrderThenTitle);
  });

  eleventyConfig.addCollection("communityPages", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/community/*.md")
      .filter(item => item.data.has_page === true)
      .sort(byOrderThenTitle);
  });

  eleventyConfig.addCollection("studyGroups", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/community/*.md")
      .filter(item => item.data.types && item.data.types.includes("Study Group"))
      .sort(byOrderThenTitle);
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
