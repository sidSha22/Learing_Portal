import { getFileData } from './storage';
import { extractTextFromPDF } from './fileUtils';

const buildPrompt = (materialTitle, numQuestions, content) =>
  `You are an expert quiz creator for industrial training. Based on the study material titled "${materialTitle}", generate exactly ${numQuestions} multiple-choice questions.

MATERIAL:
${content}

INSTRUCTIONS:
- Test genuine understanding, not just memorization
- Each question must have exactly 4 options
- Only one option should be correct
- Vary difficulty: mix easy, medium, and hard questions
- Focus on key concepts, procedures, safety points, and important facts

Return ONLY a valid JSON array — no markdown, no backticks, no explanation. Format:
[{"id":1,"question":"...?","options":["Option A","Option B","Option C","Option D"],"correctIndex":0,"explanation":"Why this is correct"}]`;

async function callServer(prompt) {
  const response = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}

export async function generateQuestionsFromPDF(materialId, materialTitle, numQuestions = 10) {
  const fileData = await getFileData(materialId);
  if (!fileData) throw new Error('File data not found. The material may have been deleted.');

  const text = await extractTextFromPDF(fileData);
  if (!text || text.trim().length < 50) {
    throw new Error('Could not extract enough text from this PDF. It may be a scanned/image-based PDF.');
  }

  const truncated = text.length > 14000 ? text.substring(0, 14000) + '...' : text;
  const raw = await callServer(buildPrompt(materialTitle, numQuestions, truncated));
  return parseQuestions(raw);
}

export async function generateQuestionsFromText(text, materialTitle, numQuestions = 10) {
  const truncated = text.length > 14000 ? text.substring(0, 14000) + '...' : text;
  const raw = await callServer(buildPrompt(materialTitle, numQuestions, truncated));
  return parseQuestions(raw);
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
    console.error('Question parse error:', e, '\nRaw:', content);
    throw new Error('AI returned an unexpected format. Please try again.');
  }
}
