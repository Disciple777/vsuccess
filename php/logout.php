<?php
/**
 * logout.php — Invalidate the current auth token
 *
 * POST /logout.php
 *
 * Headers:
 *   Authorization: Bearer <token>
 *
 * Or query param:
 *   POST /logout.php?token=<token>
 *
 * Responses:
 *   200 — { "success": true, "message": "Logged out successfully." }
 *   400 — { "success": false, "error": "..." }
 *   401 — { "success": false, "error": "No token provided." }
 */

require_once __DIR__ . '/helpers.php';

set_cors_headers();

// ──────────────────────────────────────────────
// Only accept POST
// ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed. Use POST.', 405);
}

// ──────────────────────────────────────────────
// Get token
// ──────────────────────────────────────────────
$token = get_request_token();

if (!$token) {
    json_error('No token provided.', 401);
}

// ──────────────────────────────────────────────
// Delete token
// ──────────────────────────────────────────────
try {
    delete_token($token);
} catch (PDOException $e) {
    json_error('Failed to log out. Please try again.', 500);
}

json_response([
    'success' => true,
    'message' => 'Logged out successfully.',
]);
