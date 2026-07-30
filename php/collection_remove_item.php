<?php
/**
 * collection_remove_item.php — Remove a bookmark from a collection
 *
 * POST /collection_remove_item.php
 * Requires: Authorization: Bearer <token>
 *
 * Request body (JSON):
 *   { "collection_id": 1, "bookmark_id": 5 }
 *
 * Responses:
 *   200 — { "success": true, "message": "Removed from collection" }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "Authentication required" }
 *   404 — { "success": false, "error": "Item not found in collection" }
 */

require_once __DIR__ . '/helpers.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed. Use POST.', 405);
}

$user = validate_token();
if (!$user) {
    json_error('Authentication required.', 401);
}

$user_id = (int) $user['id'];

$data = json_body();

$collection_id = (int) ($data['collection_id'] ?? 0);
$bookmark_id   = (int) ($data['bookmark_id']   ?? 0);

if ($collection_id <= 0 || $bookmark_id <= 0) {
    json_error('collection_id and bookmark_id are required.', 400);
}

try {
    // Delete item by joining through collections to verify ownership
    $pdo  = get_pdo();
    $stmt = $pdo->prepare(
        'DELETE ci FROM collection_items ci
         JOIN collections c ON c.id = ci.collection_id
         WHERE ci.collection_id = :collection_id
           AND ci.bookmark_id = :bookmark_id
           AND c.user_id = :user_id'
    );
    $stmt->execute([
        'collection_id' => $collection_id,
        'bookmark_id'   => $bookmark_id,
        'user_id'       => $user_id,
    ]);

    if ($stmt->rowCount() === 0) {
        json_error('Item not found in collection', 404);
    }

    json_response([
        'success' => true,
        'message' => 'Removed from collection',
    ]);

} catch (PDOException $e) {
    json_error('Failed to remove from collection. Please try again.', 500);
}
