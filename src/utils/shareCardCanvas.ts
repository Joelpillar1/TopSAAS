import { Product } from '../types';
import { getProductSlug } from './slug';

/**
 * Loads an image safely with crossOrigin = 'anonymous' and timeout.
 * Resolves to null if loading fails, CORS blocked, or times out.
 */
function loadImageSafe(src: string, timeoutMs = 3500): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let timer: number | null = window.setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    img.onload = () => {
      if (timer) clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      if (timer) clearTimeout(timer);
      resolve(null);
    };

    img.src = src;
  });
}

/**
 * Helper to draw a rounded rectangle.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draw a realistic 3D pushpin with shadow and specular highlight.
 */
function drawPushpin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: 'blue' | 'coral' = 'blue'
) {
  ctx.save();
  ctx.translate(x, y);

  // Pin shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(3, 10, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pin head gradient
  const pinGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14);
  if (color === 'blue') {
    pinGrad.addColorStop(0, '#93c5fd');
    pinGrad.addColorStop(0.4, '#3b82f6');
    pinGrad.addColorStop(1, '#1d4ed8');
  } else {
    pinGrad.addColorStop(0, '#fca5a5');
    pinGrad.addColorStop(0.4, '#ef4444');
    pinGrad.addColorStop(1, '#b91c1c');
  }

  // Base disc
  ctx.fillStyle = color === 'blue' ? '#1e40af' : '#991b1b';
  ctx.beginPath();
  ctx.arc(0, 3, 9, 0, Math.PI * 2);
  ctx.fill();

  // Main bulb
  ctx.fillStyle = pinGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();

  // Specular shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.arc(-3, -3, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Wrap text into lines fitting within maxWidth.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length === maxLines - 1) break;
      } else {
        lines.push(word);
        currentLine = '';
        if (lines.length === maxLines - 1) break;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === maxLines) {
    let last = lines[lines.length - 1];
    while (ctx.measureText(`${last}...`).width > maxWidth && last.length > 0) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last}...`;
  }

  return lines;
}

/**
 * Main render function: Draws the TopSAAS "Big Launching Texts" share card.
 * Dimensions: 1200 x 630 (rendered at 2x: 2400 x 1260 for Retina clarity).
 */
export async function renderShareCardToCanvas(
  canvas: HTMLCanvasElement,
  product: Product,
  scale = 2
): Promise<void> {
  const width = 1200;
  const height = 630;

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);

  // ── 1. TopSAAS Brand Gradient Background (Electric Royal Blue to Deep Sapphire) ──
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.42,
    60,
    width / 2,
    height / 2,
    width * 0.75
  );
  bgGrad.addColorStop(0, '#3b82f6'); // Vibrant bright electric blue center
  bgGrad.addColorStop(0.35, '#2563eb'); // Core TopSAAS electric blue
  bgGrad.addColorStop(0.75, '#1d4ed8'); // Deep royal blue
  bgGrad.addColorStop(1, '#0f172a'); // Midnight slate frame
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // ── 2. Subtle Vertical Grid Lines (matching the reference styling) ──
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  const lineSpacing = 44;
  for (let x = lineSpacing; x < width; x += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // ── 3. Preload Images ──
  const [logoImg, creatorImg] = await Promise.all([
    product.logoUrl ? loadImageSafe(product.logoUrl) : Promise.resolve(null),
    product.creatorAvatar ? loadImageSafe(product.creatorAvatar) : Promise.resolve(null),
  ]);

  const category = (product.category || 'SaaS & AI').split(',')[0].trim();
  const upvotes = product.upvotes ?? 0;
  const rank = product.rank || 1;
  const makerName = product.creatorName || product.creatorUsername || 'Joel Pillar';

  // ── 4. Corner Floating Pinned Cards (inspired by the sample) ──

  // Top-Left Tilted Card: Category & Upvotes
  ctx.save();
  ctx.translate(14, -14);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  drawRoundedRect(ctx, 0, 0, 190, 110, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#1e3a8a';
  ctx.font = '900 13px Inter, sans-serif';
  ctx.fillText('⚡ ' + category.toUpperCase(), 18, 38);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 22px Inter, sans-serif';
  ctx.fillText(`▲ ${upvotes} Upvotes`, 18, 72);
  ctx.restore();

  // Top-Right Tilted Card: TopSAAS Official Stamp
  ctx.save();
  ctx.translate(width - 150, -18);
  ctx.rotate((14 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  drawRoundedRect(ctx, 0, 0, 200, 115, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#2563eb';
  ctx.font = '900 12px Inter, sans-serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText('🏆 TOPSAAS VERIFIED', 18, 40);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 20px Inter, sans-serif';
  ctx.fillText(`Rank #${rank} This Week`, 18, 74);
  ctx.restore();

  // Bottom-Left Tilted Card with 3D Pushpin: Product Link Stamp
  ctx.save();
  ctx.translate(35, height - 90);
  ctx.rotate((6 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  drawRoundedRect(ctx, 0, 0, 230, 85, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('OFFICIAL LAUNCH PAGE', 20, 32);

  ctx.fillStyle = '#2563eb';
  ctx.font = '900 13px Inter, monospace, sans-serif';
  const slug = getProductSlug(product);
  ctx.fillText(`topsaas.space/product/${slug}`, 20, 54);

  // 3D Pushpin on the card corner
  drawPushpin(ctx, 16, 12, 'blue');
  ctx.restore();

  // Bottom-Right Tilted Card with 3D Pushpin: Maker Attribution
  ctx.save();
  ctx.translate(width - 235, height - 95);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  drawRoundedRect(ctx, 0, 0, 220, 85, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Maker Avatar
  if (creatorImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(36, 42, 16, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(creatorImg, 20, 26, 32, 32);
    ctx.restore();
  } else {
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(36, 42, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(makerName.charAt(0).toUpperCase(), 36, 42);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('LAUNCHED BY', 62, 36);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 14px Inter, sans-serif';
  let displayMaker = makerName;
  if (ctx.measureText(displayMaker).width > 140) {
    displayMaker = displayMaker.slice(0, 14) + '...';
  }
  ctx.fillText(displayMaker, 62, 55);

  // 3D Pushpin on card corner
  drawPushpin(ctx, 205, 14, 'coral');
  ctx.restore();

  // ── 5. Floating Center-Top Pill (like the sample's avatar pill) ──
  const pillY = 56;
  ctx.save();
  ctx.font = 'bold 16px Inter, sans-serif';
  const pillText = product.name;
  const pillTextW = ctx.measureText(pillText).width;
  const pillW = Math.max(170, pillTextW + 72);
  const pillH = 46;
  const pillX = (width - pillW) / 2;

  // Pill Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 23);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Subtle border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Logo in pill
  const iconW = 30;
  const iconX = pillX + 10;
  const iconY = pillY + (pillH - iconW) / 2;

  if (logoImg) {
    ctx.save();
    drawRoundedRect(ctx, iconX, iconY, iconW, iconW, 8);
    ctx.clip();
    ctx.drawImage(logoImg, iconX, iconY, iconW, iconW);
    ctx.restore();
  } else {
    ctx.fillStyle = '#2563eb';
    drawRoundedRect(ctx, iconX, iconY, iconW, iconW, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((product.name || 'S').charAt(0).toUpperCase(), iconX + iconW / 2, iconY + iconW / 2);
  }

  // Pill Text
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 16px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, iconX + iconW + 10, pillY + pillH / 2);
  ctx.restore();

  // ── 6. BIG LAUNCHING TEXTS (The Main Centerpiece!) ──
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Line 1: "Now Live on" (Huge crisp white text)
  const line1Y = 228;
  ctx.font = '900 82px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillText('Now Live on', width / 2, line1Y);

  // Line 2: "TopSAAS 🚀" (Translucent Glass Effect like the reference image!)
  const line2Y = 328;
  const line2Text = 'TopSAAS 🚀';

  // Outer glow
  ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
  ctx.shadowBlur = 28;

  // Frosted Glass Fill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText(line2Text, width / 2, line2Y);

  // Crisp Glass Border Stroke
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.strokeText(line2Text, width / 2, line2Y);

  ctx.shadowColor = 'transparent';
  ctx.restore();

  // ── 7. Tagline Subtitle (Directly below the big texts) ──
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 23px Inter, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';

  const maxTaglineW = 760;
  const tagline = product.tagline || 'The Curated Directory of Modern SaaS & AI Tools';
  const taglineLines = wrapText(ctx, tagline, maxTaglineW, 2);

  const startTaglineY = 430;
  taglineLines.forEach((line, idx) => {
    ctx.fillText(line, width / 2, startTaglineY + idx * 32);
  });
  ctx.restore();
}

/**
 * Exports the Share Card canvas directly as a PNG Blob.
 */
export async function exportShareCardBlob(product: Product): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  await renderShareCardToCanvas(canvas, product, 2);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.98);
  });
}

/**
 * Copies the generated Share Card directly to system clipboard as a PNG image.
 */
export async function copyShareCardImageToClipboard(product: Product): Promise<boolean> {
  try {
    const blob = await exportShareCardBlob(product);
    if (!blob) return false;
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}

/**
 * Downloads the 1200x630 launch card PNG.
 */
export async function downloadShareCardImage(product: Product, filename?: string): Promise<void> {
  const blob = await exportShareCardBlob(product);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = getProductSlug(product);
  a.href = url;
  a.download = filename || `${slug}-topsaas-launch.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
