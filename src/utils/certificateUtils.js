export function generateCertificate({ userName, materialTitle, score, date, orgName = 'LearnPro Industrial Training' }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, 1200, 850);

  // Outer border - gold double line
  ctx.strokeStyle = '#d4a843';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 1152, 802);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(212,168,67,0.4)';
  ctx.strokeRect(34, 34, 1132, 782);

  // Corner ornaments
  drawCornerOrnament(ctx, 24, 24, false, false);
  drawCornerOrnament(ctx, 1176, 24, true, false);
  drawCornerOrnament(ctx, 24, 826, false, true);
  drawCornerOrnament(ctx, 1176, 826, true, true);

  // Top decorative band
  const topGrad = ctx.createLinearGradient(0, 0, 1200, 0);
  topGrad.addColorStop(0, 'rgba(212,168,67,0)');
  topGrad.addColorStop(0.5, 'rgba(212,168,67,0.08)');
  topGrad.addColorStop(1, 'rgba(212,168,67,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(34, 34, 1132, 120);

  // Organization name
  ctx.fillStyle = '#d4a843';
  ctx.font = '600 16px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '0.12em';
  ctx.fillText(orgName.toUpperCase(), 600, 90);

  // Decorative line
  drawDividerLine(ctx, 600, 110);

  // "Certificate of Completion"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.fillText('Certificate of Completion', 600, 200);

  // Subtitle line
  ctx.fillStyle = '#9aa0b4';
  ctx.font = '300 18px "DM Sans", sans-serif';
  ctx.fillText('This is to certify that', 600, 256);

  // Recipient name
  ctx.fillStyle = '#4f8ef7';
  ctx.font = 'bold 46px "Playfair Display", serif';
  ctx.fillText(userName, 600, 340);

  // Underline for name
  const nameWidth = ctx.measureText(userName).width;
  ctx.strokeStyle = 'rgba(79,142,247,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(600 - nameWidth / 2, 358);
  ctx.lineTo(600 + nameWidth / 2, 358);
  ctx.stroke();

  // "has successfully completed"
  ctx.fillStyle = '#9aa0b4';
  ctx.font = '300 18px "DM Sans", sans-serif';
  ctx.fillText('has successfully completed the learning module', 600, 398);

  // Material title
  ctx.fillStyle = '#e8eaf0';
  ctx.font = 'bold 28px "Playfair Display", serif';
  const titleText = materialTitle.length > 60 ? materialTitle.substring(0, 60) + '...' : materialTitle;
  ctx.fillText(`"${titleText}"`, 600, 458);

  // Score badge area
  drawScoreBadge(ctx, 600, 540, score);

  // Divider
  drawDividerLine(ctx, 600, 620);

  // Date and seal area
  ctx.fillStyle = '#6b7289';
  ctx.font = '14px "DM Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DATE OF COMPLETION', 160, 690);
  ctx.fillStyle = '#e8eaf0';
  ctx.font = '600 17px "DM Sans", sans-serif';
  ctx.fillText(new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 160, 715);

  // Signature line
  ctx.strokeStyle = 'rgba(212,168,67,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(780, 720); ctx.lineTo(1020, 720); ctx.stroke();
  ctx.fillStyle = '#9aa0b4';
  ctx.font = '13px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Authorized Signature', 900, 740);

  // Seal
  drawSeal(ctx, 600, 740);

  // Bottom
  ctx.fillStyle = '#6b7289';
  ctx.font = '12px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Certificate ID: LP-${Date.now().toString(36).toUpperCase()}  •  Issued by ${orgName}`, 600, 800);

  return canvas.toDataURL('image/png');
}

function drawCornerOrnament(ctx, x, y, flipX, flipY) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.strokeStyle = '#d4a843';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, 0); ctx.lineTo(30, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(8, 8); ctx.lineTo(0, 8); ctx.stroke();
  ctx.restore();
}

function drawDividerLine(ctx, cx, y) {
  const w = 300;
  ctx.strokeStyle = 'rgba(212,168,67,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - w, y); ctx.lineTo(cx - 20, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 20, y); ctx.lineTo(cx + w, y); ctx.stroke();
  // Diamond
  ctx.fillStyle = '#d4a843';
  ctx.save(); ctx.translate(cx, y); ctx.rotate(Math.PI / 4);
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
}

function drawScoreBadge(ctx, cx, cy, score) {
  const r = 58;
  // Outer ring
  const grad = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 4);
  grad.addColorStop(0, 'rgba(212,168,67,0.2)');
  grad.addColorStop(1, 'rgba(212,168,67,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#d4a843';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(212,168,67,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r - 8, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = '#d4a843';
  ctx.font = 'bold 32px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${score}%`, cx, cy + 6);
  ctx.fillStyle = '#9aa0b4';
  ctx.font = '11px "DM Sans", sans-serif';
  ctx.fillText('SCORE', cx, cy + 26);
}

function drawSeal(ctx, cx, cy) {
  // Decorative seal
  ctx.fillStyle = 'rgba(79,142,247,0.08)';
  ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(79,142,247,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(79,142,247,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#4f8ef7';
  ctx.font = 'bold 11px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED', cx, cy + 4);
}
