-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 28, 2026 at 08:01 PM
-- Server version: 11.8.8-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u480328775_bits`
--

-- --------------------------------------------------------

--
-- Table structure for table `auth_tokens`
--

CREATE TABLE `auth_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bits`
--

CREATE TABLE `bits` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `bit_type` varchar(40) NOT NULL,
  `title` varchar(180) NOT NULL,
  `content_preview` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_attachments`
--

CREATE TABLE `bit_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `relative_path` varchar(255) NOT NULL,
  `mime_type` varchar(120) NOT NULL,
  `size_bytes` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_attachment_bits`
--

CREATE TABLE `bit_attachment_bits` (
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `relative_path` varchar(255) NOT NULL,
  `mime_type` varchar(120) NOT NULL,
  `size_bytes` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_cards`
--

CREATE TABLE `bit_cards` (
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `due_at` datetime DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `is_hidden` tinyint(1) NOT NULL DEFAULT 0,
  `published_on_tiktok` tinyint(1) NOT NULL DEFAULT 0,
  `published_on_youtube` tinyint(1) NOT NULL DEFAULT 0,
  `published_on_instagram` tinyint(1) NOT NULL DEFAULT 0,
  `has_scenes` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_checklists`
--

CREATE TABLE `bit_checklists` (
  `bit_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_checklist_items`
--

CREATE TABLE `bit_checklist_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `content` varchar(255) NOT NULL,
  `is_done` tinyint(1) NOT NULL DEFAULT 0,
  `position` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_checklist_item_bits`
--

CREATE TABLE `bit_checklist_item_bits` (
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `is_done` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_comments`
--

CREATE TABLE `bit_comments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_comment_bits`
--

CREATE TABLE `bit_comment_bits` (
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `author_user_id` bigint(20) UNSIGNED NOT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_labels`
--

CREATE TABLE `bit_labels` (
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `label_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_linked_file_bits`
--

CREATE TABLE `bit_linked_file_bits` (
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `original_name` varchar(255) NOT NULL,
  `locator` varchar(500) NOT NULL,
  `mime_type` varchar(120) NOT NULL,
  `size_bytes` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `source_label` varchar(120) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_notes`
--

CREATE TABLE `bit_notes` (
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `body` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_relations`
--

CREATE TABLE `bit_relations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `parent_bit_id` bigint(20) UNSIGNED NOT NULL,
  `child_bit_id` bigint(20) UNSIGNED NOT NULL,
  `relation_type` varchar(40) NOT NULL,
  `position` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bit_scene_bits`
--

CREATE TABLE `bit_scene_bits` (
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `scene_number` int(11) NOT NULL DEFAULT 1,
  `timestamp_in` decimal(10,2) DEFAULT NULL,
  `duration` decimal(10,2) DEFAULT NULL,
  `is_done` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `boards`
--

CREATE TABLE `boards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `color_theme` varchar(40) NOT NULL DEFAULT 'melon',
  `board_type` varchar(30) NOT NULL DEFAULT 'general',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `board_bit_instances`
--

CREATE TABLE `board_bit_instances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `board_id` bigint(20) UNSIGNED NOT NULL,
  `board_list_id` bigint(20) UNSIGNED NOT NULL,
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `position` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `board_lists`
--

CREATE TABLE `board_lists` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `board_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(160) NOT NULL,
  `position` int(11) NOT NULL DEFAULT 1,
  `is_hidden` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `labels`
--

CREATE TABLE `labels` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL,
  `color_hex` char(7) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stickly_bit_instances`
--

CREATE TABLE `stickly_bit_instances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `bit_id` bigint(20) UNSIGNED NOT NULL,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `surface_id` bigint(20) UNSIGNED NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `color_hex` char(7) NOT NULL DEFAULT '#F9D976',
  `size_code` varchar(10) NOT NULL DEFAULT 'M',
  `x` int(11) NOT NULL DEFAULT 0,
  `y` int(11) NOT NULL DEFAULT 0,
  `rotation` decimal(5,2) NOT NULL DEFAULT 0.00,
  `expires_at` datetime DEFAULT NULL,
  `won_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stickly_surfaces`
--

CREATE TABLE `stickly_surfaces` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(160) NOT NULL,
  `surface_kind` varchar(20) NOT NULL DEFAULT 'built_in',
  `texture_key` varchar(40) DEFAULT NULL,
  `background_color` char(7) DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stickly_user_preferences`
--

CREATE TABLE `stickly_user_preferences` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `home_surface_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `home_board_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `fk_auth_tokens_user` (`user_id`);

--
-- Indexes for table `bits`
--
ALTER TABLE `bits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bits_owner_type` (`owner_user_id`,`bit_type`);

--
-- Indexes for table `bit_attachments`
--
ALTER TABLE `bit_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bit_attachments_user` (`user_id`),
  ADD KEY `idx_bit_attachments_bit` (`bit_id`);

--
-- Indexes for table `bit_attachment_bits`
--
ALTER TABLE `bit_attachment_bits`
  ADD PRIMARY KEY (`bit_id`),
  ADD KEY `fk_bit_attachment_bits_user` (`user_id`);

--
-- Indexes for table `bit_cards`
--
ALTER TABLE `bit_cards`
  ADD PRIMARY KEY (`bit_id`),
  ADD KEY `idx_bit_cards_due_archived` (`due_at`,`is_archived`,`is_hidden`);

--
-- Indexes for table `bit_checklists`
--
ALTER TABLE `bit_checklists`
  ADD PRIMARY KEY (`bit_id`);

--
-- Indexes for table `bit_checklist_items`
--
ALTER TABLE `bit_checklist_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bit_checklist_bit_position` (`bit_id`,`position`);

--
-- Indexes for table `bit_checklist_item_bits`
--
ALTER TABLE `bit_checklist_item_bits`
  ADD PRIMARY KEY (`bit_id`);

--
-- Indexes for table `bit_comments`
--
ALTER TABLE `bit_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bit_comments_user` (`user_id`),
  ADD KEY `idx_bit_comments_bit_created` (`bit_id`,`created_at`);

--
-- Indexes for table `bit_comment_bits`
--
ALTER TABLE `bit_comment_bits`
  ADD PRIMARY KEY (`bit_id`),
  ADD KEY `fk_bit_comment_bits_author` (`author_user_id`);

--
-- Indexes for table `bit_labels`
--
ALTER TABLE `bit_labels`
  ADD PRIMARY KEY (`bit_id`,`label_id`),
  ADD KEY `fk_bit_labels_label` (`label_id`);

--
-- Indexes for table `bit_linked_file_bits`
--
ALTER TABLE `bit_linked_file_bits`
  ADD PRIMARY KEY (`bit_id`),
  ADD KEY `fk_bit_linked_file_bits_user` (`user_id`);

--
-- Indexes for table `bit_notes`
--
ALTER TABLE `bit_notes`
  ADD PRIMARY KEY (`bit_id`);

--
-- Indexes for table `bit_relations`
--
ALTER TABLE `bit_relations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_bit_relations_parent_child_type` (`parent_bit_id`,`child_bit_id`,`relation_type`),
  ADD KEY `fk_bit_relations_child` (`child_bit_id`),
  ADD KEY `idx_bit_relations_parent_type_position` (`parent_bit_id`,`relation_type`,`position`);

--
-- Indexes for table `bit_scene_bits`
--
ALTER TABLE `bit_scene_bits`
  ADD PRIMARY KEY (`bit_id`);

--
-- Indexes for table `boards`
--
ALTER TABLE `boards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_boards_owner` (`owner_user_id`);

--
-- Indexes for table `board_bit_instances`
--
ALTER TABLE `board_bit_instances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_board_bit_instances_board` (`board_id`),
  ADD KEY `idx_board_instances_list_position` (`board_list_id`,`position`),
  ADD KEY `idx_board_instances_bit` (`bit_id`);

--
-- Indexes for table `board_lists`
--
ALTER TABLE `board_lists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_board_lists_board_position` (`board_id`,`position`,`is_hidden`);

--
-- Indexes for table `labels`
--
ALTER TABLE `labels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_labels_owner` (`owner_user_id`);

--
-- Indexes for table `stickly_bit_instances`
--
ALTER TABLE `stickly_bit_instances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_stickly_instances_bit` (`bit_id`),
  ADD KEY `fk_stickly_instances_owner` (`owner_user_id`),
  ADD KEY `fk_stickly_instances_surface` (`surface_id`),
  ADD KEY `idx_stickly_instances_surface_status` (`surface_id`,`status`),
  ADD KEY `idx_stickly_instances_owner_status` (`owner_user_id`,`status`),
  ADD KEY `idx_stickly_instances_expires_at` (`expires_at`),
  ADD KEY `idx_stickly_instances_won_at` (`won_at`);

--
-- Indexes for table `stickly_surfaces`
--
ALTER TABLE `stickly_surfaces`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_stickly_surfaces_owner` (`owner_user_id`),
  ADD KEY `idx_stickly_surfaces_owner_position` (`owner_user_id`,`position`);

--
-- Indexes for table `stickly_user_preferences`
--
ALTER TABLE `stickly_user_preferences`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `fk_stickly_prefs_home_surface` (`home_surface_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_home_board` (`home_board_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bits`
--
ALTER TABLE `bits`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bit_attachments`
--
ALTER TABLE `bit_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bit_checklist_items`
--
ALTER TABLE `bit_checklist_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bit_comments`
--
ALTER TABLE `bit_comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bit_relations`
--
ALTER TABLE `bit_relations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `boards`
--
ALTER TABLE `boards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `board_bit_instances`
--
ALTER TABLE `board_bit_instances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `board_lists`
--
ALTER TABLE `board_lists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `labels`
--
ALTER TABLE `labels`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stickly_bit_instances`
--
ALTER TABLE `stickly_bit_instances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stickly_surfaces`
--
ALTER TABLE `stickly_surfaces`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD CONSTRAINT `fk_auth_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bits`
--
ALTER TABLE `bits`
  ADD CONSTRAINT `fk_bits_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_attachments`
--
ALTER TABLE `bit_attachments`
  ADD CONSTRAINT `fk_bit_attachments_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bit_attachments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_attachment_bits`
--
ALTER TABLE `bit_attachment_bits`
  ADD CONSTRAINT `fk_bit_attachment_bits_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bit_attachment_bits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_cards`
--
ALTER TABLE `bit_cards`
  ADD CONSTRAINT `fk_bit_cards_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_checklists`
--
ALTER TABLE `bit_checklists`
  ADD CONSTRAINT `fk_bit_checklists_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_checklist_items`
--
ALTER TABLE `bit_checklist_items`
  ADD CONSTRAINT `fk_bit_checklist_items_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_checklist_item_bits`
--
ALTER TABLE `bit_checklist_item_bits`
  ADD CONSTRAINT `fk_bit_checklist_item_bits_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_comments`
--
ALTER TABLE `bit_comments`
  ADD CONSTRAINT `fk_bit_comments_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bit_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_comment_bits`
--
ALTER TABLE `bit_comment_bits`
  ADD CONSTRAINT `fk_bit_comment_bits_author` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bit_comment_bits_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_labels`
--
ALTER TABLE `bit_labels`
  ADD CONSTRAINT `fk_bit_labels_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bit_labels_label` FOREIGN KEY (`label_id`) REFERENCES `labels` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_linked_file_bits`
--
ALTER TABLE `bit_linked_file_bits`
  ADD CONSTRAINT `fk_bit_linked_file_bits_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bit_linked_file_bits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_notes`
--
ALTER TABLE `bit_notes`
  ADD CONSTRAINT `fk_bit_notes_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_relations`
--
ALTER TABLE `bit_relations`
  ADD CONSTRAINT `fk_bit_relations_child` FOREIGN KEY (`child_bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bit_relations_parent` FOREIGN KEY (`parent_bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bit_scene_bits`
--
ALTER TABLE `bit_scene_bits`
  ADD CONSTRAINT `fk_bit_scene_bits_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `boards`
--
ALTER TABLE `boards`
  ADD CONSTRAINT `fk_boards_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `board_bit_instances`
--
ALTER TABLE `board_bit_instances`
  ADD CONSTRAINT `fk_board_bit_instances_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_board_bit_instances_board` FOREIGN KEY (`board_id`) REFERENCES `boards` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_board_bit_instances_list` FOREIGN KEY (`board_list_id`) REFERENCES `board_lists` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `board_lists`
--
ALTER TABLE `board_lists`
  ADD CONSTRAINT `fk_board_lists_board` FOREIGN KEY (`board_id`) REFERENCES `boards` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `labels`
--
ALTER TABLE `labels`
  ADD CONSTRAINT `fk_labels_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stickly_bit_instances`
--
ALTER TABLE `stickly_bit_instances`
  ADD CONSTRAINT `fk_stickly_instances_bit` FOREIGN KEY (`bit_id`) REFERENCES `bits` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_stickly_instances_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_stickly_instances_surface` FOREIGN KEY (`surface_id`) REFERENCES `stickly_surfaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stickly_surfaces`
--
ALTER TABLE `stickly_surfaces`
  ADD CONSTRAINT `fk_stickly_surfaces_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stickly_user_preferences`
--
ALTER TABLE `stickly_user_preferences`
  ADD CONSTRAINT `fk_stickly_prefs_home_surface` FOREIGN KEY (`home_surface_id`) REFERENCES `stickly_surfaces` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_stickly_prefs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_home_board` FOREIGN KEY (`home_board_id`) REFERENCES `boards` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
