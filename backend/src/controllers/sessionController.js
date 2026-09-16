const db = require('../config/db');

// Helper to generate clean unique session code (e.g., SES-9482)
const generateSessionCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SES-${code}`;
};

// 1. Health check
const getHealth = (req, res) => {
  const dbStatus = db.getDBStatus();
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
  });
};

// 2. Get all sessions
const getAllSessions = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    if (db.isLive()) {
      let querySql = `
        SELECT s.*, 
               COUNT(p.id) AS participant_count 
        FROM sessions s
        LEFT JOIN participants p ON s.id = p.session_id AND p.is_active = TRUE
      `;
      const queryParams = [];
      const conditions = [];

      if (status && status !== 'all') {
        conditions.push('s.status = ?');
        queryParams.push(status);
      }
      if (search) {
        conditions.push('(s.title LIKE ? OR s.session_code LIKE ? OR s.host_name LIKE ? OR s.topic LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (conditions.length > 0) {
        querySql += ' WHERE ' + conditions.join(' AND ');
      }

      querySql += ' GROUP BY s.id ORDER BY s.created_at DESC';

      const [rows] = await db.query(querySql, queryParams);
      return res.json({ success: true, data: rows });
    }

    // Fallback store
    const store = db.getFallbackStore();
    let sessions = [...store.sessions];

    if (status && status !== 'all') {
      sessions = sessions.filter((s) => s.status === status);
    }
    if (search) {
      const term = search.toLowerCase();
      sessions = sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.session_code.toLowerCase().includes(term) ||
          s.host_name.toLowerCase().includes(term) ||
          (s.topic && s.topic.toLowerCase().includes(term))
      );
    }

    const sessionsWithCount = sessions.map((s) => {
      const count = store.participants.filter((p) => p.session_id === s.id && p.is_active).length;
      return { ...s, participant_count: count };
    });

    sessionsWithCount.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({ success: true, data: sessionsWithCount });
  } catch (error) {
    next(error);
  }
};

// 3. Get session by ID
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (db.isLive()) {
      const [sessions] = await db.query('SELECT * FROM sessions WHERE id = ?', [id]);
      if (!sessions || sessions.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Session not found' } });
      }

      const session = sessions[0];
      const [participants] = await db.query(
        'SELECT * FROM participants WHERE session_id = ? AND is_active = TRUE ORDER BY joined_at ASC',
        [id]
      );
      const [activities] = await db.query(
        'SELECT * FROM session_activities WHERE session_id = ? ORDER BY created_at DESC LIMIT 20',
        [id]
      );

      return res.json({
        success: true,
        data: {
          ...session,
          participants,
          activities,
          participant_count: participants.length,
        },
      });
    }

    // Fallback store
    const store = db.getFallbackStore();
    const session = store.sessions.find((s) => s.id === Number(id) || s.session_code === id);
    if (!session) {
      return res.status(404).json({ success: false, error: { message: 'Session not found' } });
    }

    const participants = store.participants.filter((p) => p.session_id === session.id && p.is_active);
    const activities = store.activities.filter((a) => a.session_id === session.id);

    return res.json({
      success: true,
      data: {
        ...session,
        participants,
        activities,
        participant_count: participants.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 4. Create new session
const createSession = async (req, res, next) => {
  try {
    const { title, description, topic = 'General', host_name, max_participants = 20 } = req.body;

    if (!title || !host_name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title and Host Name are required fields.' },
      });
    }

    const session_code = generateSessionCode();

    if (db.isLive()) {
      const [result] = await db.query(
        'INSERT INTO sessions (session_code, title, description, topic, host_name, status, max_participants) VALUES (?, ?, ?, ?, ?, "waiting", ?)',
        [session_code, title, description || '', topic, host_name, Number(max_participants) || 20]
      );

      const sessionId = result.insertId;

      // Add creator as host participant
      const [partResult] = await db.query(
        'INSERT INTO participants (session_id, name, role, is_active) VALUES (?, ?, "host", TRUE)',
        [sessionId, host_name]
      );

      // Record activity
      await db.query(
        'INSERT INTO session_activities (session_id, participant_name, activity_type, message) VALUES (?, ?, "session_created", ?)',
        [sessionId, host_name, `Session "${title}" created by ${host_name}`]
      );

      const newSession = {
        id: sessionId,
        session_code,
        title,
        description,
        topic,
        host_name,
        status: 'waiting',
        max_participants: Number(max_participants) || 20,
        created_at: new Date().toISOString(),
        participant_count: 1,
      };

      return res.status(201).json({
        success: true,
        message: 'Session created successfully',
        data: newSession,
      });
    }

    // Fallback store
    const store = db.getFallbackStore();
    const sessionId = store.nextSessionId++;

    const newSession = {
      id: sessionId,
      session_code,
      title,
      description: description || '',
      topic,
      host_name,
      status: 'waiting',
      max_participants: Number(max_participants) || 20,
      created_at: new Date().toISOString(),
      started_at: null,
      ended_at: null,
    };

    store.sessions.unshift(newSession);

    // Host participant
    const hostParticipant = {
      id: store.nextParticipantId++,
      session_id: sessionId,
      name: host_name,
      role: 'host',
      is_active: true,
      joined_at: new Date().toISOString(),
    };
    store.participants.push(hostParticipant);

    // Activity
    store.activities.unshift({
      id: store.nextActivityId++,
      session_id: sessionId,
      participant_name: host_name,
      activity_type: 'session_created',
      message: `Session "${title}" created by ${host_name}`,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { ...newSession, participant_count: 1 },
    });
  } catch (error) {
    next(error);
  }
};

// 5. Join session (Access Gate requiring Name and Email)
const joinSession = async (req, res, next) => {
  try {
    const { session_code, participant_name, participant_email, role = 'attendee' } = req.body;

    if (!session_code || !participant_name || !participant_name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Session Code and Your Name are required to join.' },
      });
    }

    const email = (participant_email && participant_email.trim()) || `${participant_name.trim().toLowerCase().replace(/\s+/g, '.')}@attendee.livelogic.io`;
    const cleanCode = session_code.trim().toUpperCase();

    if (db.isLive()) {
      const [sessions] = await db.query('SELECT * FROM sessions WHERE session_code = ?', [cleanCode]);
      if (!sessions || sessions.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Invalid session code. No session found.' } });
      }

      const session = sessions[0];
      if (session.status === 'completed') {
        return res.status(400).json({ success: false, error: { message: 'This session has already ended.' } });
      }

      const [activeParticipants] = await db.query(
        'SELECT * FROM participants WHERE session_id = ? AND is_active = TRUE',
        [session.id]
      );

      if (activeParticipants.length >= session.max_participants) {
        return res.status(400).json({ success: false, error: { message: 'Session has reached maximum capacity.' } });
      }

      // Check if user is already joined
      const existing = activeParticipants.find(
        (p) => p.name.toLowerCase() === participant_name.trim().toLowerCase()
      );

      let participantId;
      if (existing) {
        participantId = existing.id;
      } else {
        const [insertResult] = await db.query(
          'INSERT INTO participants (session_id, name, email, role, is_active) VALUES (?, ?, ?, ?, TRUE)',
          [session.id, participant_name.trim(), email, role]
        );
        participantId = insertResult.insertId;

        // Add attendance record
        await db.query(
          'INSERT INTO attendance_records (session_id, participant_id, name, email, role, status) VALUES (?, ?, ?, ?, ?, "connected")',
          [session.id, participantId, participant_name.trim(), email, role]
        );

        // Activity
        await db.query(
          'INSERT INTO session_activities (session_id, participant_name, activity_type, message) VALUES (?, ?, "user_joined", ?)',
          [session.id, participant_name.trim(), `${participant_name.trim()} (${email}) joined the session`]
        );
      }

      return res.json({
        success: true,
        message: 'Successfully joined session',
        data: {
          session_id: session.id,
          session_code: session.session_code,
          title: session.title,
          participant_id: participantId,
          participant_name: participant_name.trim(),
          participant_email: email,
          role: existing ? existing.role : role,
        },
      });
    }

    // Fallback store
    const store = db.getFallbackStore();
    const session = store.sessions.find((s) => s.session_code.toUpperCase() === cleanCode);
    if (!session) {
      return res.status(404).json({ success: false, error: { message: 'Invalid session code. No session found.' } });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, error: { message: 'This session has already ended.' } });
    }

    const currentParticipants = store.participants.filter((p) => p.session_id === session.id && p.is_active);
    if (currentParticipants.length >= session.max_participants) {
      return res.status(400).json({ success: false, error: { message: 'Session has reached maximum capacity.' } });
    }

    let participant = currentParticipants.find(
      (p) => p.name.toLowerCase() === participant_name.trim().toLowerCase()
    );

    if (!participant) {
      participant = {
        id: store.nextParticipantId++,
        session_id: session.id,
        name: participant_name.trim(),
        email: email,
        role: role,
        is_active: true,
        joined_at: new Date().toISOString(),
      };
      store.participants.push(participant);

      // Attendance log
      store.attendance_records.push({
        id: store.nextAttendanceId++,
        session_id: session.id,
        participant_id: participant.id,
        name: participant.name,
        email: email,
        role: role,
        join_time: new Date().toISOString(),
        leave_time: null,
        duration_seconds: 0,
        status: 'connected',
      });

      store.activities.unshift({
        id: store.nextActivityId++,
        session_id: session.id,
        participant_name: participant.name,
        activity_type: 'user_joined',
        message: `${participant.name} (${email}) joined the session`,
        created_at: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      message: 'Successfully joined session',
      data: {
        session_id: session.id,
        session_code: session.session_code,
        title: session.title,
        participant_id: participant.id,
        participant_name: participant.name,
        participant_email: email,
        role: participant.role,
      },
    });
  } catch (error) {
    next(error);
  }
};


// 6. Update session status
const updateSessionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, actor_name = 'Host' } = req.body;

    const validStatuses = ['waiting', 'active', 'paused', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      });
    }

    if (db.isLive()) {
      let updateSql = 'UPDATE sessions SET status = ?';
      const params = [status];

      if (status === 'active') {
        updateSql += ', started_at = COALESCE(started_at, NOW())';
      } else if (status === 'completed') {
        updateSql += ', ended_at = NOW()';
      }
      updateSql += ' WHERE id = ?';
      params.push(id);

      await db.query(updateSql, params);

      // Record activity
      await db.query(
        'INSERT INTO session_activities (session_id, participant_name, activity_type, message) VALUES (?, ?, "status_changed", ?)',
        [id, actor_name, `Session status updated to "${status}" by ${actor_name}`]
      );

      return res.json({
        success: true,
        message: `Session status updated to ${status}`,
        data: { id: Number(id), status },
      });
    }

    // Fallback store
    const store = db.getFallbackStore();
    const session = store.sessions.find((s) => s.id === Number(id));
    if (!session) {
      return res.status(404).json({ success: false, error: { message: 'Session not found' } });
    }

    session.status = status;
    if (status === 'active' && !session.started_at) {
      session.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      session.ended_at = new Date().toISOString();
    }

    store.activities.unshift({
      id: store.nextActivityId++,
      session_id: session.id,
      participant_name: actor_name,
      activity_type: 'status_changed',
      message: `Session status updated to "${status}" by ${actor_name}`,
      created_at: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Session status updated to ${status}`,
      data: { id: session.id, status: session.status },
    });
  } catch (error) {
    next(error);
  }
};

// 7. Delete session
const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (db.isLive()) {
      await db.query('DELETE FROM sessions WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Session deleted successfully' });
    }

    const store = db.getFallbackStore();
    store.sessions = store.sessions.filter((s) => s.id !== Number(id));
    store.participants = store.participants.filter((p) => p.session_id !== Number(id));
    store.activities = store.activities.filter((a) => a.session_id !== Number(id));

    return res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// =========================================================
// Feature #1 & #3: Poll Controllers
// =========================================================

// 8. Create & Launch Poll (Question + 4 options)
const createPoll = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const { question, options = [], host_name = 'Host' } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Poll question is required.' },
      });
    }

    const filteredOptions = options.map((opt) => String(opt).trim()).filter((opt) => opt.length > 0);
    if (filteredOptions.length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'At least 2 poll options are required (up to 4 options).' },
      });
    }

    if (db.isLive()) {
      // Mark previous polls as closed
      await db.query('UPDATE polls SET is_active = FALSE, is_closed = TRUE, closed_at = NOW() WHERE session_id = ? AND is_active = TRUE', [sessionId]);

      const [pollResult] = await db.query(
        'INSERT INTO polls (session_id, question, is_active, is_closed) VALUES (?, ?, TRUE, FALSE)',
        [sessionId, question.trim()]
      );
      const pollId = pollResult.insertId;

      const createdOptions = [];
      for (let i = 0; i < filteredOptions.length; i++) {
        const [optResult] = await db.query(
          'INSERT INTO poll_options (poll_id, option_text, option_order) VALUES (?, ?, ?)',
          [pollId, filteredOptions[i], i]
        );
        createdOptions.push({
          id: optResult.insertId,
          poll_id: pollId,
          option_text: filteredOptions[i],
          option_order: i,
          vote_count: 0,
          percentage: 0,
        });
      }

      // Record activity
      await db.query(
        'INSERT INTO session_activities (session_id, participant_name, activity_type, message) VALUES (?, ?, "poll_launched", ?)',
        [sessionId, host_name, `Live Poll launched: "${question.trim()}"`]
      );

      return res.status(201).json({
        success: true,
        message: 'Poll launched successfully',
        data: {
          id: pollId,
          session_id: Number(sessionId),
          question: question.trim(),
          is_active: true,
          is_closed: false,
          created_at: new Date().toISOString(),
          options: createdOptions,
          total_votes: 0,
        },
      });
    }

    // Fallback store
    const store = db.getFallbackStore();
    // Close prior active polls for this session
    store.polls.forEach((p) => {
      if (p.session_id === Number(sessionId) && p.is_active) {
        p.is_active = false;
        p.is_closed = true;
        p.closed_at = new Date().toISOString();
      }
    });

    const pollId = store.nextPollId++;
    const newPoll = {
      id: pollId,
      session_id: Number(sessionId),
      question: question.trim(),
      is_active: true,
      is_closed: false,
      created_at: new Date().toISOString(),
      closed_at: null,
    };
    store.polls.unshift(newPoll);

    const createdOptions = filteredOptions.map((optText, index) => {
      const opt = {
        id: store.nextOptionId++,
        poll_id: pollId,
        option_text: optText,
        option_order: index,
      };
      store.poll_options.push(opt);
      return { ...opt, vote_count: 0, percentage: 0 };
    });

    store.activities.unshift({
      id: store.nextActivityId++,
      session_id: Number(sessionId),
      participant_name: host_name,
      activity_type: 'poll_launched',
      message: `Live Poll launched: "${question.trim()}"`,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'Poll launched successfully',
      data: {
        ...newPoll,
        options: createdOptions,
        total_votes: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 9. Get all polls / active poll for session with live vote stats
const getSessionPolls = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;

    if (db.isLive()) {
      const [polls] = await db.query(
        'SELECT * FROM polls WHERE session_id = ? ORDER BY created_at DESC',
        [sessionId]
      );

      const pollsWithData = await Promise.all(
        polls.map(async (poll) => {
          const [options] = await db.query(
            'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY option_order ASC',
            [poll.id]
          );
          const [responses] = await db.query(
            'SELECT * FROM poll_responses WHERE poll_id = ?',
            [poll.id]
          );

          const totalVotes = responses.length;
          const optionsWithVotes = options.map((opt) => {
            const count = responses.filter((r) => r.option_id === opt.id).length;
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return { ...opt, vote_count: count, percentage };
          });

          return {
            ...poll,
            options: optionsWithVotes,
            total_votes: totalVotes,
            responses,
          };
        })
      );

      return res.json({ success: true, data: pollsWithData });
    }

    // Fallback store
    const store = db.getFallbackStore();
    const sessionPolls = store.polls.filter((p) => p.session_id === Number(sessionId));

    const pollsWithData = sessionPolls.map((poll) => {
      const options = store.poll_options.filter((o) => o.poll_id === poll.id);
      const responses = store.poll_responses.filter((r) => r.poll_id === poll.id);
      const totalVotes = responses.length;

      const optionsWithVotes = options.map((opt) => {
        const count = responses.filter((r) => r.option_id === opt.id).length;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return { ...opt, vote_count: count, percentage };
      });

      return {
        ...poll,
        options: optionsWithVotes,
        total_votes: totalVotes,
        responses,
      };
    });

    return res.json({ success: true, data: pollsWithData });
  } catch (error) {
    next(error);
  }
};

// 10. Vote in Poll
const votePoll = async (req, res, next) => {
  try {
    const { id: sessionId, pollId } = req.params;
    const { option_id, participant_id, voter_name = 'Anonymous' } = req.body;

    if (!option_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Option ID is required to cast a vote.' },
      });
    }

    if (db.isLive()) {
      const [polls] = await db.query('SELECT * FROM polls WHERE id = ?', [pollId]);
      if (!polls || polls.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Poll not found' } });
      }

      const poll = polls[0];
      if (poll.is_closed || !poll.is_active) {
        return res.status(400).json({ success: false, error: { message: 'This poll is already closed.' } });
      }

      await db.query(
        'INSERT INTO poll_responses (poll_id, option_id, participant_id, voter_name) VALUES (?, ?, ?, ?)',
        [pollId, option_id, participant_id || null, voter_name]
      );

      // Record activity
      await db.query(
        'INSERT INTO session_activities (session_id, participant_name, activity_type, message) VALUES (?, ?, "poll_voted", ?)',
        [sessionId, voter_name, `${voter_name} submitted a vote in the live poll`]
      );

      return res.json({
        success: true,
        message: 'Vote recorded successfully',
        data: { poll_id: Number(pollId), option_id: Number(option_id), voter_name },
      });
    }

    // Fallback store
    const store = db.getFallbackStore();
    const poll = store.polls.find((p) => p.id === Number(pollId));
    if (!poll) {
      return res.status(404).json({ success: false, error: { message: 'Poll not found' } });
    }

    if (poll.is_closed || !poll.is_active) {
      return res.status(400).json({ success: false, error: { message: 'This poll is already closed.' } });
    }

    const newResponse = {
      id: store.nextResponseId++,
      poll_id: Number(pollId),
      option_id: Number(option_id),
      participant_id: participant_id ? Number(participant_id) : null,
      voter_name: voter_name,
      created_at: new Date().toISOString(),
    };
    store.poll_responses.push(newResponse);

    store.activities.unshift({
      id: store.nextActivityId++,
      session_id: Number(sessionId),
      participant_name: voter_name,
      activity_type: 'poll_voted',
      message: `${voter_name} submitted a vote in the live poll`,
      created_at: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: newResponse,
    });
  } catch (error) {
    next(error);
  }
};

// 11. Close Poll
const closePoll = async (req, res, next) => {
  try {
    const { id: sessionId, pollId } = req.params;
    const { host_name = 'Host' } = req.body;

    if (db.isLive()) {
      await db.query(
        'UPDATE polls SET is_active = FALSE, is_closed = TRUE, closed_at = NOW() WHERE id = ?',
        [pollId]
      );

      await db.query(
        'INSERT INTO session_activities (session_id, participant_name, activity_type, message) VALUES (?, ?, "poll_closed", ?)',
        [sessionId, host_name, `Live poll closed by ${host_name}`]
      );

      return res.json({ success: true, message: 'Poll closed successfully' });
    }

    const store = db.getFallbackStore();
    const poll = store.polls.find((p) => p.id === Number(pollId));
    if (poll) {
      poll.is_active = false;
      poll.is_closed = true;
      poll.closed_at = new Date().toISOString();

      store.activities.unshift({
        id: store.nextActivityId++,
        session_id: Number(sessionId),
        participant_name: host_name,
        activity_type: 'poll_closed',
        message: `Live poll closed by ${host_name}`,
        created_at: new Date().toISOString(),
      });
    }

    return res.json({ success: true, message: 'Poll closed successfully' });
  } catch (error) {
    next(error);
  }
};

// 12. Q&A Module: Get Questions (sorted by pinned first, then upvotes descending)
const getQAQuestions = async (req, res, next) => {

  try {
    const { id: sessionId } = req.params;

    if (db.isLive()) {
      const [questions] = await db.query(
        'SELECT * FROM qa_questions WHERE session_id = ? ORDER BY is_pinned DESC, upvotes_count DESC, created_at DESC',
        [sessionId]
      );
      return res.json({ success: true, data: questions });
    }

    const store = db.getFallbackStore();
    const questions = store.qa_questions.filter((q) => q.session_id === Number(sessionId));
    questions.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
      if (b.upvotes_count !== a.upvotes_count) return b.upvotes_count - a.upvotes_count;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

// 13. Q&A Module: Post Question
const postQAQuestion = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const { author_name, question_text, participant_id } = req.body;

    if (!question_text || !question_text.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Question text is required.' },
      });
    }

    const author = (author_name && author_name.trim()) || 'Anonymous';

    if (db.isLive()) {
      const [result] = await db.query(
        'INSERT INTO qa_questions (session_id, participant_id, author_name, question_text, upvotes_count, is_answered, is_pinned) VALUES (?, ?, ?, ?, 0, FALSE, FALSE)',
        [sessionId, participant_id || null, author, question_text.trim()]
      );

      const newQ = {
        id: result.insertId,
        session_id: Number(sessionId),
        participant_id: participant_id || null,
        author_name: author,
        question_text: question_text.trim(),
        upvotes_count: 0,
        is_answered: false,
        is_pinned: false,
        created_at: new Date().toISOString(),
      };

      await db.query(
        'INSERT INTO session_activities (session_id, participant_name, activity_type, message) VALUES (?, ?, "qa_posted", ?)',
        [sessionId, author, `New question posted: "${question_text.trim().slice(0, 50)}..."`]
      );

      return res.status(201).json({ success: true, message: 'Question submitted', data: newQ });
    }

    const store = db.getFallbackStore();
    const newQ = {
      id: store.nextQAId++,
      session_id: Number(sessionId),
      participant_id: participant_id ? Number(participant_id) : null,
      author_name: author,
      question_text: question_text.trim(),
      upvotes_count: 0,
      is_answered: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
    };
    store.qa_questions.unshift(newQ);

    store.activities.unshift({
      id: store.nextActivityId++,
      session_id: Number(sessionId),
      participant_name: author,
      activity_type: 'qa_posted',
      message: `New question posted: "${question_text.trim().slice(0, 50)}..."`,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, message: 'Question submitted', data: newQ });
  } catch (error) {
    next(error);
  }
};

// 14. Q&A Module: Upvote Question
const upvoteQAQuestion = async (req, res, next) => {
  try {
    const { id: sessionId, questionId } = req.params;
    const { voter_key = 'anon-voter', voter_name = 'Attendee' } = req.body;

    if (db.isLive()) {
      try {
        await db.query('INSERT INTO qa_upvotes (question_id, voter_key) VALUES (?, ?)', [questionId, voter_key]);
        await db.query('UPDATE qa_questions SET upvotes_count = upvotes_count + 1 WHERE id = ?', [questionId]);
      } catch (err) {
        // Unique constraint means already upvoted; toggle/remove upvote
        await db.query('DELETE FROM qa_upvotes WHERE question_id = ? AND voter_key = ?', [questionId, voter_key]);
        await db.query('UPDATE qa_questions SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = ?', [questionId]);
      }

      const [updated] = await db.query('SELECT * FROM qa_questions WHERE id = ?', [questionId]);
      return res.json({ success: true, data: updated[0] });
    }

    const store = db.getFallbackStore();
    const q = store.qa_questions.find((item) => item.id === Number(questionId));
    if (!q) {
      return res.status(404).json({ success: false, error: { message: 'Question not found' } });
    }

    const existingIdx = store.qa_upvotes.findIndex(
      (u) => u.question_id === Number(questionId) && u.voter_key === voter_key
    );

    if (existingIdx >= 0) {
      store.qa_upvotes.splice(existingIdx, 1);
      q.upvotes_count = Math.max(0, q.upvotes_count - 1);
    } else {
      store.qa_upvotes.push({
        id: store.nextUpvoteId++,
        question_id: Number(questionId),
        voter_key,
      });
      q.upvotes_count += 1;
    }

    return res.json({ success: true, data: q });
  } catch (error) {
    next(error);
  }
};

// 15. Q&A Module: Toggle Question Answered or Pinned
const toggleQAQuestionStatus = async (req, res, next) => {
  try {
    const { id: sessionId, questionId } = req.params;
    const { is_answered, is_pinned } = req.body;

    if (db.isLive()) {
      let updateSql = 'UPDATE qa_questions SET ';
      const updates = [];
      const params = [];
      if (typeof is_answered === 'boolean') {
        updates.push('is_answered = ?');
        params.push(is_answered);
      }
      if (typeof is_pinned === 'boolean') {
        updates.push('is_pinned = ?');
        params.push(is_pinned);
      }
      updateSql += updates.join(', ') + ' WHERE id = ?';
      params.push(questionId);

      await db.query(updateSql, params);
      const [updated] = await db.query('SELECT * FROM qa_questions WHERE id = ?', [questionId]);
      return res.json({ success: true, data: updated[0] });
    }

    const store = db.getFallbackStore();
    const q = store.qa_questions.find((item) => item.id === Number(questionId));
    if (q) {
      if (typeof is_answered === 'boolean') q.is_answered = is_answered;
      if (typeof is_pinned === 'boolean') q.is_pinned = is_pinned;
    }
    return res.json({ success: true, data: q });
  } catch (error) {
    next(error);
  }
};

// 16. Attendance & Participation Tracking: Live Roster & Active Durations
const getSessionAttendance = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;

    if (db.isLive()) {
      const [records] = await db.query(
        'SELECT * FROM attendance_records WHERE session_id = ? ORDER BY join_time ASC',
        [sessionId]
      );

      const recordsWithDuration = records.map((rec) => {
        const join = new Date(rec.join_time).getTime();
        const end = rec.leave_time ? new Date(rec.leave_time).getTime() : Date.now();
        const durationSec = Math.max(0, Math.floor((end - join) / 1000));
        return {
          ...rec,
          duration_seconds: durationSec,
          duration_formatted: `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`,
        };
      });

      return res.json({ success: true, data: recordsWithDuration });
    }

    const store = db.getFallbackStore();
    let records = store.attendance_records.filter((r) => r.session_id === Number(sessionId));

    // If empty, auto populate from participants
    if (records.length === 0) {
      const participants = store.participants.filter((p) => p.session_id === Number(sessionId));
      records = participants.map((p) => ({
        id: store.nextAttendanceId++,
        session_id: Number(sessionId),
        participant_id: p.id,
        name: p.name,
        email: p.email || `${p.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        role: p.role,
        join_time: p.joined_at,
        leave_time: p.left_at,
        status: p.is_active ? 'connected' : 'disconnected',
      }));
      store.attendance_records.push(...records);
    }

    const recordsWithDuration = records.map((rec) => {
      const join = new Date(rec.join_time).getTime();
      const end = rec.leave_time ? new Date(rec.leave_time).getTime() : Date.now();
      const durationSec = Math.max(0, Math.floor((end - join) / 1000));
      return {
        ...rec,
        duration_seconds: durationSec,
        duration_formatted: `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`,
      };
    });

    return res.json({ success: true, data: recordsWithDuration });
  } catch (error) {
    next(error);
  }
};

// 17. Detailed Breakdown: Participant-Level Response Logs
const getSessionResponses = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;

    if (db.isLive()) {
      const [logs] = await db.query(
        `SELECT pr.id, pr.poll_id, pr.voter_name, pr.voter_email, pr.created_at,
                po.option_text, po.is_correct, p.question, p.poll_type
         FROM poll_responses pr
         JOIN poll_options po ON pr.option_id = po.id
         JOIN polls p ON pr.poll_id = p.id
         WHERE p.session_id = ?
         ORDER BY pr.created_at DESC`,
        [sessionId]
      );
      return res.json({ success: true, data: logs });
    }

    const store = db.getFallbackStore();
    const sessionPolls = store.polls.filter((p) => p.session_id === Number(sessionId));
    const pollIds = new Set(sessionPolls.map((p) => p.id));

    const responses = store.poll_responses.filter((r) => pollIds.has(r.poll_id));
    const logs = responses.map((r) => {
      const poll = store.polls.find((p) => p.id === r.poll_id);
      const option = store.poll_options.find((o) => o.id === r.option_id);
      return {
        id: r.id,
        poll_id: r.poll_id,
        question: poll?.question || 'Untitled Poll',
        poll_type: poll?.poll_type || 'poll',
        option_id: r.option_id,
        option_text: option?.option_text || 'Unknown Option',
        is_correct: Boolean(option?.is_correct),
        voter_name: r.voter_name,
        voter_email: r.voter_email || 'attendee@livelogic.io',
        created_at: r.created_at,
      };
    });

    return res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// 18. Export Session Summary Report (CSV or JSON)
const exportSessionReport = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const { format = 'json' } = req.query;

    const store = db.getFallbackStore();
    const session = store.sessions.find((s) => s.id === Number(sessionId));
    const attendance = store.attendance_records.filter((r) => r.session_id === Number(sessionId));
    const polls = store.polls.filter((p) => p.session_id === Number(sessionId));
    const questions = store.qa_questions.filter((q) => q.session_id === Number(sessionId));

    const reportData = {
      session: session || { id: sessionId, title: 'Session Report' },
      generated_at: new Date().toISOString(),
      attendance_summary: {
        total_participants: attendance.length,
        roster: attendance,
      },
      polls_summary: polls.map((p) => {
        const options = store.poll_options.filter((o) => o.poll_id === p.id);
        const responses = store.poll_responses.filter((r) => r.poll_id === p.id);
        return {
          question: p.question,
          total_votes: responses.length,
          options: options.map((opt) => ({
            text: opt.option_text,
            votes: responses.filter((r) => r.option_id === opt.id).length,
          })),
        };
      }),
      qa_summary: questions.map((q) => ({
        author: q.author_name,
        question: q.question_text,
        upvotes: q.upvotes_count,
        is_answered: q.is_answered,
      })),
    };

    if (format === 'csv') {
      let csv = 'Type,Author/Participant,Details/Question,Value/Votes,Timestamp\n';
      attendance.forEach((a) => {
        csv += `Attendance,"${a.name} (${a.email})","Role: ${a.role}","Duration: ${a.duration_seconds || 0}s","${a.join_time}"\n`;
      });
      reportData.polls_summary.forEach((p) => {
        csv += `Poll,"Host","${p.question.replace(/"/g, '""')}","Total Votes: ${p.total_votes}","${new Date().toISOString()}"\n`;
      });
      questions.forEach((q) => {
        csv += `QA,"${q.author_name}","${q.question_text.replace(/"/g, '""')}","Upvotes: ${q.upvotes_count} | Answered: ${q.is_answered}","${q.created_at}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="livelogic_session_${sessionId}_report.csv"`);
      return res.send(csv);
    }

    return res.json({ success: true, data: reportData });
  } catch (error) {
    next(error);
  }
};

// 19. Session History & Archives with Historical Analytics
const getSessionHistory = async (req, res, next) => {
  try {
    if (db.isLive()) {
      const [rows] = await db.query(`
        SELECT
          s.*,
          COUNT(DISTINCT p.id) AS total_participants,
          COUNT(DISTINCT polls.id) AS total_polls,
          COUNT(DISTINCT questions.id) AS total_questions,
          insights.id AS insight_id,
          insights.summary AS insight_summary,
          insights.engagement_score AS insight_engagement_score,
          insights.accuracy_rate AS insight_accuracy_rate,
          insights.key_themes AS insight_key_themes,
          insights.actionable_insights AS insight_actionable_insights,
          insights.generated_at AS insight_generated_at
        FROM sessions s
        LEFT JOIN participants p ON p.session_id = s.id
        LEFT JOIN polls ON polls.session_id = s.id
        LEFT JOIN qa_questions questions ON questions.session_id = s.id
        LEFT JOIN session_insights insights ON insights.session_id = s.id
        WHERE s.status = 'completed' OR s.ended_at IS NOT NULL
        GROUP BY s.id, insights.id
        ORDER BY COALESCE(s.ended_at, s.created_at) DESC
      `);

      const historyWithAnalytics = rows.map((session) => {
        const hasInsights = session.insight_id !== null;
        const insights = hasInsights
          ? {
              session_id: session.id,
              summary: session.insight_summary,
              engagement_score: session.insight_engagement_score,
              accuracy_rate: session.insight_accuracy_rate,
              key_themes: session.insight_key_themes,
              actionable_insights: session.insight_actionable_insights,
              generated_at: session.insight_generated_at,
            }
          : null;

        return {
          ...session,
          engagement_score: insights ? insights.engagement_score : 85,
          insights,
        };
      });

      return res.json({ success: true, data: historyWithAnalytics });
    }

    const store = db.getFallbackStore();
    const completedSessions = store.sessions.filter((s) => s.status === 'completed' || s.ended_at);

    const historyWithAnalytics = completedSessions.map((s) => {
      const participants = store.participants.filter((p) => p.session_id === s.id);
      const polls = store.polls.filter((p) => p.session_id === s.id);
      const questions = store.qa_questions.filter((q) => q.session_id === s.id);
      const insights = store.session_insights.find((i) => i.session_id === s.id);

      return {
        ...s,
        total_participants: participants.length,
        total_polls: polls.length,
        total_questions: questions.length,
        engagement_score: insights ? insights.engagement_score : Math.floor(75 + Math.random() * 20),
        insights: insights || null,
      };
    });

    return res.json({ success: true, data: historyWithAnalytics });
  } catch (error) {
    next(error);
  }
};

// 20. AI Session Insights: Generate & Retrieve
const getAISessionInsights = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const store = db.getFallbackStore();

    let insight = store.session_insights.find((i) => i.session_id === Number(sessionId));
    const session = store.sessions.find((s) => s.id === Number(sessionId));
    const polls = store.polls.filter((p) => p.session_id === Number(sessionId));
    const questions = store.qa_questions.filter((q) => q.session_id === Number(sessionId));
    const participants = store.participants.filter((p) => p.session_id === Number(sessionId));

    if (!insight) {
      // Auto-generate AI Insight based on session data
      const engagement = Math.min(100, Math.max(60, participants.length * 15 + polls.length * 10 + questions.length * 5));
      const accuracy = 88;

      insight = {
        session_id: Number(sessionId),
        summary: `Dynamic live session on "${session?.title || 'Interactive Session'}". Total ${participants.length} connected participants actively engaged in ${polls.length} poll activities and posed ${questions.length} discussion queries.`,
        engagement_score: engagement,
        accuracy_rate: accuracy,
        key_themes: JSON.stringify([
          session?.topic || 'Architecture & Design',
          'Distributed Systems Consensus',
          'Performance & Scale Optimization',
          'Fault Tolerance Strategies',
        ]),
        actionable_insights: JSON.stringify([
          `Review top-voted attendee question from ${questions[0]?.author_name || 'participants'} regarding asynchronous architectures.`,
          `High consensus observed on ${polls[0]?.question ? 'the primary poll' : 'the opening topic'}; consider following up with benchmark code samples.`,
          'Overall participant retention remained steady throughout the duration.',
        ]),
        generated_at: new Date().toISOString(),
      };
      store.session_insights.push(insight);
    }

    return res.json({
      success: true,
      data: {
        ...insight,
        key_themes: typeof insight.key_themes === 'string' ? JSON.parse(insight.key_themes) : insight.key_themes,
        actionable_insights: typeof insight.actionable_insights === 'string' ? JSON.parse(insight.actionable_insights) : insight.actionable_insights,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getAllSessions,
  getSessionById,
  createSession,
  joinSession,
  updateSessionStatus,
  deleteSession,
  createPoll,
  getSessionPolls,
  votePoll,
  closePoll,
  getQAQuestions,
  postQAQuestion,
  upvoteQAQuestion,
  toggleQAQuestionStatus,
  getSessionAttendance,
  getSessionResponses,
  exportSessionReport,
  getSessionHistory,
  getAISessionInsights,
};


