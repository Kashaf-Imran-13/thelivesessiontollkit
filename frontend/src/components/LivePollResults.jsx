import React from 'react';
import { BarChart2, CheckCircle, Lock, Plus, Users, Zap } from 'lucide-react';

export const LivePollResults = ({
  poll,
  onOpenCreatePoll,
  onClosePoll,
  onSimulateVote,
  isHost = true,
}) => {
  if (!poll) {
    return (
      <div className="dash-panel">
        <div className="dash-panel-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={18} color="#6366f1" />
            <span>Interactive Live Polls</span>
          </div>
          {isHost && (
            <button className="btn btn-primary btn-sm" onClick={onOpenCreatePoll}>
              <Plus size={14} />
              <span>New Poll</span>
            </button>
          )}
        </div>
        <div className="empty-state" style={{ padding: '2.5rem 1.5rem' }}>
          <BarChart2 size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <h4 style={{ color: '#e5e7eb', marginBottom: '0.35rem' }}>No active polls right now</h4>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Create single-choice polls to gather real-time feedback and visualize responses live.
          </p>
          {isHost && (
            <button className="btn btn-primary btn-sm" onClick={onOpenCreatePoll}>
              <Plus size={14} />
              <span>Launch First Poll</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];
  const totalVotes = poll.total_votes || 0;

  return (
    <div className="dash-panel">
      {/* Panel Header */}
      <div className="dash-panel-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={18} color="#6366f1" />
          <span>Live Poll Results</span>
          {poll.is_active && !poll.is_closed ? (
            <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>
              ● LIVE
            </span>
          ) : (
            <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>
              CLOSED
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isHost && poll.is_active && !poll.is_closed && (
            <>
              {onSimulateVote && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onSimulateVote}
                  title="Simulate a participant vote to test real-time update"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  <Zap size={12} color="#f59e0b" />
                  <span>Test Vote</span>
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onClosePoll(poll.id)}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                <Lock size={12} />
                <span>Close Poll</span>
              </button>
            </>
          )}
          {isHost && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenCreatePoll}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <Plus size={12} />
              <span>New Poll</span>
            </button>
          )}
        </div>
      </div>

      {/* Question */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6', marginBottom: '0.25rem' }}>
          {poll.question}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Users size={14} />
          <span>Total Votes: <strong>{totalVotes}</strong></span>
        </div>
      </div>

      {/* Live Animated Bar Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {poll.options?.map((opt, idx) => {
          const color = colors[idx % colors.length];
          const count = opt.vote_count || 0;
          const percentage = opt.percentage || (totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0);

          return (
            <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {/* Option label & numbers */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: '#e5e7eb' }}>
                  <strong style={{ color }}>{String.fromCharCode(65 + idx)}.</strong> {opt.option_text}
                </span>
                <span style={{ fontWeight: 700, color: '#f3f4f6', fontFamily: 'var(--font-mono)' }}>
                  {count} votes ({percentage}%)
                </span>
              </div>

              {/* Progress Bar Container */}
              <div
                style={{
                  width: '100%',
                  height: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: percentage > 0 ? `0 0 10px ${color}66` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
