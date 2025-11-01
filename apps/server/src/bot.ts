import Matter from 'matter-js';

export class Bot {
  private targetAngle = 0;
  private targetUpdateTime = 0;
  
  constructor(public readonly id: string) {}
  
  getInput(
    body: Matter.Body,
    world: Matter.World,
    players: any[]
  ): { steer: number; boost: boolean } {
    const now = Date.now();
    
    // Update target periodically
    if (now - this.targetUpdateTime > 500) {
      this.updateTarget(body, world, players);
      this.targetUpdateTime = now;
    }
    
    // Calculate steering to target
    let angleDiff = this.targetAngle - body.angle;
    
    // Normalize angle difference to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Proportional steering
    const steer = Math.max(-1, Math.min(1, angleDiff * 2));
    
    // Boost when facing target
    const boost = Math.abs(angleDiff) < 0.5;
    
    return { steer, boost };
  }
  
  private updateTarget(body: Matter.Body, world: Matter.World, players: any[]): void {
    // Find nearest opponent
    let nearestDist = Infinity;
    let nearestPos: Matter.Vector | null = null;
    
    players.forEach(p => {
      if (p.id === this.id || !p.body || p.state !== 'alive') return;
      
      const dx = p.body.position.x - body.position.x;
      const dy = p.body.position.y - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestPos = p.body.position;
      }
    });
    
    if (nearestPos) {
      // Aim at nearest opponent
      const dx = nearestPos.x - body.position.x;
      const dy = nearestPos.y - body.position.y;
      this.targetAngle = Math.atan2(dy, dx);
    } else {
      // Head toward center
      const dx = -body.position.x;
      const dy = -body.position.y;
      this.targetAngle = Math.atan2(dy, dx);
    }
    
    // Avoid edges - if too close to edge, turn toward center
    const distFromCenter = Math.sqrt(body.position.x ** 2 + body.position.y ** 2);
    if (distFromCenter > 400) {
      const dx = -body.position.x;
      const dy = -body.position.y;
      this.targetAngle = Math.atan2(dy, dx);
    }
  }
}
