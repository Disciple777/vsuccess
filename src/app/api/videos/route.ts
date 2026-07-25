import { NextRequest, NextResponse } from "next/server";
import { searchViralVideos } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche")?.trim();
  const interval = searchParams.get("interval") || "7d";
  const videoType = searchParams.get("videoType") || "all";
  const apiKey = searchParams.get("apiKey") || process.env.YOUTUBE_API_KEY || "";
  const pageToken = searchParams.get("pageToken") || undefined;
  const subscriberLimitParam = searchParams.get("subscriberLimit");
  const subscriberLimit = subscriberLimitParam ? parseInt(subscriberLimitParam, 10) : undefined;
  const maxChannelAgeParam = searchParams.get("maxChannelAge");
  const maxChannelAgeMonths = maxChannelAgeParam ? parseInt(maxChannelAgeParam, 10) : undefined;

  if (!niche) {
    return NextResponse.json(
      { error: "Please provide a niche (e.g., ?niche=fitness)" },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "YouTube API key required",
        message: "Set YOUTUBE_API_KEY in your .env.local file or pass it as ?apiKey=YOUR_KEY",
      },
      { status: 400 }
    );
  }

  try {
    const result = await searchViralVideos(niche, interval, 20, apiKey, videoType, pageToken, subscriberLimit, maxChannelAgeMonths);
    return NextResponse.json({
      niche,
      interval,
      videoType,
      count: result.videos.length,
      videos: result.videos,
      nextPageToken: result.nextPageToken,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch videos", details: message },
      { status: 500 }
    );
  }
}
