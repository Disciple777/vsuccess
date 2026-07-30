<?php
/**
 * db.php — PDO Database Connection
 * 
 * Singleton pattern. Loads credentials from config.php (if present),
 * otherwise falls back to environment variables (getenv).
 *
 * Usage:
 *   $pdo = get_pdo();
 *
 * Setup:
 *   1. Copy config.example.php to config.php
 *   2. Fill in your Hostinger database credentials
 *   3. config.php is gitignored — credentials stay safe
 */

/**
 * Load local config file if it exists (gitignored, holds real credentials).
 */
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

/**
 * Get or create the PDO singleton connection.
 *
 * @return PDO
 * @throws PDOException
 */
function get_pdo(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $host     = defined('DB_HOST')     ? DB_HOST     : (getenv('DB_HOST')     ?: 'localhost');
        $port     = defined('DB_PORT')     ? DB_PORT     : (getenv('DB_PORT')     ?: '3306');
        $dbname   = defined('DB_NAME')     ? DB_NAME     : (getenv('DB_NAME')     ?: 'u480328775_bits');
        $username = defined('DB_USER')     ? DB_USER     : (getenv('DB_USER')     ?: 'u480328775_bits');
        $password = defined('DB_PASSWORD') ? DB_PASSWORD : (getenv('DB_PASSWORD') ?: '');
        $charset  = 'utf8mb4';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }

    return $pdo;
}
