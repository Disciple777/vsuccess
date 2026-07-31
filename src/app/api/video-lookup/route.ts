import { NextRequest, NextResponse } from "next/server";
import { lookupVideo, VideoLookupError } from "@/lib/youtube";

/**
 * /api/video-lookup?input=<url-or-id>
 *
 * Resolves a full YouTube video (with stats, engagement rate, and channel
 * outlier info) from a pasted URL or video ID.
 *
 * Accepted inputs:
 *   - https://youtube.com/watch?v=<id>   (videos.list → 1 unit)
 *   - https://youtu.be/<id>              (videos.list → 1 unit)
 *   - https://youtube.com/shorts/<id>    (videos.list → 1 unit)
 *   - Bare 11-char video ID
 *
 * Cost: 2 units per lookup (videos.list + channels.list).
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input")?.trim();
  const apiKey = searchParams.get("apiKey") || process.env.YOUTUBE_API_KEY || "";

  if (!input) {
    return NextResponse.json(
      { error: "Please provide a video URL or ID (e.g. ?input=youtube.com/watch?v=abc123)" },
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
    const video = await lookupVideo(input, apiKey);
    return NextResponse.json({ video, generatedAt: new Date().toISOString() });
  } catch (error) {
    const status = error instanceof VideoLookupError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to look up video";
    return NextResponse.json({ error: message }, { status });
  }
}
