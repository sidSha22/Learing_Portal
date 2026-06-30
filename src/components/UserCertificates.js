import React, { useState, useEffect } from 'react';
import { getResultsByUser, getMaterials } from '../utils/storage';
import { generateCertificate } from '../utils/certificateUtils';
import '../pages/Dashboard.css';

export default function UserCertificates({ user }) {
  const [results, setResults] = useState([]);
  const [matMap, setMatMap] = useState({});

  useEffect(() => {
    getResultsByUser(user.id).then(r => setResults(r.filter(r => r.passed || r.percentage >= 90)));
    getMaterials().then(mats => setMatMap(Object.fromEntries(mats.map(m => [m.id, m]))));
  }, [user.id]);

  const handleDownload = (r) => {
    const mat = matMap[r.materialId];
    const certData = generateCertificate({
      userName: user.name,
      materialTitle: mat ? mat.title : 'Learning Module',
      score: r.score,
      date: r.completedAt,
    });
    const a = document.createElement('a');
    a.href = certData;
    a.download = `Certificate_${user.name.replace(/\s+/g, '_')}_${(mat?.title || 'Module').replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">My Certificates</h1>
          <p className="dash-subtitle">{results.length} certificate{results.length !== 1 ? 's' : ''} earned</p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✦</div>
          <div className="empty-state-title">No certificates yet</div>
          <div className="empty-state-sub">Score 90% or above on a quiz to earn a certificate</div>
        </div>
      ) : (
        <div className="materials-grid">
          {results.slice().reverse().map(r => {
            const mat = matMap[r.materialId];
            return (
              <div key={r.id} className="material-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>🏆</span>
                  <span className="badge badge-gold">Certified</span>
                </div>
                <div className="material-card-title">{mat ? mat.title : 'Learning Module'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-display)' }}>{r.score}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{new Date(r.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{r.correct}/{r.total} correct</div>
                  </div>
                </div>
                <div className="material-card-actions">
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleDownload(r)}>⬇ Download Certificate</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
