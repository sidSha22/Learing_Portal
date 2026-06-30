import React, { useState } from 'react';
import { findUser, registerUser, saveSession } from '../utils/storage';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const user = findUser(form.username.trim(), form.password);
    if (!user) { setError('Invalid username or password.'); setLoading(false); return; }
    saveSession(user);
    onLogin(user);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Full name is required.'); return; }
    if (form.username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = registerUser(form.name.trim(), form.username.trim(), form.password);
    if (result.error) { setError(result.error); setLoading(false); return; }
    saveSession(result.user);
    onLogin(result.user);
  };

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="login-bg-grid" />
        <div className="login-bg-glow" />
      </div>
      <div className="login-card fade-in">
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="2" fill="#4f8ef7"/>
              <rect x="15" y="2" width="11" height="11" rx="2" fill="rgba(79,142,247,0.5)"/>
              <rect x="2" y="15" width="11" height="11" rx="2" fill="rgba(79,142,247,0.5)"/>
              <rect x="15" y="15" width="11" height="11" rx="2" fill="#4f8ef7"/>
            </svg>
          </div>
          <div>
            <div className="login-logo-title">LearnPro</div>
            <div className="login-logo-sub">Industrial Learning Portal</div>
          </div>
        </div>

        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Sign In</button>
          <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Register</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={e => set('username', e.target.value)} placeholder="Enter username" autoFocus required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Enter password" required />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? <><span className="spinner" style={{width:16,height:16}} /> Signing in…</> : 'Sign In'}
            </button>
            <div className="login-hints">
              <div className="login-hint-row"><span className="badge badge-blue">Admin</span><span>admin / admin123</span></div>
              <div className="login-hint-row"><span className="badge badge-gray">User</span><span>user / user123</span></div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" autoFocus required />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={e => set('username', e.target.value)} placeholder="Choose a username" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" required />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? <><span className="spinner" style={{width:16,height:16}} /> Creating account…</> : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
