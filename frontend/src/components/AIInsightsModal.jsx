import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, CheckCircle2, Target, TrendingUp, RefreshCw, Lightbulb } from 'lucide-react';
import { sessionApi } from '../api/sessionApi';

export const AIInsightsModal = ({ sessionId, sessionTitle = 'Session' }) => {
  const [insight, setInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const res = await sessionApi.getAIInsights(sessionId);
      if (res.success) {
        setInsight(res.data);
      }
    } catch (err) {
      console.error('AI Insights err:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [sessionId]);

  return (
    <div className="dash-panel">
      {/* Title Header */}
      <div className="dash-panel-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#ec4899" />
          <span>AI Session Insights & Analytics Summary</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchInsights} title="Regenerate AI Analysis">
          <RefreshCw size={12} className={isLoading ? 'spin-animation' : ''} />
          <span>Re-analyze</span>
        </button>
      </div>

      {isLoading ? (
        <div className="empty-state" style={{ padding: '2.5rem' }}>
          <Brain size={36} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#ec4899' }} />
          <p>Generating real-time AI engagement analysis and takeaways...</p>
        </div>
      ) : !insight ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p>No insights generated yet. Click re-analyze above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(99, 102, 241, 0.1))',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              <TrendingUp size={28} color="#ec4899" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Engagement Index</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {insight.engagement_score}%
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              <Target size={28} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Response Consensus / Accuracy</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {insight.accuracy_rate}%
                </div>
              </div>
            </div>
          </div>

          {/* AI Executive Summary */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              ✦ Executive AI Summary
            </div>
            <p style={{ color: 'var(--text-main)', fontSize: '0.925rem', lineHeight: 1.5 }}>
              {insight.summary}
            </p>
          </div>

          {/* Key Discussion Themes */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Key Discussion Themes
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {insight.key_themes?.map((theme, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '0.35rem 0.75rem',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#c7d2fe',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  #{theme}
                </span>
              ))}
            </div>
          </div>

          {/* Actionable Host Takeaways */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lightbulb size={16} color="#f59e0b" />
              <span>Recommended Actionable Takeaways</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {insight.actionable_insights?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid #ec4899',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
