<?php
/**
 * helpers.php — Shared utilities for VSuccess PHP API
 *
 * Include this file in every endpoint. It handles:
 *   - CORS headers
 *   - JSON request/response parsing
 *   - Auth token creation & validation (using auth_tokens table)
 *   - Password hashing & verification
 *
 * Note: db.php is automatically loaded — endpoints only need to require helpers.php.
 */

require_once __DIR__ . '/db.php';

// ──────────────────────────────────────────────
// 1. CORS
// ──────────────────────────────────────────────

/**
 * Set CORS headers for cross-origin requests from the Next.js frontend.
 *
 * In development, the origin will be something like http://localhost:3001.
 * In production, it will be your Vercel/Next.js domain.
 *
 * Update $allowed_origins as needed.
 */
function set_cors_headers(): void
{
    $allowed_origins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://vsuccess-finder.vercel.app',
        // Add your production domain here when deployed
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowed_origins, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Content-Type: application/json; charset=utf-8');

    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ──────────────────────────────────────────────
// 2. JSON helpers
// ──────────────────────────────────────────────

/**
 * Send a JSON response and exit.
 *
 * @param mixed  $data  Data to encode as JSON
 * @param int    $code  HTTP status code (default 200)
 */
function json_response(mixed $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send a JSON error response and exit.
 *
 * @param string $message  Human-readable error message
 * @param int    $code     HTTP status code (default 400)
 */
function json_error(string $message, int $code = 400): void
{
    json_response(['success' => false, 'error' => $message], $code);
}

/**
 * Read and decode the JSON request body.
 *
 * @return array  Decoded associative array
 */
function json_body(): array
{
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        json_error('Invalid JSON body', 400);
    }

    return $data;
}

// ──────────────────────────────────────────────
// 3. Password helpers
// ──────────────────────────────────────────────

/**
 * Hash a plain-text password using bcrypt.
 *
 * @param string $password
 * @return string  The bcrypt hash
 */
function hash_password(string $password): string
{
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verify a plain-text password against a bcrypt hash.
 *
 * @param string $password  The plain-text password
 * @param string $hash      The stored bcrypt hash
 * @return bool
 */
function verify_password(string $password, string $hash): bool
{
    return password_verify($password, $hash);
}

// ──────────────────────────────────────────────
// 4. Token helpers (auth_tokens table)
// ──────────────────────────────────────────────

/**
 * Generate a secure random token and insert it into the auth_tokens table.
 *
 * @param int       $user_id
 * @param int       $ttl_days  Token time-to-live in days (default 30)
 * @return string   The raw token string
 */
function create_token(int $user_id, int $ttl_days = 30): string
{
    $pdo    = get_pdo();
    $token  = bin2hex(random_bytes(32)); // 64-char hex string (matches CHAR(64) in auth_tokens)
    $expiry = date('Y-m-d H:i:s', time() + ($ttl_days * 86400));

    $stmt = $pdo->prepare(
        'INSERT INTO auth_tokens (user_id, token, expires_at)
         VALUES (:user_id, :token, :expires_at)'
    );
    $stmt->execute([
        'user_id'    => $user_id,
        'token'      => $token,
        'expires_at' => $expiry,
    ]);

    return $token;
}

/**
 * Validate an auth token and return the associated user row.
 *
 * Checks:
 *   - Authorization: Bearer <token> header (preferred), or
 *   - ?token=<token> query param (fallback)
 *   - Token exists in auth_tokens and is not expired
 *
 * Also performs occasional cleanup of expired tokens (~1/100 requests).
 *
 * @return array|null  User associative array, or null if invalid/expired
 */
function validate_token(): ?array
{
    $pdo = get_pdo();

    // ── Occasional cleanup of expired tokens ──
    if (mt_rand(1, 100) === 1) {
        $pdo->exec('DELETE FROM auth_tokens WHERE expires_at <= NOW()');
    }

    // ── Extract token from request ──
    $token = null;
    $auth  = $_SERVER['HTTP_AUTHORIZATION']
          ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
          ?? '';

    if (preg_match('/^Bearer\s+(.+)$/i', $auth, $matches)) {
        $token = $matches[1];
    }

    // Fallback: query param
    if (!$token && !empty($_GET['token'])) {
        $token = $_GET['token'];
    }

    if (!$token) {
        return null;
    }

    // ── Look up token in DB ──
    $stmt = $pdo->prepare(
        'SELECT u.id, u.email, u.name, u.vsuccess_tier AS tier, u.created_at
         FROM auth_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token = :token
           AND t.expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch();

    return $user ?: null;
}

/**
 * Delete an auth token (used for logout).
 *
 * @param string $token
 * @return bool  True if a row was deleted
 */
function delete_token(string $token): bool
{
    $pdo  = get_pdo();
    $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE token = :token');
    $stmt->execute(['token' => $token]);

    return $stmt->rowCount() > 0;
}

/**
 * Extract the raw token string from the current request.
 *
 * @return string|null
 */
function get_request_token(): ?string
{
    $auth = $_SERVER['HTTP_AUTHORIZATION']
          ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
          ?? '';

    if (preg_match('/^Bearer\s+(.+)$/i', $auth, $matches)) {
        return $matches[1];
    }

    return $_GET['token'] ?? null;
}
