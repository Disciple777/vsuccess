<?php
/**
 * collection_detail.php — Get a single collection with its items
 *
 * GET /collection_detail.php?collection_id=1
 * Requires: Authorization: Bearer <token>
 *
 * Query parameters:
 *   collection_id  (int, required)
 *
 * Responses:
 *   200 — { "success": true, "data": { collection: { ... }, items: [...] } }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "Authentication required" }
 *   404 — { "success": false, "error": "Collection not found" }
 */

require_once __DIR__ . '/helpers.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed. Use GET.', 405);
}

$user = validate_token();
if (!$user) {
    json_error('Authentication required.', 401);
}

$user_id       = (int) $user['id'];
$collection_id = (int) ($_GET['collection_id'] ?? 0);

if ($collection_id <= 0) {
    json_error('collection_id is required.', 400);
}

try {
    $pdo = get_pdo();

    // Get collection
    $col_stmt = $pdo->prepare(
        'SELECT id, name, description, created_at, updated_at
         FROM collections
         WHERE id = :id AND user_id = :user_id
         LIMIT 1'
    );
    $col_stmt->execute(['id' => $collection_id, 'user_id' => $user_id]);
    $collection = $col_stmt->fetch();

    if (!$collection) {
        json_error('Collection not found', 404);
    }

    $collection['id'] = (int) $collection['id'];

    // Get items with bookmark details
    $items_stmt = $pdo->prepare(
        'SELECT ci.id AS item_id, ci.bookmark_id, ci.position, ci.created_at AS added_at,
                b.video_id, b.video_title, b.channel_title, b.channel_id,
                b.thumbnail_url, b.view_count, b.saved_at
         FROM collection_items ci
         JOIN bookmarks b ON b.id = ci.bookmark_id
         WHERE ci.collection_id = :collection_id
         ORDER BY ci.position ASC, ci.created_at ASC'
    );
    $items_stmt->execute(['collection_id' => $collection_id]);
    $items = $items_stmt->fetchAll();

    // Cast numeric fields
    foreach ($items as &$item) {
        $item['item_id']     = (int) $item['item_id'];
        $item['bookmark_id'] = (int) $item['bookmark_id'];
        $item['position']    = (int) $item['position'];
        $item['view_count']  = (int) $item['view_count'];
    }
    unset($item);

    json_response([
        'success' => true,
        'data'    => [
            'collection' => $collection,
            'items'      => $items,
            'total'      => count($items),
        ],
    ]);

} catch (PDOException $e) {
    json_error('Failed to fetch collection. Please try again.', 500);
}
