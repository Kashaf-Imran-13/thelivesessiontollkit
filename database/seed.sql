-- =========================================================
-- Full-Stack Session App - Seed Data with Polls
-- =========================================================

USE session_platform_db;

-- Clear previous demo data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE poll_responses;
TRUNCATE TABLE poll_options;
TRUNCATE TABLE polls;
TRUNCATE TABLE session_activities;
TRUNCATE TABLE participants;
TRUNCATE TABLE sessions;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert Sample Sessions
INSERT INTO sessions (id, session_code, title, description, topic, host_name, status, max_participants, created_at, started_at)
VALUES
(1, 'ARCH-101', 'Cloud Microservices Workshop', 'Interactive session on breaking down monolithic architectures into decoupled microservices.', 'Architecture', 'Sarah Jenkins', 'active', 25, NOW() - INTERVAL 45 MINUTE, NOW() - INTERVAL 30 MINUTE),
(2, 'REACT-202', 'React 19 & Next.js Masterclass', 'Hands-on review of Server Components, Actions, and modern frontend state management patterns.', 'Frontend', 'Alex Rivera', 'waiting', 15, NOW() - INTERVAL 10 MINUTE, NULL),
(3, 'DATA-303', 'Database Optimization & Indexing', 'Deep dive into MySQL query execution plans, composite indexes, and connection pooling best practices.', 'Database', 'Michael Chen', 'active', 30, NOW() - INTERVAL 80 MINUTE, NOW() - INTERVAL 60 MINUTE),
(4, 'SEC-404', 'API Security & OAuth2 Best Practices', 'Comprehensive overview of securing REST and GraphQL endpoints using JWT and refresh tokens.', 'Security', 'Elena Rostov', 'completed', 20, NOW() - INTERVAL 180 MINUTE, NOW() - INTERVAL 160 MINUTE);

-- Insert Sample Participants
INSERT INTO participants (id, session_id, name, role, is_active, joined_at)
VALUES
-- Session 1
(1, 1, 'Sarah Jenkins', 'host', TRUE, NOW() - INTERVAL 30 MINUTE),
(2, 1, 'David Miller', 'attendee', TRUE, NOW() - INTERVAL 25 MINUTE),
(3, 1, 'Sophia Patel', 'attendee', TRUE, NOW() - INTERVAL 20 MINUTE),
(4, 1, 'Lucas Gomez', 'attendee', TRUE, NOW() - INTERVAL 15 MINUTE),

-- Session 2
(5, 2, 'Alex Rivera', 'host', TRUE, NOW() - INTERVAL 10 MINUTE),
(6, 2, 'Emma Watson', 'attendee', TRUE, NOW() - INTERVAL 5 MINUTE),

-- Session 3
(7, 3, 'Michael Chen', 'host', TRUE, NOW() - INTERVAL 60 MINUTE),
(8, 3, 'Jordan Lee', 'attendee', TRUE, NOW() - INTERVAL 55 MINUTE),
(9, 3, 'Rachel Adams', 'attendee', TRUE, NOW() - INTERVAL 40 MINUTE),

-- Session 4
(10, 4, 'Elena Rostov', 'host', FALSE, NOW() - INTERVAL 160 MINUTE),
(11, 4, 'Carlos Silva', 'attendee', FALSE, NOW() - INTERVAL 155 MINUTE);

-- Insert Sample Polls (Feature #1)
INSERT INTO polls (id, session_id, question, is_active, is_closed, created_at)
VALUES
(1, 1, 'Which message broker do you prefer for microservice event streaming?', TRUE, FALSE, NOW() - INTERVAL 15 MINUTE);

-- Insert 4 Options for Poll 1
INSERT INTO poll_options (id, poll_id, option_text, option_order)
VALUES
(1, 1, 'Apache Kafka', 0),
(2, 1, 'RabbitMQ', 1),
(3, 1, 'Redis Streams / PubSub', 2),
(4, 1, 'AWS SQS & SNS / GCP PubSub', 3);

-- Insert Sample Poll Responses / Votes (Feature #3)
INSERT INTO poll_responses (poll_id, option_id, participant_id, voter_name, created_at)
VALUES
(1, 1, 2, 'David Miller', NOW() - INTERVAL 12 MINUTE),
(1, 1, 3, 'Sophia Patel', NOW() - INTERVAL 10 MINUTE),
(1, 3, 4, 'Lucas Gomez', NOW() - INTERVAL 8 MINUTE);

-- Insert Activities
INSERT INTO session_activities (session_id, participant_name, activity_type, message, created_at)
VALUES
(1, 'Sarah Jenkins', 'session_created', 'Session created by Sarah Jenkins', NOW() - INTERVAL 45 MINUTE),
(1, 'Sarah Jenkins', 'status_changed', 'Session status updated to active', NOW() - INTERVAL 30 MINUTE),
(1, 'Sarah Jenkins', 'poll_launched', 'Live Poll launched: Which message broker do you prefer for microservice event streaming?', NOW() - INTERVAL 15 MINUTE),
(1, 'David Miller', 'poll_voted', 'David Miller voted in the live poll', NOW() - INTERVAL 12 MINUTE),
(1, 'Sophia Patel', 'poll_voted', 'Sophia Patel voted in the live poll', NOW() - INTERVAL 10 MINUTE);
