export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

export function createBurst(
  x: number,
  y: number,
  color: string,
  count: number = 60,
  speed: number = 150
): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.5 + Math.random() * 0.5);
    const life = 400 + Math.random() * 500;
    
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life,
      maxLife: life,
      radius: 3 + Math.random() * 3,
      color,
    });
  }
  
  return particles;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      life: p.life - dt * 1000,
    }))
    .filter(p => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  particles.forEach(p => {
    const alpha = Math.pow(p.life / p.maxLife, 2);
    const radius = p.radius * (p.life / p.maxLife);
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void {
  const alphas = [0.25, 0.15, 0.1, 0.05];
  
  alphas.forEach((alpha, i) => {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius + i * 4, 0, Math.PI * 2);
    ctx.stroke();
  });
  
  ctx.globalAlpha = 1;
}

export function drawOutline(
  ctx: CanvasRenderingContext2D,
  drawFunc: () => void,
  outlineColor: string = '#ffffff',
  outlineWidth: number = 4
): void {
  // Outer stroke
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineWidth;
  drawFunc();
  ctx.stroke();
  
  // Inner stroke
  ctx.lineWidth = outlineWidth / 2;
  drawFunc();
  ctx.stroke();
}

export function drawDropShadow(
  ctx: CanvasRenderingContext2D,
  drawFunc: () => void,
  offsetX: number = 2,
  offsetY: number = 2
): void {
  const alphas = [0.15, 0.1, 0.06];
  
  alphas.forEach((alpha, i) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.translate(offsetX + i, offsetY + i);
    drawFunc();
    ctx.stroke();
    ctx.restore();
  });
}
