<?php
/**
 * bookmark_list.php — List user's saved bookmarks
 *
 * GET /bookmark_list.php?page=1&per_page=20
 * Requires: Authorization: Bearer <token>
 *
 * Query parameters:
 *   page      (int,  optional, default 1)
 *   per_page  (int,  optional, default 20, max 50)
 *
 * Responses:
 *   200 — { "success": true, "data": { bookmarks: [...], total, page, per_page, has_more } }
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

$user_id  = (int) $user['id'];
$page     = max(1, (int) ($_GET['page'] ?? 1));
$per_page = max(1, min(50, (int) ($_GET['per_page'] ?? 20)));
$offset   = ($page - 1) * $per_page;

// ── Fetch bookmarks ───────────────────────────
try {
    $pdo = get_pdo();

    // Get total count
    $count_stmt = $pdo->prepare('SELECT COUNT(*) FROM bookmarks WHERE user_id = :user_id');
    $count_stmt->execute(['user_id' => $user_id]);
    $total = (int) $count_stmt->fetchColumn();

    // Get page of bookmarks (newest first)
    $stmt = $pdo->prepare(
        'SELECT id, video_id, video_title, channel_title, channel_id,
                thumbnail_url, view_count, saved_at
         FROM bookmarks
         WHERE user_id = :user_id
         ORDER BY saved_at DESC
         LIMIT :limit OFFSET :offset'
    );
    $stmt->bindValue('user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindValue('limit',   $per_page, PDO::PARAM_INT);
    $stmt->bindValue('offset',  $offset,   PDO::PARAM_INT);
    $stmt->execute();

    $bookmarks = $stmt->fetchAll();

    json_response([
        'success' => true,
        'data'    => [
            'bookmarks'  => $bookmarks,
            'total'      => $total,
            'page'       => $page,
            'per_page'   => $per_page,
            'has_more'   => ($offset + $per_page) < $total,
        ],
    ]);

} catch (PDOException $e) {
    json_error('Failed to fetch bookmarks. Please try again.', 500);
}
