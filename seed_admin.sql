-- SQL to create users table and insert/update Admin credentials in phpMyAdmin

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT '',
  `address` TEXT DEFAULT NULL,
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert or Update Admin Account
-- Username: Silverhythm
-- Password: Silverhythm@2026
INSERT INTO `users` (`name`, `email`, `password`, `phone`, `address`, `is_admin`)
VALUES (
  'Silverhythm',
  'Silverhythm',
  '$2y$10$ynRK6iSxWp72xJOVrPGhAepySkjZ8viPYww.S9KvUow1yNc7V4rgC',
  '',
  '',
  1
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `password` = VALUES(`password`),
  `is_admin` = 1;
