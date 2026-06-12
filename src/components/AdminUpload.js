import React, { useState, useRef } from 'react';
import { saveMaterial } from '../utils/storage';
import { fileToBase64, formatFileSize, getFileIcon, getFileType } from '../utils/fileUtils';
import '../pages/Dashboard.css';

export default function AdminUpload({ toast, onSuccess }) {
  const [form, setForm] = useState({ title: '', description: '', subject: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 100 * 1024 * 1024) { toast.error('File too large. Max 100MB.'); return; }
    setFile(f);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file.'); return; }
    if (!form.title.trim()) { toast.error('Please enter a title.'); return; }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const material = {
        id: `mat-${Date.now()}`,
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject.trim(),
        fileName: file.name,
        fileSize: file.size,
        fileMime: file.type,
        fileType: getFileType(file.type),
        fileIcon: getFileIcon(file.type),
        fileData: base64,           // saveMaterial strips this into IndexedDB
        uploadedAt: new Date().toISOString(),
      };

      await saveMaterial(material);
      toast.success('Material uploaded successfully!');
      setForm({ title: '', description: '', subject: '' });
      setFile(null);
      onSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Upload Learning Material</h1>
          <p className="dash-subtitle">Add new study resources for learners</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Material Title *</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Industrial Safety Procedures Module 1" required />
          </div>

          <div className="form-group">
            <label className="form-label">Subject / Category</label>
            <input className="form-input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Safety, Operations, Quality Control" />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Briefly describe what this material covers..." rows={3} />
          </div>

          <div className="form-group">
            <label className="form-label">File *</label>
            <div
              className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileRef.current.click()}
            >
              {file ? (
                <div className="upload-file-preview">
                  <span style={{ fontSize: 28 }}>{getFileIcon(file.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div className="upload-file-name">{file.name}</div>
                    <div className="upload-file-size">{formatFileSize(file.size)}</div>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setFile(null); }}>✕ Remove</button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-placeholder-icon">↑</div>
                  <div className="upload-placeholder-text">Drag & drop or <span className="upload-link">browse files</span></div>
                  <div className="upload-placeholder-sub">PDF, MP4, MP3, PPT, images · Max 100MB</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.mp4,.mov,.avi,.mp3,.wav,.ppt,.pptx,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={uploading || !file || !form.title}>
              {uploading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</> : '↑ Upload Material'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setForm({ title: '', description: '', subject: '' }); setFile(null); }}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .upload-dropzone {
          border: 2px dashed var(--border2);
          border-radius: var(--radius);
          padding: 32px;
          cursor: pointer;
          transition: all var(--transition);
          background: var(--bg3);
        }
        .upload-dropzone:hover, .upload-dropzone.drag-over { border-color: var(--accent); background: var(--accent-glow); }
        .upload-dropzone.has-file { cursor: default; border-style: solid; border-color: var(--border2); }
        .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .upload-placeholder-icon { font-size: 32px; color: var(--text3); background: var(--bg2); width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border2); }
        .upload-placeholder-text { font-size: 14px; color: var(--text2); }
        .upload-link { color: var(--accent); text-decoration: underline; }
        .upload-placeholder-sub { font-size: 12px; color: var(--text3); }
        .upload-file-preview { display: flex; align-items: center; gap: 14px; }
        .upload-file-name { font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 2px; }
        .upload-file-size { font-size: 12px; color: var(--text3); font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}
