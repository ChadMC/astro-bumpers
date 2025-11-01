import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SIZES = [192, 256, 384, 512];
const BG_COLOR = '#0a0f1e';
const SHIP_COLOR = '#58d7ff';

function drawShipIcon(ctx: any, size: number) {
  const scale = size / 192;
  const centerX = size / 2;
  const centerY = size / 2;
  
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, size, size);
  
  // Draw ship
  ctx.save();
  ctx.translate(centerX, centerY);
  
  const w = 50 * scale;
  const h = 70 * scale;
  
  // Main body
  ctx.fillStyle = SHIP_COLOR;
  
  // Top circle
  ctx.beginPath();
  ctx.arc(0, -h/2 + w/2, w/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Middle rect
  ctx.fillRect(-w/2, -h/2 + w/2, w, h - w);
  
  // Bottom circle
  ctx.beginPath();
  ctx.arc(0, h/2 - w/2, w/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Fins
  ctx.beginPath();
  ctx.moveTo(-w/2, h/4);
  ctx.lineTo(-w * 0.9, h/2);
  ctx.lineTo(-w/2, h/2);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(w/2, h/4);
  ctx.lineTo(w * 0.9, h/2);
  ctx.lineTo(w/2, h/2);
  ctx.closePath();
  ctx.fill();
  
  // Window
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, -h/4, w/4, 0, Math.PI * 2);
  ctx.fill();
  
  // Outline
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3 * scale;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  // Outline top
  ctx.beginPath();
  ctx.arc(0, -h/2 + w/2, w/2, 0, Math.PI * 2);
  ctx.stroke();
  
  // Outline middle
  ctx.strokeRect(-w/2, -h/2 + w/2, w, h - w);
  
  // Outline bottom
  ctx.beginPath();
  ctx.arc(0, h/2 - w/2, w/2, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

function generateIcons() {
  const controllerDir = resolve(__dirname, '../../../apps/controller/public/icons');
  const hostDir = resolve(__dirname, '../../../apps/host/public/icons');
  
  [controllerDir, hostDir].forEach(dir => {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (e) {
      // Directory exists
    }
    
    SIZES.forEach(size => {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      drawShipIcon(ctx, size);
      
      const buffer = canvas.toBuffer('image/png');
      writeFileSync(resolve(dir, `icon-${size}.png`), buffer);
      console.log(`Generated ${dir}/icon-${size}.png`);
    });
    
    // Maskable icon (with padding)
    const maskSize = 512;
    const canvas = createCanvas(maskSize, maskSize);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, maskSize, maskSize);
    
    ctx.save();
    ctx.translate(maskSize / 2, maskSize / 2);
    ctx.scale(0.6, 0.6);
    ctx.translate(-maskSize / 2, -maskSize / 2);
    drawShipIcon(ctx, maskSize);
    ctx.restore();
    
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(resolve(dir, 'icon-512-maskable.png'), buffer);
    console.log(`Generated ${dir}/icon-512-maskable.png`);
  });
}

generateIcons();
console.log('✓ PWA icons generated successfully');
