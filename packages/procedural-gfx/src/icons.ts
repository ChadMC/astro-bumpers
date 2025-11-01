export type DrawContext = CanvasRenderingContext2D;

export function drawShip(ctx: DrawContext, x: number, y: number, scale: number, color: string, angle: number = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  const w = 30 * scale;
  const h = 40 * scale;
  
  // Main body (capsule)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -h/2 + w/2, w/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-w/2, -h/2 + w/2, w, h - w);
  ctx.beginPath();
  ctx.arc(0, h/2 - w/2, w/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Fins
  ctx.beginPath();
  ctx.moveTo(-w/2, h/4);
  ctx.lineTo(-w * 0.8, h/2);
  ctx.lineTo(-w/2, h/2);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(w/2, h/4);
  ctx.lineTo(w * 0.8, h/2);
  ctx.lineTo(w/2, h/2);
  ctx.closePath();
  ctx.fill();
  
  // Outline
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
  
  ctx.restore();
}

export function drawNitroIcon(ctx: DrawContext, x: number, y: number, scale: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  
  const chevronSpacing = 8 * scale;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-10 * scale + i * chevronSpacing, -8 * scale);
    ctx.lineTo(0 + i * chevronSpacing, 0);
    ctx.lineTo(-10 * scale + i * chevronSpacing, 8 * scale);
    ctx.stroke();
  }
  
  ctx.restore();
}

export function drawShockwaveIcon(ctx: DrawContext, x: number, y: number, scale: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;
  
  // Concentric circles
  for (let r = 4; r <= 12; r += 4) {
    ctx.beginPath();
    ctx.arc(0, 0, r * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Outward ticks
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = Math.cos(angle) * 12 * scale;
    const y1 = Math.sin(angle) * 12 * scale;
    const x2 = Math.cos(angle) * 16 * scale;
    const y2 = Math.sin(angle) * 16 * scale;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  ctx.restore();
}

export function drawHeavyIcon(ctx: DrawContext, x: number, y: number, scale: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  
  // Anvil shape
  const w = 16 * scale;
  const h = 16 * scale;
  ctx.fillRect(-w/2, -h/2, w, h);
  ctx.strokeRect(-w/2, -h/2, w, h);
  
  // Top
  ctx.fillRect(-w/2 - 4 * scale, -h/2 - 4 * scale, w + 8 * scale, 4 * scale);
  ctx.strokeRect(-w/2 - 4 * scale, -h/2 - 4 * scale, w + 8 * scale, 4 * scale);
  
  ctx.restore();
}

export function drawGlueIcon(ctx: DrawContext, x: number, y: number, scale: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  
  // Droplet
  ctx.beginPath();
  ctx.arc(0, -4 * scale, 8 * scale, 0, Math.PI, true);
  ctx.quadraticCurveTo(-8 * scale, 8 * scale, 0, 12 * scale);
  ctx.quadraticCurveTo(8 * scale, 8 * scale, 8 * scale, -4 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Lines beneath
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6 * scale, 14 * scale);
    ctx.lineTo(i * 6 * scale, 18 * scale);
    ctx.stroke();
  }
  
  ctx.restore();
}

export function drawGhostIcon(ctx: DrawContext, x: number, y: number, scale: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  
  // Rounded blob
  ctx.beginPath();
  ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(-4 * scale, -2 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.arc(4 * scale, -2 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

export function drawTractorIcon(ctx: DrawContext, x: number, y: number, scale: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  
  // Horseshoe magnet
  ctx.beginPath();
  ctx.arc(0, -4 * scale, 10 * scale, 0, Math.PI);
  ctx.stroke();
  
  // Poles
  ctx.beginPath();
  ctx.moveTo(-10 * scale, -4 * scale);
  ctx.lineTo(-10 * scale, 8 * scale);
  ctx.moveTo(10 * scale, -4 * scale);
  ctx.lineTo(10 * scale, 8 * scale);
  ctx.stroke();
  
  ctx.restore();
}

export function drawMaceHazard(ctx: DrawContext, x: number, y: number, scale: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  
  // Central circle
  ctx.beginPath();
  ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Spikes
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = Math.cos(angle) * 8 * scale;
    const y1 = Math.sin(angle) * 8 * scale;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(
      Math.cos(angle) * 18 * scale,
      Math.sin(angle) * 18 * scale
    );
    ctx.lineTo(
      Math.cos(angle + 0.3) * 10 * scale,
      Math.sin(angle + 0.3) * 10 * scale
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  ctx.restore();
}

export function drawBlackHole(ctx: DrawContext, x: number, y: number, scale: number, rotation: number = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = '#8844ff';
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  
  // Three spiral arcs
  for (let i = 0; i < 3; i++) {
    const startAngle = (i / 3) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15 * scale, startAngle, startAngle + Math.PI * 0.8);
    ctx.stroke();
  }
  
  ctx.restore();
}
