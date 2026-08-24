module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("src/files");

  eleventyConfig.addCollection("events", (collectionApi) =>
    collectionApi.getFilteredByTag("events").sort((a, b) => b.data.year - a.data.year)
  );

  eleventyConfig.addCollection("sponsors", (collectionApi) =>
    collectionApi.getFilteredByTag("sponsors")
  );

  eleventyConfig.addFilter("sponsorsFor", (sponsors, eventSlug) =>
    sponsors
      .filter((s) => s.data.event === eventSlug)
      .sort((a, b) => (a.data.tierOrder || 99) - (b.data.tierOrder || 99))
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
