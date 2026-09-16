import React from 'react';
import { Radio, Users, Sparkles, Activity } from 'lucide-react';

export const StatsOverview = ({ sessions = [] }) => {
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === 'active').length;
  const totalParticipants = sessions.reduce(
    (acc, curr) => acc + (Number(curr.participant_count) || 0),
    0
  );
  const waitingSessions = sessions.filter((s) => s.status === 'waiting').length;

  const stats = [
    {
      label: 'Live Active Sessions',
      value: activeSessions,
      icon: Radio,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
    },
    {
      label: 'Total Participants',
      value: totalParticipants,
      icon: Users,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.12)',
    },
    {
      label: 'Upcoming / Waiting',
      value: waitingSessions,
      icon: Sparkles,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      label: 'Total Sessions Hosted',
      value: totalSessions,
      icon: Activity,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.12)',
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="stat-card">
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <Icon size={24} />
            </div>
            <div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
