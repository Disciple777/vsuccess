<?php
/**
 * check_usage.php — Check remaining free searches (GET)
 *
 * Returns the number of remaining searches for the current week (Mon–Sun).
 * Paid users get unlimited (-1). Unauthenticated requests return null.
 *
 * Responses:
 *   200 — { "success": true, "data": { "remaining": 3, "total": 5, "tier": "free" } }
 *   200 — { "success": true, "data": { "remaining": -1, "total": -1, "tier": "paid" } }
 *   401 — { "success": false, "error": "Authentication required" }
 */

require_once __DIR__ . '/helpers.php';
set_cors_headers();

// ── Auth check ────────────────────────────────────────
$user = validate_token();
if (!$user) {
    json_error('Authentication required', 401);
}

// ── Paid users — unlimited ────────────────────────────
if ($user['vsuccess_tier'] === 'paid') {
    json_response([
        'success' => true,
        'data' => [
            'remaining' => -1,
            'total'     => -1,
            'tier'      => 'paid',
        ],
    ]);
}

// ── Free users — count this week's searches ───────────
$pdo = get_pdo();

// Week = Monday 00:00 to Sunday 23:59
$stmt = $pdo->prepare('
    SELECT COUNT(*) AS cnt
    FROM search_queries
    WHERE user_id = :user_id
      AND searched_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
');
$stmt->execute(['user_id' => $user['id']]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

$total     = 5;
$used      = (int)($row['cnt'] ?? 0);
$remaining = max(0, $total - $used);

json_response([
    'success' => true,
    'data' => [
        'remaining' => $remaining,
        'total'     => $total,
        'tier'      => 'free',
    ],
]);
