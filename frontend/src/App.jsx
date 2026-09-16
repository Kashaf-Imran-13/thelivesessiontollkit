import React, { useState, useEffect, useRef, useCallback } from 'react';

// Dynamic API origin (works on localhost, LAN IP, and mobile devices)
const API_BASE = (typeof window !== 'undefined' && window.location.origin
  ? window.location.origin
  : 'http://localhost:5000') + '/api';

async function readApiResponse(response) {
  const body = await response.text();
  let data;
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`API returned a non-JSON response (${response.status}). Check that the backend is running at ${API_BASE}.`);
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.error || `Request failed (${response.status}).`);
  }
  return data;
}

const POLL_INTERVAL_MS = 1500;

// -------------------------------------------------------------
// Theme Definitions (Corporate Blue Palette)
// -------------------------------------------------------------
const getTheme = (isDark) => ({
  isDark,
  bg: isDark ? '#0b1329' : '#f0f4f9',
  card: isDark ? '#13203b' : '#ffffff',
  cardSecondary: isDark ? '#0d172e' : '#f8fafc',
  border: isDark ? '#22365e' : '#cbd5e1',
  text: isDark ? '#f8fafc' : '#0f172a',
  subtext: isDark ? '#94a3b8' : '#64748b',
  primary: '#2563eb', // Royal Blue
  primaryHover: '#1d4ed8',
  primaryLight: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
  sky: '#0284c7', // Sky Blue
  emerald: '#10b981', // Success Green
  emeraldBg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
  amber: '#f59e0b',
  red: '#ef4444',
  redBg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
  whatsapp: '#25D366',
});

// -------------------------------------------------------------
// Top Navigation Header with Theme Toggle
// -------------------------------------------------------------
function TopNavbar({ isDark, onToggleTheme, title = 'LiveLogic Classroom', onBack, onLeave, userLabel, isStudentLocked }) {
  const theme = getTheme(isDark);

  return (
    <header
      style={{
        width: '100%',
        background: theme.card,
        borderBottom: `1px solid ${theme.border}`,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '18px',
          }}
        >
          ⚡
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: theme.text, letterSpacing: '-0.3px' }}>
            {title}
          </span>
          {userLabel && (
            <div style={{ fontSize: '12px', color: theme.subtext, fontWeight: 500 }}>
              {userLabel}
            </div>
          )}
        </div>

      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onBack && (
          <button
            onClick={onBack}
            title="Go back"
            style={{ background: 'transparent', border: `1px solid ${theme.border}`, color: theme.text, padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            background: theme.cardSecondary,
            border: `1px solid ${theme.border}`,
            color: theme.text,
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{isDark ? '☀️' : '🌙'}</span>
          <span>{isDark ? 'Light' : 'Dark'}</span>
        </button>

        {onLeave && (
          <button
            onClick={onLeave}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.red,
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {isStudentLocked ? 'Exit Class' : 'Leave'}
          </button>
        )}
      </div>
    </header>
  );
}

// -------------------------------------------------------------
// Teacher Passcode Modal (For Resuming / Unlocking Session)
// -------------------------------------------------------------
function TeacherAuthModal({ isOpen, onClose, onSuccess, isDark }) {
  const theme = getTheme(isDark);
  const [code, setCode] = useState(() => localStorage.getItem('livelogic_teacher_code') || '');
  const [passcode, setPasscode] = useState(() => localStorage.getItem('livelogic_teacher_passcode') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim() || !passcode.trim()) {
      setError('Please enter both the Class Code and your Teacher Passcode.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/teacher/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), passcode: passcode.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('livelogic_teacher_code', code.trim());
        localStorage.setItem('livelogic_teacher_passcode', passcode.trim());
        onSuccess(data.session);
      } else {
        setError(data.error || 'Incorrect passcode for this class.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '20px',
          padding: '32px 28px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔐</div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, marginBottom: '6px' }}>
          Teacher Dashboard Access
        </h3>
        <p style={{ color: theme.subtext, fontSize: '13px', marginBottom: '20px' }}>
          Enter your 6-digit Class Code and 4-digit Teacher Passcode.
        </p>

        {error && (
          <div
            style={{
              background: theme.redBg,
              border: `1px solid ${theme.red}`,
              color: theme.red,
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.subtext, textAlign: 'left', marginBottom: '4px' }}>
            6-Digit Class Code
          </label>
          <input
            type="text"
            placeholder="e.g. 123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: theme.cardSecondary,
              color: theme.text,
              fontSize: '16px',
              textAlign: 'center',
              letterSpacing: '4px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '14px',
            }}
            autoFocus
          />

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.subtext, textAlign: 'left', marginBottom: '4px' }}>
            4-Digit Teacher Passcode
          </label>
          <input
            type="password"
            placeholder="e.g. 4821"
            maxLength={6}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: theme.cardSecondary,
              color: theme.text,
              fontSize: '16px',
              textAlign: 'center',
              letterSpacing: '4px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '20px',
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              background: theme.primary,
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '10px',
            }}
          >
            {loading ? 'Verifying...' : 'Unlock Teacher Dashboard'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              color: theme.subtext,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Role Selection Screen
// -------------------------------------------------------------
function RoleSelectScreen({ onStartNewClass, onResumeTeacher, onSelectStudent, isDark, onToggleTheme }) {
  const theme = getTheme(isDark);

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
      <TopNavbar isDark={isDark} onToggleTheme={onToggleTheme} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: '24px',
            padding: '40px 32px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: '20px',
            }}
          >
            🎓
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '8px' }}>
            Interactive Classroom
          </h1>
          <p style={{ color: theme.subtext, fontSize: '15px', marginBottom: '28px', lineHeight: 1.5 }}>
            Real-time live polling, waiting rooms, and unlimited AI quiz builder. Choose your portal:
          </p>

          <button
            onClick={onStartNewClass}
            style={{
              width: '100%',
              padding: '18px 20px',
              borderRadius: '16px',
              border: `1px solid ${theme.border}`,
              background: theme.cardSecondary,
              color: theme.text,
              fontSize: '17px',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                color: '#fff',
              }}
            >
              ➕
            </div>
            <div>
              <div style={{ color: theme.text, fontSize: '16px', fontWeight: 700 }}>Teacher: Create New Class</div>
              <div style={{ fontSize: '13px', color: theme.subtext, fontWeight: 400, marginTop: '2px' }}>
                Set custom passcode & start interactive session
              </div>
            </div>
          </button>

          <button
            onClick={onResumeTeacher}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '14px',
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.subtext,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>🔐</span>
            <span>Resume Existing Class as Teacher</span>
          </button>

          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '18px' }}>
            <button
              onClick={onSelectStudent}
              style={{
                width: '100%',
                padding: '18px 20px',
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                background: theme.cardSecondary,
                color: theme.text,
                fontSize: '17px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  color: '#fff',
                }}
              >
                🙋‍♂️
              </div>
              <div>
                <div style={{ color: theme.text, fontSize: '16px', fontWeight: 700 }}>Student Join</div>
                <div style={{ fontSize: '13px', color: theme.subtext, fontWeight: 400, marginTop: '2px' }}>
                  Enter class via 6-digit code or QR
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Teacher Dashboard Component (Multi-Tab Control Center)
// -------------------------------------------------------------
function TeacherControlCenter({ onLeave, onBack, onResumeTeacher, isDark, onToggleTheme, initialSession }) {
  const theme = getTheme(isDark);

  const [teacherName, setTeacherName] = useState('');
  const [customPasscode, setCustomPasscode] = useState('');
  const [session, setSession] = useState(initialSession || null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | waiting | polls | quizzes | attendance | questions
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Poll Form State (Auto-cleared clean inputs)
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollSubmitting, setPollSubmitting] = useState(false);

  // Quiz Builder State (Unlimited AI & Manual Questions)
  const [quizMode, setQuizMode] = useState('ai'); // ai | manual
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [quizDurationMinutes, setQuizDurationMinutes] = useState(10);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Manual Quiz State
  const [manualTitle, setManualTitle] = useState('');
  const [manualTopic, setManualTopic] = useState('');
  const [manualQuestions, setManualQuestions] = useState([
    {
      id: 'q_1',
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
    },
  ]);

  const pollIntervalRef = useRef(null);
  const historyVersion = [
    session?.activeParticipants?.length || 0,
    session?.waitingRoom?.length || 0,
    session?.activePoll?.id || '',
    session?.activeQuiz?.id || '',
    session?.quizSubmissions?.length || 0,
    session?.activeQuiz?.submissions ? Object.keys(session.activeQuiz.submissions).length : 0,
    session?.feedback?.length || 0,
    session?.attendance?.length || 0,
    session?.doubts?.map((doubt) => `${doubt.id}:${doubt.status}`).join(',') || '',
  ].join(':');

  // 1. Create Session with Custom Passcode
  const handleCreateSession = async () => {
    if (!teacherName.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setIsCreating(true);

    try {
      const res = await fetch(`${API_BASE}/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: teacherName.trim(),
          customPasscode: customPasscode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session.');
      localStorage.setItem('livelogic_teacher_code', data.session.code);
      localStorage.setItem('livelogic_teacher_passcode', data.session.teacherPasscode);
      setSession(data.session);
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setIsCreating(false);
    }
  };

  // 2. Poll Server for Session Status Updates (every 1.5s)
  const fetchSessionData = useCallback(async (code) => {
    try {
      const res = await fetch(`${API_BASE}/session/${code}`);
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
      }
    } catch {
      // background poll catch
    }
  }, []);

  useEffect(() => {
    if (!session?.code) return;
    pollIntervalRef.current = setInterval(() => {
      fetchSessionData(session.code);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [session?.code, fetchSessionData]);

  useEffect(() => {
    if (!session?.code || !session.teacherPasscode) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      setHistoryError('');
      try {
        const res = await fetch(`${API_BASE}/teacher/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: session.code, passcode: session.teacherPasscode }),
        });
        const data = await readApiResponse(res);
        if (data.success) setSessionHistory(data.history || []);
      } catch (error) {
        setHistoryError(error.message || 'Could not load session history.');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [session?.code, session?.teacherPasscode, historyVersion]);

  // 3. Approve Student
  const handleApprove = async (participantId) => {
    try {
      const res = await fetch(`${API_BASE}/session/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: session.code, participantId }),
      });
      const data = await res.json();
      if (res.ok && data.session) setSession(data.session);
    } catch {
      setError('Approval failed.');
    }
  };

  // 4. Reject Student
  const handleReject = async (participantId) => {
    try {
      const res = await fetch(`${API_BASE}/session/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: session.code, participantId }),
      });
      const data = await res.json();
      if (res.ok && data.session) setSession(data.session);
    } catch {
      setError('Rejection failed.');
    }
  };

  // 5. Kick Student
  const handleKick = async (participantId) => {
    try {
      const res = await fetch(`${API_BASE}/session/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: session.code, participantId }),
      });
      const data = await res.json();
      if (res.ok && data.session) setSession(data.session);
    } catch {
      setError('Could not remove student.');
    }
  };

  const handleResolveDoubt = async (doubtId) => {
    try {
      const res = await fetch(`${API_BASE}/session/doubt/${doubtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: session.code, status: 'resolved' }),
      });
      const data = await res.json();
      if (res.ok && data.doubt) {
        setSession((current) => ({
          ...current,
          doubts: (current.doubts || []).map((doubt) => doubt.id === doubtId ? data.doubt : doubt),
        }));
      }
    } catch {
      setError('Could not resolve doubt.');
    }
  };

  const handleExportReport = () => {
    const url = `${API_BASE}/teacher/history/${encodeURIComponent(session.code)}/report.csv?passcode=${encodeURIComponent(session.teacherPasscode)}`;
    window.open(url, '_blank');
  };

  // 6. Launch Poll (Auto-resets form inputs to blank)
  const handleLaunchPoll = async (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;

    const validOptions = pollOptions.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      alert('Please fill in at least 2 options.');
      return;
    }

    setPollSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/session/poll/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: session.code,
          question: pollQuestion.trim(),
          options: validOptions,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        setPollQuestion('');
        setPollOptions(['', '']);
      } else {
        alert(data.error || 'Failed to launch poll.');
      }
    } catch (err) {
      alert(`Error launching poll: ${err.message}`);
    } finally {
      setPollSubmitting(false);
    }
  };

  // 7. Close Poll
  const handleClosePoll = async () => {
    try {
      const res = await fetch(`${API_BASE}/session/poll/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: session.code }),
      });
      const data = await res.json();
      if (res.ok && data.session) setSession(data.session);
    } catch {
      alert('Failed to close poll.');
    }
  };

  // 8. Launch Unlimited AI Quiz (Direct Session Persistence)
  const handleLaunchAiQuiz = async () => {
    if (!aiTopic.trim()) {
      alert('Please enter a topic keyword for the quiz.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/session/quiz/generate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: session.code,
          topic: aiTopic.trim(),
          count: aiCount,
          durationMinutes: quizDurationMinutes,
          showAnswerKey,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        setAiTopic('');
      } else {
        alert(data.error || 'Failed to generate AI quiz.');
      }
    } catch (err) {
      alert(`AI Quiz generation error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // 9. Launch Manual Quiz (Direct Session Persistence)
  const handleLaunchManualQuiz = async () => {
    if (!manualTitle.trim()) {
      alert('Please enter a quiz title.');
      return;
    }

    const validQuestions = manualQuestions.filter(
      (q) => q.question.trim().length > 0 && q.options.some((o) => o.trim().length > 0)
    );

    if (validQuestions.length === 0) {
      alert('Please enter at least one question with options.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/session/quiz/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: session.code,
          title: manualTitle.trim(),
          topic: manualTopic.trim() || 'General',
          questions: validQuestions,
          durationMinutes: quizDurationMinutes,
          showAnswerKey,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        setManualTitle('');
        setManualTopic('');
        setManualQuestions([
          {
            id: 'q_1',
            question: '',
            options: ['', '', '', ''],
            correctIndex: 0,
          },
        ]);
      } else {
        alert(data.error || 'Failed to launch quiz.');
      }
    } catch (err) {
      alert(`Quiz error: ${err.message}`);
    }
  };

  // 10. Close Quiz
  const handleCloseQuiz = async () => {
    try {
      const res = await fetch(`${API_BASE}/session/quiz/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: session.code }),
      });
      const data = await res.json();
      if (res.ok && data.session) setSession(data.session);
    } catch {
      alert('Failed to close quiz.');
    }
  };

  const handleAddManualQuestion = () => {
    setManualQuestions([
      ...manualQuestions,
      {
        id: `q_${manualQuestions.length + 1}_${Date.now().toString(36)}`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
      },
    ]);
  };

  const handleRemoveManualQuestion = (index) => {
    if (manualQuestions.length <= 1) return;
    setManualQuestions(manualQuestions.filter((_, i) => i !== index));
  };

  // Initial Creation Stage
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
        <TopNavbar isDark={isDark} onToggleTheme={onToggleTheme} onBack={onBack} onLeave={onLeave} userLabel="Teacher Setup" />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: '24px',
              padding: '36px 32px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>👨‍🏫</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: theme.text, textAlign: 'center', marginBottom: '6px' }}>
              Create Classroom Session
            </h2>
            <p style={{ color: theme.subtext, fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
              Set up your teacher profile and custom passcode.
            </p>

            {error && (
              <div
                style={{
                  background: theme.redBg,
                  border: `1px solid ${theme.red}`,
                  color: theme.red,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: theme.subtext, marginBottom: '8px' }}>
              Teacher / Instructor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Professor Smith"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                background: theme.cardSecondary,
                color: theme.text,
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '16px',
              }}
              autoFocus
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: theme.subtext }}>
                Teacher Passcode (4 Digits)
              </label>
              <button
                type="button"
                onClick={() => setCustomPasscode(String(Math.floor(1000 + Math.random() * 9000)))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.primary,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🎲 Random
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. 7842 (Auto-generated if empty)"
              maxLength={4}
              value={customPasscode}
              onChange={(e) => setCustomPasscode(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                background: theme.cardSecondary,
                color: theme.text,
                fontSize: '16px',
                letterSpacing: '2px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '24px',
              }}
            />

            <button
              onClick={handleCreateSession}
              disabled={isCreating}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: 'none',
                background: theme.primary,
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              {isCreating ? 'Generating Class Code...' : '⚡ Generate Class Code'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: theme.border }} />
              <span style={{ fontSize: '12px', color: theme.subtext, fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: '1px', background: theme.border }} />
            </div>

            {/* Resume existing session via passcode */}
            <button
              type="button"
              onClick={onResumeTeacher}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.subtext,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>🔐</span>
              <span>Resume Existing Class</span>
            </button>
          </div>
        </div>
      </div>
    );
  }


  // Active Session Control Center
  const networkJoinUrl = session.joinUrl || `http://${session.localIp || 'localhost'}:5000/?code=${session.code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(networkJoinUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Join our live classroom!\nCode: ${session.code}\nJoin link: ${networkJoinUrl}`)}`;

  const totalPollVotes = session.activePoll
    ? Object.keys(session.activePoll.votes || {}).length
    : 0;

  const totalQuizSubmissions = session.activeQuiz
    ? Object.keys(session.activeQuiz.submissions || {}).length
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
      <TopNavbar
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onBack={onLeave}
        onLeave={() => {
          if (window.confirm('Are you sure you want to end this session and leave?')) onLeave();
        }}
        userLabel={`Teacher: ${session.hostName}`}
      />

      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '24px 16px', boxSizing: 'border-box' }}>
        {/* Top Header Card with Passcode Reminder */}
        <div
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: theme.subtext, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Class Code
                </div>
                <div
                  style={{
                    fontSize: '40px',
                    fontWeight: 900,
                    color: theme.primary,
                    letterSpacing: '6px',
                    fontFamily: 'monospace',
                    lineHeight: 1,
                    margin: '4px 0',
                  }}
                >
                  {session.code}
                </div>
              </div>

              {session.teacherPasscode && (
                <div
                  style={{
                    background: theme.cardSecondary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    padding: '8px 14px',
                    marginLeft: '8px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: theme.amber, fontWeight: 800, textTransform: 'uppercase' }}>
                    🔑 Teacher Passcode
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: theme.text, fontFamily: 'monospace', letterSpacing: '2px' }}>
                    {session.teacherPasscode}
                  </div>
                </div>
              )}
            </div>

            <div style={{ fontSize: '13px', color: theme.subtext, marginTop: '8px' }}>
              Mobile Join Link: <code style={{ color: theme.emerald, background: theme.cardSecondary, padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>{networkJoinUrl}</code>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <img
                src={qrUrl}
                alt="Mobile QR Code"
                width={104}
                height={104}
                style={{ borderRadius: '10px', background: '#ffffff', padding: '5px', display: 'block', border: `1px solid ${theme.border}` }}
              />
              <span style={{ fontSize: '11px', color: theme.emerald, fontWeight: 700, marginTop: '4px', display: 'block' }}>
                📱 Mobile QR Ready
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: theme.whatsapp,
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>💬</span> Share via WhatsApp
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(networkJoinUrl);
                  alert(`✅ Student Invite Link Copied!\n\n${networkJoinUrl}\n\nShare this link with your students to let them join instantly.`);
                }}
                style={{
                  background: theme.cardSecondary,
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📋 Copy Student Invite Link
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: `1px solid ${theme.border}`,
            paddingBottom: '8px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'overview', label: '📊 Class Overview' },
            { id: 'waiting', label: `👥 Waiting Room (${session.waitingRoom.length})` },
            { id: 'polls', label: `📈 Live Polls ${session.activePoll ? '● Live' : ''}` },
            { id: 'quizzes', label: `✨ Quizzes ${session.activeQuiz ? `● Live (${totalQuizSubmissions})` : ''}` },
            { id: 'attendance', label: `🧾 Attendance (${session.attendance?.length || session.activeParticipants.length})` },
            { id: 'questions', label: `🙋 Doubts (${(session.doubts || []).filter((doubt) => doubt.status === 'open').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.id ? theme.primary : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : theme.subtext,
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '13px', color: theme.subtext, fontWeight: 600 }}>Active Connected Students</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: theme.emerald, marginTop: '4px' }}>
                  {session.activeParticipants.length}
                </div>
              </div>

              <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '13px', color: theme.subtext, fontWeight: 600 }}>Pending in Waiting Room</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: session.waitingRoom.length > 0 ? theme.amber : theme.subtext, marginTop: '4px' }}>
                  {session.waitingRoom.length}
                </div>
              </div>

              <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '13px', color: theme.subtext, fontWeight: 600 }}>Live Poll Status</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: session.activePoll ? theme.primary : theme.subtext, marginTop: '12px' }}>
                  {session.activePoll ? `Active (${totalPollVotes} votes)` : 'No active poll'}
                </div>
              </div>

              <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '13px', color: theme.subtext, fontWeight: 600 }}>Active Quiz Status</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: session.activeQuiz ? theme.sky : theme.subtext, marginTop: '12px' }}>
                  {session.activeQuiz ? `Active (${session.activeQuiz.questions?.length || 0} Questions, ${totalQuizSubmissions} submitted)` : 'No active quiz'}
                </div>
              </div>
            </div>

            {/* Active Student Roster */}
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: theme.text, marginBottom: '16px' }}>
                Active Classroom Roster ({session.activeParticipants.length})
              </h3>
              {session.activeParticipants.length === 0 ? (
                <div style={{ color: theme.subtext, fontSize: '14px', fontStyle: 'italic', padding: '12px 0' }}>
                  No students in class yet. Have students scan the QR code or enter code <strong>{session.code}</strong>.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {session.activeParticipants.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: theme.cardSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '12px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.emerald }} />
                        <span style={{ fontWeight: 600, color: theme.text, fontSize: '14px' }}>{p.name}</span>
                      </div>
                      <button
                        onClick={() => handleKick(p.id)}
                        title="Remove student"
                        style={{ background: 'transparent', border: 'none', color: theme.subtext, cursor: 'pointer', fontSize: '12px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px', marginTop: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: theme.text, marginBottom: '6px' }}>
                Teacher Session History
              </h3>
              <p style={{ color: theme.subtext, fontSize: '13px', marginBottom: '16px' }}>
                Saved sessions remain available for review and resume after a browser restart.
              </p>
              <button
                onClick={handleExportReport}
                style={{ padding: '9px 14px', borderRadius: '9px', border: `1px solid ${theme.border}`, background: theme.cardSecondary, color: theme.text, fontWeight: 700, cursor: 'pointer', marginBottom: '16px' }}
              >
                Export Report (CSV)
              </button>
              {isLoadingHistory ? (
                <div style={{ color: theme.subtext, fontSize: '14px' }}>Loading saved sessions...</div>
              ) : historyError ? (
                <div style={{ background: theme.redBg, border: `1px solid ${theme.red}`, color: theme.red, borderRadius: '10px', padding: '12px', fontSize: '13px' }}>
                  {historyError}
                </div>
              ) : sessionHistory.length === 0 ? (
                <div style={{ color: theme.subtext, fontSize: '14px' }}>No previous sessions found.</div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {sessionHistory.map((item) => (
                    <details key={item.code} style={{ background: theme.cardSecondary, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '12px 14px' }}>
                      <summary style={{ cursor: 'pointer', color: theme.text, fontWeight: 700 }}>
                        <span style={{ color: theme.primary, fontFamily: 'monospace', letterSpacing: '1px' }}>{item.code}</span>
                        <span style={{ color: theme.subtext, fontSize: '12px', marginLeft: '12px' }}>{new Date(item.createdAt).toLocaleString()}</span>
                      </summary>
                      <div style={{ color: theme.subtext, fontSize: '13px', marginTop: '14px' }}>
                        <strong style={{ color: theme.text }}>Participants</strong>
                        {item.participants?.length ? item.participants.map((participant) => (
                          <div key={participant.id} style={{ padding: '6px 0' }}>
                            {participant.name} · ID: {participant.id} · {participant.participationStatus} · joined {participant.joinedAt ? new Date(participant.joinedAt).toLocaleString() : 'pending'}
                          </div>
                        )) : <div style={{ padding: '6px 0' }}>No participants recorded.</div>}

                        <strong style={{ color: theme.text, display: 'block', marginTop: '10px' }}>Questions Asked</strong>
                        {item.questionsAsked?.length ? item.questionsAsked.map((question) => (
                          <div key={question.id} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.border}` }}>
                            <div style={{ color: theme.text }}>{question.question}</div>
                            <div style={{ fontSize: '12px' }}>{question.type} {question.quizTitle ? `· ${question.quizTitle}` : ''}</div>
                            {question.options?.length > 0 && (
                              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                Options: {question.options.join(' | ')}
                                {question.correctIndex !== undefined && (
                                  <span style={{ color: theme.emerald, marginLeft: '8px' }}>
                                    Correct: {question.options[question.correctIndex] || 'Not specified'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )) : <div style={{ padding: '6px 0' }}>No questions recorded.</div>}

                        <strong style={{ color: theme.text, display: 'block', marginTop: '10px' }}>Quiz Submissions</strong>
                        {item.quizSubmissions?.length ? item.quizSubmissions.map((submission) => (
                          <div key={`${submission.quizId}:${submission.participantId}`} style={{ padding: '6px 0' }}>
                            {submission.studentName} · {submission.score}/{submission.total} ({submission.percentage}%) · ID: {submission.participantId}
                          </div>
                        )) : <div style={{ padding: '6px 0' }}>No quiz submissions.</div>}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px', marginTop: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: theme.text, margin: '0 0 12px' }}>Student Reviews & Feedback</h3>
              {session.feedback?.length ? session.feedback.map((feedback) => (
                <div key={feedback.id} style={{ padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ color: theme.text, fontWeight: 700 }}>{feedback.studentName}</div>
                  <div style={{ color: theme.subtext, fontSize: '12px', margin: '4px 0' }}>{new Date(feedback.createdAt).toLocaleString()}</div>
                  <div style={{ color: theme.text, fontSize: '14px' }}>{feedback.message}</div>
                </div>
              )) : <div style={{ color: theme.subtext, fontSize: '14px' }}>No student feedback yet.</div>}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, margin: '0 0 6px' }}>Attendance Sheet</h3>
            <p style={{ color: theme.subtext, fontSize: '13px', marginBottom: '18px' }}>Students are marked when they join with the session code.</p>
            {!session.attendance?.length ? (
              <div style={{ color: theme.subtext, padding: '20px', background: theme.cardSecondary, borderRadius: '12px' }}>No attendance recorded yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {session.attendance.map((record) => (
                  <div key={record.participantId} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.5fr .7fr', gap: '12px', alignItems: 'center', background: theme.cardSecondary, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '12px 14px' }}>
                    <div><strong style={{ color: theme.text }}>{record.studentName}</strong><div style={{ color: theme.subtext, fontSize: '11px' }}>{record.participantId}</div></div>
                    <span style={{ color: theme.subtext, fontSize: '13px' }}>{record.joinTime ? new Date(record.joinTime).toLocaleString() : 'Unknown'}</span>
                    <strong style={{ color: record.status === 'Late' ? theme.amber : record.status === 'Left' ? theme.subtext : theme.emerald }}>{record.status}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, margin: '0 0 6px' }}>Live Doubt Queue</h3>
            <p style={{ color: theme.subtext, fontSize: '13px', marginBottom: '18px' }}>Raise-hand signals and student questions appear here in real time.</p>
            {!session.doubts?.length ? (
              <div style={{ color: theme.subtext, padding: '20px', background: theme.cardSecondary, borderRadius: '12px' }}>No doubts raised yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {session.doubts.map((doubt) => (
                  <div key={doubt.id} style={{ background: theme.cardSecondary, border: `1px solid ${doubt.status === 'open' ? theme.amber : theme.border}`, borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><strong style={{ color: theme.text }}>{doubt.type === 'hand' ? '✋ Raise Hand' : '❓ Ask Doubt'} · {doubt.studentName}</strong><span style={{ color: doubt.status === 'open' ? theme.amber : theme.subtext, fontSize: '12px', fontWeight: 700 }}>{doubt.status}</span></div>
                    <div style={{ color: theme.text, margin: '8px 0', fontSize: '14px' }}>{doubt.message}</div>
                    {doubt.status === 'open' && <button onClick={() => handleResolveDoubt(doubt.id)} style={{ padding: '7px 11px', borderRadius: '8px', border: 'none', background: theme.emerald, color: '#052e12', fontWeight: 700, cursor: 'pointer' }}>Mark Resolved</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Waiting Room & Approval */}
        {activeTab === 'waiting' && (
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, marginBottom: '6px' }}>
              Pending Student Access Requests ({session.waitingRoom.length})
            </h3>
            <p style={{ color: theme.subtext, fontSize: '14px', marginBottom: '20px' }}>
              Approved students will immediately unlock the live workspace on their devices.
            </p>

            {session.waitingRoom.length === 0 ? (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: theme.subtext,
                  background: theme.cardSecondary,
                  borderRadius: '16px',
                  border: `1px dashed ${theme.border}`,
                }}
              >
                No pending requests right now. Students joining via code <strong>{session.code}</strong> will appear here instantly.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {session.waitingRoom.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      background: theme.cardSecondary,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '14px',
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: theme.text }}>{student.name}</div>
                      <div style={{ fontSize: '12px', color: theme.subtext }}>
                        Requested at {new Date(student.requestedAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApprove(student.id)}
                        style={{
                          background: theme.emerald,
                          color: '#052e12',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReject(student.id)}
                        style={{
                          background: 'transparent',
                          color: theme.red,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Interactive Live Polls */}
        {activeTab === 'polls' && (
          <div style={{ display: 'grid', gridTemplateColumns: session.activePoll ? '1fr 1fr' : '1fr', gap: '20px' }}>
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, marginBottom: '6px' }}>
                Create Quick Live Poll
              </h3>
              <p style={{ color: theme.subtext, fontSize: '14px', marginBottom: '20px' }}>
                Fields auto-clear after launching. Live voting updates student screens instantly.
              </p>

              <form onSubmit={handleLaunchPoll}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.subtext, marginBottom: '6px' }}>
                  Poll Question
                </label>
                <input
                  type="text"
                  placeholder="e.g. Which topic should we review first?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${theme.border}`,
                    background: theme.cardSecondary,
                    color: theme.text,
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    marginBottom: '16px',
                  }}
                  required
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: theme.subtext }}>
                    Poll Options ({pollOptions.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.primary,
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Add Option
                  </button>
                </div>

                {pollOptions.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...pollOptions];
                        updated[idx] = e.target.value;
                        setPollOptions(updated);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        background: theme.cardSecondary,
                        color: theme.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${theme.border}`,
                          color: theme.red,
                          borderRadius: '10px',
                          padding: '0 12px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={pollSubmitting}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: theme.primary,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  {pollSubmitting ? 'Launching...' : '🚀 Launch Live Poll'}
                </button>
              </form>
            </div>

            {/* Active Poll Live Display */}
            {session.activePoll && (
              <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: theme.emerald, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ● Active Live Poll
                  </span>
                  <button
                    onClick={handleClosePoll}
                    style={{
                      background: theme.redBg,
                      border: `1px solid ${theme.red}`,
                      color: theme.red,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    End Poll
                  </button>
                </div>

                <h4 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, marginBottom: '20px' }}>
                  {session.activePoll.question}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {session.activePoll.options.map((option) => {
                    const votesForOption = Object.values(session.activePoll.votes || {}).filter(
                      (v) => v.optionId === option.id
                    ).length;
                    const pct = totalPollVotes > 0 ? Math.round((votesForOption / totalPollVotes) * 100) : 0;

                    return (
                      <div
                        key={option.id}
                        style={{
                          background: theme.cardSecondary,
                          borderRadius: '12px',
                          padding: '12px 16px',
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, color: theme.text, marginBottom: '6px' }}>
                          <span>{option.text}</span>
                          <span style={{ color: theme.primary, fontWeight: 700 }}>
                            {votesForOption} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height: '8px', background: theme.border, borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #2563eb, #0284c7)',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '16px', fontSize: '13px', color: theme.subtext, textAlign: 'right' }}>
                  Total Votes Recorded: <strong>{totalPollVotes}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Unlimited Custom & AI Quiz Builder & Real-time Scoreboard */}
        {activeTab === 'quizzes' && (
          <div style={{ display: 'grid', gridTemplateColumns: session.activeQuiz ? '1fr 1fr' : '1fr', gap: '20px' }}>
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, margin: 0 }}>
                  Unlimited Quiz Builder
                </h3>
                <div style={{ display: 'flex', gap: '4px', background: theme.cardSecondary, padding: '4px', borderRadius: '10px' }}>
                  <button
                    onClick={() => setQuizMode('ai')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: quizMode === 'ai' ? theme.primary : 'transparent',
                      color: quizMode === 'ai' ? '#fff' : theme.subtext,
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✨ AI Generator
                  </button>
                  <button
                    onClick={() => setQuizMode('manual')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: quizMode === 'manual' ? theme.primary : 'transparent',
                      color: quizMode === 'manual' ? '#fff' : theme.subtext,
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✍️ Manual Builder
                  </button>
                </div>
              </div>

              <div style={{ background: theme.cardSecondary, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px 14px', marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.subtext, marginBottom: '6px' }}>
                  Quiz Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={quizDurationMinutes}
                  onChange={(e) => setQuizDurationMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, fontSize: '14px', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '12px', color: theme.subtext, marginTop: '6px' }}>
                  Students can submit only before this timer expires.
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.text, fontSize: '13px', fontWeight: 700, marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    checked={showAnswerKey}
                    onChange={(event) => setShowAnswerKey(event.target.checked)}
                  />
                  Allow students to view answer key after submission
                </label>
              </div>

              {quizMode === 'ai' ? (
                <div>
                  <p style={{ color: theme.subtext, fontSize: '14px', marginBottom: '16px' }}>
                    Generate any number of questions for any topic. Inputs auto-clear upon launch.
                  </p>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.subtext, marginBottom: '6px' }}>
                    Topic Keyword
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. JavaScript, Python, Photosynthesis, World History, Calculus..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${theme.border}`,
                      background: theme.cardSecondary,
                      color: theme.text,
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      marginBottom: '16px',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: theme.subtext }}>
                      Number of Questions
                    </label>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: theme.primary }}>
                      {aiCount} Questions
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {[3, 5, 8, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAiCount(num)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${aiCount === num ? theme.primary : theme.border}`,
                          background: aiCount === num ? theme.primaryLight : theme.cardSecondary,
                          color: aiCount === num ? theme.primary : theme.text,
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={aiCount}
                    onChange={(e) => setAiCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${theme.border}`,
                      background: theme.cardSecondary,
                      color: theme.text,
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      marginBottom: '20px',
                    }}
                    placeholder="Or enter custom number (e.g. 12)"
                  />

                  <button
                    onClick={handleLaunchAiQuiz}
                    disabled={aiLoading || !aiTopic.trim()}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {aiLoading ? 'Crafting Questions...' : `✨ Generate & Launch ${aiCount}-Question AI Quiz`}
                  </button>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.subtext, marginBottom: '6px' }}>
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Midterm Assessment"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${theme.border}`,
                      background: theme.cardSecondary,
                      color: theme.text,
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      marginBottom: '12px',
                    }}
                  />

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.subtext, marginBottom: '6px' }}>
                    Subject / Topic (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={manualTopic}
                    onChange={(e) => setManualTopic(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${theme.border}`,
                      background: theme.cardSecondary,
                      color: theme.text,
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      marginBottom: '16px',
                    }}
                  />

                  {manualQuestions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      style={{
                        background: theme.cardSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '12px',
                        padding: '14px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: theme.primary }}>
                          Question {qIdx + 1}
                        </span>
                        {manualQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveManualQuestion(qIdx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: theme.red,
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            🗑 Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder={`Type question ${qIdx + 1} text here...`}
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...manualQuestions];
                          updated[qIdx].question = e.target.value;
                          setManualQuestions(updated);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme.border}`,
                          background: theme.card,
                          color: theme.text,
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          marginBottom: '10px',
                        }}
                      />

                      <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '6px' }}>
                        Select radio button next to the correct answer:
                      </div>

                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctIndex === oIdx}
                            onChange={() => {
                              const updated = [...manualQuestions];
                              updated[qIdx].correctIndex = oIdx;
                              setManualQuestions(updated);
                            }}
                          />
                          <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            value={opt}
                            onChange={(e) => {
                              const updated = [...manualQuestions];
                              updated[qIdx].options[oIdx] = e.target.value;
                              setManualQuestions(updated);
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${theme.border}`,
                              background: theme.card,
                              color: theme.text,
                              fontSize: '13px',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddManualQuestion}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px dashed ${theme.primary}`,
                      background: theme.primaryLight,
                      color: theme.primary,
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginBottom: '14px',
                    }}
                  >
                    + Add Another Question
                  </button>

                  <button
                    onClick={handleLaunchManualQuiz}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      background: theme.primary,
                      color: '#fff',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🚀 Launch Custom {manualQuestions.length}-Question Quiz
                  </button>
                </div>
              )}
            </div>

            {/* Active Quiz Monitor & Real-Time Scoreboard */}
            {session.activeQuiz && (
              <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: theme.sky, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ● Live Active Quiz
                  </span>
                  <button
                    onClick={handleCloseQuiz}
                    style={{
                      background: theme.redBg,
                      border: `1px solid ${theme.red}`,
                      color: theme.red,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    End Quiz
                  </button>
                </div>

                <h4 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, marginBottom: '4px' }}>
                  {session.activeQuiz.title}
                </h4>
                <div style={{ fontSize: '13px', color: theme.subtext, marginBottom: '20px' }}>
                  Topic: <strong>{session.activeQuiz.topic}</strong> | {session.activeQuiz.questions.length} Total Questions
                </div>

                <details style={{ background: theme.cardSecondary, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px 14px', marginBottom: '20px' }}>
                  <summary style={{ cursor: 'pointer', color: theme.primary, fontWeight: 800 }}>View Complete Answer Key</summary>
                  <div style={{ marginTop: '10px' }}>
                    {session.activeQuiz.questions.map((question, index) => (
                      <div key={question.id} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.border}`, color: theme.text, fontSize: '13px' }}>
                        <strong>{index + 1}. {question.question}</strong>
                        <div style={{ color: theme.emerald, marginTop: '4px' }}>
                          Correct answer: {question.options[question.correctIndex] || 'Not specified'}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, color: theme.text, margin: 0 }}>
                    Live Student Submissions ({totalQuizSubmissions})
                  </h5>
                  <span style={{ fontSize: '12px', color: theme.emerald, fontWeight: 700 }}>
                    ● Real-Time Sync Active
                  </span>
                </div>

                {totalQuizSubmissions === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: theme.subtext, background: theme.cardSecondary, borderRadius: '12px' }}>
                    Waiting for students to complete and submit answers...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(session.activeQuiz.submissions || {}).map(([partId, sub]) => (
                      <div
                        key={partId}
                        style={{
                          background: theme.cardSecondary,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '10px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: theme.text, fontSize: '15px' }}>{sub.studentName}</div>
                          <div style={{ fontSize: '11px', color: theme.subtext, marginTop: '2px' }}>
                            Submitted {new Date(sub.submittedAt || Date.now()).toLocaleTimeString()}
                          </div>
                        </div>
                        <span
                          style={{
                            fontWeight: 900,
                            color: sub.percentage >= 70 ? theme.emerald : theme.amber,
                            fontSize: '16px',
                          }}
                        >
                          {sub.score} / {sub.total} ({sub.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Student Portal Component (Direct, Isolated, In-App Feedback)
// -------------------------------------------------------------
function StudentPortal({ onLeave, isDark, onToggleTheme, defaultCode = '', isStudentLocked = false }) {
  const theme = getTheme(isDark);

  const [studentName, setStudentName] = useState('');
  const [classCode, setClassCode] = useState(defaultCode);
  const [participantId, setParticipantId] = useState(null);
  const [status, setStatus] = useState('form'); // 'form' | 'waiting' | 'inside'
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  // Student Poll State
  const [selectedPollOption, setSelectedPollOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const lastActivePollIdRef = useRef(null);

  // Student Quiz Taking State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizSubmissionResult, setQuizSubmissionResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackAnonymous, setFeedbackAnonymous] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [doubtMessage, setDoubtMessage] = useState('');
  const [doubtStatus, setDoubtStatus] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const lastActiveQuizIdRef = useRef(null);

  const pollIntervalRef = useRef(null);

  // 1. Send Join Request
  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!studentName.trim() || !classCode.trim()) {
      setError('Please enter both your name and the 6-digit class code.');
      return;
    }

    setError('');
    setIsJoining(true);

    try {
      const res = await fetch(`${API_BASE}/session/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: classCode.trim(),
          participantName: studentName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not join class.');

      setParticipantId(data.participantId);
      setSessionData(data.session);

      if (data.isAlreadyActive) {
        setStatus('inside');
      } else {
        setStatus('waiting');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setIsJoining(false);
    }
  };

  // 2. Poll Server Every 1.5s for Approval & Quiz/Poll Overwrites
  const fetchStudentSessionStatus = useCallback(async () => {
    if (!classCode || !participantId) return;

    try {
      const res = await fetch(`${API_BASE}/session/${classCode.trim()}?role=student&participantId=${encodeURIComponent(participantId)}`);
      const data = await res.json();
      if (res.ok && data.session) {
        const currentSession = data.session;
        setSessionData(currentSession);

        const isApproved = currentSession.activeParticipants.some((p) => p.id === participantId);
        if (isApproved) {
          setStatus('inside');
        }

        const stillInWaiting = currentSession.waitingRoom.some((p) => p.id === participantId);
        if (!isApproved && !stillInWaiting && status === 'waiting') {
          setError('Your entry request was declined by the teacher.');
          setStatus('form');
        }

        // Detect new quiz
        const currentQuiz = currentSession.activeQuiz;
        if (currentQuiz && currentQuiz.id !== lastActiveQuizIdRef.current) {
          lastActiveQuizIdRef.current = currentQuiz.id;
          setQuizAnswers({});
          setCurrentQuestionIdx(0);
          setQuizSubmissionResult(null);
          setIsSubmittingQuiz(false);
          setSubmitError('');
        } else if (!currentQuiz && lastActiveQuizIdRef.current) {
          lastActiveQuizIdRef.current = null;
          setQuizSubmissionResult(null);
        }

        // Detect new poll
        const currentPoll = currentSession.activePoll;
        if (currentPoll && currentPoll.id !== lastActivePollIdRef.current) {
          lastActivePollIdRef.current = currentPoll.id;
          setSelectedPollOption(null);
          setIsVoting(false);
        } else if (!currentPoll && lastActivePollIdRef.current) {
          lastActivePollIdRef.current = null;
          setSelectedPollOption(null);
        }
      }
    } catch {
      // background poll catch
    }
  }, [classCode, participantId, status]);

  useEffect(() => {
    if (status === 'form') return;

    pollIntervalRef.current = setInterval(() => {
      fetchStudentSessionStatus();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, fetchStudentSessionStatus]);

  useEffect(() => {
    const expiresAt = sessionData?.activeQuiz?.expiresAt;
    if (!expiresAt) {
      setQuizTimeRemaining(null);
      return undefined;
    }

    const updateRemaining = () => {
      setQuizTimeRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [sessionData?.activeQuiz?.id, sessionData?.activeQuiz?.expiresAt]);

  // 3. Vote in Poll
  const handleVote = async (optionId) => {
    if (!sessionData?.activePoll) return;
    setIsVoting(true);

    try {
      const res = await fetch(`${API_BASE}/session/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: classCode.trim(),
          participantId,
          studentName,
          optionId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSessionData(data.session);
        setSelectedPollOption(optionId);
      }
    } catch {
      // silent catch
    } finally {
      setIsVoting(false);
    }
  };

  // 4. Submit Quiz Answers (Clean In-App Feedback & Real-time Sync)
  const handleSubmitQuiz = async () => {
    if (!sessionData?.activeQuiz) return;
    setIsSubmittingQuiz(true);
    setSubmitError('');

    try {
      const res = await fetch(`${API_BASE}/session/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: classCode.trim(),
          participantId,
          studentName,
          answers: quizAnswers,
          quizId: sessionData.activeQuiz.id,
        }),
      });
      const data = await res.json();

      if (res.ok && data.result) {
        setQuizSubmissionResult(data.result);
        if (data.session) setSessionData(data.session);
      } else {
        setSubmitError(data.error || 'Could not submit quiz. Please try again.');
        if (data.expired) setQuizTimeRemaining(0);
      }
    } catch (err) {
      setSubmitError(err.message || 'Connection error while submitting quiz.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    setFeedbackStatus('Submitting...');
    try {
      const res = await fetch(`${API_BASE}/session/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: classCode.trim(),
          participantId,
          studentName,
          message: feedbackMessage.trim(),
          anonymous: feedbackAnonymous,
        }),
      });
      const data = await readApiResponse(res);
      setFeedbackMessage('');
      setFeedbackStatus('Feedback submitted. Thank you.');
    } catch (err) {
      setFeedbackStatus(err.message);
    }
  };

  const handleStudentBack = () => {
    if (isStudentLocked) {
      window.history.back();
      return;
    }
    onLeave();
  };

  const sendDoubt = async (message, type = 'doubt') => {
    setDoubtStatus('Sending...');
    try {
      const res = await fetch(`${API_BASE}/session/doubt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: classCode.trim(), participantId, studentName, message, type }),
      });
      const data = await readApiResponse(res);
      setDoubtMessage('');
      setHandRaised(type === 'hand');
      setDoubtStatus(type === 'hand' ? 'Hand raised.' : 'Doubt sent.');
      if (data.doubt) setSessionData((current) => ({ ...current, doubts: [data.doubt, ...(current.doubts || [])] }));
    } catch (err) {
      setDoubtStatus(err.message);
    }
  };

  // Form Stage
  if (status === 'form') {
    return (
      <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
        <TopNavbar
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onBack={handleStudentBack}
          onLeave={isStudentLocked ? null : onLeave}
          userLabel="Student Portal"
          isStudentLocked={isStudentLocked}
        />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: '24px',
              padding: '36px 32px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>🙋‍♂️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: theme.text, textAlign: 'center', marginBottom: '6px' }}>
              Join Live Class
            </h2>
            <p style={{ color: theme.subtext, fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
              Enter your name and the 6-digit class code.
            </p>

            {error && (
              <div
                style={{
                  background: theme.redBg,
                  border: `1px solid ${theme.red}`,
                  color: theme.red,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleJoin}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: theme.subtext, marginBottom: '8px' }}>
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.cardSecondary,
                  color: theme.text,
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                }}
                autoFocus
                required
              />

              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: theme.subtext, marginBottom: '8px' }}>
                6-Digit Class Code
              </label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.cardSecondary,
                  color: theme.text,
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '6px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '24px',
                }}
                required
              />

              <button
                type="submit"
                disabled={isJoining}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: theme.sky,
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isJoining ? 'Connecting...' : 'Request Entry to Class'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Waiting Room Stage
  if (status === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
        <TopNavbar
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onBack={() => setStatus('form')}
          userLabel="Waiting Room"
          isStudentLocked={isStudentLocked}
        />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: '24px',
              padding: '40px 32px',
              width: '100%',
              maxWidth: '460px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                border: `4px solid ${theme.border}`,
                borderTopColor: theme.sky,
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'spin 1s linear infinite',
              }}
            />

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, marginBottom: '8px' }}>
              Waiting for Teacher Approval...
            </h2>
            <p style={{ color: theme.subtext, fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
              Hello <strong>{studentName}</strong>, your request has been sent for Class Code <strong>{classCode}</strong>.
              You will automatically enter as soon as the teacher approves.
            </p>

            <button
              onClick={() => setStatus('form')}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                color: theme.subtext,
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Inside Workspace Stage
  const activePoll = sessionData?.activePoll;
  const activeQuiz = sessionData?.activeQuiz;

  const hasVotedCurrentPoll = activePoll?.votes?.[participantId];
  const submissionRecord = activeQuiz?.submissions?.[participantId];
  const isQuizCompleted = submissionRecord || (quizSubmissionResult && quizSubmissionResult.quizId === activeQuiz?.id);
  const quizExpired = quizTimeRemaining !== null && quizTimeRemaining <= 0;
  const formattedQuizTime = quizTimeRemaining === null
    ? null
    : `${Math.floor(quizTimeRemaining / 60)}:${String(quizTimeRemaining % 60).padStart(2, '0')}`;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
      <TopNavbar
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onBack={handleStudentBack}
        onLeave={isStudentLocked ? null : () => {
          if (window.confirm('Are you sure you want to leave this class?')) {
            setStatus('form');
            if (onLeave) onLeave();
          }
        }}
        userLabel={`Student: ${studentName} (Class ${classCode})`}
        isStudentLocked={isStudentLocked}
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '24px 16px', boxSizing: 'border-box' }}>
        {/* Welcome Status Banner */}
        <div
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: '18px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.emerald }} />
            <span style={{ fontWeight: 700, color: theme.text, fontSize: '15px' }}>
              Connected to <strong>{sessionData?.hostName}'s</strong> Class
            </span>
          </div>
          <span style={{ fontSize: '13px', color: theme.subtext, fontFamily: 'monospace', fontWeight: 700 }}>
            Code: {classCode}
          </span>
        </div>

        {/* Section 1: Live Poll Workspace */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: activePoll ? theme.primary : theme.subtext, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {activePoll ? '📈 Active Live Poll' : '📈 Live Poll'}
            </span>
            {activePoll && (
              <span style={{ fontSize: '12px', color: theme.emerald, fontWeight: 700 }}>
                ● Open for Voting
              </span>
            )}
          </div>

          {!activePoll ? (
            <div style={{ padding: '24px', textAlign: 'center', color: theme.subtext, background: theme.cardSecondary, borderRadius: '14px', fontSize: '14px' }}>
              No active poll right now. When the teacher launches a poll, it will appear here instantly.
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, marginBottom: '16px' }}>
                {activePoll.question}
              </h3>

              {hasVotedCurrentPoll ? (
                <div
                  style={{
                    background: theme.emeraldBg,
                    border: `1px solid ${theme.emerald}`,
                    borderRadius: '14px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>✅</div>
                  <div style={{ fontWeight: 800, color: theme.emerald, fontSize: '16px', marginBottom: '4px' }}>
                    Your vote has been submitted!
                  </div>
                  <div style={{ fontSize: '13px', color: theme.subtext }}>
                    Your response has been recorded on the teacher dashboard.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activePoll.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(opt.id)}
                      disabled={isVoting}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: `2px solid ${selectedPollOption === opt.id ? theme.primary : theme.border}`,
                        background: selectedPollOption === opt.id ? theme.primaryLight : theme.cardSecondary,
                        color: theme.text,
                        fontSize: '15px',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Interactive Quiz Workspace (Clean In-App Feedback Card) */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: activeQuiz ? theme.sky : theme.subtext, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {activeQuiz ? '✨ Active Quiz' : '✨ Interactive Quiz'}
            </span>
            {activeQuiz && (
              <span style={{ fontSize: '12px', color: quizExpired ? theme.red : theme.sky, fontWeight: 700 }}>
                {quizExpired ? '⏱ Time expired' : `⏱ ${formattedQuizTime} remaining`} · {activeQuiz.questions.length} Questions
              </span>
            )}
          </div>

          {submitError && (
            <div
              style={{
                background: theme.redBg,
                border: `1px solid ${theme.red}`,
                color: theme.red,
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              {submitError}
            </div>
          )}

          {!activeQuiz ? (
            <div style={{ padding: '24px', textAlign: 'center', color: theme.subtext, background: theme.cardSecondary, borderRadius: '14px', fontSize: '14px' }}>
              No active quiz at the moment.
            </div>
          ) : isQuizCompleted ? (
            <div
              style={{
                background: theme.cardSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                padding: '32px 24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: theme.text, marginBottom: '6px' }}>
                Quiz Submitted Successfully!
              </h3>
              <p style={{ color: theme.subtext, fontSize: '14px', marginBottom: '20px' }}>
                Your answers were evaluated and synced directly to your teacher's dashboard.
              </p>

              <div
                style={{
                  display: 'inline-block',
                  background: theme.emeraldBg,
                  border: `1px solid ${theme.emerald}`,
                  borderRadius: '16px',
                  padding: '14px 28px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '12px', color: theme.emerald, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  Your Score
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: theme.emerald }}>
                  {submissionRecord?.score ?? quizSubmissionResult?.score} / {submissionRecord?.total ?? quizSubmissionResult?.total}{' '}
                  <span style={{ fontSize: '18px', fontWeight: 700 }}>
                    ({submissionRecord?.percentage ?? quizSubmissionResult?.percentage}%)
                  </span>
                </div>
              </div>

              {quizSubmissionResult?.answerKey?.length > 0 && (
                <div style={{ textAlign: 'left', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '16px', marginTop: '8px' }}>
                  <h4 style={{ color: theme.text, margin: '0 0 10px', fontSize: '16px' }}>Answer Key</h4>
                  {quizSubmissionResult.answerKey.map((answer, index) => (
                    <div key={answer.questionId || index} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.border}`, color: theme.text, fontSize: '13px' }}>
                      <strong>{index + 1}. {answer.question}</strong>
                      <div style={{ color: theme.emerald, marginTop: '4px' }}>Correct answer: {answer.correctAnswer}</div>
                      {answer.explanation && <div style={{ color: theme.subtext, marginTop: '4px' }}>Explanation: {answer.explanation}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {quizExpired && (
                <div style={{ background: theme.redBg, border: `1px solid ${theme.red}`, color: theme.red, padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px', textAlign: 'center', fontWeight: 700 }}>
                  The time limit has expired. This quiz can no longer be submitted.
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, margin: 0 }}>
                  {activeQuiz.title}
                </h3>
                <span style={{ fontSize: '13px', color: theme.subtext, fontWeight: 600 }}>
                  Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '6px', background: theme.border, borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100}%`,
                    height: '100%',
                    background: theme.sky,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* Question Chips Navigator */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
                {activeQuiz.questions.map((q, idx) => {
                  const isAnswered = quizAnswers[q.id] !== undefined;
                  const isCurrent = currentQuestionIdx === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentQuestionIdx(idx)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: `1px solid ${isCurrent ? theme.sky : theme.border}`,
                        background: isCurrent ? theme.sky : isAnswered ? theme.emeraldBg : theme.cardSecondary,
                        color: isCurrent ? '#fff' : isAnswered ? theme.emerald : theme.subtext,
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question Content */}
              {activeQuiz.questions[currentQuestionIdx] && (
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: theme.text, marginBottom: '16px', lineHeight: 1.4 }}>
                    {activeQuiz.questions[currentQuestionIdx].question}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {activeQuiz.questions[currentQuestionIdx].options.map((opt, oIdx) => {
                      const qId = activeQuiz.questions[currentQuestionIdx].id;
                      const isSelected = quizAnswers[qId] === oIdx;

                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            setQuizAnswers({
                              ...quizAnswers,
                              [qId]: oIdx,
                            });
                          }}
                          disabled={quizExpired}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '12px',
                            border: `2px solid ${isSelected ? theme.sky : theme.border}`,
                            background: isSelected ? theme.primaryLight : theme.cardSecondary,
                            color: theme.text,
                            fontSize: '14px',
                            fontWeight: 600,
                            textAlign: 'left',
                            cursor: 'pointer',
                            opacity: quizExpired ? 0.55 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              background: isSelected ? theme.sky : theme.border,
                              color: isSelected ? '#fff' : theme.subtext,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 800,
                            }}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Stepper Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                      disabled={currentQuestionIdx === 0}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        background: theme.cardSecondary,
                        color: theme.text,
                        fontWeight: 600,
                        cursor: currentQuestionIdx === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentQuestionIdx === 0 ? 0.4 : 1,
                      }}
                    >
                      ← Previous
                    </button>

                    {currentQuestionIdx < activeQuiz.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '10px',
                          border: 'none',
                          background: theme.sky,
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitQuiz}
                          disabled={isSubmittingQuiz || quizExpired}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '10px',
                          border: 'none',
                          background: theme.emerald,
                          color: '#052e12',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {isSubmittingQuiz ? 'Submitting...' : quizExpired ? 'Time Expired' : '✓ Submit Quiz'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px', marginTop: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, margin: '0 0 6px' }}>Ask the Teacher</h3>
          <p style={{ color: theme.subtext, fontSize: '13px', margin: '0 0 14px' }}>Raise your hand or send a question during the live session.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <button onClick={() => sendDoubt('Student raised a hand.', 'hand')} disabled={handRaised || doubtStatus === 'Sending...'} style={{ padding: '10px 14px', borderRadius: '9px', border: `1px solid ${theme.amber}`, background: handRaised ? theme.cardSecondary : 'transparent', color: theme.amber, fontWeight: 700, cursor: 'pointer' }}>
              {handRaised ? '✋ Hand Raised' : '✋ Raise Hand'}
            </button>
          </div>
          <textarea value={doubtMessage} onChange={(event) => setDoubtMessage(event.target.value)} placeholder="Type your doubt..." rows={3} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.cardSecondary, color: theme.text, resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }} />
          <button onClick={() => sendDoubt(doubtMessage.trim())} disabled={!doubtMessage.trim() || doubtStatus === 'Sending...'} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: theme.sky, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Ask Doubt</button>
          {doubtStatus && <span style={{ marginLeft: '12px', color: theme.subtext, fontSize: '13px' }}>{doubtStatus}</span>}
        </div>

        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '24px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, margin: '0 0 6px' }}>Share Feedback</h3>
          <p style={{ color: theme.subtext, fontSize: '13px', margin: '0 0 14px' }}>
            Tell the teacher what worked well or what could improve.
          </p>
          <textarea
            value={feedbackMessage}
            onChange={(event) => setFeedbackMessage(event.target.value)}
            placeholder="Write your review..."
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.cardSecondary, color: theme.text, resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.subtext, fontSize: '13px', marginBottom: '12px' }}>
            <input type="checkbox" checked={feedbackAnonymous} onChange={(event) => setFeedbackAnonymous(event.target.checked)} />
            Submit anonymously
          </label>
          <button
            onClick={handleSubmitFeedback}
            disabled={!feedbackMessage.trim() || feedbackStatus === 'Submitting...'}
            style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: theme.primary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            Submit Feedback
          </button>
          {feedbackStatus && <span style={{ marginLeft: '12px', color: theme.subtext, fontSize: '13px' }}>{feedbackStatus}</span>}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Root Application
// -------------------------------------------------------------
export default function App() {
  // role starts null until URL detection runs in useEffect
  const [role, setRole] = useState(null); // null | 'picker' | 'teacher' | 'student'
  const [isStudentLocked, setIsStudentLocked] = useState(false);
  const [urlCode, setUrlCode] = useState('');
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [activeTeacherSession, setActiveTeacherSession] = useState(null);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('livelogic_theme') !== 'light';
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('livelogic_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // ---------------------------------------------------------------
  // Entry-Point Routing (runs once on mount)
  //   - ?code=XXXXXX  →  Student locked mode (QR / shared link)
  //   - Root URL /    →  Teacher Portal (default)
  // Students CANNOT reach the Teacher Dashboard from the root URL.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code') || params.get('join');
      if (code && code.trim().length > 0) {
        // Student entry via shared link or QR scan
        setUrlCode(code.trim());
        setIsStudentLocked(true);
        setRole('student');
      } else {
        // Default: Teacher Portal
        setRole('teacher');
      }
    }
  }, []);

  const handleTeacherResumeSuccess = (session) => {
    setActiveTeacherSession(session);
    setIsTeacherModalOpen(false);
    setRole('teacher');
  };

  const openTeacherSetup = () => {
    setActiveTeacherSession(null);
    setRole('teacher');
  };

  // Show nothing until URL detection resolves to avoid flash
  if (role === null) return null;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${isDark ? '#0b1329' : '#f0f4f9'}; font-family: 'Segoe UI', Roboto, -apple-system, sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { border-color: #2563eb !important; }
        button:hover { filter: brightness(1.06); }
        button:active { transform: scale(0.99); }
      `}</style>

      {/* Teacher Authentication / Resume Modal
          Only reachable from the Teacher setup form — never exposed to students */}
      <TeacherAuthModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onSuccess={handleTeacherResumeSuccess}
        isDark={isDark}
      />

      {/* ── TEACHER PORTAL ──────────────────────────────────────────
          Default view for root URL (/).
          Teacher can create a new class or resume an existing one. */}
      {role === 'picker' && (
        <RoleSelectScreen
          onStartNewClass={openTeacherSetup}
          onResumeTeacher={() => {
            setRole('teacher');
            setIsTeacherModalOpen(true);
          }}
          onSelectStudent={() => {
            setIsStudentLocked(false);
            setRole('student');
          }}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      )}

      {role === 'teacher' && (
        <TeacherControlCenter
          onLeave={() => {
            // "Leave" resets to a fresh teacher setup — no role picker
            setActiveTeacherSession(null);
          }}
          onBack={() => {
            setActiveTeacherSession(null);
            setRole('picker');
          }}
          onResumeTeacher={() => setIsTeacherModalOpen(true)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          initialSession={activeTeacherSession}
        />
      )}

      {/* ── STUDENT PORTAL ──────────────────────────────────────────
          Only accessible via ?code= link or QR scan.
          isStudentLocked=true hides ALL teacher controls and nav. */}
      {role === 'student' && (
        <StudentPortal
          onLeave={() => {
            // Locked students cannot leave to any other view
            if (!isStudentLocked) {
              setRole('teacher');
              setUrlCode('');
            }
          }}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          defaultCode={urlCode}
          isStudentLocked={isStudentLocked}
        />
      )}
    </>
  );
}