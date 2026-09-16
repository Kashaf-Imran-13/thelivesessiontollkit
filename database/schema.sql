-- =========================================================
-- LiveLogic - Database Schema
-- Target Engine: MySQL 8.0+ / MariaDB 10.5+
-- =========================================================

CREATE DATABASE IF NOT EXISTS session_platform_db;
USE session_platform_db;

-- ---------------------------------------------------------
-- Table: sessions
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_code VARCHAR(12) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    topic VARCHAR(100) DEFAULT 'General',
    host_name VARCHAR(100) NOT NULL,
    host_email VARCHAR(150) NULL,
    status ENUM('waiting', 'active', 'paused', 'completed') DEFAULT 'waiting',
    max_participants INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    INDEX idx_session_code (session_code),
    INDEX idx_session_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table: participants (Access Gated with Email)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    role ENUM('host', 'co-host', 'attendee') DEFAULT 'attendee',
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_participant_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table: attendance_records (Participation Tracking)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    participant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'attendee',
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leave_time TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'connected',
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_attendance_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table: session_activities
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    participant_name VARCHAR(100) DEFAULT 'System',
    activity_type VARCHAR(50) NOT NULL,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_activity_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table: polls & quizzes
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS polls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    question TEXT NOT NULL,
    poll_type VARCHAR(20) DEFAULT 'poll',
    is_active BOOLEAN DEFAULT TRUE,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_poll_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poll_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    INDEX idx_option_poll (poll_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poll_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    option_id INT NOT NULL,
    participant_id INT NULL,
    voter_name VARCHAR(100) DEFAULT 'Anonymous',
    voter_email VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,
    INDEX idx_response_poll (poll_id),
    INDEX idx_response_option (option_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Feature 6: Q&A Module Tables
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS qa_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    participant_id INT NULL,
    author_name VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    upvotes_count INT DEFAULT 0,
    is_answered BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,
    INDEX idx_qa_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qa_upvotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    voter_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES qa_questions(id) ON DELETE CASCADE,
    UNIQUE KEY uq_question_voter (question_id, voter_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Feature 9: AI Session Insights Table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    engagement_score INT DEFAULT 85,
    accuracy_rate INT DEFAULT 90,
    key_themes TEXT NOT NULL,
    actionable_insights TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
