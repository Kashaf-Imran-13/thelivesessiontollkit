import React from 'react';
import { Zap, Plus, LogIn, Sun, Moon, RefreshCw, Archive, Radio } from 'lucide-react';

export const Navbar = ({
  theme,
  onToggleTheme,
  currentView = 'hub',
  onNavigateView,
  onOpenCreate,
  onOpenJoin,
  onNavigateHome,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand" onClick={onNavigateHome}>
          <div className="brand-icon">
            <Zap size={20} color="#ffffff" fill="#ffffff" />
          </div>
          <span className="brand-title">LiveLogic</span>
        </div>

        {/* View Switcher Tabs (Sessions Hub vs Archives) */}
        <div className="tabs" style={{ background: 'var(--bg-secondary)' }}>
          <button
            className={`tab-btn ${currentView === 'hub' ? 'active' : ''}`}
            onClick={() => onNavigateView('hub')}
          >
            <Radio size={13} style={{ display: 'inline', marginRight: '4px' }} />
            <span>Live Hub</span>
          </button>
          <button
            className={`tab-btn ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => onNavigateView('history')}
          >
            <Archive size={13} style={{ display: 'inline', marginRight: '4px' }} />
            <span>Archives & Analytics</span>
          </button>
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {/* Light / Dark Mode Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
          </button>

          {/* Refresh Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            title="Refresh"
            disabled={isRefreshing}
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'spin-animation' : ''}
            />
          </button>

          {/* Join Session Button */}
          <button className="btn btn-secondary" onClick={onOpenJoin}>
            <LogIn size={15} />
            <span>Join Session</span>
          </button>

          {/* Create Session Button */}
          <button className="btn btn-primary" onClick={onOpenCreate}>
            <Plus size={15} />
            <span>Create Session</span>
          </button>
        </div>
      </div>
    </header>
  );
};
