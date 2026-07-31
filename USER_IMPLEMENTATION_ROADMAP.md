# 👤 VSuccess — User Implementation Roadmap

> **Goal**: Add user accounts, tiered access (free/paid), bookmarks, collections, and followed channels using the existing shared database on Hostinger.

---

## 🧠 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Auth method** | Token-based (PHP sessions via cookies) | Reusing existing `auth_tokens` table + PHP session management |
| **Auth flow** | Next.js API routes → PHP → MySQL | PHP is the bridge to Hostinger's MySQL (no direct external DB access) |
| **Tier limit type** | Soft limit | Show upgrade banner after 5 searches/week, don't block |
| **Free tier** | 5 searches per week | Tracked via `search_queries` table |
| **Paid tier** | Unlimited | Payment integration planned later (Stripe/PayPal) |
| **Existing DB reuse** | Full reuse of `users` + `auth_tokens` tables | Shared user base across apps — add `tier` column to `users` |

---

## 🗄️ Database: Existing Tables (Reused)

These tables already exist in `u480328775_bits` and will be reused **as-is** or with minor modifications:

### `users` — Already exists ✅

```sql
CREATE TABLE `users` (
  `id`              BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`           VARCHAR(190) NOT NULL,
  `password_hash`   VARCHAR(255) NOT NULL,
  `home_board_id`   BIGINT(20) UNSIGNED DEFAULT NULL,
  `created_at`      TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at`      TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
);
```

**⚠️ Needed change**: Add `vsuccess_tier` column:
```sql
ALTER TABLE `users`
  ADD COLUMN `vsuccess_tier` ENUM('free','paid') NOT NULL DEFAULT 'free' AFTER `home_board_id`,
  ADD COLUMN `name` VARCHAR(100) DEFAULT NULL AFTER `email`;
```

### `auth_tokens` — Already exists ✅

```sql
CREATE TABLE `auth_tokens` (
  `id`          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT(20) UNSIGNED NOT NULL,
  `token`       CHAR(64) NOT NULL,
  `expires_at`  DATETIME NOT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `fk_auth_tokens_user` (`user_id`),
  CONSTRAINT `fk_auth_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

Used for session management — PHP will create/validate tokens stored as cookies.

---

## 🗄️ Database: New Tables (Need to Create)

### `search_queries` — Free tier quota tracking

```sql
CREATE TABLE `search_queries` (
  `id`          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT(20) UNSIGNED NOT NULL,
  `niche`       VARCHAR(180) NOT NULL,
  `searched_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_search_queries_user_week` (`user_id`, `searched_at`),
  CONSTRAINT `fk_search_queries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

### `bookmarks` — Saved videos

```sql
CREATE TABLE `bookmarks` (
  `id`             BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        BIGINT(20) UNSIGNED NOT NULL,
  `video_id`       VARCHAR(30) NOT NULL,
  `video_title`    VARCHAR(255) NOT NULL,
  `channel_title`  VARCHAR(255) NOT NULL,
  `channel_id`     VARCHAR(50) DEFAULT NULL,
  `thumbnail_url`  VARCHAR(500) DEFAULT NULL,
  `view_count`     BIGINT(20) UNSIGNED DEFAULT 0,
  `notes`          TEXT DEFAULT NULL,
  `saved_at`       TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_video` (`user_id`, `video_id`),
  CONSTRAINT `fk_bookmarks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

### `collections` — Groups of bookmarks

```sql
CREATE TABLE `collections` (
  `id`          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT(20) UNSIGNED NOT NULL,
  `name`        VARCHAR(160) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at`  TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_collections_user` (`user_id`),
  CONSTRAINT `fk_collections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

### `collection_items` — Videos inside collections

```sql
CREATE TABLE `collection_items` (
  `id`            BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT(20) UNSIGNED NOT NULL,
  `bookmark_id`   BIGINT(20) UNSIGNED NOT NULL,
  `position`      INT(11) NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_collection_bookmark` (`collection_id`, `bookmark_id`),
  KEY `fk_collection_items_bookmark` (`bookmark_id`),
  CONSTRAINT `fk_collection_items_collection` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_collection_items_bookmark` FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks` (`id`) ON DELETE CASCADE
);
```

### `followed_channels` — Watch channels

```sql
CREATE TABLE `followed_channels` (
  `id`              BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`         BIGINT(20) UNSIGNED NOT NULL,
  `channel_id`      VARCHAR(50) NOT NULL,
  `channel_title`   VARCHAR(255) NOT NULL,
  `channel_avatar`  VARCHAR(500) DEFAULT NULL,
  `followed_at`     TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_channel` (`user_id`, `channel_id`),
  CONSTRAINT `fk_followed_channels_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

---

## 🚧 Implementation Phases

### Phase 1: PHP Auth Backend + DB Schema ✅ (Completed)

**Goal**: Set up the PHP API layer on Hostinger with auth endpoints and create new VSuccess tables.

- [x] Add `tier` and `name` columns to existing `users` table — ✅ SQL in `database/vsuccess_migration.sql`
- [x] Create all new VSuccess tables — ✅ `search_queries`, `bookmarks`, `collections`, `collection_items`, `followed_channels`
- [x] Create PHP `db.php` — PDO singleton with config.php / env fallback
- [x] Create PHP `helpers.php` — CORS, JSON, password hashing, token management with auto-cleanup
- [x] Create PHP endpoint: `POST /signup.php` — Register new user
- [x] Create PHP endpoint: `POST /login.php` — Authenticate → return token
- [x] Create PHP endpoint: `POST /logout.php` — Invalidate token
- [x] Create PHP endpoint: `GET /me.php` — Get current user info + tier
- [x] Create `php/config.example.php` — Template for DB credentials (copy → fill → gitignored)
- [ ] **User action**: Run `database/vsuccess_migration.sql` on Hostinger phpMyAdmin
- [ ] **User action**: Copy `php/config.example.php` → `php/config.php` → fill in real DB credentials
- [ ] **User action**: Upload all `php/` files to `https://guatermelon.com/vsuccess/php/`
- [ ] **User action**: Test endpoints with curl or Postman

### Phase 2: Next.js Auth Frontend ✅ (Completed)

**Goal**: Build the login/signup UI in Next.js and wire it to the PHP backend — zero external dependencies.

- [x] Create `src/lib/api.ts` — Centralized PHP API client (native fetch + localStorage, zero npm deps)
- [x] Create `src/context/AuthContext.tsx` — Auth state provider (user, tier, login/logout, auto-restore)
- [x] Create `src/app/auth/login/page.tsx` — Login page with email + password form
- [x] Create `src/app/auth/signup/page.tsx` — Signup page with name, email, password, confirm
- [x] Create `src/components/AuthGuard.tsx` — Protected route wrapper (redirects to login)
- [x] Update `src/app/layout.tsx` — Wrap root with AuthProvider
- [x] Update `src/app/page.tsx` — Add user avatar/menu in header, Sign in / Sign out buttons
- [x] Update `.env.example` — Add `NEXT_PUBLIC_PHP_API_URL`
- [ ] **User action**: Set `NEXT_PUBLIC_PHP_API_URL` in `.env.local`

### Phase 3: Tier Tracking + Upgrade Banner ✅ (Completed)

**Goal**: Track free tier searches and show upgrade prompts.

- [x] Create PHP endpoint: `POST /log_usage.php` — Log a search query
- [x] Create PHP endpoint: `GET /check_usage.php` — Get remaining searches this week
- [x] Create Next.js hook: `useSearchQuota()` — Checks remaining + auto-logs after search
- [x] Inject quota check into `page.tsx` search flow
- [x] Build upgrade banner component (dismissible, shows remaining count + upgrade CTA)
- [x] Style banner with gradient/glassmorphism to match existing theme
- [x] Comment out API Key button (key is set in `.env.local`)

**PHP Endpoints:**
```
GET  /check_usage.php  ← Token required → { remaining, total, tier }
POST /log_usage.php    ← Token required → { niche: "..." } → logs search
```

**Files added:**
| File | Purpose |
|------|---------|
| `php/check_usage.php` | Weekly quota checker (Mon–Sun, free vs paid) |
| `php/log_usage.php` | Logs a search query to `search_queries` table |
| `src/hooks/useSearchQuota.ts` | React hook managing quota state + auto-logging |
| `src/components/UpgradeBanner.tsx` | Dismissible upgrade prompt banner |

**Integration:** `page.tsx` calls `quotaTrackSearch(niche)` after every successful search, and renders `UpgradeBanner` at the top of results when the quota is exhausted.

### Phase 4: Bookmarks ✅ (Completed)

**Goal**: Allow users to save/bookmark videos and view them later.

- [x] Create PHP endpoint: `POST /bookmark_save.php` — Save a bookmark (with duplicate check, returns 409)
- [x] Create PHP endpoint: `POST /bookmark_delete.php` — Remove bookmark (by video_id, ownership enforced via user_id)
- [x] Create PHP endpoint: `GET /bookmark_list.php` — List user's bookmarks (paginated, newest first)
- [x] Create PHP endpoint: `GET /bookmark_check.php?video_ids=id1,id2` — Bulk check which IDs are bookmarked (max 50)
- [x] Add `BookmarkButton.tsx` — Heart toggle with optimistic UI, auth redirect, sync animation
- [x] Update `VideoCard.tsx` — Bookmarks button on every video card with initialBoomarked prop
- [x] Create `src/app/bookmarks/page.tsx` — Full bookmarks grid page with AuthGuard
- [x] Update `page.tsx` — Bookmarks link in header (logged in), bulk check after search, bookmarked IDs state

### Phase 5: Collections ✅ (Completed)

**Goal**: Let users organize bookmarks into named collections.

- [x] Create PHP endpoint: `POST /collection_create.php` — Create collection (ownership check)
- [x] Create PHP endpoint: `GET /collection_list.php` — List collections with item counts (LEFT JOIN)
- [x] Create PHP endpoint: `POST /collection_update.php` — Update name/description (dynamic SET, ownership check)
- [x] Create PHP endpoint: `POST /collection_delete.php` — Delete collection (ownership check, Cascade)
- [x] Create PHP endpoint: `POST /collection_add_item.php` — Add bookmark to collection (verifies both ownerships, duplicate check, auto-position)
- [x] Create PHP endpoint: `POST /collection_remove_item.php` — Remove bookmark from collection (JOIN through collections for ownership)
- [x] Create PHP endpoint: `GET /collection_detail.php?collection_id=ID` — Get collection with items
- [x] Add collection API functions to `src/lib/api.ts` (7 functions)
- [x] Create `src/components/CollectionPicker.tsx` — Modal picker with create-new-inline
- [x] Create `src/app/collections/page.tsx` — Grid of collections with inline create/edit/delete
- [x] Create `src/app/collections/[id]/page.tsx` — Detail page with items grid, remove items
- [x] Update `BookmarkButton.tsx` — After bookmark, show folder icon → opens picker
- [x] Update bookmarks page — FolderPlus button on each card → opens picker
- [x] Update `page.tsx` header — Add Collections link for logged-in users
- [x] Fix cursor-pointer on bookmark heart button

### Phase 6: Followed Channels ✅ (Completed)

**Goal**: Let users follow YouTube channels and see their recent videos.

- [x] Create PHP endpoint: `POST /follow_channel.php` — Follow a channel (duplicate check, ownership enforced via user_id)
- [x] Create PHP endpoint: `POST /unfollow_channel.php` — Unfollow (by channel_id, ownership enforced)
- [x] Create PHP endpoint: `GET /list_followed_channels.php` — List followed channels (newest first)
- [x] Add `FollowButton.tsx` — Follow/unfollow toggle with optimistic UI, auth redirect, size variants (xs/sm)
- [x] Update `VideoCard.tsx` — Follow button next to channel name (xs size, right-aligned)
- [x] Create Next.js API route: `GET /api/channel-videos?channelId=UC...&maxResults=5` — Fetches latest videos from a YouTube channel (search.list + videos.list)
- [x] Create `src/app/following/page.tsx` — Following/feed page with channel cards (expand/collapse), latest videos per channel, unfollow, empty state
- [x] Update `page.tsx` header — Add Following link (Heart icon, blue hover) for logged-in users
- [x] **Extension: Channel Lookup (paste URL/@handle)** — `GET /api/channel-lookup?input=...` resolves a channel from a pasted URL or @handle (channels.list, 1–2 units); "Find a channel" box on `/following` with result card (avatar, name, @handle, subs/videos/views) + Follow button + Inspect link
  - Supported inputs: `/channel/UC...`, `@handle`, `/watch?v=` and `/shorts/` and `youtu.be` video links (resolves the video's channel), bare `@handle` / channel ID / single-token handle
  - Legacy `youtube.com/c/...` URLs not resolvable via API → friendly error suggesting the @handle
  - Cost: **1 unit** per handle/ID lookup, **2 units** for video links → ~10k lookups/day on free tier
- [x] **Extension: Video Lookup (paste video URL/ID)** — `GET /api/video-lookup?input=...` resolves a full `YouTubeVideo` (with stats, engagement rate, and channel outlier info) from a pasted URL or ID (`videos.list` + `channels.list` = 2 units); reusable `VideoLookup` bar on `/bookmarks`, `/collections`, and `/collections/[id]` — renders the same `VideoCard` as the main page (bookmark ❤️ + collection folder), and on the collection detail page a quick **Add to this collection** button that bookmarks first then adds
  - Supported inputs: `/watch?v=`, `/shorts/`, `youtu.be`, bare 11-char video ID
  - Cost: **2 units** per lookup → ~5k lookups/day on free tier

### Phase 7: Payment Integration ⬜ (Not started)

**Goal**: Accept payments for unlimited tier.

- [ ] Choose payment provider (Stripe or PayPal)
- [ ] Create PHP endpoint: `POST /api/payments/create-checkout` — Create checkout session
- [ ] Create PHP endpoint: `POST /api/payments/webhook` — Handle payment confirmation
- [ ] Create PHP endpoint: `POST /api/users/upgrade` — Upgrade user tier
- [ ] Create PHP endpoint: `POST /api/users/downgrade` — Downgrade user tier (at end of billing period)
- [ ] Add pricing page
- [ ] Add upgrade button in banner and user settings
- [ ] Test: complete payment → user upgraded → unlimited searches

---

## 📊 System Architecture

```
Browser (Next.js Frontend)
    │
    │ Cookies (auth_token)
    ▼
Next.js API Routes   ────►   PHP API (Hostinger)   ────►   MySQL (Hostinger)
(src/app/api/*)               (/api/*.php)                    (u480328775_bits)
    │                              │
    │ Forward cookies              │ Existing: users, auth_tokens
    │ via fetch()                  │ New: search_queries, bookmarks,
    │                              │      collections, collection_items,
    │                              │      followed_channels
```

### Auth Flow

```
1. User submits login form → Next.js → POST /api/auth/login → PHP
2. PHP validates email + password_hash → creates auth_tokens row → returns token
3. Next.js stores token in httpOnly cookie (or localStorage)
4. On subsequent requests, Next.js forwards cookie → PHP validates token → returns user data
5. On logout, Next.js calls POST /api/auth/logout → PHP invalidates token

Signup follows the same flow but creates a new users row first.
```

### Tier Check Flow

```
1. User submits a search → Next.js API route called
2. Next.js API calls PHP GET /api/usage/remaining with user's cookie
3. PHP counts search_queries rows for this user in current week (Mon-Sun)
4. PHP returns: { remaining: 3, total: 5, tier: "free" }
5. Next.js search proceeds normally
6. After search, Next.js calls PHP POST /api/usage/log to record the query
7. If remaining was 0 → show upgrade banner (soft limit — search still works)
```

---

## 🔧 Tech Details

### PHP File Structure (Hostinger)

```
/api/
├── db.php                ← DB connection (PDO singleton)
├── auth.php              ← Token helpers (create_token, validate_token, hash_password)
├── auth/
│   ├── signup.php        ← POST — Register
│   ├── login.php         ← POST — Login
│   ├── logout.php        ← POST — Logout
│   └── me.php            ← GET — Current user
├── usage/
│   ├── log.php           ← POST — Record search
│   └── remaining.php     ← GET — Check quota
├── bookmarks/
│   ├── index.php         ← GET — List / POST — Create
│   ├── delete.php        ← DELETE — Remove
│   └── check.php         ← GET — Check if bookmarked
├── collections/
│   ├── index.php         ← GET — List / POST — Create
│   ├── update.php        ← PUT — Edit
│   └── delete.php        ← DELETE — Remove
│   └── items/
│       ├── index.php     ← POST — Add item
│       └── delete.php    ← DELETE — Remove item
└── followed-channels/
    ├── index.php         ← GET — List / POST — Follow
    └── delete.php        ← DELETE — Unfollow
```

### Next.js File Structure

```
src/
├── lib/
│   ├── youtube.ts        ← Existing YouTube API logic
│   └── api.ts            ← NEW: PHP API client (fetch wrapper with cookie handling)
├── context/
│   └── AuthContext.tsx   ← NEW: Auth state provider
├── hooks/
│   └── useSearchQuota.ts ← NEW: Quota check hook
├── components/
│   ├── VideoCard.tsx     ← Existing (add bookmark button)
│   ├── UpgradeBanner.tsx ← NEW: Upgrade prompt banner
│   ├── BookmarkButton.tsx← NEW: Save/unsave toggle
│   └── CollectionPicker.tsx ← NEW: Modal to pick collection
├── app/
│   ├── auth/
│   │   ├── login/page.tsx    ← NEW
│   │   └── signup/page.tsx   ← NEW
│   ├── bookmarks/page.tsx    ← NEW
│   ├── collections/
│   │   ├── page.tsx          ← NEW
│   │   └── [id]/page.tsx     ← NEW
│   ├── following/page.tsx    ← NEW
│   └── page.tsx              ← Existing (add auth check + quota)
```

---

## ✅ Progress Tracker

| Phase | Status |
|-------|--------|
| **Phase 1: PHP Auth Backend + DB Schema** | ✅ Completed |
| **Phase 2: Next.js Auth Frontend** | ✅ Completed |
| **Phase 3: Tier Tracking + Upgrade Banner** | ✅ Completed |
| **Phase 4: Bookmarks** | ✅ Completed |
| **Phase 5: Collections** | ✅ Completed |
| **Phase 6: Followed Channels** | ✅ Completed |
| **Phase 7: Payment Integration** | ⬜ Not started |

---

## 📝 Notes

- The existing `auth_tokens` table uses `CHAR(64)` tokens with expiration — perfect for our session-based auth approach
- All new tables follow the existing schema conventions (BIGINT UNSIGNED PKs, utf8mb4_unicode_ci, TIMESTAMP defaults, CASCADE deletes)
- PHP API files should mirror the existing routing pattern already in place on Hostinger
- When Phase 3 is implemented, the search flow in `src/app/api/videos/route.ts` will need modification to include quota checking
