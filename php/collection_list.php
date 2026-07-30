<?php
/**
 * collection_list.php — List user's collections with item counts
 *
 * GET /collection_list.php
 * Requires: Authorization: Bearer <token>
 *
 * Responses:
 *   200 — { "success": true, "data": { collections: [...] } }
 *   401 — { "success": false, "error": "..." }
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

$user_id = (int) $user['id'];

try {
    $pdo = get_pdo();

    $stmt = $pdo->prepare(
        'SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
                COUNT(ci.id) AS item_count
         FROM collections c
         LEFT JOIN collection_items ci ON ci.collection_id = c.id
         WHERE c.user_id = :user_id
         GROUP BY c.id
         ORDER BY c.updated_at DESC'
    );
    $stmt->execute(['user_id' => $user_id]);
    $collections = $stmt->fetchAll();

    // Cast numeric fields
    foreach ($collections as &$col) {
        $col['id']         = (int) $col['id'];
        $col['item_count'] = (int) $col['item_count'];
    }
    unset($col);

    json_response([
        'success' => true,
        'data'    => ['collections' => $collections],
    ]);

} catch (PDOException $e) {
    json_error('Failed to fetch collections. Please try again.', 500);
}
