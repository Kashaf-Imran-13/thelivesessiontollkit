import React, { useState, useEffect } from 'react';
import { X, LogIn, AlertCircle, Mail, User, Key, ShieldCheck } from 'lucide-react';

export const JoinSessionModal = ({ isOpen, onClose, onSubmit, defaultSessionCode = '' }) => {
  const [sessionCode, setSessionCode] = useState(defaultSessionCode);
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [role, setRole] = useState('attendee');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultSessionCode) {
      setSessionCode(defaultSessionCode);
    }
  }, [defaultSessionCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionCode.trim() || !participantName.trim() || !participantEmail.trim()) {
      setError('Please provide session code, full name, and your email address to enter.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        session_code: sessionCode.trim().toUpperCase(),
        participant_name: participantName.trim(),
        participant_email: participantEmail.trim().toLowerCase(),
        role,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to join session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <LogIn size={20} color="#6366f1" />
            <span>Join Live Session</span>
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
              <label className="form-label">Session Access Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ARCH-101 or SES-9482"
                value={sessionCode}
                onChange={(e) => {
                  setSessionCode(e.target.value.toUpperCase());
                  if (error) setError('');
                }}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                required
                autoFocus
              />
            </div>

            {/* Access Gate: Name and Email */}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Morgan"
                  value={participantName}
                  onChange={(e) => {
                    setParticipantName(e.target.value);
                    if (error) setError('');
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Access Gate) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. alex.morgan@company.com"
                  value={participantEmail}
                  onChange={(e) => {
                    setParticipantEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                />
              </div>
              <small style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                Required for attendance tracking and verified polling results.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role in Session</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="attendee">Attendee (Standard Participant)</option>
                <option value="co-host">Co-Host (Moderator)</option>
              </select>
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
              <ShieldCheck size={16} />
              <span>{isSubmitting ? 'Verifying...' : 'Enter Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
