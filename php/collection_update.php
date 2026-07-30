<?php
/**
 * collection_update.php — Update collection name and/or description
 *
 * POST /collection_update.php
 * Requires: Authorization: Bearer <token>
 *
 * Request body (JSON):
 *   { "collection_id": 1, "name": "New Name", "description": "Optional" }
 *
 * Responses:
 *   200 — { "success": true, "message": "Collection updated", "collection": { ... } }
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
$name          = trim($data['name']          ?? '');
$description   = isset($data['description']) ? trim($data['description']) : null;

if ($collection_id <= 0) {
    json_error('collection_id is required.', 400);
}

if ($name === '') {
    json_error('Collection name is required.', 400);
}

if (mb_strlen($name) > 160) {
    json_error('Collection name is too long (max 160 characters).', 400);
}

try {
    $pdo = get_pdo();

    // Verify ownership
    $check = $pdo->prepare(
        'SELECT id, name, description FROM collections WHERE id = :id AND user_id = :user_id LIMIT 1'
    );
    $check->execute(['id' => $collection_id, 'user_id' => $user_id]);
    $existing = $check->fetch();

    if (!$existing) {
        json_error('Collection not found', 404);
    }

    // Build dynamic SET
    $fields = ['name = :name'];
    $params = ['name' => $name, 'id' => $collection_id];

    if ($description !== null) {
        // Allow setting to empty string (clear description)
        $fields[] = 'description = :description';
        $params['description'] = $description !== '' ? $description : null;
    }

    $set_clause = implode(', ', $fields);

    $stmt = $pdo->prepare(
        "UPDATE collections SET {$set_clause} WHERE id = :id AND user_id = :user_id"
    );
    $params['user_id'] = $user_id;
    $stmt->execute($params);

    // Fetch fresh data
    $fresh = $pdo->prepare(
        'SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
                COUNT(ci.id) AS item_count
         FROM collections c
         LEFT JOIN collection_items ci ON ci.collection_id = c.id
         WHERE c.id = :id
         GROUP BY c.id
         LIMIT 1'
    );
    $fresh->execute(['id' => $collection_id]);
    $collection = $fresh->fetch();
    $collection['id']         = (int) $collection['id'];
    $collection['item_count'] = (int) $collection['item_count'];

    json_response([
        'success' => true,
        'message' => 'Collection updated',
        'data'    => [
            'collection' => $collection,
        ],
    ]);

} catch (PDOException $e) {
    json_error('Failed to update collection. Please try again.', 500);
}
