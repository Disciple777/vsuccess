<?php
/**
 * bookmark_delete.php — Remove a video bookmark
 *
 * POST /bookmark_delete.php
 * Requires: Authorization: Bearer <token>
 *
 * Request body (JSON):
 *   { "video_id": "abc123" }
 *
 * Responses:
 *   200 — { "success": true, "message": "Bookmark removed" }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "Authentication required" }
 *   404 — { "success": false, "error": "Bookmark not found" }
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

$video_id = trim($data['video_id'] ?? '');

if ($video_id === '') {
    json_error('video_id is required.', 400);
}

// ── Delete bookmark ───────────────────────────
try {
    $pdo  = get_pdo();
    $stmt = $pdo->prepare(
        'DELETE FROM bookmarks WHERE user_id = :user_id AND video_id = :video_id'
    );
    $stmt->execute([
        'user_id'  => $user_id,
        'video_id' => $video_id,
    ]);

    if ($stmt->rowCount() === 0) {
        json_error('Bookmark not found', 404);
    }

    json_response([
        'success' => true,
        'message' => 'Bookmark removed',
    ]);

} catch (PDOException $e) {
    json_error('Failed to remove bookmark. Please try again.', 500);
}
