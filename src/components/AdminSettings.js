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
        <h3 className="section-title">AI Quiz Generation</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className="badge badge-green">✓ Configured</span>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>Powered by Groq (server-side)</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
          The AI API key is securely stored on the server. All users of this portal share the same key automatically — no configuration needed per device.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <h3 className="section-title">Portal Info</h3>
        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 2 }}>
          <div><strong style={{ color: 'var(--text2)' }}>Version:</strong> 1.0.0</div>
          <div><strong style={{ color: 'var(--text2)' }}>AI Model:</strong> Llama 3.3 70B (via Groq)</div>
          <div><strong style={{ color: 'var(--text2)' }}>Storage:</strong> Browser localStorage + IndexedDB</div>
        </div>
      </div>
    </div>
  );
}
