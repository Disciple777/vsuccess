<div align="center">
  <br />
  <img src="" alt="VSuccess Logo" width="80" height="80" style="border-radius: 16px;" />
  <h1 align="center">VSuccess</h1>
  <p align="center"><strong>Viral Video Ideas Finder</strong></p>
  <p align="center">
    Discover what's popping in any niche — powered by the YouTube Data API v3.
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#usage">Usage</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#tech-stack">Tech Stack</a>
  </p>
  <br />
</div>

---

## 📋 Overview

**VSuccess** is a web application that helps content creators find trending and viral videos within any niche. Enter a topic — from "fitness" to "personal finance" — and instantly discover the most popular videos, analyze their engagement metrics, and get inspired for your next hit.

Built with **Next.js 16** and **React 19**, deployed seamlessly on **Vercel**.

---

## ✨ Features

### 🔍 Smart Video Discovery
- **Niche-based search** — Search any topic (fitness, cooking, tech reviews, gaming, etc.)
- **Multiple platforms** — YouTube (primary), with TikTok & Instagram coming soon
- **Flexible time intervals** — Filter by last 24 hours, 7 days, or 30 days
- **Video type filter** — All videos, Shorts only, or Long Form only
- **Subscriber filter** — Filter by max subscriber count to find smaller channels
- **Channel age filter** — Filter by max channel age (e.g., channels less than 3 months old)
- **Load More** — Paginate through results to discover more videos

### 📊 Rich Analytics Per Video
- **View count** — Total views with human-readable formatting (1.2M, 34.5K, etc.)
- **Like count** — Hearts icon showing total likes
- **Comment count** — Message icon showing total comments
- **Engagement rate** — Percentage-based engagement score ((likes + comments) / views × 100)
- **Engagement label** — Color-coded badges (🔥 Viral, 💥 High, 📈 Good, 👍 Solid, 👀 Average)

  **How engagement rate is calculated:**

  ```
  engagementRate = ((likes + comments) / views) × 100
  ```

  For example, a video with 100,000 views, 6,000 likes, and 600 comments has an engagement rate of:
  ```
  ((6,000 + 600) / 100,000) × 100 = 6.6% → 💥 High
  ```

  **Threshold chart:**

  | Badge | Rate | Meaning |
  |-------|------|---------|
  | 🔥 **Viral** | > 10% | Insane engagement — the video is truly popping off relative to its views |
  | 💥 **High** | > 5% | Really strong engagement — people are loving it |
  | 📈 **Good** | > 2% | Solid engagement, well above average |
  | 👍 **Solid** | > 1% | Decent engagement, around the YouTube average |
  | 👀 **Average** | ≤ 1% | Standard engagement, nothing unusual |

- **Total stats bar** — Aggregate view count across all returned videos

### 🎬 In-App Video Player
- **Fullscreen modal** — Click any video thumbnail to play it inside the platform
- **Escape key** — Close the player with the Escape key
- **Body scroll lock** — Prevents background scrolling while watching
- **Stats overlay** — View count, likes, comments, and engagement rate shown during playback
- **Direct YouTube link** — "Watch on YouTube" button to open in a new tab

### 🎨 Beautiful UI/UX
- **Dark theme** — Premium dark mode design with glassmorphism effects
- **Gradient orbs** — Animated background gradients for visual depth
- **Smooth animations** — Fade-in, scale, and slide animations throughout
- **Shimmer loading** — Skeleton loading states while fetching results
- **Responsive grid** — Adapts from 1 column (mobile) to 4 columns (desktop)
- **Quick niche pills** — One-click example niches for instant exploration
- **Rank badges** — Numbered badges on each video card
- **Hover effects** — Card lifts, overlay play button, thumbnail zoom
- **Error handling** — Clear error messages with helpful context

### 🔐 API Key Management
- **Environment variable** — Set `YOUTUBE_API_KEY` in `.env.local` for server-side use
- **Inline API key input** — Toggleable API key field for quick testing
- **Secure** — API key is sent server-side, never exposed to the client

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **YouTube Data API v3 Key** — [Get one from Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vsuccess-finder.git
   cd vsuccess-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your YouTube API key:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   npm run dev -- -p 3001
   ```

5. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🎯 Usage

### Basic Search
1. Enter a niche in the search bar (e.g., "fitness", "cooking", "tech reviews")
2. Click "Find Videos" or press Enter
3. Browse the results sorted by view count

### Advanced Filters

| Filter | Options | Description |
|--------|---------|-------------|
| **Platform** | YouTube, TikTok*, Instagram* | Select which platform to search |
| **Interval** | 24h, 7d, 30d | Time range for published videos |
| **Video Type** | All, Shorts, Long Form | Filter by video duration |
| **Max Subs** | Any number | Max channel subscriber count (find smaller channels) |
| **Max Age** | Any number (months) | Max channel age (find newer channels) |

*\*TikTok & Instagram coming soon*

### Discovering Rising Creators
Combine **Max Subs** and **Max Age** filters to find viral videos from small, new channels:

```
Max Subs: 10,000  |  Max Age: 3 months
```

This surfaces videos from channels with under 10K subscribers that were created in the last 3 months — perfect for spotting rising talent before they blow up!

### Playing Videos
- Click any video **thumbnail** to open the fullscreen in-app player
- Click the **"Watch"** button (or the **"YouTube"** button in the player) to open the video on YouTube
- Press **Escape** or click outside the video to close the player

### Loading More Results
- After the initial search, click **"Load More Videos"** at the bottom of the results
- Continue loading until you've exhausted all available results

---

## ⚙️ API Reference

### `GET /api/videos`

Fetches trending videos for a given niche.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `niche` | string | ✅ | — | The niche/topic to search for |
| `interval` | string | ❌ | `"7d"` | Time range: `"24h"`, `"7d"`, or `"30d"` |
| `videoType` | string | ❌ | `"all"` | Video type: `"all"`, `"short"`, or `"long"` |
| `platform` | string | ❌ | `"youtube"` | Platform: `"youtube"` |
| `apiKey` | string | ❌* | — | Override the server-side API key |
| `pageToken` | string | ❌ | — | Pagination token for loading more results |
| `subscriberLimit` | number | ❌ | — | Max channel subscriber count |
| `maxChannelAge` | number | ❌ | — | Max channel age in months |

*\*Only required if `YOUTUBE_API_KEY` is not set in environment variables*

**Response:**
```json
{
  "niche": "fitness",
  "interval": "7d",
  "videoType": "all",
  "count": 20,
  "videos": [
    {
      "id": "abc123",
      "title": "Video Title",
      "description": "Video description...",
      "thumbnail": "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
      "channelTitle": "Channel Name",
      "channelId": "UC...",
      "publishedAt": "2026-07-20T12:00:00Z",
      "viewCount": 1500000,
      "likeCount": 85000,
      "commentCount": 3200,
      "engagementRate": 5.88,
      "url": "https://www.youtube.com/watch?v=abc123",
      "subscriberCount": 2500000,
      "channelCreatedAt": "2020-03-15T10:30:00Z"
    }
  ],
  "nextPageToken": "CBQQAA",
  "generatedAt": "2026-07-25T15:30:00Z"
}
```

---

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **[Next.js 16](https://nextjs.org/)** | React framework with App Router & API routes |
| **[React 19](https://react.dev/)** | UI library |
| **[TypeScript](https://www.typescriptlang.org/)** | Type safety |
| **[Tailwind CSS v4](https://tailwindcss.com/)** | Styling |
| **[Lucide React](https://lucide.dev/)** | Icon library |
| **[YouTube Data API v3](https://developers.google.com/youtube/v3)** | Video data source |
| **[Vercel](https://vercel.com/)** | Deployment & hosting |

---

## 🚢 Deployment

VSuccess is designed for effortless deployment on **Vercel** (free tier).

### Deploy to Vercel

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com) and log in with GitHub
   - Click **Add New → Project**
   - Select your `vsuccess-finder` repository
   - Vercel auto-detects Next.js — no configuration needed

3. **Add environment variable**
   - Add `YOUTUBE_API_KEY` with your YouTube Data API v3 key
   - Enable for **Production**, **Preview**, and **Development**

4. **Deploy**
   - Click **Deploy**
   - Your app is live at `https://vsuccess-finder.vercel.app`

### Custom Domain (Optional)

1. In your Vercel project dashboard, go to **Settings → Domains**
2. Add your custom domain or subdomain (e.g., `vsuccess.yourdomain.com`)
3. Follow Vercel's DNS configuration instructions

### YouTube API Quota

The YouTube Data API v3 has a **free daily quota of 10,000 units**:

| Request | Cost per call |
|---------|--------------|
| `search.list` | 100 units |
| `videos.list` | 1 unit |
| `channels.list` | 1 unit |

Each full search costs **~102 units** (1 search + 1 stats + 1 channel info), allowing approximately **98 searches per day** on the free tier.

For higher limits, request a quota increase through [Google Cloud Console](https://console.cloud.google.com/).

---

## 🗺️ Roadmap

- [x] YouTube video search with filters
- [x] Video analytics (views, likes, comments, engagement rate)
- [x] Shorts / Long Form filtering
- [x] In-app video player (fullscreen modal)
- [x] Channel subscriber filtering
- [x] Channel age filtering
- [x] Load More pagination
- [ ] TikTok integration
- [ ] Instagram integration
- [ ] AI-powered viral trend analysis
- [ ] Personalized idea generation
- [ ] Save & compare niches
- [ ] Historical trend tracking

---

## 📄 License

This project is for personal and educational use. YouTube Data API v3 usage is subject to [Google's Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service).

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/yourusername">@yourusername</a></p>
  <p>
    <a href="https://vercel.com">Powered by Vercel</a> •
    <a href="https://developers.google.com/youtube/v3">YouTube Data API v3</a> •
    <a href="https://nextjs.org">Next.js</a>
  </p>
</div>
