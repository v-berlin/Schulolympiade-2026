-- Database initialization for Schulolympiade
CREATE DATABASE IF NOT EXISTS schulolympiade;
USE schulolympiade;

-- Results table
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team VARCHAR(100) NOT NULL,
    disziplin VARCHAR(200) NOT NULL,
    punkte INT NOT NULL,
    platz INT NOT NULL,
    uhr TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_team (team),
    INDEX idx_disziplin (disziplin),
    INDEX idx_uhr (uhr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Emoji mappings are now stored in services/dashboard/public/data/emojiMap.json
