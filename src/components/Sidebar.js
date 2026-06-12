import React from 'react';
import './Sidebar.css';

export default function Sidebar({ user, activeSection, sections, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="11" height="11" rx="2" fill="#4f8ef7"/>
            <rect x="15" y="2" width="11" height="11" rx="2" fill="rgba(79,142,247,0.5)"/>
            <rect x="2" y="15" width="11" height="11" rx="2" fill="rgba(79,142,247,0.5)"/>
            <rect x="15" y="15" width="11" height="11" rx="2" fill="#4f8ef7"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">LearnPro</span>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user.name}</div>
          <div className={`badge ${user.role === 'admin' ? 'badge-blue' : 'badge-gray'}`} style={{fontSize:'10px', padding:'2px 7px'}}>
            {user.role === 'admin' ? 'Administrator' : 'Learner'}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map(s => (
          <button
            key={s.id}
            className={`sidebar-nav-item ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => onNavigate(s.id)}
          >
            <span className="sidebar-nav-icon">{s.icon}</span>
            <span>{s.label}</span>
            {s.badge && <span className="sidebar-nav-badge">{s.badge}</span>}
          </button>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={onLogout}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign Out
      </button>
    </aside>
  );
}
