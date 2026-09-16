import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, CheckCircle, Pin, Send, Plus, Filter, Sparkles } from 'lucide-react';
import { sessionApi } from '../api/sessionApi';

export const QAModule = ({ sessionId, currentUserName = 'Attendee', isHost = true }) => {
  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // all | unanswered | answered
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voterKey] = useState(() => {
    return localStorage.getItem('livelogic-voter-key') || `voter-${Math.random().toString(36).substr(2, 9)}`;
  });

  useEffect(() => {
    localStorage.setItem('livelogic-voter-key', voterKey);
  }, [voterKey]);

  const loadQuestions = async () => {
    try {
      const res = await sessionApi.getQA(sessionId);
      if (res.success) {
        setQuestions(res.data || []);
      }
    } catch (err) {
      console.error('QA fetch error:', err);
    }
  };

  useEffect(() => {
    loadQuestions();
    const interval = setInterval(loadQuestions, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await sessionApi.postQA(sessionId, {
        author_name: currentUserName,
        question_text: newQuestionText.trim(),
      });
      if (res.success) {
        setNewQuestionText('');
        loadQuestions();
      }
    } catch (err) {
      alert(`Could not post question: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (questionId) => {
    try {
      const res = await sessionApi.upvoteQA(sessionId, questionId, {
        voter_key: voterKey,
        voter_name: currentUserName,
      });
      if (res.success) {
        loadQuestions();
      }
    } catch (err) {
      console.error('Upvote err:', err);
    }
  };

  const handleToggleAnswered = async (questionId, currentStatus) => {
    try {
      const res = await sessionApi.toggleQAStatus(sessionId, questionId, {
        is_answered: !currentStatus,
      });
      if (res.success) {
        loadQuestions();
      }
    } catch (err) {
      console.error('Status err:', err);
    }
  };

  const handleTogglePin = async (questionId, currentPin) => {
    try {
      const res = await sessionApi.toggleQAStatus(sessionId, questionId, {
        is_pinned: !currentPin,
      });
      if (res.success) {
        loadQuestions();
      }
    } catch (err) {
      console.error('Pin err:', err);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filterMode === 'unanswered') return !q.is_answered;
    if (filterMode === 'answered') return q.is_answered;
    return true;
  });

  return (
    <div className="dash-panel">
      {/* Title Header */}
      <div className="dash-panel-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="#6366f1" />
          <span>Live Audience Q&A ({questions.length})</span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['all', 'unanswered', 'answered'].map((mode) => (
            <button
              key={mode}
              className={`btn btn-sm ${filterMode === mode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterMode(mode)}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              {mode === 'all' ? 'All' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Question Submit Box */}
      <form onSubmit={handlePostQuestion} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Ask a question for the speaker or audience..."
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!newQuestionText.trim() || isSubmitting}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Send size={14} />
          <span>Ask</span>
        </button>
      </form>

      {/* Questions Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
        {filteredQuestions.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p>No questions in this filter yet. Be the first to ask!</p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                padding: '0.85rem 1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: q.is_pinned
                  ? '1px solid #6366f1'
                  : q.is_answered
                  ? '1px solid var(--color-success)'
                  : '1px solid var(--border-color)',
                position: 'relative',
              }}
            >
              {/* Upvote Button (Bubbles to top) */}
              <button
                className="btn btn-secondary"
                onClick={() => handleUpvote(q.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.4rem 0.65rem',
                  gap: '0.2rem',
                  borderRadius: 'var(--radius-md)',
                  minWidth: '46px',
                }}
                title="Upvote this question"
              >
                <ThumbsUp size={15} color="#6366f1" />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {q.upvotes_count || 0}
                </span>
              </button>

              {/* Question Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {q.author_name}
                  </span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                    {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {q.is_pinned && (
                    <span className="badge badge-paused" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                      <Pin size={10} /> PINNED
                    </span>
                  )}
                  {q.is_answered && (
                    <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                      <CheckCircle size={10} /> ANSWERED
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.45 }}>
                  {q.question_text}
                </p>
              </div>

              {/* Host Controls */}
              {isHost && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleTogglePin(q.id, q.is_pinned)}
                    title={q.is_pinned ? 'Unpin' : 'Pin to top'}
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    <Pin size={13} color={q.is_pinned ? '#6366f1' : 'var(--text-muted)'} />
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleToggleAnswered(q.id, q.is_answered)}
                    title={q.is_answered ? 'Mark Unanswered' : 'Mark Answered'}
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    <CheckCircle size={13} color={q.is_answered ? '#10b981' : 'var(--text-muted)'} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
