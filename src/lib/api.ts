/**
 * api.ts — VSuccess PHP API client
 *
 * Thin wrapper around the native fetch API. No external packages required.
 *
 * Token flow:
 *   1. Login/signup → PHP returns a token → stored in localStorage
 *   2. On every API call → token sent as Authorization: Bearer header
 *   3. On page load → check localStorage → validate via me.php
 *   4. On logout → call logout.php → clear localStorage
 */

const PHP_BASE = (process.env.NEXT_PUBLIC_PHP_API_URL || "https://guatermelon.com/vsuccess/php").replace(/\/+$/, "");

// ── Token helpers ──────────────────────────────────────

const STORAGE_KEY = "vsuccess_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Response types ─────────────────────────────────────

export interface PhpUser {
  id: number;
  email: string;
  name: string | null;
  tier: "free" | "paid";
  created_at: string;
}

interface PhpSuccessResponse<T> {
  success: true;
  data?: T;
  user?: PhpUser;
  token?: string;
  message?: string;
}

interface PhpErrorResponse {
  success: false;
  error: string;
}

type PhpResponse<T = unknown> = PhpSuccessResponse<T> | PhpErrorResponse;

// ── Generic fetch ──────────────────────────────────────

async function phpFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PhpResponse<T>> {
  const url = `${PHP_BASE}/${endpoint.replace(/^\//, "")}`;

  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    return { success: false, error: data.error || `Request failed (${res.status})` };
  }

  return data;
}

// ── Usage / Quota endpoints ────────────────────────────

export interface UsageInfo {
  remaining: number;
  total: number;
  tier: "free" | "paid";
}

/**
 * Check how many free searches the current user has remaining this week.
 * Returns null if not authenticated or the request fails.
 */
export async function checkRemainingSearches(): Promise<UsageInfo | null> {
  const res = await phpFetch<UsageInfo>("check_usage.php");
  if (!res.success || !res.data) return null;
  return res.data;
}

/**
 * Log a search query for the current user (free tier quota tracking).
 * Silently fails — best-effort tracking.
 */
export async function logSearchUsage(niche: string): Promise<void> {
  try {
    await phpFetch("log_usage.php", {
      method: "POST",
      body: JSON.stringify({ niche }),
    });
  } catch {
    // Best-effort
  }
}

// ── Collection types ──────────────────────────────────

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
}

export interface CollectionDetail extends Collection {
  // Uses the same fields from PHP
}

export interface CollectionItem {
  item_id: number;
  bookmark_id: number;
  position: number;
  added_at: string;
  video_id: string;
  video_title: string;
  channel_title: string;
  channel_id: string | null;
  thumbnail_url: string | null;
  view_count: number;
  saved_at: string;
}

export interface CollectionListData {
  collections: Collection[];
}

export interface CollectionDetailData {
  collection: Collection;
  items: CollectionItem[];
  total: number;
}

// ── Collection endpoints ──────────────────────────────

/**
 * Create a new collection.
 */
export async function createCollection(
  name: string,
  description?: string
): Promise<Collection> {
  const res = await phpFetch<{ collection: Collection }>("collection_create.php", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });

  if (!res.success || !res.data) {
    throw new Error("Failed to create collection");
  }

  return res.data.collection;
}

/**
 * List all collections for the current user.
 */
export async function listCollections(): Promise<Collection[]> {
  const res = await phpFetch<CollectionListData>("collection_list.php");

  if (!res.success || !res.data) return [];
  return res.data.collections;
}

/**
 * Get a single collection with all its items.
 */
export async function getCollectionDetail(
  collectionId: number
): Promise<CollectionDetailData | null> {
  const res = await phpFetch<CollectionDetailData>(
    `collection_detail.php?collection_id=${collectionId}`
  );

  if (!res.success || !res.data) return null;
  return res.data;
}

/**
 * Update collection name/description.
 */
export async function updateCollection(
  collectionId: number,
  name: string,
  description?: string
): Promise<Collection> {
  const res = await phpFetch<{ collection: Collection }>("collection_update.php", {
    method: "POST",
    body: JSON.stringify({ collection_id: collectionId, name, description }),
  });

  if (!res.success || !res.data) {
    throw new Error("Failed to update collection");
  }

  return res.data.collection;
}

/**
 * Delete a collection.
 */
export async function deleteCollection(collectionId: number): Promise<void> {
  const res = await phpFetch("collection_delete.php", {
    method: "POST",
    body: JSON.stringify({ collection_id: collectionId }),
  });

  if (!res.success) {
    throw new Error("Failed to delete collection");
  }
}

/**
 * Add a bookmark to a collection.
 */
export async function addToCollection(
  collectionId: number,
  bookmarkId: number
): Promise<void> {
  const res = await phpFetch("collection_add_item.php", {
    method: "POST",
    body: JSON.stringify({
      collection_id: collectionId,
      bookmark_id: bookmarkId,
    }),
  });

  if (!res.success) {
    throw new Error(res.error || "Failed to add to collection");
  }
}

/**
 * Remove a bookmark from a collection.
 */
export async function removeFromCollection(
  collectionId: number,
  bookmarkId: number
): Promise<void> {
  const res = await phpFetch("collection_remove_item.php", {
    method: "POST",
    body: JSON.stringify({
      collection_id: collectionId,
      bookmark_id: bookmarkId,
    }),
  });

  if (!res.success) {
    throw new Error("Failed to remove from collection");
  }
}

// ── Bookmark types ─────────────────────────────────────

export interface Bookmark {
  id: number;
  video_id: string;
  video_title: string;
  channel_title: string;
  channel_id: string | null;
  thumbnail_url: string | null;
  view_count: number;
  saved_at: string;
}

export interface BookmarkListData {
  bookmarks: Bookmark[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface BookmarkCheckData {
  bookmarked_ids: string[];
}

// ── Bookmark endpoints ────────────────────────────────

/**
 * Save a bookmark for the current user.
 * Returns the bookmark ID on success.
 */
export async function saveBookmark(video: {
  video_id: string;
  video_title: string;
  channel_title: string;
  channel_id?: string;
  thumbnail_url?: string;
  view_count: number;
}): Promise<number> {
  const res = await phpFetch<{ bookmark: { id: number } }>("bookmark_save.php", {
    method: "POST",
    body: JSON.stringify(video),
  });

  if (!res.success) {
    throw new Error(res.error || "Failed to save bookmark");
  }

  if (!res.data) {
    throw new Error("Failed to save bookmark");
  }

  return res.data.bookmark.id;
}

/**
 * Remove a bookmark by video_id.
 */
export async function deleteBookmark(videoId: string): Promise<void> {
  const res = await phpFetch("bookmark_delete.php", {
    method: "POST",
    body: JSON.stringify({ video_id: videoId }),
  });

  if (!res.success) {
    throw new Error(res.error || "Failed to remove bookmark");
  }
}

/**
 * List the current user's bookmarks (paginated).
 */
export async function listBookmarks(page = 1, perPage = 20): Promise<BookmarkListData | null> {
  const res = await phpFetch<BookmarkListData>(
    `bookmark_list.php?page=${page}&per_page=${perPage}`
  );

  if (!res.success || !res.data) return null;
  return res.data;
}

/**
 * Check which of the given YouTube video IDs are already bookmarked.
 */
export async function checkBookmarks(videoIds: string[]): Promise<string[]> {
  if (videoIds.length === 0) return [];

  const res = await phpFetch<BookmarkCheckData>(
    `bookmark_check.php?video_ids=${videoIds.join(",")}`
  );

  if (!res.success || !res.data) return [];
  return res.data.bookmarked_ids;
}

// ── Auth endpoints ─────────────────────────────────────

export interface AuthResult {
  user: PhpUser;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await phpFetch<AuthResult>("login.php", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!res.success) {
    throw new Error(res.error || "Login failed");
  }

  if (!res.user || !res.token) {
    throw new Error("Login failed");
  }

  storeToken(res.token);
  return { user: res.user, token: res.token };
}

export async function signup(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  const res = await phpFetch<AuthResult>("signup.php", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.success) {
    throw new Error(res.error || "Signup failed");
  }

  if (!res.user || !res.token) {
    throw new Error("Signup failed");
  }

  storeToken(res.token);
  return { user: res.user, token: res.token };
}

export async function logout(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;

  // Fire-and-forget — clear token locally regardless of server response
  try {
    await phpFetch("logout.php", { method: "POST" });
  } catch {
    // Swallow — best-effort server-side invalidation
  }

  clearToken();
}

export async function fetchCurrentUser(): Promise<PhpUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  const res = await phpFetch("me.php");

  if (!res.success) {
    clearToken();
    return null;
  }

  if (!res.user) {
    clearToken();
    return null;
  }

  return res.user;
}
