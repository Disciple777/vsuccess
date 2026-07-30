<?php
/**
 * collection_add_item.php — Add a bookmark to a collection
 *
 * POST /collection_add_item.php
 * Requires: Authorization: Bearer <token>
 *
 * Request body (JSON):
 *   { "collection_id": 1, "bookmark_id": 5 }
 *
 * This endpoint:
 *   1. Verifies the collection belongs to the user
 *   2. Verifies the bookmark belongs to the user
 *   3. Adds the item (or returns 409 if already in collection)
 *
 * Responses:
 *   201 — { "success": true, "message": "Added to collection" }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "Authentication required" }
 *   404 — { "success": false, "error": "Collection or bookmark not found" }
 *   409 — { "success": false, "error": "Already in collection" }
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
    $pdo = get_pdo();

    // Verify collection ownership
    $col_check = $pdo->prepare(
        'SELECT id FROM collections WHERE id = :id AND user_id = :user_id LIMIT 1'
    );
    $col_check->execute(['id' => $collection_id, 'user_id' => $user_id]);
    if (!$col_check->fetch()) {
        json_error('Collection not found', 404);
    }

    // Verify bookmark ownership
    $bm_check = $pdo->prepare(
        'SELECT id FROM bookmarks WHERE id = :id AND user_id = :user_id LIMIT 1'
    );
    $bm_check->execute(['id' => $bookmark_id, 'user_id' => $user_id]);
    if (!$bm_check->fetch()) {
        json_error('Bookmark not found', 404);
    }

    // Check for duplicate
    $dup_check = $pdo->prepare(
        'SELECT id FROM collection_items WHERE collection_id = :cid AND bookmark_id = :bid LIMIT 1'
    );
    $dup_check->execute(['cid' => $collection_id, 'bid' => $bookmark_id]);
    if ($dup_check->fetch()) {
        json_error('Already in collection', 409);
    }

    // Get next position
    $pos_stmt = $pdo->prepare(
        'SELECT COALESCE(MAX(position), 0) + 1 FROM collection_items WHERE collection_id = :cid'
    );
    $pos_stmt->execute(['cid' => $collection_id]);
    $next_position = (int) $pos_stmt->fetchColumn();

    // Insert
    $stmt = $pdo->prepare(
        'INSERT INTO collection_items (collection_id, bookmark_id, position)
         VALUES (:collection_id, :bookmark_id, :position)'
    );
    $stmt->execute([
        'collection_id' => $collection_id,
        'bookmark_id'   => $bookmark_id,
        'position'      => $next_position,
    ]);

    json_response([
        'success' => true,
        'message' => 'Added to collection',
    ], 201);

} catch (PDOException $e) {
    // Handle duplicate from race condition
    if ($e->getCode() === '23000' && str_contains($e->getMessage(), 'uq_collection_bookmark')) {
        json_error('Already in collection', 409);
    }
    json_error('Failed to add to collection. Please try again.', 500);
}
