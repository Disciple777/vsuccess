<?php
/**
 * login.php — Authenticate a user and return a session token
 *
 * POST /login.php
 *
 * Request body (JSON):
 *   { "email": "user@example.com", "password": "secret123" }
 *
 * Responses:
 *   200 — { "success": true, "user": { id, email, name, tier }, "token": "abc..." }
 *   400 — { "success": false, "error": "..." }       (validation error)
 *   401 — { "success": false, "error": "..." }       (invalid credentials)
 *   500 — { "success": false, "error": "..." }       (server error)
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
// Validate input
// ──────────────────────────────────────────────
$data = json_body();

$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';

if ($email === '' || $password === '') {
    json_error('Email and password are required.', 400);
}

// ──────────────────────────────────────────────
// Look up user
// ──────────────────────────────────────────────
try {
    $pdo  = get_pdo();
    $stmt = $pdo->prepare(
        'SELECT id, email, name, vsuccess_tier AS tier, password_hash, created_at
         FROM users
         WHERE email = :email
         LIMIT 1'
    );
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
} catch (PDOException $e) {
    json_error('Database error. Please try again.', 500);
}

if (!$user) {
    json_error('Invalid email or password.', 401);
}

// ──────────────────────────────────────────────
// Verify password
// ──────────────────────────────────────────────
if (!verify_password($password, $user['password_hash'])) {
    json_error('Invalid email or password.', 401);
}

// ──────────────────────────────────────────────
// Create auth token
// ──────────────────────────────────────────────
try {
    $token = create_token((int) $user['id'], 30);
} catch (PDOException $e) {
    json_error('Login failed. Please try again.', 500);
}

// ──────────────────────────────────────────────
// Return user (exclude password_hash)
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
    'token' => $token,
]);
