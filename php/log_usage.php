<?php
/**
 * log_usage.php — Log a search query (POST)
 *
 * Records a search in the search_queries table for the authenticated user.
 * Used to track weekly free tier usage.
 *
 * Request (JSON body):
 *   { "niche": "fitness" }
 *
 * Responses:
 *   200 — { "success": true, "message": "Search logged" }
 *   400 — { "success": false, "error": "Niche is required" }
 *   401 — { "success": false, "error": "Authentication required" }
 */

require_once __DIR__ . '/helpers.php';
set_cors_headers();

// ── Auth check ────────────────────────────────────────
$user = validate_token();
if (!$user) {
    json_error('Authentication required', 401);
}

// ── Parse body ────────────────────────────────────────
$body = json_body();
$niche = trim($body['niche'] ?? '');

if ($niche === '') {
    json_error('Niche is required', 400);
}

// ── Log the search ────────────────────────────────────
$pdo = get_pdo();

$stmt = $pdo->prepare('
    INSERT INTO search_queries (user_id, niche, searched_at)
    VALUES (:user_id, :niche, NOW())
');
$stmt->execute([
    'user_id' => $user['id'],
    'niche'   => mb_substr($niche, 0, 180),
]);

json_response([
    'success' => true,
    'message' => 'Search logged',
]);
