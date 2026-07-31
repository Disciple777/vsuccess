import { NextRequest, NextResponse } from "next/server";
import { computeChannelAverage } from "@/lib/youtube";

/**
 * /api/channel-inspect?channelId=UC...&maxResults=30&sort=date
 *
 * Fetches videos from a YouTube channel with full statistics
 * including outlier multiplier, engagement rate, and channel info.
 *
 * TWO FETCH STRATEGIES depending on sort mode:
 *
 * ── sort=date (Latest, default) ──
 *   Uses the channel's Upload Playlist (playlistItems.list).
 *   Cheap — 1 unit per 50 items. Returns the N most recent uploads.
 *   Cost: ~3 units for 30 videos.
 *
 * ── sort=views (Top Performing) ──
 *   Uses search.list with order=viewCount + channelId filter.
 *   Returns the channel's true ALL-TIME most-viewed videos.
 *   Cost: ~102 units — but it actually works!
 *
 * Why not use playlistItems for Top Performing?
 *   The Upload Playlist is ordered newest-first. For a channel with
 *   thousands of videos, the 200M-view video from 3 years ago is
 *   buried way later. playlistItems would only scan the ~200 newest.
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
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
  contentDetails?: {
    duration: string;
  };
  snippet?: {
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    channelTitle: string;
    channelId: string;
    publishedAt: string;
  };
}

interface YouTubeChannelItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    publishedAt: string;
  };
  statistics: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
  contentDetails?: {
    relatedPlaylists: {
      uploads?: string;
    };
  };
}

interface YouTubePlaylistItem {
  snippet: {
    resourceId: { videoId: string };
    publishedAt: string;
  };
}

export interface ChannelInspectVideo {
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
  /** Duration in seconds (parsed from ISO 8601) */
  durationSeconds: number;
}

export interface ChannelInspectResponse {
  channelId: string;
  channelTitle: string;
  channelAvatar: string;
  subscriberCount: number;
  channelVideoTotalCount: number;
  channelTotalViews: number;
  channelCreatedAt: string;
  sort: "date" | "views";
  videos: ChannelInspectVideo[];
  count: number;
}

/** Max videos per page for playlistItems.list */
const PAGE_SIZE = 50;

async function fetchYouTubeJSON(endpoint: string, params: Record<string, string>, apiKey: string) {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  url.searchParams.set("key", apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`YouTube API error (${res.status}): ${error}`);
  }
  return res.json();
}

// ── Shared helpers ────────────────────────────────────────────────

function parseISODuration(iso: string): number {
  const m = iso.match(/PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || "0", 10) * 3600) +
         (parseInt(m[2] || "0", 10) * 60) +
          parseInt(m[3] || "0", 10);
}

function buildVideoObjects(
  videoIds: string[],
  publishedAtMap: Map<string, string>,
  statsMap: Map<string, YouTubeVideoItem["statistics"]>,
  durationMap: Map<string, string>,
  snippetMap: Map<string, YouTubeVideoItem["snippet"]>,
  channelInfo: {
    title: string;
    id: string;
    subscriberCount: number;
    channelCreatedAt: string;
    channelTotalViews: number;
    channelVideoTotalCount: number;
  }
): ChannelInspectVideo[] {
  const { title: channelTitle, id: channelId, subscriberCount, channelCreatedAt, channelTotalViews, channelVideoTotalCount } = channelInfo;

  return videoIds
    .map((videoId) => {
      const stats = statsMap.get(videoId);
      const snippet = snippetMap.get(videoId);
      if (!snippet || !stats) return null;

      const viewCount = parseInt(stats.viewCount || "0", 10);
      if (viewCount <= 0) return null;

      const likeCount = parseInt(stats.likeCount || "0", 10);
      const commentCount = parseInt(stats.commentCount || "0", 10);

      // Outlier multiplier: video views vs channel avg (excluding this video)
      const { avgViews, outlierMultiplier: outlierMult } = computeChannelAverage(
        channelTotalViews,
        channelVideoTotalCount,
        viewCount
      );

      return {
        id: videoId,
        title: snippet.title || "Untitled",
        description: snippet.description || "",
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
        channelTitle,
        channelId,
        publishedAt: publishedAtMap.get(videoId) || snippet.publishedAt || "",
        viewCount,
        likeCount,
        commentCount,
        engagementRate: viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        subscriberCount,
        channelCreatedAt,
        channelAvgViews: Math.round(avgViews),
        outlierMultiplier: outlierMult,
        channelVideoCount: channelVideoTotalCount,
        durationSeconds: parseISODuration(durationMap.get(videoId) || ""),
      };
    })
    .filter((v): v is ChannelInspectVideo => v !== null);
}

// ── Strategy 1: Latest — paginate through upload playlist (cheap) ──

async function fetchLatestViaPlaylist(
  playlistId: string,
  apiKey: string,
  maxToFetch: number,
  channelInfo: { title: string; id: string; subscriberCount: number; channelCreatedAt: string; channelTotalViews: number; channelVideoTotalCount: number }
): Promise<ChannelInspectVideo[]> {
  // Step A: Fetch items from playlist (newest-first)
  const allItems: { videoId: string; publishedAt: string }[] = [];
  let pageToken: string | undefined;

  while (allItems.length < maxToFetch) {
    const params: Record<string, string> = {
      part: "snippet",
      playlistId,
      maxResults: String(Math.min(PAGE_SIZE, maxToFetch - allItems.length)),
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await fetchYouTubeJSON("playlistItems", params, apiKey);
    const items: YouTubePlaylistItem[] = data.items || [];
    for (const item of items) {
      if (item.snippet?.resourceId?.videoId) {
        allItems.push({
          videoId: item.snippet.resourceId.videoId,
          publishedAt: item.snippet.publishedAt,
        });
      }
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  if (allItems.length === 0) return [];

  const videoIds = allItems.map((i) => i.videoId);
  const publishedMap = new Map(allItems.map((i) => [i.videoId, i.publishedAt]));

  // Step B: Fetch video stats + durations + snippets
  const allStatsItems: YouTubeVideoItem[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await fetchYouTubeJSON("videos", {
      part: "statistics,contentDetails,snippet",
      id: batch.join(","),
    }, apiKey);
    allStatsItems.push(...(data.items || []));
  }

  const statsMap = new Map(allStatsItems.map((item) => [item.id, item.statistics]));
  const durationMap = new Map(allStatsItems.map((item) => [item.id, item.contentDetails?.duration || ""]));
  const snippetMap = new Map(allStatsItems.map((item) => [item.id, item.snippet]));

  // Step C: Build videos, sort by date desc, return
  const videos = buildVideoObjects(videoIds, publishedMap, statsMap, durationMap, snippetMap, channelInfo);
  videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return videos;
}

// ── Strategy 2: Top Performing — search.list with order=viewCount (true all-time top) ──

async function fetchTopViaSearch(
  channelId: string,
  apiKey: string,
  maxToFetch: number,
  channelInfo: { title: string; id: string; subscriberCount: number; channelCreatedAt: string; channelTotalViews: number; channelVideoTotalCount: number }
): Promise<ChannelInspectVideo[]> {
  // Step A: search.list with order=viewCount — returns true top videos (100 units)
  const searchData = await fetchYouTubeJSON("search", {
    part: "snippet",
    channelId,
    order: "viewCount",
    type: "video",
    maxResults: String(Math.min(maxToFetch, 50)),
  }, apiKey);

  const searchItems: YouTubeSearchItem[] = searchData.items || [];
  if (searchItems.length === 0) return [];

  // Collect video IDs and their publishedAt from search snippet
  const videoIds: string[] = [];
  const publishedMap = new Map<string, string>();

  for (const item of searchItems) {
    if (item.id?.videoId) {
      videoIds.push(item.id.videoId);
      publishedMap.set(item.id.videoId, item.snippet.publishedAt);
    }
  }

  // Step B: Fetch video stats + durations + snippets (1 unit per 50)
  const allStatsItems: YouTubeVideoItem[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await fetchYouTubeJSON("videos", {
      part: "statistics,contentDetails,snippet",
      id: batch.join(","),
    }, apiKey);
    allStatsItems.push(...(data.items || []));
  }

  const statsMap = new Map(allStatsItems.map((item) => [item.id, item.statistics]));
  const durationMap = new Map(allStatsItems.map((item) => [item.id, item.contentDetails?.duration || ""]));
  const snippetMap = new Map(allStatsItems.map((item) => [item.id, item.snippet]));

  // Step C: Build videos (search snippet sometimes has better data)
  for (const item of searchItems) {
    const vid = item.id?.videoId;
    if (vid && !snippetMap.has(vid) && item.snippet) {
      snippetMap.set(vid, item.snippet as any);
    }
  }

  const videos = buildVideoObjects(videoIds, publishedMap, statsMap, durationMap, snippetMap, channelInfo);

  // Already sorted by viewCount from the search, but ensure it
  videos.sort((a, b) => b.viewCount - a.viewCount);
  return videos;
}

// ── GET Handler ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId")?.trim();
  const sort = searchParams.get("sort") === "views" ? "views" : "date";
  const requestedMax = Math.min(50, Math.max(1, parseInt(searchParams.get("maxResults") || "30", 10)));
  const apiKey = searchParams.get("apiKey") || process.env.YOUTUBE_API_KEY || "";

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API key required" }, { status: 400 });
  }

  try {
    // ── Step 1: Fetch channel info (shared by both strategies) ──
    const channelData = await fetchYouTubeJSON("channels", {
      part: "statistics,snippet,contentDetails",
      id: channelId,
    }, apiKey);

    const channelItem: YouTubeChannelItem | undefined = channelData.items?.[0];
    if (!channelItem) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const channelTitle = channelItem.snippet.title;
    const channelAvatar = channelItem.snippet.thumbnails.high?.url || channelItem.snippet.thumbnails.medium?.url || channelItem.snippet.thumbnails.default?.url || "";
    const channelCreatedAt = channelItem.snippet.publishedAt;
    const subscriberCount = parseInt(channelItem.statistics.subscriberCount || "0", 10);
    const channelTotalViews = parseInt(channelItem.statistics.viewCount || "0", 10);
    const channelVideoTotalCount = parseInt(channelItem.statistics.videoCount || "0", 10);
    const uploadPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;

    const channelInfo = {
      title: channelTitle,
      id: channelId,
      subscriberCount,
      channelCreatedAt,
      channelTotalViews,
      channelVideoTotalCount,
    };

    let videos: ChannelInspectVideo[] = [];

    // ── Step 2: Fetch videos using the appropriate strategy ──
    if (sort === "views") {
      // 🎯 Top Performing: search.list with order=viewCount + channelId
      // This returns the channel's TRUE all-time most-viewed videos (not just recent ones).
      // Cost: ~102 units (channels=1 + search=100 + videos=1)
      videos = await fetchTopViaSearch(channelId, apiKey, requestedMax, channelInfo);
    } else {
      // 🕐 Latest: paginate through upload playlist (cheap)
      // Cost: ~3 units for 30 videos
      if (!uploadPlaylistId) {
        return NextResponse.json({
          channelId, channelTitle, channelAvatar, subscriberCount,
          channelVideoTotalCount, channelTotalViews, channelCreatedAt,
          sort, videos: [], count: 0,
        });
      }
      videos = await fetchLatestViaPlaylist(uploadPlaylistId, apiKey, requestedMax, channelInfo);
    }

    return NextResponse.json({
      channelId,
      channelTitle,
      channelAvatar,
      subscriberCount,
      channelVideoTotalCount,
      channelTotalViews,
      channelCreatedAt,
      sort,
      videos,
      count: videos.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch channel data", details: message },
      { status: 500 }
    );
  }
}
