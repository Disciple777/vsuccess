<?php
/**
 * collection_delete.php — Delete a collection and all its items
 *
 * POST /collection_delete.php
 * Requires: Authorization: Bearer <token>
 *
 * Request body (JSON):
 *   { "collection_id": 1 }
 *
 * Responses:
 *   200 — { "success": true, "message": "Collection deleted" }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "Authentication required" }
 *   404 — { "success": false, "error": "Collection not found" }
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

if ($collection_id <= 0) {
    json_error('collection_id is required.', 400);
}

try {
    $pdo  = get_pdo();
    $stmt = $pdo->prepare(
        'DELETE FROM collections WHERE id = :id AND user_id = :user_id'
    );
    $stmt->execute([
        'id'      => $collection_id,
        'user_id' => $user_id,
    ]);

    if ($stmt->rowCount() === 0) {
        json_error('Collection not found', 404);
    }

    json_response([
        'success' => true,
        'message' => 'Collection deleted',
    ]);

} catch (PDOException $e) {
    json_error('Failed to delete collection. Please try again.', 500);
}
