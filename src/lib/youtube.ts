export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
  url: string;
  subscriberCount: number;
  channelCreatedAt: string;
  channelAvgViews: number;
  outlierMultiplier: number;
  channelVideoCount: number;
}

export interface YouTubeChannelItem {
  id: string;
  snippet: {
    publishedAt: string;
  };
  statistics: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
    channelTitle: string;
    channelId: string;
    publishedAt: string;
  };
}

interface YouTubeVideoItem {
  id: string;
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

function getPublishedAfter(interval: string): string {
  const now = new Date();
  switch (interval) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

async function fetchFromYouTube(endpoint: string, params: Record<string, string>, apiKey: string) {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  url.searchParams.set("key", apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const res = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`YouTube API error (${res.status}): ${error}`);
  }

  return res.json();
}

export async function searchViralVideos(
  niche: string,
  interval: string = "7d",
  maxResults: number = 20,
  apiKey: string,
  videoType: string = "all",
  pageToken?: string,
  subscriberLimit?: number,
  maxChannelAgeMonths?: number,
  sort: "relevance" | "views" = "relevance",
  strictRelevance: boolean = false
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> {
  const publishedAfter = getPublishedAfter(interval);

  // Step 1: Search for videos by keyword, date, and video type
  const baseSearchParams: Record<string, string> = {
    part: "snippet",
    q: niche,
    type: "video",
    maxResults: "50",
    publishedAfter,
    relevanceLanguage: "en",
  };

  // Add pageToken for pagination (only for single-search types)
  if (pageToken) {
    baseSearchParams.pageToken = pageToken;
  }

  let searchItems: YouTubeSearchItem[] = [];
  let nextPageToken: string | undefined;

  if (videoType === "short") {
    const data = await fetchFromYouTube("search", { ...baseSearchParams, videoDuration: "short" }, apiKey);
    searchItems = data.items || [];
    nextPageToken = data.nextPageToken;
  } else if (videoType === "long") {
    // Long form: pagination not supported for dual search
    const [mediumData, longData] = await Promise.all([
      fetchFromYouTube("search", { ...baseSearchParams, videoDuration: "medium", maxResults: "25" }, apiKey),
      fetchFromYouTube("search", { ...baseSearchParams, videoDuration: "long", maxResults: "25" }, apiKey),
    ]);
    searchItems = [...(mediumData.items || []), ...(longData.items || [])];
    // No pagination for dual search
  } else {
    const data = await fetchFromYouTube("search", baseSearchParams, apiKey);
    searchItems = data.items || [];
    nextPageToken = data.nextPageToken;
  }

  if (searchItems.length === 0) return { videos: [] };

  // Step 2: Get video IDs and fetch statistics
  const videoIds = searchItems.map((item) => item.id.videoId).filter(Boolean);

  const statsParams: Record<string, string> = {
    part: "statistics",
    id: videoIds.join(","),
  };

  const statsData = await fetchFromYouTube("videos", statsParams, apiKey);
  const statsItems: YouTubeVideoItem[] = statsData.items || [];
  const statsMap = new Map(statsItems.map((item) => [item.id, item.statistics]));

  // Step 3: Build initial videos array with stats
  let videos: YouTubeVideo[] = searchItems
    .map((item) => {
      const stats = statsMap.get(item.id.videoId);
      const viewCount = parseInt(stats?.viewCount || "0", 10);
      const likeCount = parseInt(stats?.likeCount || "0", 10);
      const commentCount = parseInt(stats?.commentCount || "0", 10);

      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || "",
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        viewCount,
        likeCount,
        commentCount,
        engagementRate: viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        subscriberCount: 0, // temporary, will fetch below
        channelCreatedAt: "", // temporary, will fetch below
        channelAvgViews: 0, // temporary, will fetch below
        outlierMultiplier: 1, // temporary, will fetch below
        channelVideoCount: 0, // temporary, will fetch below
      };
    })
    .filter((v) => v.viewCount > 0);

  // Step 4: Fetch subscriber counts & channel creation dates for each unique channel
  const uniqueChannelIds = [...new Set(videos.map((v) => v.channelId))];
  if (uniqueChannelIds.length > 0) {
    const channelParams: Record<string, string> = {
      part: "statistics,snippet",
      id: uniqueChannelIds.join(","),
    };
    try {
      const channelData = await fetchFromYouTube("channels", channelParams, apiKey);
      const subscriberMap: Map<string, number> = new Map(
        (channelData.items || []).map((item: YouTubeChannelItem) => [
          item.id,
          parseInt(item.statistics?.subscriberCount || "0", 10),
        ] as [string, number])
      );
      const channelCreatedAtMap: Map<string, string> = new Map(
        (channelData.items || []).map((item: YouTubeChannelItem) => [
          item.id,
          item.snippet?.publishedAt || "",
        ] as [string, string])
      );
      const channelViewCountMap: Map<string, number> = new Map(
        (channelData.items || []).map((item: YouTubeChannelItem) => [
          item.id,
          parseInt(item.statistics?.viewCount || "0", 10),
        ] as [string, number])
      );
      const channelVideoCountMap: Map<string, number> = new Map(
        (channelData.items || []).map((item: YouTubeChannelItem) => [
          item.id,
          parseInt(item.statistics?.videoCount || "0", 10),
        ] as [string, number])
      );
      videos = videos.map((v) => {
        const channelTotalViews = channelViewCountMap.get(v.channelId) || 0;
        const channelTotalVideos = channelVideoCountMap.get(v.channelId) || 0;
        const subCount = subscriberMap.get(v.channelId) || 0;
        const createdAt = channelCreatedAtMap.get(v.channelId) || "";

        // Calculate channel average views excluding this video
        const { avgViews, outlierMultiplier } = computeChannelAverage(
          channelTotalViews,
          channelTotalVideos,
          v.viewCount
        );

        return {
          ...v,
          subscriberCount: subCount,
          channelCreatedAt: createdAt,
          channelAvgViews: avgViews,
          outlierMultiplier,
          channelVideoCount: channelTotalVideos,
        };
      });
    } catch {
      // If channel fetch fails, continue with default values
      // This is a non-critical enrichment step
    }
  }

  // Step 5: Filter by subscriber limit (if set)
  if (subscriberLimit && subscriberLimit > 0) {
    videos = videos.filter((v) => v.subscriberCount <= subscriberLimit && v.subscriberCount > 0);
  }

  // Step 6: Filter by max channel age (if set)
  if (maxChannelAgeMonths && maxChannelAgeMonths > 0) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - maxChannelAgeMonths);
    videos = videos.filter((v) => {
      if (!v.channelCreatedAt) return false; // can't verify age, exclude
      const channelDate = new Date(v.channelCreatedAt);
      return channelDate >= cutoffDate;
    });
  }

  // Step 7: Strict relevance filter (optional) — hide videos that don't
  // clearly match the niche. Runs before sorting so the pool is narrowed.
  if (strictRelevance) {
    videos = videos.filter((v) => matchesStrictRelevance(v, niche));
  }

  // Step 8: Sort and limit results
  // ── relevance (default): the Data API's own "relevance" ordering is
  //    rudimentary keyword matching — for "surface pattern design" it
  //    happily ranks videos about painting floors (they contain "surface"
  //    + "pattern"). So we RE-RANK its pool with our own lightweight
  //    scorer: titles/descriptions containing the exact niche phrase (or
  //    more of its words) float to the top. Stable — YouTube's original
  //    order is the tiebreaker.
  // ── views: sort by view count descending (popularity-first).
  if (sort === "views") {
    videos = videos.sort((a, b) => b.viewCount - a.viewCount);
  } else {
    videos = videos
      .map((v, index) => ({ v, index, score: scoreRelevance(v, niche) }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ v }) => v);
  }

  videos = videos.slice(0, maxResults);

  return { videos, nextPageToken };
}

export function getEngagementLabel(rate: number): string {
  if (rate > 10) return "🔥 Hooked";
  if (rate > 5) return "💥 High";
  if (rate > 2) return "📈 Good";
  if (rate > 1) return "👍 Solid";
  return "👀 Average";
}

export function getOutlierInfo(multiplier: number): { icon: string; level: number; label: string } {
  if (multiplier >= 20) return { icon: "💎", level: 4, label: "Gem" };
  if (multiplier >= 10) return { icon: "🚀", level: 3, label: "Rocketing" };
  if (multiplier >= 5) return { icon: "🔥", level: 2, label: "Hot" };
  if (multiplier >= 3) return { icon: "👀", level: 1, label: "Notable" };
  return { icon: "", level: 0, label: "Normal" };
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Lightweight relevance scorer used to RE-RANK YouTube's search pool.
 *
 * The Data API's own "relevance" ordering is rudimentary keyword matching —
 * for a query like "surface pattern design" it happily returns videos about
 * painting floors (they contain "surface" + "pattern"). Our scorer instead
 * rewards titles/descriptions that contain the *exact phrase* or more of the
 * query's words, so genuinely on-topic niche content floats to the top.
 */
export function scoreRelevance(
  video: Pick<YouTubeVideo, "title" | "description" | "channelTitle">,
  query: string
): number {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const phrase = query.toLowerCase().trim();
  const title = (video.title || "").toLowerCase();
  const desc = (video.description || "").toLowerCase();
  const channel = (video.channelTitle || "").toLowerCase();

  let score = 0;
  // Exact phrase in the title → the strongest signal by far
  if (phrase.length > 1 && title.includes(phrase)) score += 100;
  // Each query word found in the title
  score += tokens.filter((t) => title.includes(t)).length * 20;
  // Exact phrase in the description
  if (phrase.length > 1 && desc.includes(phrase)) score += 30;
  // Each query word found in the description
  score += tokens.filter((t) => desc.includes(t)).length * 8;
  // Channel name match (e.g. "Surface Pattern Design Studio")
  score += tokens.filter((t) => channel.includes(t)).length * 4;
  return score;
}

/**
 * Strict relevance check: keep a video only if at least `min(2, wordCount)`
 * of the query's words appear in its title/description, or the exact phrase
 * appears verbatim. Used by the "Strict relevance" toggle to hide videos
 * that merely tangentially match (e.g. floor-painting for "surface pattern
 * design").
 */
export function matchesStrictRelevance(
  video: Pick<YouTubeVideo, "title" | "description">,
  query: string
): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const phrase = query.toLowerCase().trim();
  const haystack = `${(video.title || "").toLowerCase()} ${(video.description || "").toLowerCase()}`;

  if (phrase.length > 1 && haystack.includes(phrase)) return true;

  const matched = new Set(tokens.filter((t) => haystack.includes(t)));
  return matched.size >= Math.min(2, tokens.length);
}

/**
 * Compute a channel's average views per video (excluding the given video)
 * and the outlier multiplier for that video.
 *
 * ⚠️ Guards against stale YouTube channel statistics: `channels.list`
 * reports channel-wide totals that are cached server-side and lag behind
 * real-time video stats. A viral video's `viewCount` can temporarily exceed
 * the channel's reported total views, which would make
 * `(channelTotalViews - videoViewCount) / (videoCount - 1)` NEGATIVE.
 *
 * In that case we fall back to the channel average including the video
 * (`channelTotalViews / videoCount`), which is always ≥ 0, so the UI never
 * shows a negative average and the outlier multiplier stays meaningful.
 */
export function computeChannelAverage(
  channelTotalViews: number,
  channelVideoCount: number,
  videoViewCount: number
): { avgViews: number; outlierMultiplier: number } {
  // Stale stats: the video's views exceed the channel's reported total.
  if (channelTotalViews < videoViewCount) {
    const avgViews = channelVideoCount > 0 ? channelTotalViews / channelVideoCount : 0;
    return { avgViews, outlierMultiplier: avgViews > 0 ? videoViewCount / avgViews : 1 };
  }

  if (channelVideoCount > 1) {
    const avgViews = (channelTotalViews - videoViewCount) / (channelVideoCount - 1);
    return { avgViews, outlierMultiplier: avgViews > 0 ? videoViewCount / avgViews : 1 };
  }

  return { avgViews: channelTotalViews, outlierMultiplier: 1 };
}

// ── Channel lookup (URL / @handle → channel info) ──────────────

export interface ChannelLookupResult {
  channelId: string;
  title: string;
  avatar: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  createdAt: string;
  handle: string | null;
  url: string;
}

export class ChannelLookupError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ChannelLookupError";
    this.status = status;
  }
}

type ParsedChannelInput =
  | { type: "id"; value: string }
  | { type: "handle"; value: string }
  | { type: "video"; value: string }
  | { type: "unsupported"; value: string };

/**
 * Parse a user-pasted string into a channel lookup query.
 * Accepts:
 *   - https://youtube.com/channel/UC...  → channel ID
 *   - https://youtube.com/@handle        → handle
 *   - https://youtube.com/watch?v=...    → video ID (channel resolved via the video)
 *   - https://youtube.com/shorts/...     → video ID
 *   - @handle                            → handle
 *   - Bare UC... channel ID              → channel ID
 *   - Bare handle without @              → handle
 */
export function parseChannelInput(input: string): ParsedChannelInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try to parse as URL (prepend https:// when no protocol is present)
  let url: URL | null = null;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    url = null;
  }

  if (url && /(^|\.)youtube\.com$|youtu\.be$/i.test(url.hostname)) {
    const segments = url.pathname.split("/").filter(Boolean);

    // /channel/UC...
    if (segments[0] === "channel" && segments[1]) {
      return { type: "id", value: segments[1] };
    }
    // /@handle
    if (segments[0] && segments[0].startsWith("@")) {
      return { type: "handle", value: segments[0] };
    }
    // /watch?v=...
    if (url.searchParams.get("v")) {
      return { type: "video", value: url.searchParams.get("v")! };
    }
    // /shorts/<id>
    if (segments[0] === "shorts" && segments[1]) {
      return { type: "video", value: segments[1] };
    }
    // youtu.be/<videoId> (short share links, with or without www)
    if (url.hostname.endsWith("youtu.be") && segments[0]) {
      return { type: "video", value: segments[0] };
    }
    // Legacy custom URLs (c/ and user/) can't be resolved via the Data API
    if (segments[0] === "c" || segments[0] === "user") {
      return { type: "unsupported", value: trimmed };
    }
  }

  // @handle
  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed };
  }

  // Bare channel ID (UC + 22 chars)
  if (/^UC[\w-]{22}$/.test(trimmed)) {
    return { type: "id", value: trimmed };
  }

  // Bare handle without @ (single token, no spaces)
  if (/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return { type: "handle", value: `@${trimmed}` };
  }

  return null;
}

/**
 * Resolve a YouTube channel from a URL, @handle, or channel ID.
 *
 * Cost: 1 unit (channels.list) — 2 units if a video URL is given
 * (videos.list to find the channel + channels.list).
 */
export async function lookupChannel(input: string, apiKey: string): Promise<ChannelLookupResult> {
  const parsed = parseChannelInput(input);
  if (!parsed) {
    throw new ChannelLookupError(
      "That doesn't look like a YouTube channel link or @handle. Try pasting a channel URL like youtube.com/@MrBeast.",
      400
    );
  }

  if (parsed.type === "unsupported") {
    throw new ChannelLookupError(
      "Legacy channel URLs (youtube.com/c/...) can't be resolved directly. Open the channel on YouTube and copy its @handle link instead.",
      400
    );
  }

  let channelId: string;
  let handle: string | null = null;

  if (parsed.type === "video") {
    // Resolve the channel from a video URL (1 unit)
    const videoData = await fetchFromYouTube("videos", { part: "snippet", id: parsed.value }, apiKey);
    const video = videoData.items?.[0];
    if (!video?.snippet?.channelId) {
      throw new ChannelLookupError("Couldn't find the channel for that video.", 404);
    }
    channelId = video.snippet.channelId;
  } else {
    channelId = parsed.value;
    if (parsed.type === "handle") handle = parsed.value;
  }

  // Fetch channel details (1 unit)
  const params: Record<string, string> = { part: "snippet,statistics" };
  if (handle) {
    params.forHandle = handle;
  } else {
    params.id = channelId;
  }

  const data = await fetchFromYouTube("channels", params, apiKey);
  const item = data.items?.[0];
  if (!item) {
    throw new ChannelLookupError("Channel not found. Double-check the link or handle.", 404);
  }

  return {
    channelId: item.id,
    title: item.snippet?.title || "Unknown channel",
    avatar:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      "",
    description: item.snippet?.description || "",
    subscriberCount: parseInt(item.statistics?.subscriberCount || "0", 10),
    videoCount: parseInt(item.statistics?.videoCount || "0", 10),
    totalViews: parseInt(item.statistics?.viewCount || "0", 10),
    createdAt: item.snippet?.publishedAt || "",
    handle,
    url: `https://www.youtube.com/channel/${item.id}`,
  };
}

// ── Video lookup (URL / ID → full YouTubeVideo with stats) ──

export class VideoLookupError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "VideoLookupError";
    this.status = status;
  }
}

/**
 * Parse a user-pasted string into a YouTube video ID.
 * Accepts:
 *   - https://youtube.com/watch?v=...   → video ID
 *   - https://youtu.be/<id>             → video ID
 *   - https://youtube.com/shorts/<id>   → video ID
 *   - Bare 11-char video ID             → video ID
 * Returns null if it doesn't look like a video link.
 */
export function parseVideoInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try to parse as URL (prepend https:// when no protocol is present)
  let url: URL | null = null;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    url = null;
  }

  if (url && /(^|\.)youtube\.com$|youtu\.be$/i.test(url.hostname)) {
    const segments = url.pathname.split("/").filter(Boolean);

    // /shorts/<id> (checked first so a stray v= param on a shorts URL can't override)
    if (segments[0] === "shorts" && segments[1]) {
      return segments[1];
    }
    // youtu.be/<videoId> (short share links, with or without www)
    if (url.hostname.endsWith("youtu.be") && segments[0]) {
      return segments[0];
    }
    // /watch?v=...
    if (url.searchParams.get("v")) {
      return url.searchParams.get("v")!;
    }
    // Any other YouTube URL (channel, @handle, playlist…) is not a video
    return null;
  }

  // Bare video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Resolve a full YouTube video (with stats, engagement rate, and
 * channel outlier info) from a pasted URL or video ID.
 *
 * Cost: 2 units — videos.list (1) + channels.list (1).
 */
export async function lookupVideo(input: string, apiKey: string): Promise<YouTubeVideo> {
  const videoId = parseVideoInput(input);
  if (!videoId) {
    throw new VideoLookupError(
      "That doesn't look like a YouTube video link. Try pasting a URL like youtube.com/watch?v=abc123.",
      400
    );
  }

  // Step 1: Fetch video snippet + statistics (1 unit)
  const videoData = await fetchFromYouTube(
    "videos",
    { part: "snippet,statistics", id: videoId },
    apiKey
  );
  const item = videoData.items?.[0];
  if (!item) {
    throw new VideoLookupError("Video not found. Double-check the link or ID.", 404);
  }

  const viewCount = parseInt(item.statistics?.viewCount || "0", 10);
  const likeCount = parseInt(item.statistics?.likeCount || "0", 10);
  const commentCount = parseInt(item.statistics?.commentCount || "0", 10);

  const channelId = item.snippet?.channelId || "";
  const channelTitle = item.snippet?.channelTitle || "Unknown channel";

  // Step 2: Fetch channel stats for the outlier calculation (1 unit)
  let subscriberCount = 0;
  let channelCreatedAt = "";
  let channelAvgViews = 0;
  let outlierMultiplier = 1;
  let channelVideoCount = 0;

  if (channelId) {
    try {
      const channelData = await fetchFromYouTube(
        "channels",
        { part: "snippet,statistics", id: channelId },
        apiKey
      );
      const channel = channelData.items?.[0];
      if (channel) {
        subscriberCount = parseInt(channel.statistics?.subscriberCount || "0", 10);
        channelCreatedAt = channel.snippet?.publishedAt || "";
        const channelTotalViews = parseInt(channel.statistics?.viewCount || "0", 10);
        channelVideoCount = parseInt(channel.statistics?.videoCount || "0", 10);

        // Calculate channel average views excluding this video
        const { avgViews, outlierMultiplier: multiplier } = computeChannelAverage(
          channelTotalViews,
          channelVideoCount,
          viewCount
        );
        channelAvgViews = avgViews;
        outlierMultiplier = multiplier;
      }
    } catch {
      // Non-critical enrichment step — keep default values
    }
  }

  return {
    id: item.id,
    title: item.snippet?.title || "Unknown title",
    description: item.snippet?.description || "",
    thumbnail:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      "",
    channelTitle,
    channelId,
    publishedAt: item.snippet?.publishedAt || "",
    viewCount,
    likeCount,
    commentCount,
    engagementRate: viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    subscriberCount,
    channelCreatedAt,
    channelAvgViews,
    outlierMultiplier,
    channelVideoCount,
  };
}
