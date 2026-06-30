// This file is kept for compatibility but no longer used.
// Quiz questions are now managed manually by the admin in the question bank.
export default function handler(req, res) {
  res.status(410).json({ error: 'AI quiz generation has been replaced by a manual question bank.' });
}
