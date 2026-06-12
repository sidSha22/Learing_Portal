// storage.js — Supabase for everything: database + file storage
// Tables: users, materials, quiz_results
// Storage bucket: materials

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
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();
  if (error) return null;
  return data;
}

export async function registerUser(name, username, password) {
  // Check duplicate
  const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
  if (existing) return { error: 'Username already taken' };

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, username, password, role: 'user' }])
    .select()
    .single();
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
    if (!data) {
      await supabase.from('users').insert([u]);
    }
  }
}

// ── Materials ──────────────────────────────────────────────────────────────────
export async function getMaterials() {
  const { data, error } = await supabase.from('materials').select('*').order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalise);
}

export async function getMaterialsMeta() { return getMaterials(); }

export async function saveMaterial(material) {
  const { fileData, id: localId, ...meta } = material;

  let fileUrl = null;

  // Upload file to Supabase Storage
  if (fileData) {
    const base64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const binary  = atob(base64);
    const bytes   = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob     = new Blob([bytes], { type: meta.fileMime || 'application/octet-stream' });
    const filePath = `${localId}/${meta.fileName || 'file'}`;

    const { error: upErr } = await supabase.storage.from('materials').upload(filePath, blob, {
      contentType: meta.fileMime || 'application/octet-stream',
      upsert: true,
    });
    if (upErr) throw new Error('File upload failed: ' + upErr.message);

    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(filePath);
    fileUrl = urlData?.publicUrl || null;
  }

  const row = {
    id:           localId,
    title:        meta.title,
    description:  meta.description || '',
    subject:      meta.subject || '',
    file_name:    meta.fileName || '',
    file_size:    meta.fileSize || 0,
    file_mime:    meta.fileMime || '',
    file_type:    meta.fileType || '',
    file_icon:    meta.fileIcon || '📄',
    file_url:     fileUrl,
    uploaded_at:  meta.uploadedAt || new Date().toISOString(),
  };

  const { data, error } = await supabase.from('materials').upsert([row]).select().single();
  if (error) throw error;
  return normalise(data);
}

export async function deleteMaterial(id) {
  // Delete file from storage
  const { data: files } = await supabase.storage.from('materials').list(id);
  if (files && files.length > 0) {
    const paths = files.map(f => `${id}/${f.name}`);
    await supabase.storage.from('materials').remove(paths);
  }
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}

export async function updateMaterialMeta(id, updates) {
  const row = {};
  if (updates.title)       row.title       = updates.title;
  if (updates.description) row.description = updates.description;
  if (updates.subject)     row.subject     = updates.subject;
  const { error } = await supabase.from('materials').update(row).eq('id', id);
  if (error) throw error;
  return true;
}

// ── File data (for quiz PDF text extraction) ───────────────────────────────────
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

// ── Quiz Results ───────────────────────────────────────────────────────────────
export async function getQuizResults() {
  const { data, error } = await supabase.from('quiz_results').select('*').order('completed_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({
    id:           r.id,
    userId:       r.user_id,
    userName:     r.user_name,
    materialId:   r.material_id,
    materialTitle:r.material_title,
    score:        r.score,
    total:        r.total,
    percentage:   r.percentage,
    passed:       r.passed,
    completedAt:  r.completed_at,
    timeTaken:    r.time_taken,
  }));
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
    time_taken:     result.timeTaken,
  }]);
  if (error) throw error;
}

export async function getResultsByUser(userId) {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({
    id:           r.id,
    userId:       r.user_id,
    userName:     r.user_name,
    materialId:   r.material_id,
    materialTitle:r.material_title,
    score:        r.score,
    total:        r.total,
    percentage:   r.percentage,
    passed:       r.passed,
    completedAt:  r.completed_at,
    timeTaken:    r.time_taken,
  }));
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function normalise(row) {
  return {
    id:           row.id,
    title:        row.title,
    description:  row.description,
    subject:      row.subject,
    fileName:     row.file_name,
    fileSize:     row.file_size,
    fileMime:     row.file_mime,
    fileType:     row.file_type,
    fileIcon:     row.file_icon,
    fileDownloadURL: row.file_url,
    uploadedAt:   row.uploaded_at,
  };
}
