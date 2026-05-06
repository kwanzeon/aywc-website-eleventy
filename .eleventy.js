module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "admin": "admin" });

  eleventyConfig.addFilter("limit", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("htmlDateString", (dateObj) => new Date(dateObj).toISOString().split("T")[0]);

  eleventyConfig.addCollection("news", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/news/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("community", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/community/*.md")
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99));
  });

  eleventyConfig.addCollection("communityPages", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/community/*.md")
      .filter(item => item.data.has_page === true)
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99));
  });

  eleventyConfig.addCollection("studyGroups", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/community/*.md")
      .filter(item => item.data.types && item.data.types.includes("Study Group"))
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99));
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
