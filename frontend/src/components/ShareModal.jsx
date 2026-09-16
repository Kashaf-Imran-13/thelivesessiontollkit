import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Share2, Link2, ExternalLink } from 'lucide-react';

export const ShareModal = ({ isOpen, onClose, session }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !session) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://livelogic.io';
  const joinUrl = `${currentOrigin}/?join=${session.session_code}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}&bgcolor=ffffff&color=0f172a&margin=6`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.session_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 70 }}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Share2 size={20} color="#6366f1" />
            <span>Invite & Share Session</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ textAlign: 'center' }}>
          {/* QR Code Display */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-block',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
              border: '2px solid var(--border-color)',
            }}
          >
            <img
              src={qrApiUrl}
              alt={`QR Code for ${session.session_code}`}
              style={{ width: '180px', height: '180px', display: 'block' }}
            />
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '0.5rem' }}>
              Scan with camera to join
            </div>
          </div>

          {/* Dynamic Access Code */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Session PIN / Access Code
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--accent-primary)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--text-main)',
                }}
              >
                {session.session_code}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleCopyCode}>
                {copiedCode ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Shareable URL */}
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem', textAlign: 'left' }}>
              Direct Shareable Link
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Link2 size={16} color="#9ca3af" />
              <input
                type="text"
                readOnly
                value={joinUrl}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  flex: 1,
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleCopyLink}>
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
