import { NextRequest, NextResponse } from "next/server";
import { lookupChannel, ChannelLookupError } from "@/lib/youtube";

/**
 * /api/channel-lookup?input=<url-or-handle>
 *
 * Resolves a YouTube channel from a pasted URL, @handle, or channel ID.
 *
 * Accepted inputs:
 *   - https://youtube.com/channel/UC...   (channels.list by id  → 1 unit)
 *   - https://youtube.com/@handle         (channels.list forHandle → 1 unit)
 *   - https://youtube.com/watch?v=...     (video → channel: videos.list + channels.list → 2 units)
 *   - https://youtube.com/shorts/<id>     (video → channel → 2 units)
 *   - @handle / bare handle / bare UC... ID
 *
 * Cost: 1–2 YouTube API units per lookup.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input")?.trim();
  const apiKey = searchParams.get("apiKey") || process.env.YOUTUBE_API_KEY || "";

  if (!input) {
    return NextResponse.json(
      { error: "Please provide a channel URL or handle (e.g. ?input=@MrBeast)" },
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
    const channel = await lookupChannel(input, apiKey);
    return NextResponse.json({ channel, generatedAt: new Date().toISOString() });
  } catch (error) {
    const status = error instanceof ChannelLookupError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to look up channel";
    return NextResponse.json({ error: message }, { status });
  }
}
