// storage.js — Supabase for everything: database + file storage

import { supabase } from '../supabase';

// ── Session (localStorage — just tracks who is logged in on this device) ──────
export function getSession()      { try { const r = localStorage.getItem('lp_session'); return r ? JSON.parse(r) : null; } catch { return null; } }
export function saveSession(user) { localStorage.setItem('lp_session', JSON.stringify(user)); }
export function clearSession()    { localStorage.removeItem('lp_session'); }

// ── Users ──────────────────────────────────────────────────────────────────────
export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function findUser(username, password) {
  const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single();
  if (error) return null;
  return data;
}

export async function registerUser(name, username, password) {
  const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
  if (existing) return { error: 'Username already taken' };
  const { data, error } = await supabase.from('users').insert([{ name, username, password, role: 'user' }]).select().single();
  if (error) return { error: error.message };
  return { user: data };
}

export async function seedDefaultUsers() {
  const defaults = [
    { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
    { username: 'user',  password: 'user123',  role: 'user',  name: 'Demo User' },
  ];
  for (const u of defaults) {
    const { data } = await supabase.from('users').select('id').eq('username', u.username).single();
    if (!data) await supabase.from('users').insert([u]);
  }
}

// ── Materials ──────────────────────────────────────────────────────────────────
export async function getMaterials() {
  const { data, error } = await supabase.from('materials').select('*').order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normaliseMaterial);
}

export async function getMaterialsMeta() { return getMaterials(); }

export async function saveMaterial(material) {
  const { fileData, id: localId, ...meta } = material;
  let fileUrl = null;

  if (fileData) {
    const base64  = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const binary  = atob(base64);
    const bytes   = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob     = new Blob([bytes], { type: meta.fileMime || 'application/octet-stream' });
    const filePath = `${localId}/${meta.fileName || 'file'}`;
    const { error: upErr } = await supabase.storage.from('materials').upload(filePath, blob, { contentType: meta.fileMime || 'application/octet-stream', upsert: true });
    if (upErr) throw new Error('File upload failed: ' + upErr.message);
    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(filePath);
    fileUrl = urlData?.publicUrl || null;
  }

  const row = {
    id: localId, title: meta.title, description: meta.description || '',
    subject: meta.subject || '', file_name: meta.fileName || '',
    file_size: meta.fileSize || 0, file_mime: meta.fileMime || '',
    file_type: meta.fileType || '', file_icon: meta.fileIcon || '📄',
    file_url: fileUrl, uploaded_at: meta.uploadedAt || new Date().toISOString(),
  };

  const { data, error } = await supabase.from('materials').upsert([row]).select().single();
  if (error) throw error;
  return normaliseMaterial(data);
}

export async function deleteMaterial(id) {
  const { data: files } = await supabase.storage.from('materials').list(id);
  if (files && files.length > 0) {
    await supabase.storage.from('materials').remove(files.map(f => `${id}/${f.name}`));
  }
  await supabase.from('questions').delete().eq('material_id', id);
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}

export async function updateMaterialMeta(id, updates) {
  const row = {};
  if (updates.title !== undefined)       row.title       = updates.title;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.subject !== undefined)     row.subject     = updates.subject;
  const { error } = await supabase.from('materials').update(row).eq('id', id);
  if (error) throw error;
  return true;
}

export async function getFileData(materialId) {
  const { data, error } = await supabase.from('materials').select('file_url').eq('id', materialId).single();
  if (error || !data?.file_url) return null;
  const response = await fetch(data.file_url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function saveFileData()   {}
export async function deleteFileData() {}

// ── Questions (manual MCQ bank) ────────────────────────────────────────────────
export async function getQuestions(materialId) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('material_id', materialId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(normaliseQuestion);
}

export async function addQuestion(materialId, q) {
  const row = {
    material_id:   materialId,
    question:      q.question,
    option_a:      q.options[0],
    option_b:      q.options[1],
    option_c:      q.options[2],
    option_d:      q.options[3],
    correct_index: q.correctIndex,
    explanation:   q.explanation || '',
  };
  const { data, error } = await supabase.from('questions').insert([row]).select().single();
  if (error) throw error;
  return normaliseQuestion(data);
}

export async function updateQuestion(id, q) {
  const row = {
    question:      q.question,
    option_a:      q.options[0],
    option_b:      q.options[1],
    option_c:      q.options[2],
    option_d:      q.options[3],
    correct_index: q.correctIndex,
    explanation:   q.explanation || '',
  };
  const { error } = await supabase.from('questions').update(row).eq('id', id);
  if (error) throw error;
  return true;
}

export async function deleteQuestion(id) {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkAddQuestions(materialId, questions) {
  const rows = questions.map(q => ({
    material_id:   materialId,
    question:      q.question,
    option_a:      q.options[0],
    option_b:      q.options[1],
    option_c:      q.options[2],
    option_d:      q.options[3],
    correct_index: q.correctIndex,
    explanation:   q.explanation || '',
  }));
  const { error } = await supabase.from('questions').insert(rows);
  if (error) throw error;
  return rows.length;
}

export async function getRandomQuestions(materialId, count = 10) {
  // Fetch all questions for this material then randomly pick `count`
  const all = await getQuestions(materialId);
  if (all.length === 0) return [];
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, all.length));
}

export async function getQuestionCount(materialId) {
  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('material_id', materialId);
  if (error) return 0;
  return count || 0;
}

// ── Quiz Results ───────────────────────────────────────────────────────────────
export async function getQuizResults() {
  const { data, error } = await supabase.from('quiz_results').select('*').order('completed_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normaliseResult);
}

export async function saveQuizResult(result) {
  const { error } = await supabase.from('quiz_results').insert([{
    user_id:        result.userId,
    user_name:      result.userName,
    material_id:    result.materialId,
    material_title: result.materialTitle,
    score:          result.score,
    total:          result.total,
    percentage:     result.percentage,
    passed:         result.passed,
    completed_at:   result.completedAt,
    time_taken:     result.timeTaken || 0,
  }]);
  if (error) throw error;
}

export async function getResultsByUser(userId) {
  const { data, error } = await supabase.from('quiz_results').select('*').eq('user_id', userId).order('completed_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normaliseResult);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function normaliseMaterial(row) {
  return {
    id: row.id, title: row.title, description: row.description,
    subject: row.subject, fileName: row.file_name, fileSize: row.file_size,
    fileMime: row.file_mime, fileType: row.file_type, fileIcon: row.file_icon,
    fileDownloadURL: row.file_url, uploadedAt: row.uploaded_at,
  };
}

function normaliseQuestion(row) {
  return {
    id:           row.id,
    materialId:   row.material_id,
    question:     row.question,
    options:      [row.option_a, row.option_b, row.option_c, row.option_d],
    correctIndex: row.correct_index,
    explanation:  row.explanation || '',
  };
}

function normaliseResult(r) {
  return {
    id: r.id, userId: r.user_id, userName: r.user_name,
    materialId: r.material_id, materialTitle: r.material_title,
    score: r.score, total: r.total, percentage: r.percentage,
    passed: r.passed, completedAt: r.completed_at, timeTaken: r.time_taken,
  };
}
