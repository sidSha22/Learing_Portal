import { getApiKey, getFileData } from './storage';

export async function generateQuestionsFromPDF(materialId, materialTitle, numQuestions = 10) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const fileData = await getFileData(materialId);
  if (!fileData) throw new Error('File data not found. The material may have been deleted.');

  const base64Only = fileData.includes(',') ? fileData.split(',')[1] : fileData;

  const prompt = `You are an expert quiz creator for industrial training. Based on this PDF document titled "${materialTitle}", generate exactly ${numQuestions} multiple-choice questions.

INSTRUCTIONS:
- Create questions that test genuine understanding, not just memorization
- Each question must have exactly 4 options
- Only one option should be correct
- Vary difficulty: mix easy, medium, and hard questions
- Focus on key concepts, procedures, safety points, and important facts in the document

Return ONLY a valid JSON array — no markdown, no backticks, no preamble. Format:
[{"id":1,"question":"...?","options":["Option A","Option B","Option C","Option D"],"correctIndex":0,"explanation":"Why this is correct"}]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Only } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || '';
    if (response.status === 401) throw new Error('API_KEY_INVALID');
    throw new Error(msg || `API error ${response.status}`);
  }

  const data = await response.json();
  return parseQuestions(data.content?.[0]?.text || '');
}

export async function generateQuestionsFromText(text, materialTitle, numQuestions = 10) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const truncated = text.length > 12000 ? text.substring(0, 12000) + '...' : text;

  const prompt = `You are an expert quiz creator for industrial training. Based on this study material titled "${materialTitle}", generate exactly ${numQuestions} multiple-choice questions.

MATERIAL:
${truncated}

INSTRUCTIONS:
- Test genuine understanding, not just memorization
- Exactly 4 options per question, only one correct
- Vary difficulty: easy, medium, hard
- Focus on key concepts, facts, procedures

Return ONLY a valid JSON array — no markdown, no backticks. Format:
[{"id":1,"question":"...?","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('API_KEY_INVALID');
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return parseQuestions(data.content?.[0]?.text || '');
}

function parseQuestions(content) {
  try {
    const clean = content.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array found');
    const questions = JSON.parse(clean.substring(start, end + 1));
    if (!Array.isArray(questions) || questions.length === 0) throw new Error('Empty array');
    return questions;
  } catch (e) {
    console.error('Question parse error:', e, '\nRaw content:', content);
    throw new Error('AI returned an unexpected format. Please try again.');
  }
}
