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

  const TIER_ORDER = { Platinum: 1, Gold: 2, Silver: 3, "Networking Drinks": 4 };

  // Given an event's own `sponsors` list ([{ sponsor: slug, tier, note }, ...]),
  // resolve each entry to the full sponsor profile so templates can link to it.
  eleventyConfig.addFilter("resolveSponsors", (sponsorRefs, allSponsors) => {
    if (!sponsorRefs) return [];
    return sponsorRefs
      .map((ref) => {
        const profile = allSponsors.find((s) => s.data.slug === ref.sponsor);
        if (!profile) return null;
        return { profile, tier: ref.tier, note: ref.note };
      })
      .filter(Boolean)
      .sort((a, b) => (TIER_ORDER[a.tier] || 99) - (TIER_ORDER[b.tier] || 99));
  });

  // Reverse lookup: every event a given sponsor (by slug) appears in, with
  // the tier/note they had at that specific event.
  eleventyConfig.addFilter("byRegion", (events, region) =>
    (events || []).filter((e) => e.data.region === region)
  );

  eleventyConfig.addFilter("niceDate", (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  });

  eleventyConfig.addFilter("withLogo", (sponsors) =>
    (sponsors || []).filter((s) => s.data.logo)
  );

  eleventyConfig.addFilter("eventsForSponsor", (events, sponsorSlug) => {
    const rows = [];
    events.forEach((event) => {
      (event.data.sponsors || []).forEach((ref) => {
        if (ref.sponsor === sponsorSlug) {
          rows.push({ event, tier: ref.tier, note: ref.note });
        }
      });
    });
    return rows.sort((a, b) => b.event.data.year - a.event.data.year);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
