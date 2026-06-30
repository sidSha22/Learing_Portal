import React, { useState, useEffect } from 'react';
import { getMaterials, getRandomQuestions, getQuestionCount, saveQuizResult } from '../utils/storage';
import { generateCertificate } from '../utils/certificateUtils';
import '../pages/Dashboard.css';

// ── Stage 1: Select material ──────────────────────────────────────────────────
function SelectMaterial({ onSelect }) {
  const [materials, setMaterials]         = useState([]);
  const [questionCounts, setQuestionCounts] = useState({});
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');

  useEffect(() => {
    getMaterials().then(async (mats) => {
      setMaterials(mats);
      // Load question counts in parallel
      const counts = {};
      await Promise.all(mats.map(async m => { counts[m.id] = await getQuestionCount(m.id); }));
      setQuestionCounts(counts);
      setLoading(false);
    });
  }, []);

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="dash-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
        <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
        <div>Loading materials…</div>
      </div>
    </div>
  );

  return (
    <div className="dash-content fade-in">
      <div className="dash-header">
        <div><h1 className="dash-title">Take a Quiz</h1><p className="dash-subtitle">Choose a module to be tested on</p></div>
        <input className="form-input" style={{ width: 240 }} placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <div className="empty-state-title">No materials available</div>
          <div className="empty-state-sub">Wait for an admin to upload study materials and add quiz questions</div>
        </div>
      ) : (
        <div className="materials-grid">
          {filtered.map(m => {
            const count = questionCounts[m.id] || 0;
            const ready = count >= 10;
            return (
              <div key={m.id} className="material-card">
                <div className="material-card-icon">{m.fileIcon || '📄'}</div>
                <div className="material-card-title">{m.title}</div>
                {m.description && <div className="material-card-desc">{m.description}</div>}
                <div className="material-card-meta">
                  <span className="badge badge-gray">{(m.fileType || 'file').toUpperCase()}</span>
                  {m.subject && <span className="badge badge-blue">{m.subject}</span>}
                </div>
                <div style={{ marginTop: 8, marginBottom: 4, fontSize: 12, color: ready ? 'var(--success)' : 'var(--warning)' }}>
                  {ready ? `✓ ${count} questions available` : `⚠ ${count}/10 questions — not ready yet`}
                </div>
                <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={() => onSelect(m)} disabled={!ready}>
                  {ready ? 'Start Quiz →' : 'Not enough questions'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Stage 2: Loading questions ────────────────────────────────────────────────
function LoadingQuiz({ material, onLoaded, onError }) {
  useEffect(() => {
    getRandomQuestions(material.id, 10)
      .then(qs => {
        if (qs.length < 1) { onError('No questions found for this material. Please ask your administrator to add questions.'); return; }
        onLoaded(qs);
      })
      .catch(e => onError(e.message));
  }, []); // eslint-disable-line

  return (
    <div className="dash-content fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 24px' }}>
          <div style={{ width: 72, height: 72, border: '3px solid var(--border2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{material.fileIcon || '📄'}</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>Preparing Your Quiz</h2>
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>Selecting 10 random questions from the question bank…</p>
        <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: '10px 16px', border: '1px solid var(--border)' }}>
          <strong style={{ color: 'var(--text2)' }}>{material.title}</strong>
        </div>
      </div>
    </div>
  );
}

// ── Error screen ──────────────────────────────────────────────────────────────
function QuizError({ error, onBack }) {
  return (
    <div className="dash-content fade-in" style={{ maxWidth: 520 }}>
      <div className="card" style={{ textAlign: 'center', padding: '40px 36px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8, color: 'var(--warning)' }}>Quiz Generation Failed</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{error || 'An unexpected error occurred. Please try again.'}</p>
        <button className="btn btn-secondary" onClick={onBack}>← Back to Materials</button>
      </div>
    </div>
  );
}

// ── Stage 3: Quiz interface ────────────────────────────────────────────────────
function QuizInterface({ material, questions, onComplete }) {
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState({});
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const q        = questions[current];
  const progress = (current / questions.length) * 100;
  const isLast   = current === questions.length - 1;

  const handleConfirm = () => {
    if (selected === null) return;
    setAnswers(a => ({ ...a, [current]: selected }));
    setConfirmed(true);
  };

  const handleNext = () => {
    if (isLast) {
      const finalAnswers = { ...answers, [current]: selected };
      const correct = questions.filter((q, i) => finalAnswers[i] === q.correctIndex).length;
      onComplete({ answers: finalAnswers, correct, total: questions.length });
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  return (
    <div className="dash-content fade-in">
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{material.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text2)' }}>
            Question <strong style={{ color: 'var(--text)' }}>{current + 1}</strong> / {questions.length}
          </div>
        </div>

        <div className="progress-bar-track" style={{ marginBottom: 28 }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="card" style={{ marginBottom: 16, padding: '28px 28px 24px' }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Question {current + 1}</div>
          <p style={{ fontSize: 17, color: 'var(--text)', fontWeight: 500, lineHeight: 1.65, marginBottom: 24 }}>{q.question}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => {
              let extraStyle = {};
              if (confirmed) {
                if (i === q.correctIndex) extraStyle = { background: 'var(--success-bg)', borderColor: 'var(--success)', color: 'var(--success)' };
                else if (i === selected && selected !== q.correctIndex) extraStyle = { background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' };
              } else if (selected === i) {
                extraStyle = { background: 'rgba(79,142,247,0.1)', borderColor: 'var(--accent)', color: 'var(--text)' };
              }
              return (
                <button key={i}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius2)', cursor: confirmed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%', ...extraStyle }}
                  onClick={() => !confirmed && setSelected(i)}
                  disabled={confirmed}
                >
                  <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                    {confirmed && i === q.correctIndex ? '✓' : confirmed && i === selected && selected !== q.correctIndex ? '✕' : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.55 }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {confirmed && q.explanation && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--accent-glow)', borderRadius: 'var(--radius2)', border: '1px solid rgba(79,142,247,0.2)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--accent)' }}>Explanation: </strong>{q.explanation}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {!confirmed
            ? <button className="btn btn-primary" onClick={handleConfirm} disabled={selected === null}>Confirm Answer</button>
            : <button className="btn btn-primary" onClick={handleNext}>{isLast ? 'Submit Quiz →' : 'Next Question →'}</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Stage 4: Results ──────────────────────────────────────────────────────────
function QuizResults({ material, result, user, onRetake, onNavigate }) {
  const { correct, total } = result;
  const percentage = Math.round((correct / total) * 100);
  const passed     = percentage >= 90;
  const [certData, setCertData] = useState(null);

  const handleGenerateCert = () => {
    setCertData(generateCertificate({ userName: user.name, materialTitle: material.title, score: percentage, date: new Date().toISOString() }));
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = certData;
    a.download = `Certificate_${user.name.replace(/\s+/g, '_')}_${material.title.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="dash-content fade-in" style={{ maxWidth: 580 }}>
      <div className="card" style={{ textAlign: 'center', padding: '44px 40px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{passed ? '🏆' : '📊'}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 6, letterSpacing: '-0.02em' }}>
          {passed ? 'Congratulations!' : 'Good Effort!'}
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 30 }}>
          {passed ? 'You passed with distinction and earned a certificate.' : `You need ${90 - percentage}% more to earn a certificate. Keep studying!`}
        </p>

        {/* Score ring */}
        <div style={{ position: 'relative', width: 128, height: 128, margin: '0 auto 28px' }}>
          <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="64" cy="64" r="54" fill="none" stroke="var(--border)" strokeWidth="9" />
            <circle cx="64" cy="64" r="54" fill="none"
              stroke={passed ? 'var(--success)' : percentage >= 60 ? 'var(--warning)' : 'var(--danger)'}
              strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
              style={{ transition: 'stroke-dashoffset 1.2s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: passed ? 'var(--success)' : 'var(--warning)', lineHeight: 1 }}>{percentage}%</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Score</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 28 }}>
          <div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{correct}</div><div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correct</div></div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--danger)' }}>{total - correct}</div><div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wrong</div></div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{total}</div><div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div></div>
        </div>

        <span className={`badge ${passed ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 13, padding: '5px 16px', marginBottom: 28, display: 'inline-block' }}>
          {passed ? '✓ PASSED — Certificate Eligible' : '✕ FAILED — Score below 90%'}
        </span>

        {passed && (
          <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(52,201,122,0.3)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 24 }}>
            <div style={{ fontWeight: 600, color: 'var(--success)', marginBottom: 12 }}>🎓 Your Certificate is Ready</div>
            {!certData ? (
              <button className="btn btn-success" onClick={handleGenerateCert}>Generate Certificate</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <img src={certData} alt="Certificate Preview" style={{ width: '100%', borderRadius: 'var(--radius2)', border: '1px solid var(--border)' }} />
                <button className="btn btn-success" onClick={handleDownload}>⬇ Download as PNG</button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onRetake}>↺ Retake Quiz</button>
          <button className="btn btn-primary" onClick={() => onNavigate('study')}>Continue Studying →</button>
        </div>
      </div>
    </div>
  );
}

// ── Main orchestrator ─────────────────────────────────────────────────────────
export default function UserQuiz({ user, toast, preselectedMaterial, onNavigate }) {
  const [material, setMaterial] = useState(preselectedMaterial || null);
  const [stage, setStage]       = useState(preselectedMaterial ? 'loading' : 'select');
  const [questions, setQuestions] = useState(null);
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSelect    = (m) => { setMaterial(m); setStage('loading'); };
  const handleLoaded    = (qs) => { setQuestions(qs); setStage('quiz'); };
  const handleError     = (msg) => { setErrorMsg(msg); setStage('error'); };
  const handleBackError = () => { setStage('select'); setMaterial(null); setErrorMsg(null); };

  const handleComplete = (res) => {
    const percentage = Math.round((res.correct / res.total) * 100);
    const passed     = percentage >= 90;
    saveQuizResult({
      userId: user.id, userName: user.name,
      materialId: material.id, materialTitle: material.title,
      score: percentage, total: res.total, percentage, passed,
      completedAt: new Date().toISOString(), timeTaken: 0,
    });
    setResult(res);
    setStage('results');
    if (passed) toast.success(`🎉 ${percentage}% — You earned a certificate!`);
    else toast.info(`Score: ${percentage}%. You need 90% to pass.`);
  };

  const handleRetake = () => { setStage('loading'); setResult(null); setQuestions(null); setErrorMsg(null); };

  if (stage === 'select')  return <SelectMaterial onSelect={handleSelect} />;
  if (stage === 'loading') return <LoadingQuiz material={material} onLoaded={handleLoaded} onError={handleError} />;
  if (stage === 'error')   return <QuizError error={errorMsg} onBack={handleBackError} />;
  if (stage === 'quiz')    return <QuizInterface material={material} questions={questions} onComplete={handleComplete} />;
  if (stage === 'results') return <QuizResults material={material} result={result} user={user} onRetake={handleRetake} onNavigate={onNavigate} />;
  return null;
}
