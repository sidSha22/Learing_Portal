import React, { useState } from 'react';
import { getApiKey, saveApiKey } from '../utils/storage';
import '../pages/Dashboard.css';

export default function AdminSettings({ toast }) {
  const [apiKey, setApiKey] = useState(getApiKey());
  const [show, setShow] = useState(false);

  const handleSave = () => {
    saveApiKey(apiKey.trim());
    toast.success('API key saved.');
  };

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Settings</h1>
          <p className="dash-subtitle">Configure your portal settings</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <h3 className="section-title">Anthropic API Key</h3>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
          The API key is required for AI-powered quiz generation from uploaded materials. Get your key from{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>console.anthropic.com</a>.
        </p>

        <div className="form-group">
          <label className="form-label">API Key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              type={show ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              style={{ fontFamily: apiKey ? 'var(--font-mono)' : 'var(--font)', fontSize: 13 }}
            />
            <button type="button" className="btn btn-secondary btn-sm" style={{ white_space: 'nowrap', flexShrink: 0 }} onClick={() => setShow(s => !s)}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={!apiKey.trim()}>Save Key</button>
          {getApiKey() && <span className="badge badge-green">✓ Key configured</span>}
        </div>

        <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg3)', borderRadius: 'var(--radius2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text2)' }}>Note:</strong> The API key is stored locally in your browser's localStorage and is only used to make requests to Anthropic's API for quiz generation. It is never sent anywhere else.
        </div>
      </div>
    </div>
  );
}
