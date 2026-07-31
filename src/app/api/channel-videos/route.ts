import { NextRequest, NextResponse } from "next/server";

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
}

export interface ChannelVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
  url: string;
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId")?.trim();
  const maxResults = parseInt(searchParams.get("maxResults") || "5", 10);
  const apiKey =
    searchParams.get("apiKey") || process.env.YOUTUBE_API_KEY || "";

  if (!channelId) {
    return NextResponse.json(
      { error: "Please provide a channelId (e.g., ?channelId=UC...)" },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API key required" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Search for latest videos from this channel
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("channelId", channelId);
    searchUrl.searchParams.set("order", "date");
    searchUrl.searchParams.set("maxResults", String(Math.min(maxResults, 10)));
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("key", apiKey);

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!searchRes.ok) {
      const error = await searchRes.text();
      throw new Error(`YouTube API error (${searchRes.status}): ${error}`);
    }

    const searchData = await searchRes.json();
    const searchItems: YouTubeSearchItem[] = searchData.items || [];

    if (searchItems.length === 0) {
      return NextResponse.json({
        channelId,
        videos: [],
        count: 0,
      });
    }

    // Step 2: Fetch statistics for each video
    const videoIds = searchItems.map((item) => item.id.videoId).filter(Boolean);

    const statsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    statsUrl.searchParams.set("part", "statistics");
    statsUrl.searchParams.set("id", videoIds.join(","));
    statsUrl.searchParams.set("key", apiKey);

    const statsRes = await fetch(statsUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!statsRes.ok) {
      const error = await statsRes.text();
      throw new Error(`YouTube API error (${statsRes.status}): ${error}`);
    }

    const statsData = await statsRes.json();
    const statsItems: YouTubeVideoItem[] = statsData.items || [];
    const statsMap = new Map(
      statsItems.map((item) => [item.id, item.statistics])
    );

    // Step 3: Build videos array
    const videos: ChannelVideo[] = searchItems.map((item) => {
      const stats = statsMap.get(item.id.videoId);
      const viewCount = parseInt(stats?.viewCount || "0", 10);
      const likeCount = parseInt(stats?.likeCount || "0", 10);
      const commentCount = parseInt(stats?.commentCount || "0", 10);

      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url ||
          "",
        publishedAt: item.snippet.publishedAt,
        viewCount,
        likeCount,
        commentCount,
        engagementRate:
          viewCount > 0
            ? ((likeCount + commentCount) / viewCount) * 100
            : 0,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    });

    return NextResponse.json({
      channelId,
      videos,
      count: videos.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch channel videos", details: message },
      { status: 500 }
    );
  }
}
