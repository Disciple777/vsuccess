<?php
/**
 * collection_create.php — Create a new collection
 *
 * POST /collection_create.php
 * Requires: Authorization: Bearer <token>
 *
 * Request body (JSON):
 *   { "name": "My Collection", "description": "Optional desc" }
 *
 * Responses:
 *   201 — { "success": true, "collection": { id, name, description, created_at } }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "Authentication required" }
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

$name        = trim($data['name']        ?? '');
$description = trim($data['description'] ?? '');

if ($name === '') {
    json_error('Collection name is required.', 400);
}

if (mb_strlen($name) > 160) {
    json_error('Collection name is too long (max 160 characters).', 400);
}

if (mb_strlen($description) > 5000) {
    json_error('Description is too long.', 400);
}

try {
    $pdo = get_pdo();

    $stmt = $pdo->prepare(
        'INSERT INTO collections (user_id, name, description)
         VALUES (:user_id, :name, :description)'
    );
    $stmt->execute([
        'user_id'     => $user_id,
        'name'        => $name,
        'description' => $description !== '' ? $description : null,
    ]);

    $collection_id = (int) $pdo->lastInsertId();

    json_response([
        'success' => true,
        'data'    => [
            'collection' => [
                'id'          => $collection_id,
                'name'        => $name,
                'description' => $description ?: null,
                'created_at'  => date('Y-m-d H:i:s'),
                'item_count'  => 0,
            ],
        ],
    ], 201);

} catch (PDOException $e) {
    json_error('Failed to create collection. Please try again.', 500);
}
