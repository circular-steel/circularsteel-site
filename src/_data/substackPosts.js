module.exports = async function () {
  try {
    const res = await fetch("https://circularsteel.substack.com/feed", {
      headers: { "User-Agent": "circularsteel-site-build" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    return items.slice(0, 3).map((item) => {
      const title = (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || [])[1] || "";
      const description = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || [])[1] || "";
      const link = (item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "";
      const image = (item.match(/<enclosure url="([^"]*)"/) || [])[1] || "";
      const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";
      return { title, description, link, image, pubDate };
    });
  } catch (err) {
    console.warn("Could not fetch Substack feed at build time:", err.message);
    return [];
  }
};
