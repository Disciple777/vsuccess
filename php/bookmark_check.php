<?php
/**
 * bookmark_check.php — Check which video IDs are bookmarked by the current user
 *
 * GET /bookmark_check.php?video_ids=abc123,def456
 * Requires: Authorization: Bearer <token>
 *
 * Query parameters:
 *   video_ids  (string, required) — Comma-separated YouTube video IDs
 *
 * Responses:
 *   200 — { "success": true, "data": { "bookmarked_ids": ["abc123"] } }
 *   400 — { "success": false, "error": "..." }
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

// ── Parse video IDs ───────────────────────────
$video_ids_raw = trim($_GET['video_ids'] ?? '');
if ($video_ids_raw === '') {
    json_response([
        'success' => true,
        'data'    => ['bookmarked_ids' => []],
    ]);
}

$input_ids = array_unique(array_filter(array_map('trim', explode(',', $video_ids_raw))));

if (count($input_ids) > 50) {
    json_error('Too many video IDs (max 50).', 400);
}

if (count($input_ids) === 0) {
    json_response([
        'success' => true,
        'data'    => ['bookmarked_ids' => []],
    ]);
}

// ── Build placeholders ────────────────────────
$placeholders = [];
$params       = ['user_id' => $user_id];

foreach ($input_ids as $i => $id) {
    $key                = ":id_{$i}";
    $placeholders[]     = $key;
    $params[$key]       = $id;
}

$placeholder_str = implode(', ', $placeholders);

// ── Query ─────────────────────────────────────
try {
    $pdo  = get_pdo();
    $stmt = $pdo->prepare(
        "SELECT video_id FROM bookmarks
         WHERE user_id = :user_id
           AND video_id IN ({$placeholder_str})"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

    json_response([
        'success' => true,
        'data'    => [
            'bookmarked_ids' => $rows,
        ],
    ]);

} catch (PDOException $e) {
    json_error('Failed to check bookmarks. Please try again.', 500);
}
