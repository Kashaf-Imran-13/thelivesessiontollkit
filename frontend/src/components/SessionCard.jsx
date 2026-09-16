import React from 'react';
import { User, Users, Tag, ArrowRight, Play, CheckCircle } from 'lucide-react';

export const SessionCard = ({ session, onSelect, onJoinDirect }) => {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge badge-active';
      case 'waiting':
        return 'badge badge-waiting';
      case 'paused':
        return 'badge badge-paused';
      default:
        return 'badge badge-completed';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '● LIVE NOW';
      case 'waiting':
        return '⏳ WAITING';
      case 'paused':
        return '⏸ PAUSED';
      default:
        return '✓ ENDED';
    }
  };

  const participantCount = Number(session.participant_count) || 0;
  const isFull = participantCount >= (session.max_participants || 20);

  return (
    <div className="session-card">
      {/* Top Header */}
      <div>
        <div className="session-header">
          <span className="session-code">{session.session_code}</span>
          <span className={getBadgeClass(session.status)}>
            {getStatusText(session.status)}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="session-title" style={{ marginTop: '0.85rem' }}>
          {session.title}
        </h3>
        <p className="session-desc">{session.description || 'No description provided.'}</p>
      </div>

      {/* Metadata */}
      <div>
        <div className="session-meta">
          <div className="meta-item">
            <User size={14} color="#9ca3af" />
            <span>Host: <strong>{session.host_name}</strong></span>
          </div>
          {session.topic && (
            <div className="meta-item">
              <Tag size={14} color="#9ca3af" />
              <span>{session.topic}</span>
            </div>
          )}
          <div className="meta-item">
            <Users size={14} color={isFull ? '#ef4444' : '#9ca3af'} />
            <span>
              {participantCount} / {session.max_participants || 20}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="session-card-actions">
          {session.status !== 'completed' ? (
            <>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={() => onJoinDirect(session)}
              >
                <Play size={14} />
                <span>Join Session</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onSelect(session.id)}
                title="View Session Dashboard"
              >
                <span>Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => onSelect(session.id)}
            >
              <CheckCircle size={14} />
              <span>View Summary</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
