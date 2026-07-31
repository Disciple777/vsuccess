<?php
/**
 * follow_channel.php — Follow a YouTube channel
 *
 * POST /follow_channel.php
 * Requires: Authorization: Bearer <token>
 *
 * Request body (JSON):
 *   {
 *     "channel_id":      "UC...",
 *     "channel_title":   "Channel Name",
 *     "channel_avatar":  "https://yt3.googleusercontent.com/..."
 *   }
 *
 * Responses:
 *   201 — { "success": true, "message": "Following channel", "data": { "channel": { id, ... } } }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "Authentication required" }
 *   409 — { "success": false, "error": "Already following" }
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

$channel_id    = trim($data['channel_id']    ?? '');
$channel_title = trim($data['channel_title'] ?? '');
$channel_avatar = trim($data['channel_avatar'] ?? '');

if ($channel_id === '' || $channel_title === '') {
    json_error('channel_id and channel_title are required.', 400);
}

if (mb_strlen($channel_id) > 50) {
    json_error('channel_id is too long (max 50 characters).', 400);
}

if (mb_strlen($channel_title) > 255) {
    json_error('channel_title is too long (max 255 characters).', 400);
}

// ── Insert follow ─────────────────────────────
try {
    $pdo = get_pdo();

    // Check for duplicate first
    $check = $pdo->prepare(
        'SELECT id FROM followed_channels WHERE user_id = :user_id AND channel_id = :channel_id LIMIT 1'
    );
    $check->execute(['user_id' => $user_id, 'channel_id' => $channel_id]);

    if ($check->fetch()) {
        json_error('Already following this channel', 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO followed_channels (user_id, channel_id, channel_title, channel_avatar)
         VALUES (:user_id, :channel_id, :channel_title, :channel_avatar)'
    );
    $stmt->execute([
        'user_id'       => $user_id,
        'channel_id'    => $channel_id,
        'channel_title' => $channel_title,
        'channel_avatar'=> $channel_avatar ?: null,
    ]);

    $follow_id = (int) $pdo->lastInsertId();

    json_response([
        'success' => true,
        'message' => 'Following channel',
        'data'    => [
            'channel' => [
                'id'             => $follow_id,
                'channel_id'     => $channel_id,
                'channel_title'  => $channel_title,
                'channel_avatar' => $channel_avatar,
                'followed_at'    => date('Y-m-d H:i:s'),
            ],
        ],
    ], 201);

} catch (PDOException $e) {
    if ($e->getCode() === '23000' && str_contains($e->getMessage(), 'uq_user_channel')) {
        json_error('Already following this channel', 409);
    }
    json_error('Failed to follow channel. Please try again.', 500);
}
