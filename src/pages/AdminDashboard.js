import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AdminUpload from '../components/AdminUpload';
import AdminMaterials from '../components/AdminMaterials';
import AdminResults from '../components/AdminResults';
import AdminSettings from '../components/AdminSettings';
import { getMaterials, getQuizResults } from '../utils/storage';
import './Dashboard.css';

const SECTIONS = [
  { id: 'overview', icon: '◈', label: 'Overview' },
  { id: 'upload', icon: '↑', label: 'Upload Material' },
  { id: 'materials', icon: '▤', label: 'Manage Materials' },
  { id: 'results', icon: '◎', label: 'Quiz Results' },
  { id: 'settings', icon: '⚙', label: 'Settings' },
];

export default function AdminDashboard({ user, onLogout, toast }) {
  const [section, setSection] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="dashboard-root">
      <Sidebar user={user} activeSection={section} sections={SECTIONS} onNavigate={setSection} onLogout={onLogout} />
      <main className="dashboard-main">
        {section === 'overview' && <AdminOverview user={user} onNavigate={setSection} key={refreshKey} />}
        {section === 'upload' && <AdminUpload toast={toast} onSuccess={() => { refresh(); setSection('materials'); }} />}
        {section === 'materials' && <AdminMaterials toast={toast} key={refreshKey} />}
        {section === 'results' && <AdminResults key={refreshKey} />}
        {section === 'settings' && <AdminSettings toast={toast} />}
      </main>
    </div>
  );
}

function AdminOverview({ user, onNavigate }) {
  const [materials, setMaterials] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    getMaterials().then(setMaterials);
    getQuizResults().then(setResults);
  }, []);

  const passed = results.filter(r => r.score >= 90).length;
  const stats = [
    { label: 'Total Materials', value: materials.length, icon: '▤', color: 'var(--accent)' },
    { label: 'Quiz Attempts', value: results.length, icon: '◎', color: 'var(--success)' },
    { label: 'Certificates Issued', value: passed, icon: '✦', color: 'var(--gold)' },
    { label: 'Pass Rate', value: results.length ? Math.round((passed / results.length) * 100) + '%' : '—', icon: '◈', color: 'var(--warning)' },
  ];

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="dash-subtitle">Here's what's happening in your learning portal</p>
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
            <button className="quick-action-btn" onClick={() => onNavigate('upload')}>
              <span className="qa-icon">↑</span>
              <div><div className="qa-title">Upload Material</div><div className="qa-sub">Add PDFs, videos, audio</div></div>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('materials')}>
              <span className="qa-icon">▤</span>
              <div><div className="qa-title">Manage Content</div><div className="qa-sub">Edit or remove materials</div></div>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('results')}>
              <span className="qa-icon">◎</span>
              <div><div className="qa-title">View Results</div><div className="qa-sub">All quiz attempts & scores</div></div>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('settings')}>
              <span className="qa-icon">⚙</span>
              <div><div className="qa-title">Settings</div><div className="qa-sub">Configure API key</div></div>
            </button>
          </div>
        </div>

        {materials.length > 0 && (
          <div className="card" style={{ flex: 1 }}>
            <h3 className="section-title">Recent Materials</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {materials.slice(-4).reverse().map(m => (
                <div key={m.id} className="recent-item">
                  <span className="recent-icon">{m.fileIcon || '📄'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="recent-title">{m.title}</div>
                    <div className="recent-meta">{(m.fileType || '').toUpperCase()} · {new Date(m.uploadedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
