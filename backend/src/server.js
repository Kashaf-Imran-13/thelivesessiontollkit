const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// Local IP Address Auto-Detection (for Mobile QR & Local Network)
// -------------------------------------------------------------
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIpAddress();
const PORT = process.env.PORT || 5000;

// -------------------------------------------------------------
// Durable session store. The file keeps teacher sessions resumable after a
// browser or server restart without requiring a database setup.
// -------------------------------------------------------------
const sessionStorePath = path.resolve(__dirname, '../data/sessions.json');

function loadSessions() {
  try {
    if (fs.existsSync(sessionStorePath)) {
      return JSON.parse(fs.readFileSync(sessionStorePath, 'utf8'));
    }
  } catch (error) {
    console.warn(`[Storage] Could not load saved sessions: ${error.message}`);
  }
  return {};
}

function saveSessions() {
  try {
    fs.mkdirSync(path.dirname(sessionStorePath), { recursive: true });
    fs.writeFileSync(sessionStorePath, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error(`[Storage] Could not save sessions: ${error.message}`);
  }
}

const sessions = loadSessions();

function generateCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (sessions[code]);
  return code;
}

function generatePasscode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// -------------------------------------------------------------
// Unlimited AI Quiz Generation Engine
// -------------------------------------------------------------
const TOPIC_PRESETS = {
  javascript: [
    {
      question: 'Which keyword declares a block-scoped constant variable in JavaScript?',
      options: ['var', 'let', 'const', 'immutable'],
      correctIndex: 2,
    },
    {
      question: 'What is the return type of the typeof operator when applied to null?',
      options: ['"null"', '"undefined"', '"object"', '"boolean"'],
      correctIndex: 2,
    },
    {
      question: 'Which method converts a JSON string into a JavaScript object?',
      options: ['JSON.stringify()', 'JSON.parse()', 'JSON.objectify()', 'JSON.toObject()'],
      correctIndex: 1,
    },
    {
      question: 'What does Promise.all() do when all promises resolve?',
      options: ['Returns the first resolved value', 'Returns a single promise resolving to an array of results', 'Returns a boolean true', 'Cancels remaining operations'],
      correctIndex: 1,
    },
    {
      question: 'Which array method creates a new array populated with the results of calling a function on every element?',
      options: ['forEach()', 'filter()', 'map()', 'reduce()'],
      correctIndex: 2,
    },
    {
      question: 'What is the strict equality operator in JavaScript that checks both value and type?',
      options: ['==', '===', '!=', '='],
      correctIndex: 1,
    },
    {
      question: 'Which statement correctly describes JavaScript closures?',
      options: ['Functions that run only once', 'A function bundled with references to its lexical surrounding state', 'Methods that close browser tabs', 'Syntax for ending loops'],
      correctIndex: 1,
    },
    {
      question: 'What does the Array.prototype.filter() method return?',
      options: ['The first matching element', 'A new array with all elements that pass the test condition', 'A boolean true or false', 'The index of the matching element'],
      correctIndex: 1,
    },
  ],
  python: [
    {
      question: 'Which data structure in Python is ordered, immutable, and allows duplicate elements?',
      options: ['List', 'Dictionary', 'Set', 'Tuple'],
      correctIndex: 3,
    },
    {
      question: 'What keyword is used to define an anonymous inline function in Python?',
      options: ['def', 'lambda', 'anonymous', 'inline'],
      correctIndex: 1,
    },
    {
      question: 'How do you open a file for safe reading in a context manager block in Python?',
      options: ['with open(filename, "r") as f:', 'file.read(filename)', 'try open(filename):', 'using f = open(filename):'],
      correctIndex: 0,
    },
    {
      question: 'What will list comprehension [x**2 for x in range(4)] evaluate to?',
      options: ['[1, 4, 9, 16]', '[0, 1, 4, 9]', '[0, 2, 4, 6]', '[0, 1, 2, 3]'],
      correctIndex: 1,
    },
    {
      question: 'Which built-in Python function returns the number of items in an object?',
      options: ['count()', 'size()', 'len()', 'length()'],
      correctIndex: 2,
    },
    {
      question: 'What is the correct syntax to output "Hello World" in Python 3?',
      options: ['echo "Hello World"', 'print("Hello World")', 'System.out.println("Hello World")', 'console.log("Hello World")'],
      correctIndex: 1,
    },
  ],
  react: [
    {
      question: 'Which React hook is primarily used to perform side effects like data fetching or subscriptions?',
      options: ['useState', 'useReducer', 'useEffect', 'useMemo'],
      correctIndex: 2,
    },
    {
      question: 'What is the purpose of the key prop when rendering lists of elements in React?',
      options: ['Styles the element', 'Helps React identify which items have changed, added, or removed', 'Binds click events', 'Sets unique database index'],
      correctIndex: 1,
    },
    {
      question: 'In React, what are props primarily used for?',
      options: ['Passing read-only data from parent to child components', 'Storing mutable local component state', 'Direct DOM manipulation', 'Global CSS animation'],
      correctIndex: 0,
    },
    {
      question: 'Which hook allows caching the result of an expensive calculation between re-renders?',
      options: ['useCallback', 'useMemo', 'useRef', 'useContext'],
      correctIndex: 1,
    },
  ],
  science: [
    {
      question: 'What organelle is known as the powerhouse of eukaryotic cells?',
      options: ['Ribosome', 'Mitochondria', 'Endoplasmic Reticulum', 'Golgi Apparatus'],
      correctIndex: 1,
    },
    {
      question: 'What is the chemical formula for water?',
      options: ['CO2', 'NaCl', 'H2O', 'CH4'],
      correctIndex: 2,
    },
    {
      question: 'Which process do plants use to convert sunlight into chemical energy?',
      options: ['Fermentation', 'Cellular Respiration', 'Photosynthesis', 'Transpiration'],
      correctIndex: 2,
    },
  ],
  history: [
    {
      question: 'In which year did the United Nations officially form following World War II?',
      options: ['1918', '1939', '1945', '1955'],
      correctIndex: 2,
    },
    {
      question: 'Who was the principal author of the United States Declaration of Independence?',
      options: ['George Washington', 'Thomas Jefferson', 'Benjamin Franklin', 'John Adams'],
      correctIndex: 1,
    },
    {
      question: 'Which ancient civilization built the Great Pyramids of Giza?',
      options: ['Ancient Rome', 'Mesopotamia', 'Ancient Greece', 'Ancient Egypt'],
      correctIndex: 3,
    },
  ],
};

function generateQuizByTopic(topicInput = 'General Knowledge', requestedCount = 5) {
  const normalized = topicInput.toLowerCase().trim();
  const targetCount = Math.max(1, parseInt(requestedCount, 10) || 5);
  const capitalizedTopic = topicInput.trim() || 'Core Topic';

  let presetPool = [];
  for (const key of Object.keys(TOPIC_PRESETS)) {
    if (normalized.includes(key)) {
      presetPool = [...TOPIC_PRESETS[key]];
      break;
    }
  }

  const generatedQuestions = [];
  for (let i = 0; i < presetPool.length && generatedQuestions.length < targetCount; i++) {
    generatedQuestions.push(presetPool[i]);
  }

  const dynamicTemplates = [
    (n) => ({
      question: `Question ${n}: What is the foundational core principle behind ${capitalizedTopic}?`,
      options: [
        `Core theoretical architecture and systematic implementation rules`,
        `Arbitrary execution without structural boundaries`,
        `Purely visual styling without functional significance`,
        `Legacy deprecated methodology`,
      ],
      correctIndex: 0,
    }),
    (n) => ({
      question: `Question ${n}: Which practice is essential when implementing ${capitalizedTopic}?`,
      options: [
        `Skipping validation and error logging`,
        `Continuous verification, clean modular design, and robust testing`,
        `Manual repetitive tasks without automation`,
        `Hardcoding static references across all layers`,
      ],
      correctIndex: 1,
    }),
    (n) => ({
      question: `Question ${n}: What is the primary operational advantage of mastering ${capitalizedTopic}?`,
      options: [
        `Increased latency and redundant processing cycles`,
        `Fragile execution flow prone to silent crashes`,
        `High efficiency, systematic scalability, and predictable outcomes`,
        `Uncontrolled resource consumption`,
      ],
      correctIndex: 2,
    }),
    (n) => ({
      question: `Question ${n}: In ${capitalizedTopic}, how are edge cases and unexpected inputs best managed?`,
      options: [
        `Ignoring invalid inputs and continuing execution`,
        `Crashing the system without reporting diagnostic data`,
        `Defensive validation, explicit exception handling, and structured recovery`,
        `Disabling all boundary limits`,
      ],
      correctIndex: 2,
    }),
  ];

  let templateIdx = 0;
  while (generatedQuestions.length < targetCount) {
    const qNum = generatedQuestions.length + 1;
    const templateFn = dynamicTemplates[templateIdx % dynamicTemplates.length];
    generatedQuestions.push(templateFn(qNum));
    templateIdx++;
  }

  const timestamp = Date.now().toString(36);
  return generatedQuestions.map((item, idx) => ({
    id: `q_${idx + 1}_${timestamp}_${Math.random().toString(36).slice(2, 6)}`,
    question: item.question,
    options: item.options,
    correctIndex: item.correctIndex,
  }));
}

function buildQuizAnswerKey(quiz) {
  return (quiz.questions || []).map((question) => ({
    questionId: question.id,
    question: question.question,
    correctAnswer: question.options?.[question.correctIndex] || '',
    explanation: question.explanation || '',
  }));
}

function getStudentSessionView(session, participantId) {
  const studentSession = JSON.parse(JSON.stringify(session));
  if (studentSession.activeQuiz) {
    const studentQuiz = studentSession.activeQuiz;
    studentQuiz.questions = (studentQuiz.questions || []).map(({ correctIndex, ...question }) => question);
    studentQuiz.submissions = participantId && studentQuiz.submissions?.[participantId]
      ? { [participantId]: studentQuiz.submissions[participantId] }
      : {};
  }
  return studentSession;
}

// -------------------------------------------------------------
// Network Info Endpoint
// -------------------------------------------------------------
app.get('/api/network-info', (req, res) => {
  const currentIp = getLocalIpAddress();
  res.json({
    localIp: currentIp,
    port: PORT,
    joinBaseUrl: `http://${currentIp}:${PORT}`,
  });
});

// -------------------------------------------------------------
// Teacher Resume Authentication Endpoint
// -------------------------------------------------------------
app.post('/api/teacher/auth', (req, res) => {
  const { code, passcode } = req.body;
  const cleanCode = (code || '').trim();
  const cleanPasscode = (passcode || '').trim();

  if (!cleanCode) {
    return res.status(400).json({ success: false, error: 'Session code is required.' });
  }

  const session = sessions[cleanCode];
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found. Please verify the 6-digit code.' });
  }

  if (session.teacherPasscode === cleanPasscode) {
    return res.status(200).json({ success: true, session, message: 'Teacher authentication successful.' });
  }

  return res.status(401).json({ success: false, error: 'Incorrect teacher passcode for this class session.' });
});

// Teacher: list saved sessions after authenticating one of their classes
app.post('/api/teacher/history', (req, res) => {
  const { code, passcode } = req.body;
  const session = sessions[(code || '').trim()];

  if (!session || session.teacherPasscode !== (passcode || '').trim()) {
    return res.status(401).json({ success: false, error: 'Teacher authentication failed.' });
  }

  const history = Object.values(sessions)
    .filter((item) => item.hostName === session.hostName)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((item) => {
      const storedParticipants = Array.isArray(item.participantHistory) && item.participantHistory.length > 0
        ? item.participantHistory
        : [
            ...(item.activeParticipants || []).map((participant) => ({ ...participant, participationStatus: 'active' })),
            ...(item.waitingRoom || []).map((participant) => ({ ...participant, participationStatus: 'waiting' })),
          ];
      const quizzes = [...(item.quizzesHistory || []), ...(item.activeQuiz ? [item.activeQuiz] : [])];
      const storedSubmissions = Array.isArray(item.quizSubmissions) ? item.quizSubmissions : [];
      const nestedSubmissions = quizzes.flatMap((quiz) => Object.values(quiz.submissions || {}));
      const submissions = [...storedSubmissions];
      nestedSubmissions.forEach((submission) => {
        if (!submissions.some((itemSubmission) => itemSubmission.quizId === submission.quizId && itemSubmission.participantId === submission.participantId)) {
          submissions.push(submission);
        }
      });

      return {
      code: item.code,
      sessionId: item.code,
      hostName: item.hostName,
      createdAt: item.createdAt,
      participants: storedParticipants,
      activeParticipants: (item.activeParticipants || []).length,
      waitingParticipants: (item.waitingRoom || []).length,
      polls: (item.pollsHistory || []).length + (item.activePoll ? 1 : 0),
      quizzes: (item.quizzesHistory || []).length + (item.activeQuiz ? 1 : 0),
      submissions: submissions.length,
      questionsAsked: [
        ...(item.pollsHistory || []).map((poll) => ({
          type: 'poll', id: poll.id, question: poll.question, askedAt: poll.createdAt,
        })),
        ...(item.activePoll ? [{
          type: 'poll', id: item.activePoll.id, question: item.activePoll.question, askedAt: item.activePoll.createdAt,
        }] : []),
        ...(item.quizzesHistory || []).flatMap((quiz) => (quiz.questions || []).map((question) => ({
          type: quiz.isAI ? 'ai-quiz' : 'quiz',
          id: `${quiz.id}:${question.id}`,
          quizId: quiz.id,
          quizTitle: quiz.title,
          question: question.question,
          options: question.options,
          correctIndex: question.correctIndex,
          askedAt: quiz.createdAt,
        }))),
        ...(item.activeQuiz ? (item.activeQuiz.questions || []).map((question) => ({
          type: item.activeQuiz.isAI ? 'ai-quiz' : 'quiz',
          id: `${item.activeQuiz.id}:${question.id}`,
          quizId: item.activeQuiz.id,
          quizTitle: item.activeQuiz.title,
          question: question.question,
          options: question.options,
          correctIndex: question.correctIndex,
          askedAt: item.activeQuiz.createdAt,
        })) : []),
      ],
      quizzesDetails: quizzes,
      quizSubmissions: submissions,
      feedback: item.feedback || [],
      attendance: item.attendance || storedParticipants.map((participant) => ({
        participantId: participant.id,
        studentName: participant.name,
        sessionId: item.code,
        joinTime: participant.joinedAt || participant.requestedAt,
        status: participant.participationStatus === 'active' ? 'Present' : 'Waiting',
      })),
      doubts: item.doubts || [],
      isActive: Boolean(item.activePoll || item.activeQuiz || (item.activeParticipants || []).length),
      };
    });

  return res.status(200).json({ success: true, history });
});

// Student: leave named or anonymous feedback for the teacher
const submitFeedback = (req, res, next) => {
  try {
    const { code, participantId, studentName, message, anonymous = false } = req.body;
    const session = sessions[(code || '').trim()];

    if (!session) {
      return res.status(404).json({ success: false, error: 'Class session not found.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Feedback message is required.' });
    }

    const participant = [
      ...(session.activeParticipants || []),
      ...(session.waitingRoom || []),
    ].find((item) => item.id === participantId);
    if (!participant) {
      return res.status(403).json({ success: false, error: 'Only class participants can leave feedback.' });
    }

    if (!Array.isArray(session.feedback)) session.feedback = [];
    const feedback = {
      id: generateId('feedback'),
      participantId,
      studentName: anonymous ? 'Anonymous student' : (studentName || participant.name),
      anonymous: Boolean(anonymous),
      message: message.trim(),
      createdAt: Date.now(),
    };
    session.feedback.unshift(feedback);
    saveSessions();

    return res.status(201).json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

app.post(['/api/session/feedback', '/api/feedback', '/api/reviews'], submitFeedback);

const resolveParticipant = (session, participantId) => [
  ...(session.activeParticipants || []),
  ...(session.waitingRoom || []),
].find((participant) => participant.id === participantId);

app.post('/api/session/doubt', (req, res) => {
  const { code, participantId, studentName, message, type = 'doubt' } = req.body;
  const session = sessions[(code || '').trim()];
  const participant = session && resolveParticipant(session, participantId);

  if (!session) return res.status(404).json({ success: false, error: 'Class session not found.' });
  if (!participant) return res.status(403).json({ success: false, error: 'Only class participants can ask a doubt.' });
  if (!message || !message.trim()) return res.status(400).json({ success: false, error: 'Doubt message is required.' });

  if (!Array.isArray(session.doubts)) session.doubts = [];
  const doubt = {
    id: generateId('doubt'),
    sessionId: session.code,
    participantId,
    studentName: studentName || participant.name,
    message: message.trim(),
    type: type === 'hand' ? 'hand' : 'doubt',
    status: 'open',
    createdAt: Date.now(),
  };
  session.doubts.unshift(doubt);
  saveSessions();
  return res.status(201).json({ success: true, doubt });
});

app.patch('/api/session/doubt/:doubtId', (req, res) => {
  const { code, status = 'resolved' } = req.body;
  const session = sessions[(code || '').trim()];
  const doubt = session?.doubts?.find((item) => item.id === req.params.doubtId);
  if (!session || !doubt) return res.status(404).json({ success: false, error: 'Doubt not found.' });
  doubt.status = status === 'open' ? 'open' : 'resolved';
  doubt.resolvedAt = doubt.status === 'resolved' ? Date.now() : null;
  saveSessions();
  return res.json({ success: true, doubt });
});

app.get('/api/teacher/history/:code/report.csv', (req, res) => {
  const session = sessions[req.params.code];
  if (!session || session.teacherPasscode !== (req.query.passcode || '').trim()) {
    return res.status(401).json({ success: false, error: 'Teacher authentication failed.' });
  }

  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = [['Section', 'Student', 'ID', 'Timestamp', 'Status', 'Details']];
  (session.attendance || []).forEach((record) => rows.push(['Attendance', record.studentName, record.participantId, new Date(record.joinTime).toISOString(), record.status, '']));
  (session.quizSubmissions || []).forEach((submission) => rows.push(['Quiz', submission.studentName, submission.participantId, new Date(submission.submittedAt).toISOString(), `${submission.score}/${submission.total}`, `${submission.quizTitle} (${submission.percentage}%)`]));
  (session.feedback || []).forEach((feedback) => rows.push(['Feedback', feedback.studentName, feedback.participantId, new Date(feedback.createdAt).toISOString(), '', feedback.message]));
  (session.doubts || []).forEach((doubt) => rows.push(['Doubt', doubt.studentName, doubt.participantId, new Date(doubt.createdAt).toISOString(), doubt.status, doubt.message]));

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="session_${session.code}_report.csv"`);
  return res.send(rows.map((row) => row.map(escapeCsv).join(',')).join('\n'));
});

// -------------------------------------------------------------
// Session Management Endpoints
// -------------------------------------------------------------

// 1. Teacher: Create new classroom session
app.post('/api/session/create', (req, res) => {
  const { hostName, customPasscode } = req.body;

  if (!hostName || !hostName.trim()) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }

  const code = generateCode();
  const currentIp = getLocalIpAddress();
  const teacherPasscode = (customPasscode && customPasscode.trim()) || generatePasscode();

  const session = {
    code,
    hostName: hostName.trim(),
    teacherPasscode,
    createdAt: Date.now(),
    localIp: currentIp,
    joinUrl: `http://${currentIp}:${PORT}/?code=${code}`,
    waitingRoom: [],
    activeParticipants: [],
    participantHistory: [],
    activePoll: null,
    pollsHistory: [],
    activeQuiz: null,
    quizzesHistory: [],
    quizSubmissions: [],
    feedback: [],
    attendance: [],
    doubts: [],
  };

  sessions[code] = session;
  saveSessions();
  return res.status(201).json({ session, localIp: currentIp, teacherPasscode });
});

// 2. Student: Request to join a classroom session (Must have valid session code)
app.post('/api/session/join', (req, res) => {
  const { code, participantName } = req.body;
  const cleanCode = (code || '').trim();

  const session = sessions[cleanCode];
  if (!session) {
    return res.status(404).json({ error: 'Class code not found. Please verify the 6-digit code.' });
  }

  if (!participantName || !participantName.trim()) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }

  const trimmedName = participantName.trim();

  const existingActive = session.activeParticipants.find(
    (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existingActive) {
    return res.status(200).json({
      participantId: existingActive.id,
      session: getStudentSessionView(session, existingActive.id),
      isAlreadyActive: true,
    });
  }

  const existingWaiting = session.waitingRoom.find(
    (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existingWaiting) {
    return res.status(200).json({ participantId: existingWaiting.id, session: getStudentSessionView(session, existingWaiting.id) });
  }

  const participantId = generateId('student');
  if (!Array.isArray(session.participantHistory)) session.participantHistory = [];
  if (!Array.isArray(session.attendance)) session.attendance = [];
  const joinTime = Date.now();
  const participant = {
    id: participantId,
    sessionId: cleanCode,
    name: trimmedName,
    requestedAt: joinTime,
    participationStatus: 'waiting',
  };
  session.waitingRoom.push(participant);
  session.participantHistory.push({ ...participant });
  session.attendance.push({
    participantId,
    studentName: trimmedName,
    sessionId: cleanCode,
    joinTime,
    status: joinTime - session.createdAt > 5 * 60 * 1000 ? 'Late' : 'Present',
  });

  saveSessions();

  return res.status(200).json({ participantId, session: getStudentSessionView(session, participantId) });
});

// 3. Teacher: Approve student entry
app.post('/api/session/approve', (req, res) => {
  const { code, participantId } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session) {
    return res.status(404).json({ error: 'Class session not found.' });
  }

  const idx = session.waitingRoom.findIndex((p) => p.id === participantId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Student not found in waiting room.' });
  }

  const [participant] = session.waitingRoom.splice(idx, 1);
  session.activeParticipants.push({
    ...participant,
    joinedAt: Date.now(),
  });
  const historyParticipant = session.participantHistory?.find((item) => item.id === participant.id);
  if (historyParticipant) {
    historyParticipant.participationStatus = 'active';
    historyParticipant.joinedAt = Date.now();
  }
  const attendanceRecord = session.attendance?.find((record) => record.participantId === participant.id);
  if (attendanceRecord) attendanceRecord.status = attendanceRecord.status === 'Late' ? 'Late' : 'Present';

  saveSessions();

  return res.status(200).json({ session });
});

// 4. Teacher: Reject student request
app.post('/api/session/reject', (req, res) => {
  const { code, participantId } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session) {
    return res.status(404).json({ error: 'Class session not found.' });
  }

  session.waitingRoom = session.waitingRoom.filter((p) => p.id !== participantId);
  const historyParticipant = session.participantHistory?.find((item) => item.id === participantId);
  if (historyParticipant) historyParticipant.participationStatus = 'rejected';
  saveSessions();
  return res.status(200).json({ session });
});

// 5. Teacher: Remove/Kick active student
app.post('/api/session/kick', (req, res) => {
  const { code, participantId } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session) {
    return res.status(404).json({ error: 'Class session not found.' });
  }

  session.activeParticipants = session.activeParticipants.filter((p) => p.id !== participantId);
  const historyParticipant = session.participantHistory?.find((item) => item.id === participantId);
  if (historyParticipant) historyParticipant.participationStatus = 'kicked';
  const attendanceRecord = session.attendance?.find((record) => record.participantId === participantId);
  if (attendanceRecord) attendanceRecord.status = 'Left';
  saveSessions();
  return res.status(200).json({ session });
});

// 6. Real-time Session Sync Query
app.get('/api/session/:code', (req, res) => {
  const cleanCode = (req.params.code || '').trim();
  const session = sessions[cleanCode];

  if (!session) {
    return res.status(404).json({ error: 'Class session not found.' });
  }

  const currentIp = getLocalIpAddress();
  session.localIp = currentIp;
  session.joinUrl = `http://${currentIp}:${PORT}/?code=${session.code}`;

  const isStudentRequest = req.query.role === 'student';
  return res.status(200).json({
    session: isStudentRequest ? getStudentSessionView(session, req.query.participantId) : session,
    localIp: currentIp,
  });
});

// -------------------------------------------------------------
// Interactive Live Polls Endpoints
// -------------------------------------------------------------
app.post('/api/session/poll/create', (req, res) => {
  const { code, question, options } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session) {
    return res.status(404).json({ error: 'Class session not found.' });
  }

  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Poll question is required.' });
  }

  const validOptions = (options || [])
    .map((opt, i) => ({ id: `opt_${i + 1}`, text: String(opt).trim() }))
    .filter((opt) => opt.text.length > 0);

  if (validOptions.length < 2) {
    return res.status(400).json({ error: 'Please provide at least 2 options for the poll.' });
  }

  if (session.activePoll) {
    session.pollsHistory.unshift({ ...session.activePoll, closedAt: Date.now() });
  }

  session.activePoll = {
    id: generateId('poll'),
    sessionId: cleanCode,
    question: question.trim(),
    options: validOptions,
    isActive: true,
    createdAt: Date.now(),
    votes: {},
  };

  saveSessions();

  return res.status(201).json({ session });
});

app.post('/api/session/poll/vote', (req, res) => {
  const { code, participantId, studentName, optionId } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session || !session.activePoll || !session.activePoll.isActive) {
    return res.status(400).json({ error: 'No active poll is currently open.' });
  }

  const poll = session.activePoll;
  const optionExists = poll.options.some((o) => o.id === optionId);
  if (!optionExists) {
    return res.status(400).json({ error: 'Selected option is invalid.' });
  }

  poll.votes[participantId] = {
    optionId,
    studentName: studentName || 'Student',
    votedAt: Date.now(),
  };

  saveSessions();

  return res.status(200).json({ session: getStudentSessionView(session, participantId), message: 'Vote recorded!' });
});

app.post('/api/session/poll/close', (req, res) => {
  const { code } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session || !session.activePoll) {
    return res.status(400).json({ error: 'No active poll to close.' });
  }

  session.activePoll.isActive = false;
  session.pollsHistory.unshift({ ...session.activePoll, closedAt: Date.now() });
  session.activePoll = null;

  saveSessions();

  return res.status(200).json({ session });
});

// -------------------------------------------------------------
// Custom & AI Quiz Builder Endpoints (Direct Session Persistence)
// -------------------------------------------------------------
app.post('/api/session/quiz/create', (req, res) => {
  const { code, title, topic, questions, durationMinutes = 10 } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session) {
    return res.status(404).json({ error: 'Class session not found.' });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Quiz title is required.' });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Quiz must contain at least 1 question.' });
  }

  const formattedQuestions = questions
    .filter((q) => q.question && q.question.trim().length > 0)
    .map((q, idx) => ({
      id: q.id || `q_${idx + 1}_${Date.now().toString(36)}`,
      question: q.question.trim(),
      options: (q.options || []).map((o) => String(o).trim()).filter((o) => o.length > 0),
      correctIndex: Math.max(0, Math.min(Number(q.correctIndex) || 0, (q.options || []).length - 1)),
    }));

  if (formattedQuestions.length === 0) {
    return res.status(400).json({ error: 'Please enter valid question text and options.' });
  }

  if (session.activeQuiz) {
    session.quizzesHistory.unshift({ ...session.activeQuiz, closedAt: Date.now() });
  }

  // Directly assign activeQuiz to the session
  const newQuiz = {
    id: generateId('quiz'),
    sessionId: cleanCode,
    title: title.trim(),
    topic: topic ? topic.trim() : 'Custom Topic',
    isActive: true,
    createdAt: Date.now(),
    durationSeconds: Math.max(1, Math.min(180, Number(durationMinutes) || 10)) * 60,
    expiresAt: Date.now() + Math.max(1, Math.min(180, Number(durationMinutes) || 10)) * 60 * 1000,
    questions: formattedQuestions,
    submissions: {},
    showAnswerKey: Boolean(req.body.showAnswerKey),
  };

  session.activeQuiz = newQuiz;
  saveSessions();

  return res.status(201).json({ session });
});

app.post('/api/session/quiz/generate-ai', (req, res) => {
  const { code, topic, count = 5, durationMinutes = 10 } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session) {
    return res.status(404).json({ error: 'Class session not found.' });
  }

  const topicName = (topic && topic.trim()) || 'General Knowledge';
  const questionCount = Math.max(1, parseInt(count, 10) || 5);
  const generatedQuestions = generateQuizByTopic(topicName, questionCount);

  if (session.activeQuiz) {
    session.quizzesHistory.unshift({ ...session.activeQuiz, closedAt: Date.now() });
  }

  // Directly assign activeQuiz to the session
  const newQuiz = {
    id: generateId('ai_quiz'),
    sessionId: cleanCode,
    title: `${topicName} Quiz`,
    topic: topicName,
    isAI: true,
    isActive: true,
    createdAt: Date.now(),
    durationSeconds: Math.max(1, Math.min(180, Number(durationMinutes) || 10)) * 60,
    expiresAt: Date.now() + Math.max(1, Math.min(180, Number(durationMinutes) || 10)) * 60 * 1000,
    questions: generatedQuestions,
    submissions: {},
    showAnswerKey: Boolean(req.body.showAnswerKey),
  };

  session.activeQuiz = newQuiz;
  saveSessions();

  return res.status(201).json({ session });
});

// Student Quiz Submission Endpoint (Guaranteed Persistence & Real-Time Sync)
app.post('/api/session/quiz/submit', (req, res) => {
  const { code, participantId, studentName, answers, quizId } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session) {
    return res.status(404).json({ error: 'Class session not found. Please verify the code.' });
  }

  // Find target quiz: prefer active quiz, fall back to history.
  let targetQuiz = session.activeQuiz;
  if (!targetQuiz && quizId) {
    targetQuiz = (session.quizzesHistory || []).find((q) => q.id === quizId);
  }

  // ── Idempotency: check if this student already submitted this quiz ──
  // This handles the race condition where a student clicks submit just as
  // the teacher closes the quiz. We return their prior result gracefully.
  if (quizId && session.quizSubmissions) {
    const priorSubmission = session.quizSubmissions.find(
      (s) => s.quizId === quizId && s.participantId === participantId
    );
    if (priorSubmission) {
      return res.status(200).json({
        success: true,
        session: getStudentSessionView(session, participantId),
        result: {
          quizId: priorSubmission.quizId,
          score: priorSubmission.score,
          total: priorSubmission.total,
          percentage: priorSubmission.percentage,
          ...(targetQuiz?.showAnswerKey ? { answerKey: buildQuizAnswerKey(targetQuiz) } : {}),
        },
        message: 'Quiz already submitted — returning your recorded result.',
      });
    }
  }

  if (!targetQuiz) {
    // Give a specific message based on whether any quiz has ever existed
    const hadQuiz = session.quizzesHistory.length > 0;
    return res.status(400).json({
      error: hadQuiz
        ? 'The quiz has already ended. Your answers were not recorded.'
        : 'No active quiz found for this session.',
    });
  }

  if (targetQuiz.expiresAt && Date.now() >= targetQuiz.expiresAt) {
    return res.status(410).json({
      error: 'This quiz time limit has expired. Your answers were not recorded.',
      expired: true,
    });
  }

  const studentAnswers = answers || {};
  let correctCount = 0;

  targetQuiz.questions.forEach((q) => {
    if (studentAnswers[q.id] !== undefined && Number(studentAnswers[q.id]) === q.correctIndex) {
      correctCount += 1;
    }
  });

  const total = targetQuiz.questions.length;
  const percentage = Math.round((correctCount / total) * 100);

  const submissionRecord = {
    quizId: targetQuiz.id,
    sessionId: cleanCode,
    quizTitle: targetQuiz.title,
    participantId: participantId || generateId('student'),
    studentName: studentName || 'Student',
    answers: studentAnswers,
    score: correctCount,
    total,
    percentage,
    submittedAt: Date.now(),
  };

  // Persist onto the quiz object (for real-time teacher scoreboard)
  if (!targetQuiz.submissions) {
    targetQuiz.submissions = {};
  }
  targetQuiz.submissions[submissionRecord.participantId] = submissionRecord;

  // Also persist on the session-level list (for history & idempotency checks)
  if (!session.quizSubmissions) {
    session.quizSubmissions = [];
  }
  session.quizSubmissions.unshift(submissionRecord);
  saveSessions();

  return res.status(200).json({
    success: true,
    session: getStudentSessionView(session, participantId),
    result: {
      quizId: targetQuiz.id,
      score: correctCount,
      total,
      percentage,
      ...(targetQuiz.showAnswerKey ? { answerKey: buildQuizAnswerKey(targetQuiz) } : {}),
    },
  });
});

app.post('/api/session/quiz/close', (req, res) => {
  const { code } = req.body;
  const cleanCode = (code || '').trim();
  const session = sessions[cleanCode];

  if (!session || !session.activeQuiz) {
    return res.status(400).json({ error: 'No active quiz to close.' });
  }

  session.activeQuiz.isActive = false;
  session.quizzesHistory.unshift({ ...session.activeQuiz, closedAt: Date.now() });
  session.activeQuiz = null;
  saveSessions();

  return res.status(200).json({ session });
});

// -------------------------------------------------------------
// Static Frontend Hosting & Fallback Routing
// -------------------------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, error);
  if (res.headersSent) return next(error);
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
  });
});

const distPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// -------------------------------------------------------------
// Start Server on 0.0.0.0
// -------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 LiveLogic Interactive Classroom is running!`);
  console.log(`📡 Local Machine: http://localhost:${PORT}`);
  console.log(`📱 Mobile/Wi-Fi Access: http://${LOCAL_IP}:${PORT}`);
  console.log(`====================================================`);
});