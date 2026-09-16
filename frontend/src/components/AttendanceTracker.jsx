import React, { useState, useEffect } from 'react';
import { Users, Clock, Mail, Shield, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import { sessionApi } from '../api/sessionApi';

export const AttendanceTracker = ({ sessionId }) => {
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const res = await sessionApi.getAttendance(sessionId);
      if (res.success) {
        setAttendance(res.data || []);
      }
    } catch (err) {
      console.error('Attendance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 4000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const totalConnected = attendance.filter((a) => a.status === 'connected').length;

  return (
    <div className="dash-panel">
      {/* Title Header */}
      <div className="dash-panel-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserCheck size={18} color="#10b981" />
          <span>Live Attendance & Participation Tracking</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-active">
            ● {totalConnected} Active Now
          </span>
          <button className="btn btn-secondary btn-sm" onClick={fetchAttendance} title="Refresh Roster">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Registered</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{attendance.length}</div>
        </div>

        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Live Connected</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{totalConnected}</div>
        </div>

        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg. Active Duration</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366f1' }}>
            {attendance.length > 0
              ? `${Math.round(attendance.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / attendance.length / 60)}m`
              : '0m'}
          </div>
        </div>
      </div>

      {/* Live Table Roster */}
      <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.6rem 0.75rem' }}>Participant</th>
              <th style={{ padding: '0.6rem 0.75rem' }}>Email (Verified Gate)</th>
              <th style={{ padding: '0.6rem 0.75rem' }}>Role</th>
              <th style={{ padding: '0.6rem 0.75rem' }}>Join Time</th>
              <th style={{ padding: '0.6rem 0.75rem' }}>Active Duration</th>
              <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((rec) => {
              const initials = rec.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        className="avatar"
                        style={{
                          width: '28px',
                          height: '28px',
                          fontSize: '0.75rem',
                          background: rec.role === 'host' ? '#f59e0b' : '#6366f1',
                        }}
                      >
                        {initials}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{rec.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {rec.email}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    {rec.role === 'host' ? (
                      <span className="badge badge-waiting" style={{ fontSize: '0.65rem' }}>Host</span>
                    ) : (
                      <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>Attendee</span>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {new Date(rec.join_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {rec.duration_formatted || `${Math.floor((rec.duration_seconds || 0) / 60)}m ${(rec.duration_seconds || 0) % 60}s`}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        color: rec.status === 'connected' ? '#10b981' : '#9ca3af',
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: rec.status === 'connected' ? '#10b981' : '#9ca3af',
                        }}
                      />
                      {rec.status === 'connected' ? 'Connected' : 'Left'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
