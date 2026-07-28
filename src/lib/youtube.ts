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
  maxChannelAgeMonths?: number
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
        let avgViews = 0;
        let outlierMult = 1;
        if (channelTotalVideos > 1) {
          avgViews = (channelTotalViews - v.viewCount) / (channelTotalVideos - 1);
          outlierMult = avgViews > 0 ? v.viewCount / avgViews : 1;
        } else {
          avgViews = channelTotalViews;
          outlierMult = 1;
        }

        return {
          ...v,
          subscriberCount: subCount,
          channelCreatedAt: createdAt,
          channelAvgViews: avgViews,
          outlierMultiplier: outlierMult,
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

  // Step 7: Sort by view count and limit results
  videos = videos.sort((a, b) => b.viewCount - a.viewCount).slice(0, maxResults);

  return { videos, nextPageToken };
}

export function getEngagementLabel(rate: number): string {
  if (rate > 10) return "🔥 Viral";
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
