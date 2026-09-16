const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let pool = null;
let isConnected = false;
let fallbackStore = null;

// Initial in-memory mock store for zero-friction standalone demonstrations
const initializeFallbackStore = () => {
  return {
    sessions: [
      {
        id: 1,
        session_code: 'ARCH-101',
        title: 'Cloud Microservices Workshop',
        description: 'Interactive session on breaking down monolithic architectures into decoupled microservices.',
        topic: 'Architecture',
        host_name: 'Sarah Jenkins',
        status: 'active',
        max_participants: 25,
        created_at: new Date(Date.now() - 45 * 60000).toISOString(),
        started_at: new Date(Date.now() - 30 * 60000).toISOString(),
        ended_at: null,
      },
      {
        id: 2,
        session_code: 'REACT-202',
        title: 'React 19 & Next.js Masterclass',
        description: 'Hands-on review of Server Components, Actions, and modern frontend state management patterns.',
        topic: 'Frontend',
        host_name: 'Alex Rivera',
        status: 'waiting',
        max_participants: 15,
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
        started_at: null,
        ended_at: null,
      },
      {
        id: 3,
        session_code: 'DATA-303',
        title: 'Database Optimization & Indexing',
        description: 'Deep dive into MySQL query execution plans, composite indexes, and connection pooling best practices.',
        topic: 'Database',
        host_name: 'Michael Chen',
        status: 'active',
        max_participants: 30,
        created_at: new Date(Date.now() - 80 * 60000).toISOString(),
        started_at: new Date(Date.now() - 60 * 60000).toISOString(),
        ended_at: null,
      },
      {
        id: 4,
        session_code: 'SEC-404',
        title: 'API Security & OAuth2 Best Practices',
        description: 'Comprehensive overview of securing REST and GraphQL endpoints using JWT and refresh tokens.',
        topic: 'Security',
        host_name: 'Elena Rostov',
        status: 'completed',
        max_participants: 20,
        created_at: new Date(Date.now() - 180 * 60000).toISOString(),
        started_at: new Date(Date.now() - 160 * 60000).toISOString(),
        ended_at: new Date(Date.now() - 40 * 60000).toISOString(),
      },
    ],
    participants: [
      { id: 1, session_id: 1, name: 'Sarah Jenkins', email: 'sarah.jenkins@company.com', role: 'host', is_active: true, joined_at: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: 2, session_id: 1, name: 'David Miller', email: 'david.miller@tech.org', role: 'attendee', is_active: true, joined_at: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: 3, session_id: 1, name: 'Sophia Patel', email: 'sophia.patel@design.io', role: 'attendee', is_active: true, joined_at: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: 4, session_id: 2, name: 'Alex Rivera', email: 'alex.rivera@react.dev', role: 'host', is_active: true, joined_at: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: 5, session_id: 2, name: 'Emma Watson', email: 'emma.watson@frontend.net', role: 'attendee', is_active: true, joined_at: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: 6, session_id: 3, name: 'Michael Chen', email: 'michael.chen@data.edu', role: 'host', is_active: true, joined_at: new Date(Date.now() - 60 * 60000).toISOString() },
      { id: 7, session_id: 3, name: 'Jordan Lee', email: 'jordan.lee@cloud.io', role: 'attendee', is_active: true, joined_at: new Date(Date.now() - 55 * 60000).toISOString() },
    ],
    attendance_records: [
      { id: 1, session_id: 1, participant_id: 1, name: 'Sarah Jenkins', email: 'sarah.jenkins@company.com', role: 'host', join_time: new Date(Date.now() - 30 * 60000).toISOString(), leave_time: null, duration_seconds: 1800, status: 'connected' },
      { id: 2, session_id: 1, participant_id: 2, name: 'David Miller', email: 'david.miller@tech.org', role: 'attendee', join_time: new Date(Date.now() - 25 * 60000).toISOString(), leave_time: null, duration_seconds: 1500, status: 'connected' },
      { id: 3, session_id: 1, participant_id: 3, name: 'Sophia Patel', email: 'sophia.patel@design.io', role: 'attendee', join_time: new Date(Date.now() - 20 * 60000).toISOString(), leave_time: null, duration_seconds: 1200, status: 'connected' },
    ],
    activities: [
      { id: 1, session_id: 1, participant_name: 'Sarah Jenkins', activity_type: 'session_created', message: 'Session created by Sarah Jenkins', created_at: new Date(Date.now() - 45 * 60000).toISOString() },
      { id: 2, session_id: 1, participant_name: 'Sarah Jenkins', activity_type: 'status_changed', message: 'Session status updated to active', created_at: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: 3, session_id: 2, participant_name: 'Alex Rivera', activity_type: 'session_created', message: 'Session created by Alex Rivera', created_at: new Date(Date.now() - 10 * 60000).toISOString() },
    ],
    polls: [
      {
        id: 1,
        session_id: 1,
        question: 'Which message broker do you prefer for microservice event streaming?',
        poll_type: 'poll',
        is_active: true,
        is_closed: false,
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
        closed_at: null,
      },
    ],
    poll_options: [
      { id: 1, poll_id: 1, option_text: 'Apache Kafka', is_correct: false, option_order: 0 },
      { id: 2, poll_id: 1, option_text: 'RabbitMQ', is_correct: false, option_order: 1 },
      { id: 3, poll_id: 1, option_text: 'Redis Streams / PubSub', is_correct: false, option_order: 2 },
      { id: 4, poll_id: 1, option_text: 'AWS SQS & SNS / GCP PubSub', is_correct: false, option_order: 3 },
    ],
    poll_responses: [
      { id: 1, poll_id: 1, option_id: 1, participant_id: 2, voter_name: 'David Miller', voter_email: 'david.miller@tech.org', created_at: new Date(Date.now() - 12 * 60000).toISOString() },
      { id: 2, poll_id: 1, option_id: 1, participant_id: 3, voter_name: 'Sophia Patel', voter_email: 'sophia.patel@design.io', created_at: new Date(Date.now() - 10 * 60000).toISOString() },
    ],
    qa_questions: [
      {
        id: 1,
        session_id: 1,
        participant_id: 2,
        author_name: 'David Miller',
        question_text: 'How should we handle distributed transactions across microservices without 2-phase commit bottlenecks?',
        upvotes_count: 5,
        is_answered: false,
        is_pinned: true,
        created_at: new Date(Date.now() - 18 * 60000).toISOString(),
      },
      {
        id: 2,
        session_id: 1,
        participant_id: 3,
        author_name: 'Sophia Patel',
        question_text: 'What are the recommended observability tools for tracing asynchronous event payloads?',
        upvotes_count: 3,
        is_answered: true,
        is_pinned: false,
        created_at: new Date(Date.now() - 14 * 60000).toISOString(),
      },
    ],
    qa_upvotes: [
      { id: 1, question_id: 1, voter_key: 'voter-101' },
      { id: 2, question_id: 1, voter_key: 'voter-102' },
      { id: 3, question_id: 2, voter_key: 'voter-101' },
    ],
    session_insights: [
      {
        session_id: 4,
        summary: 'High-engagement session focused on OAuth2 security and JWT revocation strategies. Participants demonstrated 92% quiz accuracy with key interest in token rotation.',
        engagement_score: 92,
        accuracy_rate: 88,
        key_themes: JSON.stringify(['Token Revocation', 'Zero Trust Architecture', 'Refresh Token Rotation', 'OAuth2 Scopes']),
        actionable_insights: JSON.stringify([
          'Follow up with reference architecture for Redis-backed token blacklist.',
          'Schedule a 30-minute workshop on OAuth2 Proof of Possession (DPoP).',
        ]),
        generated_at: new Date(Date.now() - 35 * 60000).toISOString(),
      },
    ],
    nextSessionId: 5,
    nextParticipantId: 8,
    nextAttendanceId: 4,
    nextActivityId: 4,
    nextPollId: 2,
    nextOptionId: 5,
    nextResponseId: 3,
    nextQAId: 3,
    nextUpvoteId: 4,
  };
};

const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'session_platform_db',
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000,
    });

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isConnected = true;
    console.log(`[Database] Successfully connected to MySQL server (${process.env.DB_NAME || 'session_platform_db'}).`);
  } catch (error) {
    console.warn(`[Database] MySQL connection notice: ${error.message}`);
    console.log(`[Database] Operating in Standalone Resilient Mode (in-memory persistent state). Live MySQL connection will be used when available.`);
    isConnected = false;
    if (!fallbackStore) {
      fallbackStore = initializeFallbackStore();
    }
  }
};

const getDBStatus = () => {
  return {
    mode: isConnected ? 'mysql_live' : 'in_memory_resilient',
    connected: isConnected,
    database: process.env.DB_NAME || 'session_platform_db',
    host: process.env.DB_HOST || 'localhost',
  };
};

const getFallbackStore = () => {
  if (!fallbackStore) {
    fallbackStore = initializeFallbackStore();
  }
  return fallbackStore;
};

const query = async (sql, params = []) => {
  if (isConnected && pool) {
    return await pool.query(sql, params);
  }
  return null;
};

module.exports = {
  connectDB,
  getDBStatus,
  getFallbackStore,
  query,
  isLive: () => isConnected,
  getPool: () => pool,
};
