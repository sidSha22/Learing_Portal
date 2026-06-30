import React, { useState, useEffect, useRef } from 'react';
import { getMaterials, getFileData } from '../utils/storage';
import { formatFileSize } from '../utils/fileUtils';
import '../pages/Dashboard.css';

export default function UserStudy({ onStartQuiz }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getMaterials().then(m => { setMaterials(m); setLoading(false); });
  }, []);

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="dash-content fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
        <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
        <div>Loading materials…</div>
      </div>
    </div>
  );

  if (viewing) return <MaterialViewer material={viewing} onBack={() => setViewing(null)} onStartQuiz={onStartQuiz} />;

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Study Materials</h1>
          <p className="dash-subtitle">{materials.length} module{materials.length !== 1 ? 's' : ''} available</p>
        </div>
        <input className="form-input" style={{ width: 240 }} placeholder="🔍 Search materials…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">{search ? 'No results found' : 'No materials yet'}</div>
          <div className="empty-state-sub">{search ? 'Try a different search term' : 'Your administrator will upload study materials soon'}</div>
        </div>
      ) : (
        <div className="materials-grid">
          {filtered.map(m => (
            <div key={m.id} className="material-card">
              <div className="material-card-icon">{m.fileIcon || '📄'}</div>
              <div className="material-card-title">{m.title}</div>
              {m.description && <div className="material-card-desc">{m.description}</div>}
              <div className="material-card-meta">
                <span className="badge badge-gray">{(m.fileType || 'file').toUpperCase()}</span>
                {m.subject && <span className="badge badge-blue">{m.subject}</span>}
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{formatFileSize(m.fileSize || 0)}</span>
              </div>
              <div className="material-card-actions">
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setViewing(m)}>▶ Study</button>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onStartQuiz(m)}>◎ Quiz</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Converts a base64 data URL to a Blob URL — required for iframe/video/audio
// because browsers block data: URIs in these elements for security reasons.
function useFileBlob(materialId, fileMime) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevUrl = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getFileData(materialId)
      .then(dataUrl => {
        if (cancelled) return;
        if (!dataUrl) { setError('File not found in storage.'); setLoading(false); return; }

        // Convert base64 data URL → Blob → Blob URL
        try {
          const [header, base64] = dataUrl.split(',');
          const mime = fileMime || header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: mime });
          const url = URL.createObjectURL(blob);
          prevUrl.current = url;
          setBlobUrl(url);
          setLoading(false);
        } catch (e) {
          setError('Failed to load file: ' + e.message);
          setLoading(false);
        }
      })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => {
      cancelled = true;
      // Revoke old blob URL to free memory
      if (prevUrl.current) { URL.revokeObjectURL(prevUrl.current); prevUrl.current = null; }
    };
  }, [materialId, fileMime]);

  return { blobUrl, loading, error };
}

function MaterialViewer({ material, onBack, onStartQuiz }) {
  const { blobUrl, loading, error } = useFileBlob(material.id, material.fileMime);

  if (loading) return (
    <div className="dash-content fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
        <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
        <div>Loading file…</div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (error || !blobUrl) return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Could not load file</div>
        <div className="empty-state-sub">{error || 'File data not found'}</div>
      </div>
    );

    const type = material.fileType;

    if (type === 'pdf') return (
      // Blob URL works fine in iframe — no security restrictions
      <iframe
        src={blobUrl}
        style={{ width: '100%', height: 'calc(100vh - 230px)', border: 'none', borderRadius: 'var(--radius2)' }}
        title={material.title}
      />
    );

    if (type === 'video') return (
      <video
        src={blobUrl}
        controls
        style={{ width: '100%', borderRadius: 'var(--radius)', maxHeight: 520, background: '#000', display: 'block' }}
      />
    );

    if (type === 'audio') return (
      <div style={{ padding: '48px 24px', background: 'var(--bg3)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎵</div>
        <p style={{ color: 'var(--text2)', marginBottom: 20, fontSize: 15 }}>{material.title}</p>
        <audio src={blobUrl} controls style={{ width: '100%', maxWidth: 480 }} />
      </div>
    );

    if (type === 'image') return (
      <img
        src={blobUrl}
        alt={material.title}
        style={{ maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'block' }}
      />
    );

    // slides / other — offer download
    return (
      <div style={{ padding: 48, background: 'var(--bg3)', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text2)' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{material.fileIcon || '📄'}</div>
        <p style={{ marginBottom: 8, fontSize: 15 }}>{material.fileName}</p>
        <p style={{ marginBottom: 24, fontSize: 13, color: 'var(--text3)' }}>This file type cannot be previewed in the browser.</p>
        <a href={blobUrl} download={material.fileName} className="btn btn-primary">⬇ Download to View</a>
      </div>
    );
  };

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>← Back</button>
          <div>
            <h1 className="dash-title">{material.title}</h1>
            <p className="dash-subtitle">{material.subject || (material.fileType || '').toUpperCase()}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => onStartQuiz(material)}>◎ Take Quiz</button>
      </div>

      {material.description && (
        <div className="card" style={{ marginBottom: 16, padding: '14px 18px' }}>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>{material.description}</p>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
