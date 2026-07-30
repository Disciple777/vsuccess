<?php
/**
 * bookmark_save.php — Save a video bookmark
 *
 * POST /bookmark_save.php
 * Requires: Authorization: Bearer <token>
 *
 * Request body (JSON):
 *   {
 *     "video_id":       "abc123",
 *     "video_title":    "My Video Title",
 *     "channel_title":  "Channel Name",
 *     "channel_id":     "UC...",
 *     "thumbnail_url":  "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
 *     "view_count":     1500000
 *   }
 *
 * Responses:
 *   201 — { "success": true, "message": "Bookmarked", "bookmark": { id, ... } }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "Authentication required" }
 *   409 — { "success": false, "error": "Already bookmarked" }
 */

require_once __DIR__ . '/helpers.php';

set_cors_headers();

// ── Only accept POST ──────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed. Use POST.', 405);
}

// ── Authenticate ──────────────────────────────
$user = validate_token();
if (!$user) {
    json_error('Authentication required.', 401);
}

$user_id = (int) $user['id'];

// ── Validate input ────────────────────────────
$data = json_body();

$video_id      = trim($data['video_id']      ?? '');
$video_title   = trim($data['video_title']   ?? '');
$channel_title = trim($data['channel_title'] ?? '');
$channel_id    = trim($data['channel_id']    ?? '');
$thumbnail_url = trim($data['thumbnail_url'] ?? '');
$view_count    = (int) ($data['view_count']   ?? 0);

if ($video_id === '' || $video_title === '' || $channel_title === '') {
    json_error('video_id, video_title, and channel_title are required.', 400);
}

if (mb_strlen($video_title) > 255) {
    json_error('video_title is too long (max 255 characters).', 400);
}

if (mb_strlen($channel_title) > 255) {
    json_error('channel_title is too long (max 255 characters).', 400);
}

if (mb_strlen($video_id) > 30) {
    json_error('video_id is too long.', 400);
}

// ── Insert bookmark ───────────────────────────
try {
    $pdo = get_pdo();

    // Check for duplicate first
    $check = $pdo->prepare(
        'SELECT id FROM bookmarks WHERE user_id = :user_id AND video_id = :video_id LIMIT 1'
    );
    $check->execute(['user_id' => $user_id, 'video_id' => $video_id]);

    if ($check->fetch()) {
        json_error('Already bookmarked', 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO bookmarks (user_id, video_id, video_title, channel_title, channel_id, thumbnail_url, view_count)
         VALUES (:user_id, :video_id, :video_title, :channel_title, :channel_id, :thumbnail_url, :view_count)'
    );
    $stmt->execute([
        'user_id'       => $user_id,
        'video_id'      => $video_id,
        'video_title'   => $video_title,
        'channel_title' => $channel_title,
        'channel_id'    => $channel_id ?: null,
        'thumbnail_url' => $thumbnail_url ?: null,
        'view_count'    => $view_count,
    ]);

    $bookmark_id = (int) $pdo->lastInsertId();

    json_response([
        'success' => true,
        'message' => 'Bookmarked',
        'data'    => [
            'bookmark' => [
                'id'             => $bookmark_id,
                'video_id'       => $video_id,
                'video_title'    => $video_title,
                'channel_title'  => $channel_title,
                'channel_id'     => $channel_id,
                'thumbnail_url'  => $thumbnail_url,
                'view_count'     => $view_count,
                'saved_at'       => date('Y-m-d H:i:s'),
            ],
        ],
    ], 201);

} catch (PDOException $e) {
    // Handle duplicate key from race condition
    if ($e->getCode() === '23000' && str_contains($e->getMessage(), 'uq_user_video')) {
        json_error('Already bookmarked', 409);
    }
    json_error('Failed to save bookmark. Please try again.', 500);
}
