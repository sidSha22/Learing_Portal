import React, { useState, useEffect, useRef } from 'react';
import { getMaterials, getQuestions, addQuestion, updateQuestion, deleteQuestion, bulkAddQuestions } from '../utils/storage';
import '../pages/Dashboard.css';

// ── CSV parser ────────────────────────────────────────────────────────────────
// Expected CSV columns (in order):
// question, option_a, option_b, option_c, option_d, correct_index (0-3), explanation
function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

  const rows = [];
  const errors = [];

  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    // Handle quoted commas by simple split (assumes no commas inside quotes for simplicity)
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, '').trim());
    if (cols.length < 6) { errors.push(`Row ${i + 1}: not enough columns (expected 7, got ${cols.length})`); continue; }

    const [question, option_a, option_b, option_c, option_d, correct_raw, explanation = ''] = cols;
    const correctIndex = parseInt(correct_raw, 10);

    if (!question) { errors.push(`Row ${i + 1}: question is empty`); continue; }
    if (!option_a || !option_b || !option_c || !option_d) { errors.push(`Row ${i + 1}: one or more options are empty`); continue; }
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) { errors.push(`Row ${i + 1}: correct_index must be 0, 1, 2, or 3 (got "${correct_raw}")`); continue; }

    rows.push({ question, options: [option_a, option_b, option_c, option_d], correctIndex, explanation });
  }

  return { rows, errors };
}

// ── Blank question template ───────────────────────────────────────────────────
const blankQ = () => ({ question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' });

// ── Single question form ──────────────────────────────────────────────────────
function QuestionForm({ initial, onSave, onCancel, saving }) {
  const [q, setQ] = useState(initial || blankQ());
  const setField = (f, v) => setQ(prev => ({ ...prev, [f]: v }));
  const setOption = (i, v) => setQ(prev => { const o = [...prev.options]; o[i] = v; return { ...prev, options: o }; });

  const valid = q.question.trim() && q.options.every(o => o.trim());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-group">
        <label className="form-label">Question *</label>
        <textarea className="form-input" rows={3} value={q.question} onChange={e => setField('question', e.target.value)} placeholder="Enter the question text…" style={{ resize: 'vertical', fontFamily: 'var(--font)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {q.options.map((opt, i) => (
          <div key={i} className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, flexShrink: 0,
                background: q.correctIndex === i ? 'var(--success)' : 'var(--bg3)',
                color: q.correctIndex === i ? '#fff' : 'var(--text2)',
                border: '1.5px solid ' + (q.correctIndex === i ? 'var(--success)' : 'var(--border2)'),
                cursor: 'pointer',
              }} onClick={() => setField('correctIndex', i)} title="Mark as correct">
                {String.fromCharCode(65 + i)}
              </span>
              Option {String.fromCharCode(65 + i)} {q.correctIndex === i && <span style={{ color: 'var(--success)', fontSize: 11 }}>✓ Correct</span>}
            </label>
            <input className="form-input" value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}…`} />
          </div>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">Explanation (optional — shown to learner after answering)</label>
        <input className="form-input" value={q.explanation} onChange={e => setField('explanation', e.target.value)} placeholder="Why is this the correct answer?" />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {onCancel && <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-primary" onClick={() => onSave(q)} disabled={!valid || saving}>
          {saving ? 'Saving…' : 'Save Question'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminQuestions({ toast }) {
  const [materials, setMaterials]   = useState([]);
  const [selectedMat, setSelectedMat] = useState('');
  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editingQ, setEditingQ]     = useState(null); // { id, data }
  const [saving, setSaving]         = useState(false);
  const [csvErrors, setCsvErrors]   = useState([]);
  const [csvPreview, setCsvPreview] = useState(null); // parsed rows waiting for confirm
  const [importing, setImporting]   = useState(false);
  const csvRef = useRef();

  // Load materials
  useEffect(() => { getMaterials().then(m => { setMaterials(m); if (m.length) setSelectedMat(m[0].id); }); }, []);

  // Load questions when material changes
  useEffect(() => {
    if (!selectedMat) return;
    setLoading(true);
    getQuestions(selectedMat).then(q => { setQuestions(q); setLoading(false); }).catch(() => setLoading(false));
  }, [selectedMat]);

  const reload = () => getQuestions(selectedMat).then(setQuestions);

  // Add single question
  const handleAdd = async (q) => {
    setSaving(true);
    try {
      await addQuestion(selectedMat, q);
      await reload();
      setShowForm(false);
      toast.success('Question added!');
    } catch (e) { toast.error('Failed: ' + e.message); }
    setSaving(false);
  };

  // Update single question
  const handleUpdate = async (q) => {
    setSaving(true);
    try {
      await updateQuestion(editingQ.id, q);
      await reload();
      setEditingQ(null);
      toast.success('Question updated!');
    } catch (e) { toast.error('Failed: ' + e.message); }
    setSaving(false);
  };

  // Delete question
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.success('Question deleted.');
    } catch (e) { toast.error('Failed: ' + e.message); }
  };

  // CSV file picked
  const handleCSVFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvErrors([]);
    setCsvPreview(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { rows, errors } = parseCSV(ev.target.result);
        setCsvErrors(errors);
        if (rows.length > 0) setCsvPreview(rows);
        else toast.error('No valid rows found in CSV.');
      } catch (err) { toast.error(err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Confirm CSV import
  const handleCSVImport = async () => {
    if (!csvPreview || csvPreview.length === 0) return;
    setImporting(true);
    try {
      const count = await bulkAddQuestions(selectedMat, csvPreview);
      await reload();
      setCsvPreview(null);
      setCsvErrors([]);
      toast.success(`${count} questions imported successfully!`);
    } catch (e) { toast.error('Import failed: ' + e.message); }
    setImporting(false);
  };

  const mat = materials.find(m => m.id === selectedMat);

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Manage Questions</h1>
          <p className="dash-subtitle">Add MCQ questions to each material's question bank</p>
        </div>
      </div>

      {/* Material selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Select Material:</label>
          <select className="form-input" style={{ flex: 1, minWidth: 200 }} value={selectedMat} onChange={e => { setSelectedMat(e.target.value); setShowForm(false); setEditingQ(null); setCsvPreview(null); }}>
            {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <span className="badge badge-blue" style={{ whiteSpace: 'nowrap' }}>{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
          {questions.length >= 10 && <span className="badge badge-green">✓ Quiz Ready</span>}
          {questions.length > 0 && questions.length < 10 && <span className="badge badge-red">Need {10 - questions.length} more for quiz</span>}
        </div>
      </div>

      {/* CSV import section */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="section-title">Bulk Import via CSV</h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.6 }}>
          Upload a CSV file to add many questions at once. The CSV must have these columns in order:
        </p>
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)', marginBottom: 14, border: '1px solid var(--border)' }}>
          question, option_a, option_b, option_c, option_d, correct_index, explanation
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
          <strong>correct_index</strong> must be 0 (Option A), 1 (Option B), 2 (Option C), or 3 (Option D). The explanation column is optional.
        </p>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCSVFile} style={{ display: 'none' }} />
          <button className="btn btn-secondary" onClick={() => csvRef.current?.click()}>📂 Choose CSV File</button>
          <button className="btn btn-secondary" onClick={() => {
            const header = 'question,option_a,option_b,option_c,option_d,correct_index,explanation\n';
            const sample = 'What is the boiling point of water at sea level?,100°C,90°C,80°C,70°C,0,Water boils at 100°C (212°F) at standard atmospheric pressure.\n';
            const blob = new Blob([header + sample], { type: 'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'questions_template.csv'; a.click();
          }}>⬇ Download Template</button>
        </div>

        {csvErrors.length > 0 && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius2)', fontSize: 12, color: 'var(--danger)' }}>
            <strong>Warnings (these rows will be skipped):</strong>
            <ul style={{ margin: '6px 0 0 18px' }}>{csvErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}

        {csvPreview && (
          <div style={{ marginTop: 14, padding: 14, background: 'var(--success-bg)', border: '1px solid rgba(52,201,122,0.3)', borderRadius: 'var(--radius2)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)', marginBottom: 10 }}>
              ✓ {csvPreview.length} valid questions ready to import
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto', fontSize: 12, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              {csvPreview.slice(0, 5).map((q, i) => (
                <div key={i} style={{ padding: '6px 8px', background: 'var(--bg2)', borderRadius: 4, border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--text)' }}>Q{i + 1}:</strong> {q.question.substring(0, 80)}{q.question.length > 80 ? '…' : ''}
                </div>
              ))}
              {csvPreview.length > 5 && <div style={{ color: 'var(--text3)', padding: '4px 8px' }}>…and {csvPreview.length - 5} more</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleCSVImport} disabled={importing}>{importing ? 'Importing…' : `Import ${csvPreview.length} Questions`}</button>
              <button className="btn btn-secondary" onClick={() => { setCsvPreview(null); setCsvErrors([]); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Add single question */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showForm ? 20 : 0 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Add Single Question</h3>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(f => !f); setEditingQ(null); }}>
            {showForm ? '− Close' : '+ Add Question'}
          </button>
        </div>
        {showForm && <QuestionForm onSave={handleAdd} onCancel={() => setShowForm(false)} saving={saving} />}
      </div>

      {/* Question list */}
      <div className="card">
        <h3 className="section-title">Question Bank {mat && <span style={{ fontWeight: 400, color: 'var(--text3)' }}>— {mat.title}</span>}</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
            Loading…
          </div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◎</div>
            <div className="empty-state-title">No questions yet</div>
            <div className="empty-state-sub">Add questions using the form above or import via CSV</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questions.map((q, idx) => (
              <div key={q.id}>
                {editingQ?.id === q.id ? (
                  <div style={{ padding: 16, background: 'var(--bg3)', borderRadius: 'var(--radius2)', border: '1px solid var(--accent)' }}>
                    <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>Editing Q{idx + 1}</div>
                    <QuestionForm initial={editingQ.data} onSave={handleUpdate} onCancel={() => setEditingQ(null)} saving={saving} />
                  </div>
                ) : (
                  <div style={{ padding: 14, background: 'var(--bg3)', borderRadius: 'var(--radius2)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>Q{idx + 1}</div>
                        <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 10, fontWeight: 500, lineHeight: 1.5 }}>{q.question}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          {q.options.map((opt, i) => (
                            <div key={i} style={{ fontSize: 12, color: q.correctIndex === i ? 'var(--success)' : 'var(--text3)', display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + i)}.</span>
                              <span>{opt}</span>
                              {q.correctIndex === i && <span style={{ fontSize: 10 }}>✓</span>}
                            </div>
                          ))}
                        </div>
                        {q.explanation && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>💡 {q.explanation}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingQ({ id: q.id, data: q })}>Edit</button>
                        <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => handleDelete(q.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
