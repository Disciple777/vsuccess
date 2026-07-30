<?php
/**
 * me.php — Get the currently authenticated user's info
 *
 * GET /me.php
 *
 * Headers:
 *   Authorization: Bearer <token>
 *
 * Or query param:
 *   GET /me.php?token=<token>
 *
 * Responses:
 *   200 — { "success": true, "user": { id, email, name, tier, created_at } }
 *   401 — { "success": false, "error": "..." }       (invalid or expired token)
 */

require_once __DIR__ . '/helpers.php';

set_cors_headers();

// ──────────────────────────────────────────────
// Only accept GET
// ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed. Use GET.', 405);
}

// ──────────────────────────────────────────────
// Validate token
// ──────────────────────────────────────────────
$user = validate_token();

if (!$user) {
    json_error('Invalid or expired token.', 401);
}

// ──────────────────────────────────────────────
// Return user
// ──────────────────────────────────────────────
json_response([
    'success' => true,
    'user'    => [
        'id'         => (int) $user['id'],
        'email'      => $user['email'],
        'name'       => $user['name'],
        'tier'       => $user['tier'],
        'created_at' => $user['created_at'],
    ],
]);
