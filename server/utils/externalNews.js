const https = require("https");

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_LANGUAGE = process.env.NEWS_API_LANGUAGE || "en";
const NEWS_API_PAGE_SIZE = Number(process.env.NEWS_API_PAGE_SIZE || 5);
const NEWS_API_CACHE_TTL_MS = Number(process.env.NEWS_API_CACHE_TTL_MS || 10 * 60 * 1000);
const NEWS_API_TIMEOUT_MS = Number(process.env.NEWS_API_TIMEOUT_MS || 8 * 1000);

const CATEGORY_QUERIES = [
  { category: "Tech", params: { category: "technology" } },
  { category: "Health", params: { category: "health" } },
  {
    category: "Education",
    params: {
      q: process.env.NEWS_API_EDUCATION_QUERY || "education OR edtech OR classroom",
    },
  },
];

let cachedItems = [];
let cachedAt = 0;

const clampNumber = (value, min, max, fallback) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
};

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { headers: { "User-Agent": "IvoTe/1.0" } },
      (response) => {
        const { statusCode } = response;
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          if (statusCode < 200 || statusCode >= 300) {
            const error = new Error(`News API request failed with status ${statusCode}`);
            error.statusCode = statusCode;
            error.body = data.slice(0, 300);
            reject(error);
            return;
          }

          try {
            resolve(JSON.parse(data));
          } catch (error) {
            error.message = `Failed to parse news response: ${error.message}`;
            reject(error);
          }
        });
      }
    );

    request.on("error", reject);
    request.setTimeout(NEWS_API_TIMEOUT_MS, () => {
      request.destroy(new Error("News API request timed out"));
    });
  });

const buildNewsApiUrl = (params) => {
  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("apiKey", NEWS_API_KEY);
  url.searchParams.set(
    "pageSize",
    String(clampNumber(NEWS_API_PAGE_SIZE, 1, 20, 5))
  );
  url.searchParams.set("language", NEWS_API_LANGUAGE);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      url.searchParams.set(key, value.trim());
    }
  });

  return url.toString();
};

const resolveContent = (article) => {
  if (typeof article?.description === "string" && article.description.trim()) {
    return article.description.trim();
  }
  if (typeof article?.content === "string" && article.content.trim()) {
    return article.content.trim();
  }
  return "Tap through to read the full story.";
};

const mapArticle = (article, category) => {
  const title = typeof article?.title === "string" ? article.title.trim() : "";
  if (!title) return null;

  const sourceUrl = typeof article?.url === "string" ? article.url.trim() : "";
  const imageUrl =
    typeof article?.urlToImage === "string" ? article.urlToImage.trim() : "";
  const publishedAtRaw = article?.publishedAt;
  const publishedAtDate = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
  const publishedAt = Number.isNaN(publishedAtDate.getTime()) ? new Date() : publishedAtDate;
  const author =
    (typeof article?.author === "string" && article.author.trim()) ||
    article?.source?.name ||
    "External News";

  let mediaType = null;
  let mediaUrl = null;
  if (imageUrl) {
    mediaType = "image";
    mediaUrl = imageUrl;
  } else if (sourceUrl) {
    mediaType = "embed";
    mediaUrl = sourceUrl;
  }

  return {
    id: sourceUrl || `${category}-${title}`.toLowerCase().replace(/\s+/g, "-"),
    title,
    content: resolveContent(article),
    author,
    category,
    mediaType,
    mediaUrl,
    sourceUrl: sourceUrl || null,
    date: publishedAt,
    isExternal: true,
  };
};

const dedupeItems = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key =
      (typeof item?.sourceUrl === "string" && item.sourceUrl.trim()) ||
      (typeof item?.title === "string" && item.title.trim().toLowerCase()) ||
      null;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchExternalNews = async () => {
  if (!NEWS_API_KEY) return [];

  const now = Date.now();
  if (cachedItems.length && now - cachedAt < NEWS_API_CACHE_TTL_MS) {
    return cachedItems;
  }

  const results = await Promise.allSettled(
    CATEGORY_QUERIES.map(async ({ category, params }) => {
      const url = buildNewsApiUrl(params);
      const payload = await fetchJson(url);
      if (payload?.status && payload.status !== "ok") {
        throw new Error(payload?.message || "News API returned an error");
      }
      const articles = Array.isArray(payload?.articles) ? payload.articles : [];
      return articles
        .map((article) => mapArticle(article, category))
        .filter(Boolean);
    })
  );

  const items = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      const label = CATEGORY_QUERIES[index]?.category || "news";
      console.warn(`External ${label} news fetch failed:`, result.reason?.message || result.reason);
    }
  });

  const deduped = dedupeItems(items).sort((a, b) => {
    const aTime = new Date(a.date || 0).getTime();
    const bTime = new Date(b.date || 0).getTime();
    const safeATime = Number.isNaN(aTime) ? 0 : aTime;
    const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
    return safeBTime - safeATime;
  });

  if (deduped.length) {
    cachedItems = deduped;
    cachedAt = now;
  }

  return deduped;
};

module.exports = {
  fetchExternalNews,
};
