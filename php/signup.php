<?php
/**
 * signup.php — Register a new user
 *
 * POST /signup.php
 *
 * Request body (JSON):
 *   { "email": "user@example.com", "password": "secret123", "name": "Optional Name" }
 *
 * Responses:
 *   201 — { "success": true, "user": { id, email, name, tier }, "token": "abc..." }
 *   400 — { "success": false, "error": "..." }       (validation error)
 *   409 — { "success": false, "error": "..." }       (email already taken)
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
$name     = trim($data['name']     ?? '');

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('A valid email address is required.', 400);
}

// Email max length (column is VARCHAR(190))
if (mb_strlen($email) > 190) {
    json_error('Email is too long (max 190 characters).', 400);
}

// Password strength
if (strlen($password) < 6) {
    json_error('Password must be at least 6 characters.', 400);
}

// Optional name
if ($name !== '' && mb_strlen($name) > 100) {
    json_error('Name must be 100 characters or fewer.', 400);
}

// ──────────────────────────────────────────────
// Check for duplicate email
// ──────────────────────────────────────────────
try {
    $pdo  = get_pdo();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);

    if ($stmt->fetch()) {
        json_error('An account with this email already exists.', 409);
    }
} catch (PDOException $e) {
    json_error('Database error. Please try again.', 500);
}

// ──────────────────────────────────────────────
// Create user
// ──────────────────────────────────────────────
try {
    $hash = hash_password($password);

    $stmt = $pdo->prepare(
        'INSERT INTO users (email, name, password_hash, vsuccess_tier)
         VALUES (:email, :name, :password_hash, :vsuccess_tier)'
    );
    $stmt->execute([
        'email'          => $email,
        'name'           => $name !== '' ? $name : null,
        'password_hash'  => $hash,
        'vsuccess_tier'  => 'free',
    ]);

    $user_id = (int) $pdo->lastInsertId();
} catch (PDOException $e) {
    json_error('Failed to create account. Please try again.', 500);
}

// ──────────────────────────────────────────────
// Create auth token
// ──────────────────────────────────────────────
try {
    $token = create_token($user_id, 30);
} catch (PDOException $e) {
    json_error('Account created but failed to sign in. Please log in.', 500);
}

// ──────────────────────────────────────────────
// Return
// ──────────────────────────────────────────────
json_response([
    'success' => true,
    'user'    => [
        'id'    => $user_id,
        'email' => $email,
        'name'  => $name !== '' ? $name : null,
        'tier'  => 'free',
    ],
    'token' => $token,
], 201);
