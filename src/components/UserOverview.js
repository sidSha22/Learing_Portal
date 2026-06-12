import React, { useState, useEffect } from 'react';
import { getMaterials, getResultsByUser } from '../utils/storage';
import '../pages/Dashboard.css';

export default function UserOverview({ user, onNavigate, onStartQuiz }) {
  const [materials, setMaterials] = useState([]);
  const [myResults, setMyResults] = useState([]);

  useEffect(() => {
    getMaterials().then(setMaterials);
    getResultsByUser(user.id).then(setMyResults);
  }, [user.id]);

  const passed = myResults.filter(r => r.score >= 90).length;
  const bestScore = myResults.length ? Math.max(...myResults.map(r => r.score)) : 0;

  const stats = [
    { label: 'Materials Available', value: materials.length, icon: '▤', color: 'var(--accent)' },
    { label: 'Quizzes Taken', value: myResults.length, icon: '◎', color: 'var(--warning)' },
    { label: 'Certificates Earned', value: passed, icon: '✦', color: 'var(--gold)' },
    { label: 'Best Score', value: myResults.length ? bestScore + '%' : '—', icon: '◈', color: 'var(--success)' },
  ];

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Hello, {user.name.split(' ')[0]} 👋</h1>
          <p className="dash-subtitle">Continue your learning journey</p>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map(s => (
          <div className="stat-card card" key={s.label}>
            <div className="stat-icon" style={{ color: s.color, background: s.color + '15' }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="overview-actions">
        <div className="card" style={{ flex: 1 }}>
          <h3 className="section-title">Quick Actions</h3>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => onNavigate('study')}>
              <span className="qa-icon">▤</span>
              <div><div className="qa-title">Browse Study Materials</div><div className="qa-sub">View all available modules</div></div>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('quiz')}>
              <span className="qa-icon">◎</span>
              <div><div className="qa-title">Take a Quiz</div><div className="qa-sub">AI-generated from uploaded material</div></div>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('certificates')}>
              <span className="qa-icon">✦</span>
              <div><div className="qa-title">My Certificates</div><div className="qa-sub">Download earned certificates</div></div>
            </button>
          </div>
        </div>

        {materials.length > 0 && (
          <div className="card" style={{ flex: 1 }}>
            <h3 className="section-title">Available Modules</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {materials.slice(0, 4).map(m => (
                <div key={m.id} className="recent-item">
                  <span className="recent-icon">{m.fileIcon || '📄'}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="recent-title">{m.title}</div>
                    <div className="recent-meta">{(m.fileType || '').toUpperCase()} {m.subject ? '· ' + m.subject : ''}</div>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={() => onStartQuiz(m)}>Quiz →</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
