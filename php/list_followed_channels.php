<?php
/**
 * list_followed_channels.php — List followed YouTube channels
 *
 * GET /list_followed_channels.php
 * Requires: Authorization: Bearer <token>
 *
 * Responses:
 *   200 — { "success": true, "data": { "channels": [...] } }
 *   401 — { "success": false, "error": "Authentication required" }
 */

require_once __DIR__ . '/helpers.php';

set_cors_headers();

// ── Only accept GET ───────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed. Use GET.', 405);
}

// ── Authenticate ──────────────────────────────
$user = validate_token();
if (!$user) {
    json_error('Authentication required.', 401);
}

$user_id = (int) $user['id'];

// ── Fetch followed channels ───────────────────
try {
    $pdo  = get_pdo();
    $stmt = $pdo->prepare(
        'SELECT id, channel_id, channel_title, channel_avatar, followed_at
         FROM followed_channels
         WHERE user_id = :user_id
         ORDER BY followed_at DESC'
    );
    $stmt->execute(['user_id' => $user_id]);

    $channels = $stmt->fetchAll();

    json_response([
        'success' => true,
        'data'    => [
            'channels' => $channels,
        ],
    ]);

} catch (PDOException $e) {
    json_error('Failed to fetch followed channels. Please try again.', 500);
}
