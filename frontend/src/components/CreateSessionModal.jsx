import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle } from 'lucide-react';

export const CreateSessionModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    host_name: '',
    topic: 'Engineering',
    max_participants: 20,
    description: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.host_name.trim()) {
      setError('Please provide both a session title and host name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        max_participants: Number(formData.max_participants) || 20,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create session.');
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
            <PlusCircle size={20} color="#6366f1" />
            <span>Create New Session</span>
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
              <label className="form-label">Session Title *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g. Distributed Systems & Kafka Deep Dive"
                value={formData.title}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Host Name *</label>
                <input
                  type="text"
                  name="host_name"
                  className="form-input"
                  placeholder="e.g. Dr. Jane Doe"
                  value={formData.host_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Topic / Category</label>
                <select
                  name="topic"
                  className="form-select"
                  value={formData.topic}
                  onChange={handleChange}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Database">Database</option>
                  <option value="Security">Security</option>
                  <option value="Product">Product</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Max Participants Capacity</label>
              <input
                type="number"
                name="max_participants"
                className="form-input"
                min="2"
                max="100"
                value={formData.max_participants}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description (Optional)</label>
              <textarea
                name="description"
                rows={3}
                className="form-textarea"
                placeholder="Briefly outline what will be discussed in this session..."
                value={formData.description}
                onChange={handleChange}
              />
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
              {isSubmitting ? 'Creating...' : 'Create & Launch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
