-- =============================================================================
-- VSuccess — Database Migration
-- Target: `u480328775_bits` database on Hostinger
-- Run this in phpMyAdmin after backing up the existing tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add tier & name columns to existing `users` table
-- ---------------------------------------------------------------------------
ALTER TABLE `users`
  ADD COLUMN `vsuccess_tier` ENUM('free', 'paid') NOT NULL DEFAULT 'free'
    AFTER `home_board_id`,
  ADD COLUMN `name` VARCHAR(100) DEFAULT NULL
    AFTER `email`;

-- ---------------------------------------------------------------------------
-- 2. Create `search_queries` — Free tier quota tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `search_queries` (
  `id`          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT(20) UNSIGNED NOT NULL,
  `niche`       VARCHAR(180) NOT NULL,
  `searched_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_search_queries_user_week` (`user_id`, `searched_at`),
  CONSTRAINT `fk_search_queries_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. Create `bookmarks` — Saved videos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id`             BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        BIGINT(20) UNSIGNED NOT NULL,
  `video_id`       VARCHAR(30) NOT NULL,
  `video_title`    VARCHAR(255) NOT NULL,
  `channel_title`  VARCHAR(255) NOT NULL,
  `channel_id`     VARCHAR(50) DEFAULT NULL,
  `thumbnail_url`  VARCHAR(500) DEFAULT NULL,
  `view_count`     BIGINT(20) UNSIGNED DEFAULT 0,
  `notes`          TEXT DEFAULT NULL,
  `saved_at`       TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_video` (`user_id`, `video_id`),
  CONSTRAINT `fk_bookmarks_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. Create `collections` — Groups of bookmarks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `collections` (
  `id`          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT(20) UNSIGNED NOT NULL,
  `name`        VARCHAR(160) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at`  TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_collections_user` (`user_id`),
  CONSTRAINT `fk_collections_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. Create `collection_items` — Videos inside collections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `collection_items` (
  `id`            BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT(20) UNSIGNED NOT NULL,
  `bookmark_id`   BIGINT(20) UNSIGNED NOT NULL,
  `position`      INT(11) NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_collection_bookmark` (`collection_id`, `bookmark_id`),
  KEY `fk_collection_items_bookmark` (`bookmark_id`),
  CONSTRAINT `fk_collection_items_collection`
    FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_collection_items_bookmark`
    FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. Create `followed_channels` — Track channels users want to follow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `followed_channels` (
  `id`              BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`         BIGINT(20) UNSIGNED NOT NULL,
  `channel_id`      VARCHAR(50) NOT NULL,
  `channel_title`   VARCHAR(255) NOT NULL,
  `channel_avatar`  VARCHAR(500) DEFAULT NULL,
  `followed_at`     TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_channel` (`user_id`, `channel_id`),
  CONSTRAINT `fk_followed_channels_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Done!
-- ---------------------------------------------------------------------------
