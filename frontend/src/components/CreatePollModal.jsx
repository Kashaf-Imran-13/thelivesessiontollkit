import React, { useState } from 'react';
import { X, BarChart2, Sparkles, AlertCircle, Plus } from 'lucide-react';

export const CreatePollModal = ({ isOpen, onClose, onSubmit, hostName = 'Host' }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    'Option A: High Performance',
    'Option B: High Availability',
    'Option C: Rapid Development',
    'Option D: Low Infrastructure Cost',
  ]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please provide a poll question.');
      return;
    }

    const filledOptions = options.map((opt) => opt.trim()).filter((opt) => opt.length > 0);
    if (filledOptions.length < 2) {
      setError('Please provide at least 2 distinct options for the poll.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        question: question.trim(),
        options: filledOptions,
        host_name: hostName,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to launch poll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <BarChart2 size={20} color="#6366f1" />
            <span>Create & Launch Live Poll</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Poll Question *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Which architectural pattern best suits our new service?"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (error) setError('');
                }}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Options (4 choices)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#a5b4fc',
                        width: '24px',
                      }}
                    >
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: '#c7d2fe',
                fontSize: '0.8rem',
              }}
            >
              <Sparkles size={16} color="#818cf8" />
              <span>
                When you click <strong>Launch Poll</strong>, all active participants in this session will instantly receive a live voting popup.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <BarChart2 size={16} />
              <span>{isSubmitting ? 'Launching...' : 'Launch Poll Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
