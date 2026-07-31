<?php
/**
 * unfollow_channel.php — Unfollow a YouTube channel
 *
 * POST /unfollow_channel.php
 * Requires: Authorization: Bearer <token>
 *
 * Request body (JSON):
 *   { "channel_id": "UC..." }
 *
 * Responses:
 *   200 — { "success": true, "message": "Unfollowed channel" }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "Authentication required" }
 *   404 — { "success": false, "error": "Not following this channel" }
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

$channel_id = trim($data['channel_id'] ?? '');

if ($channel_id === '') {
    json_error('channel_id is required.', 400);
}

// ── Delete follow ─────────────────────────────
try {
    $pdo  = get_pdo();
    $stmt = $pdo->prepare(
        'DELETE FROM followed_channels WHERE user_id = :user_id AND channel_id = :channel_id'
    );
    $stmt->execute([
        'user_id'    => $user_id,
        'channel_id' => $channel_id,
    ]);

    if ($stmt->rowCount() === 0) {
        json_error('Not following this channel', 404);
    }

    json_response([
        'success' => true,
        'message' => 'Unfollowed channel',
    ]);

} catch (PDOException $e) {
    json_error('Failed to unfollow channel. Please try again.', 500);
}
