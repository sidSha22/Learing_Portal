import React, { useState, useEffect } from 'react';
import { getQuizResults, getMaterials } from '../utils/storage';
import '../pages/Dashboard.css';

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [matMap, setMatMap] = useState({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getQuizResults().then(setResults);
    getMaterials().then(mats => setMatMap(Object.fromEntries(mats.map(m => [m.id, m.title]))));
  }, []);

  const filtered = filter === 'all' ? results
    : filter === 'passed' ? results.filter(r => r.passed || r.percentage >= 90)
    : results.filter(r => !r.passed && r.percentage < 90);

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Quiz Results</h1>
          <p className="dash-subtitle">{results.length} total attempt{results.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'passed', 'failed'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <div className="empty-state-title">No results found</div>
          <div className="empty-state-sub">Quiz attempts will appear here once learners complete them</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Material</th>
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text)', fontWeight: 500 }}>{r.userName}</td>
                  <td>{matMap[r.materialId] || 'Deleted material'}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: r.score >= 90 ? 'var(--success)' : r.score >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                      {r.score}%
                    </span>
                    <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 6 }}>({r.correct}/{r.total})</span>
                  </td>
                  <td><span className={`badge ${r.score >= 90 ? 'badge-green' : 'badge-red'}`}>{r.score >= 90 ? '✓ Certified' : '✕ Failed'}</span></td>
                  <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{new Date(r.completedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
