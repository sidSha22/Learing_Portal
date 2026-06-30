import React from 'react';
import '../pages/Dashboard.css';

export default function AdminSettings() {
  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Settings</h1>
          <p className="dash-subtitle">Portal configuration</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <h3 className="section-title">Quiz System</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className="badge badge-green">✓ Manual Question Bank</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
          Quizzes are built from questions added by administrators under <strong>Manage Questions</strong>. Each quiz attempt randomly selects 10 questions from that material's question bank.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <h3 className="section-title">Portal Info</h3>
        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 2 }}>
          <div><strong style={{ color: 'var(--text2)' }}>Version:</strong> 1.0.0</div>
          <div><strong style={{ color: 'var(--text2)' }}>Quiz Source:</strong> Manual question bank (admin-managed)</div>
          <div><strong style={{ color: 'var(--text2)' }}>Storage:</strong> Supabase (database + file storage)</div>
        </div>
      </div>
    </div>
  );
}
