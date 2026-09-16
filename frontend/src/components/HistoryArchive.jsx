import React, { useState, useEffect } from 'react';
import { Archive, Clock, Users, BarChart2, MessageSquare, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { sessionApi } from '../api/sessionApi';

export const HistoryArchive = ({ onSelectSession }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await sessionApi.getHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Session Archives & Historical Analytics
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Review past sessions, participation metrics, past poll responses, and AI summaries.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchHistory}>
          <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <RefreshCw size={32} className="spin-animation" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>Loading historical archives...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <Archive size={40} style={{ margin: '0 auto 1rem', color: '#6366f1' }} />
          <h3>No archived sessions yet</h3>
          <p>When sessions are ended and completed, they will appear here with analytics.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {history.map((s) => (
            <div key={s.id} className="session-card">
              <div>
                <div className="session-header">
                  <span className="session-code">{s.session_code}</span>
                  <span className="badge badge-completed">✓ ARCHIVED</span>
                </div>

                <h3 className="session-title" style={{ marginTop: '0.85rem' }}>
                  {s.title}
                </h3>
                <p className="session-desc">{s.description || 'No description provided.'}</p>
              </div>

              <div>
                {/* Analytics Metrics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    padding: '0.65rem 0',
                    borderTop: '1px solid var(--border-color)',
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Attendees</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem' }}>
                      {s.total_participants || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Polls</div>
                    <div style={{ fontWeight: 800, color: '#6366f1', fontSize: '1.1rem' }}>
                      {s.total_polls || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Engagement</div>
                    <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>
                      {s.engagement_score || 85}%
                    </div>
                  </div>
                </div>

                <div className="session-meta" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <span>Host: <strong>{s.host_name}</strong></span>
                  {s.topic && <span>Topic: {s.topic}</span>}
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  onClick={() => onSelectSession(s.id)}
                >
                  <span>View Details & AI Insights</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
