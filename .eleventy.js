const markdownIt = require("markdown-it");
const md = markdownIt({ html: false, linkify: true });

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("src/files");

  // For CMS "markdown" widget fields stored as plain strings in JSON data
  // (e.g. pages.about.body) - .md content files get this for free from
  // Eleventy's own template engine, but a JSON string field doesn't.
  eleventyConfig.addFilter("markdown", (content) => md.render(content || ""));

  eleventyConfig.addCollection("events", (collectionApi) =>
    collectionApi.getFilteredByTag("events").sort((a, b) => b.data.year - a.data.year)
  );

  eleventyConfig.addCollection("sponsors", (collectionApi) =>
    collectionApi.getFilteredByTag("sponsors")
  );

  eleventyConfig.addCollection("tiers", (collectionApi) =>
    collectionApi.getFilteredByTag("tiers").sort((a, b) => (a.data.order || 99) - (b.data.order || 99))
  );

  // Case-insensitive lookup of a tier's order/colour by name, with safe
  // fallbacks so an unrecognised tier name never breaks a build.
  function findTier(tiersList, tierName) {
    if (!tierName) return null;
    return (tiersList || []).find(
      (t) => (t.data.name || "").toLowerCase() === tierName.toLowerCase()
    );
  }

  // Given an event's own `sponsors` list ([{ sponsor: slug, tier, note }, ...]),
  // resolve each entry to the full sponsor profile so templates can link to it.
  // Sorts using the order defined on each tier in the Tiers collection (CMS-managed).
  eleventyConfig.addFilter("resolveSponsors", (sponsorRefs, allSponsors, tiersList) => {
    if (!sponsorRefs) return [];
    return sponsorRefs
      .map((ref) => {
        const profile = allSponsors.find((s) => s.data.slug === ref.sponsor);
        if (!profile) return null;
        return { profile, tier: ref.tier, note: ref.note };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const orderA = (findTier(tiersList, a.tier) || {}).data?.order ?? 99;
        const orderB = (findTier(tiersList, b.tier) || {}).data?.order ?? 99;
        return orderA - orderB;
      });
  });

  eleventyConfig.addFilter("tierColor", (tierName, tiersList) => {
    const tier = findTier(tiersList, tierName);
    return tier ? tier.data.color : "#5a6a85";
  });

  // Second stop for the tier's gradient ribbon - falls back to the same
  // colour twice (a flat "gradient") if a tier was never given one.
  eleventyConfig.addFilter("tierColor2", (tierName, tiersList) => {
    const tier = findTier(tiersList, tierName);
    return tier ? tier.data.color2 || tier.data.color : "#5a6a85";
  });

  // Reverse lookup: every event a given sponsor (by slug) appears in, with
  // the tier/note they had at that specific event.
  eleventyConfig.addFilter("byRegion", (events, region) =>
    (events || []).filter((e) => e.data.region === region)
  );

  // A nav item is "current" if it's the exact page, or (for anything but
  // Home) the current page's URL sits underneath it - so /uk/2026/ still
  // highlights the UK nav item, not just /uk/ itself.
  eleventyConfig.addFilter("isActiveNav", (pageUrl, itemUrl) => {
    if (pageUrl === itemUrl) return true;
    if (itemUrl === "/") return false;
    return pageUrl.startsWith(itemUrl);
  });

  eleventyConfig.addFilter("niceDate", (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  });

  eleventyConfig.addFilter("withLogo", (sponsors) =>
    (sponsors || []).filter((s) => s.data.logo)
  );

  // Splits a list roughly in half, for the two-row logo marquee.
  eleventyConfig.addFilter("splitInHalf", (arr) => {
    const list = arr || [];
    const mid = Math.ceil(list.length / 2);
    return [list.slice(0, mid), list.slice(mid)];
  });

  // Repeats a marquee row's logos enough times that the strip always
  // overflows its container - with only 2-3 logos, one or two copies
  // leaves visible empty space (looks left-aligned); this pads it out
  // so it never runs dry, and self-corrects as more logos are added.
  // `repeats` is handed back so the CSS animation can loop by exactly
  // 1/repeats of the track's width, however many copies that turns out
  // to be.
  eleventyConfig.addFilter("marqueeRow", (arr) => {
    const list = arr || [];
    if (!list.length) return { items: [], repeats: 1 };
    const targetCount = 16;
    const repeats = Math.max(2, Math.ceil(targetCount / list.length));
    const items = [];
    for (let i = 0; i < repeats; i++) items.push(...list);
    return { items, repeats };
  });

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
