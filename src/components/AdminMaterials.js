import React, { useState, useEffect, useCallback } from 'react';
import { getMaterials, updateMaterialMeta, deleteMaterial } from '../utils/storage';
import { formatFileSize } from '../utils/fileUtils';
import '../pages/Dashboard.css';

export default function AdminMaterials({ toast }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await getMaterials();
    setMaterials(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (m) => { setEditing(m.id); setEditForm({ title: m.title, description: m.description || '', subject: m.subject || '' }); };
  const cancelEdit = () => { setEditing(null); setEditForm({}); };

  const saveEdit = (m) => {
    if (!editForm.title.trim()) { toast.error('Title is required.'); return; }
    const ok = updateMaterialMeta(m.id, { title: editForm.title.trim(), description: editForm.description, subject: editForm.subject });
    if (!ok) { toast.error('Failed to save changes.'); return; }
    toast.success('Material updated.');
    setEditing(null);
    load();
  };

  const doDelete = async () => {
    await deleteMaterial(confirmDelete.id);
    toast.success('Material deleted.');
    setConfirmDelete(null);
    load();
  };

  if (loading) return (
    <div className="dash-content fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
        <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
        <div>Loading materials…</div>
      </div>
    </div>
  );

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Manage Materials</h1>
          <p className="dash-subtitle">{materials.length} material{materials.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>↺ Refresh</button>
      </div>

      {materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-title">No materials yet</div>
          <div className="empty-state-sub">Upload your first learning material to get started</div>
        </div>
      ) : (
        <div className="materials-grid">
          {materials.map(m => (
            <div key={m.id} className="material-card">
              {editing === m.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Title</label>
                    <input className="form-input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Subject</label>
                    <input className="form-input" value={editForm.subject} onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(m)}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="material-card-icon">{m.fileIcon || '📄'}</div>
                  <div className="material-card-title">{m.title}</div>
                  {m.description && <div className="material-card-desc">{m.description}</div>}
                  <div className="material-card-meta">
                    <span className="badge badge-gray">{(m.fileType || 'file').toUpperCase()}</span>
                    {m.subject && <span className="badge badge-blue">{m.subject}</span>}
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{formatFileSize(m.fileSize || 0)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    Uploaded {new Date(m.uploadedAt).toLocaleDateString()}
                    {m.updatedAt && ` · Edited ${new Date(m.updatedAt).toLocaleDateString()}`}
                  </div>
                  <div className="material-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(m)}>✎ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(m)}>✕ Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete Material</div>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>"{confirmDelete.title}"</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={doDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
