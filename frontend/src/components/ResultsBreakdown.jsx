import React, { useState, useEffect } from 'react';
import { FileText, Download, User, Check, RefreshCw, Layers, Table } from 'lucide-react';
import { sessionApi } from '../api/sessionApi';

export const ResultsBreakdown = ({ sessionId, sessionTitle = 'Session' }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchResponses = async () => {
    try {
      const res = await sessionApi.getResponses(sessionId);
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error('Response logs error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [sessionId]);

  const handleExportCSV = () => {
    sessionApi.exportReport(sessionId, 'csv');
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const data = await sessionApi.exportReport(sessionId, 'json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `livelogic_session_${sessionId}_full_report.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="dash-panel">
      {/* Title & Export Actions Header */}
      <div className="dash-panel-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Table size={18} color="#6366f1" />
          <span>Participant-Level Response Breakdown & Export</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchResponses} title="Refresh logs">
            <RefreshCw size={12} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportJSON} disabled={isExporting}>
            <Download size={13} />
            <span>Export JSON</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExportCSV}>
            <Download size={13} />
            <span>Download CSV Report</span>
          </button>
        </div>
      </div>

      {/* Response Logs Table */}
      {logs.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <FileText size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
          <p>No participant poll responses recorded yet for this session.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Participant</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Email</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Poll Question</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Voted Option</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {log.voter_name}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {log.voter_email || 'attendee@livelogic.io'}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-main)', maxWidth: '280px' }}>
                    {log.question}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        fontWeight: 600,
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {log.option_text}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
