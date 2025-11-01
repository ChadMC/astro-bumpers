import Matter from 'matter-js';
import { Namespace, Socket } from 'socket.io';
import {
  type RoomSummary,
  type PlayerSummary,
  type Snapshot,
  type InputIntent,
  type HostCommand,
  type MapId,
  type ModeId,
  type GameEvent,
  PHYSICS,
  COLORS,
  PLAYER_EMOJIS,
  MAPS,
  GAME,
  POWERUP_CONFIG,
} from '@astro-bumpers/common';
import { Bot } from './bot.js';

interface Player {
  id: string;
  nickname: string;
  socket: Socket | null;
  device: 'host' | 'controller';
  color: string;
  emoji: string;
  connected: boolean;
  isBot: boolean;
  bot?: Bot;
  body?: Matter.Body;
  lives: number;
  kos: number;
  stars: number;
  lastInputSeq: number;
  currentInput: { steer: number; boost: boolean };
  powerup?: { type: string; ttl: number };
  boostCooldown: number;
  state: 'alive' | 'ko' | 'respawn' | 'dead';
  koTime?: number;
}

interface Pickup {
  id: string;
  x: number;
  y: number;
  type: string;
  body: Matter.Body;
}

export class GameRoom {
  private players: Map<string, Player> = new Map();
  private hostId: string | null = null;
  private engine: Matter.Engine;
  private world: Matter.World;
  private pickups: Pickup[] = [];
  private tickCount = 0;
  private tickInterval: NodeJS.Timeout | null = null;
  private snapshotCounter = 0;
  private snapshotInterval = 2; // Broadcast every N ticks
  private gameState: 'lobby' | 'countdown' | 'playing' | 'podium' = 'lobby';
  private countdownValue = 0;
  private roundStartTime = 0;
  private currentRound = 0;
  private events: GameEvent[] = [];
  
  constructor(
    public readonly roomCode: string,
    private namespace: Namespace,
    private mapId: MapId = 'launchpad',
    private modeId: ModeId = 'lastAlive'
  ) {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    });
    this.world = this.engine.world;
    
    this.setupMap();
    this.startTickLoop();
  }
  
  private setupMap(): void {
    const map = MAPS[this.mapId];
    
    // Create boundaries
    if (map.bounds.type === 'circle') {
      const segments = 64;
      const radius = map.bounds.r;
      const vertices: Matter.Vector[] = [];
      
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        vertices.push({
          x: map.bounds.cx + Math.cos(angle) * radius,
          y: map.bounds.cy + Math.sin(angle) * radius,
        });
      }
      
      const boundary = Matter.Bodies.fromVertices(map.bounds.cx, map.bounds.cy, [vertices], {
        isStatic: true,
        restitution: 0.8,
      });
      
      Matter.World.add(this.world, boundary);
    }
  }
  
  addPlayer(socket: Socket, id: string, nickname: string, device: 'host' | 'controller'): void {
    if (device === 'host') {
      this.hostId = id;
    }
    
    const colorIndex = this.players.size % COLORS.players.length;
    const emojiIndex = this.players.size % PLAYER_EMOJIS.length;
    
    this.players.set(id, {
      id,
      nickname,
      socket,
      device,
      color: COLORS.players[colorIndex],
      emoji: PLAYER_EMOJIS[emojiIndex],
      connected: true,
      isBot: false,
      lives: 3,
      kos: 0,
      stars: 0,
      lastInputSeq: -1,
      currentInput: { steer: 0, boost: false },
      boostCooldown: 0,
      state: 'alive',
    });
    
    this.broadcastRoomState();
  }
  
  handleInput(playerId: string, input: InputIntent): void {
    const player = this.players.get(playerId);
    if (!player || player.isBot) return;
    
    // Sequence check
    if (input.seq <= player.lastInputSeq) return;
    player.lastInputSeq = input.seq;
    
    // Clamp and validate
    player.currentInput = {
      steer: Math.max(-1, Math.min(1, input.steer)),
      boost: input.boost === 1,
    };
  }
  
  handleHostCommand(playerId: string, cmd: HostCommand): void {
    if (playerId !== this.hostId) return;
    
    switch (cmd.type) {
      case 'start':
        this.startGame();
        break;
      case 'rematch':
        this.rematch();
        break;
      case 'switchMap':
        if (cmd.data?.map) {
          this.mapId = cmd.data.map;
          this.setupMap();
          this.broadcastRoomState();
        }
        break;
      case 'switchMode':
        if (cmd.data?.mode) {
          this.modeId = cmd.data.mode;
          this.broadcastRoomState();
        }
        break;
    }
  }
  
  handlePong(playerId: string, clientTs: number): void {
    const player = this.players.get(playerId);
    if (player) {
      // Could track RTT here
    }
  }
  
  handleDisconnect(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    
    player.connected = false;
    
    if (player.device === 'controller' && this.gameState === 'playing') {
      // Convert to bot
      player.isBot = true;
      player.bot = new Bot(playerId);
      console.log(`Player ${playerId} disconnected, converted to bot`);
    } else if (player.device === 'host') {
      // Host disconnected - end game
      this.gameState = 'lobby';
    }
    
    this.broadcastRoomState();
  }
  
  private startGame(): void {
    if (this.gameState !== 'lobby') return;
    
    this.gameState = 'countdown';
    this.countdownValue = 3;
    this.currentRound = 1;
    
    // Add bots to fill slots if needed
    const activePlayers = Array.from(this.players.values()).filter(p => p.device === 'controller');
    const botsNeeded = Math.max(0, 4 - activePlayers.length);
    
    for (let i = 0; i < botsNeeded; i++) {
      const botId = `bot_${i}`;
      const colorIndex = this.players.size % COLORS.players.length;
      const emojiIndex = this.players.size % PLAYER_EMOJIS.length;
      
      const bot = new Bot(botId);
      
      this.players.set(botId, {
        id: botId,
        nickname: `Bot ${i + 1}`,
        socket: null,
        device: 'controller',
        color: COLORS.players[colorIndex],
        emoji: PLAYER_EMOJIS[emojiIndex],
        connected: true,
        isBot: true,
        bot,
        lives: 3,
        kos: 0,
        stars: 0,
        lastInputSeq: 0,
        currentInput: { steer: 0, boost: false },
        boostCooldown: 0,
        state: 'alive',
      });
    }
    
    this.spawnPlayers();
    this.broadcastRoomState();
    
    setTimeout(() => this.startRound(), 3000);
  }
  
  private startRound(): void {
    this.gameState = 'playing';
    this.roundStartTime = Date.now();
    
    this.events.push({
      type: 'ROUND_START',
      round: this.currentRound,
      mode: this.modeId,
      map: this.mapId,
    });
    
    this.broadcastRoomState();
  }
  
  private rematch(): void {
    this.currentRound = 0;
    this.gameState = 'lobby';
    
    // Reset player stats
    this.players.forEach(player => {
      player.lives = 3;
      player.kos = 0;
      player.stars = 0;
      player.state = 'alive';
    });
    
    this.broadcastRoomState();
  }
  
  private spawnPlayers(): void {
    const map = MAPS[this.mapId];
    const spawnPoints = [...map.spawnPoints];
    
    let spawnIndex = 0;
    this.players.forEach(player => {
      if (player.device !== 'controller') return;
      
      const spawn = spawnPoints[spawnIndex % spawnPoints.length];
      spawnIndex++;
      
      const body = Matter.Bodies.circle(spawn[0], spawn[1], PHYSICS.SHIP_RADIUS, {
        mass: PHYSICS.SHIP_MASS,
        restitution: PHYSICS.SHIP_RESTITUTION,
        frictionAir: PHYSICS.SHIP_FRICTION_AIR,
        label: player.id,
      });
      
      Matter.World.add(this.world, body);
      player.body = body;
      player.state = 'alive';
    });
  }
  
  private startTickLoop(): void {
    let acc = 0;
    let last = Date.now();
    
    this.tickInterval = setInterval(() => {
      const now = Date.now();
      acc += now - last;
      last = now;
      
      while (acc >= PHYSICS.FIXED_DT) {
        this.tick();
        acc -= PHYSICS.FIXED_DT;
      }
    }, 4);
  }
  
  private tick(): void {
    this.tickCount++;
    
    if (this.gameState === 'playing') {
      this.updatePhysics();
      this.updateBots();
      this.checkKOs();
      this.updatePowerups();
      this.updatePickups();
      this.checkRoundEnd();
    }
    
    // Broadcast snapshot
    this.snapshotCounter++;
    if (this.snapshotCounter >= this.snapshotInterval) {
      this.broadcastSnapshot();
      this.snapshotCounter = 0;
    }
  }
  
  private updatePhysics(): void {
    this.players.forEach(player => {
      if (!player.body || player.state !== 'alive') return;
      
      // Apply steering
      const torque = player.currentInput.steer * PHYSICS.STEERING_TORQUE * player.body.mass;
      Matter.Body.setAngularVelocity(player.body, player.body.angularVelocity + torque);
      
      // Apply thrust
      const thrust = PHYSICS.BASE_THRUST * player.body.mass;
      const forceX = Math.cos(player.body.angle) * thrust;
      const forceY = Math.sin(player.body.angle) * thrust;
      Matter.Body.applyForce(player.body, player.body.position, { x: forceX, y: forceY });
      
      // Apply boost
      if (player.currentInput.boost && player.boostCooldown <= 0) {
        const boostForceX = Math.cos(player.body.angle) * PHYSICS.BOOST_IMPULSE;
        const boostForceY = Math.sin(player.body.angle) * PHYSICS.BOOST_IMPULSE;
        Matter.Body.applyForce(player.body, player.body.position, { 
          x: boostForceX / 1000, 
          y: boostForceY / 1000 
        });
        player.boostCooldown = PHYSICS.BOOST_COOLDOWN;
      }
      
      // Update cooldowns
      if (player.boostCooldown > 0) {
        player.boostCooldown -= PHYSICS.FIXED_DT;
      }
    });
    
    Matter.Engine.update(this.engine, PHYSICS.FIXED_DT);
  }
  
  private updateBots(): void {
    this.players.forEach(player => {
      if (!player.isBot || !player.bot || !player.body) return;
      
      const input = player.bot.getInput(player.body, this.world, Array.from(this.players.values()));
      player.currentInput = input;
    });
  }
  
  private checkKOs(): void {
    const map = MAPS[this.mapId];
    if (map.bounds.type !== 'circle') return;
    
    this.players.forEach(player => {
      if (!player.body || player.state !== 'alive') return;
      
      const bounds = map.bounds;
      const dx = player.body.position.x - bounds.cx;
      const dy = player.body.position.y - bounds.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (bounds.type === 'circle' && dist > bounds.r + PHYSICS.KO_DISTANCE_THRESHOLD) {
        player.state = 'ko';
        player.lives--;
        player.koTime = Date.now();
        
        this.events.push({
          type: 'KO',
          by: null,
          victim: player.id,
          impulse: 0,
          t: Date.now(),
        });
        
        if (player.lives <= 0) {
          player.state = 'dead';
        }
        
        setTimeout(() => this.respawnPlayer(player.id), 2000);
      }
    });
  }
  
  private respawnPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player || player.state === 'dead') return;
    
    const map = MAPS[this.mapId];
    const spawn = map.spawnPoints[0];
    
    if (player.body) {
      Matter.Body.setPosition(player.body, { x: spawn[0], y: spawn[1] });
      Matter.Body.setVelocity(player.body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(player.body, 0);
    }
    
    player.state = 'alive';
  }
  
  private updatePowerups(): void {
    this.players.forEach(player => {
      if (player.powerup) {
        player.powerup.ttl -= PHYSICS.FIXED_DT;
        if (player.powerup.ttl <= 0) {
          player.powerup = undefined;
        }
      }
    });
  }
  
  private updatePickups(): void {
    // Check collisions with pickups
    this.players.forEach(player => {
      if (!player.body || player.state !== 'alive') return;
      
      this.pickups = this.pickups.filter(pickup => {
        const dx = player.body!.position.x - pickup.x;
        const dy = player.body!.position.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < PHYSICS.SHIP_RADIUS + 20) {
          // Pickup collected
          player.powerup = {
            type: pickup.type,
            ttl: (POWERUP_CONFIG as any)[pickup.type].duration,
          };
          
          this.events.push({
            type: 'PWR',
            player: player.id,
            pwr: pickup.type as any,
            ttl: player.powerup.ttl,
          });
          
          Matter.World.remove(this.world, pickup.body);
          return false;
        }
        return true;
      });
    });
  }
  
  private checkRoundEnd(): void {
    const elapsed = Date.now() - this.roundStartTime;
    
    if (elapsed > GAME.ROUND_DURATION) {
      this.endRound();
    }
    
    // Check win conditions
    const alivePlayers = Array.from(this.players.values()).filter(
      p => p.device === 'controller' && p.state === 'alive'
    );
    
    if (alivePlayers.length <= 1 && this.modeId === 'lastAlive') {
      this.endRound();
    }
  }
  
  private endRound(): void {
    this.gameState = 'podium';
    
    const scores = Array.from(this.players.values())
      .filter(p => p.device === 'controller')
      .map(p => ({ id: p.id, kos: p.kos, stars: p.stars, lives: p.lives }))
      .sort((a, b) => b.lives - a.lives || b.kos - a.kos || b.stars - a.stars);
    
    this.events.push({
      type: 'SCORE',
      table: scores,
    });
    
    this.events.push({
      type: 'ROUND_END',
      round: this.currentRound,
      winner: scores[0]?.id || null,
    });
    
    this.broadcastRoomState();
  }
  
  private broadcastSnapshot(): void {
    const snapshot: Snapshot = {
      tick: this.tickCount,
      t: Date.now(),
      players: Array.from(this.players.values())
        .filter(p => p.device === 'controller' && p.body)
        .map(p => ({
          id: p.id,
          x: p.body!.position.x,
          y: p.body!.position.y,
          a: p.body!.angle,
          vx: p.body!.velocity.x,
          vy: p.body!.velocity.y,
          state: p.state,
          lives: p.lives,
          pwr: p.powerup?.type as any,
          pwrTtl: p.powerup?.ttl,
          stars: p.stars,
        })),
      pickups: this.pickups.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        type: p.type as any,
      })),
      hazards: [],
      events: this.events.length > 0 ? [...this.events] : undefined,
    };
    
    this.namespace.to(this.roomCode).emit('state', snapshot);
    this.events = [];
  }
  
  private broadcastRoomState(): void {
    const summary = this.getRoomSummary();
    this.namespace.to(this.roomCode).emit('room:state', summary);
  }
  
  getRoomSummary(): RoomSummary {
    return {
      roomCode: this.roomCode,
      hostId: this.hostId,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        nickname: p.nickname,
        color: p.color,
        emoji: p.emoji,
        device: p.device,
        connected: p.connected,
        isBot: p.isBot,
      })),
      map: this.mapId,
      mode: this.modeId,
      state: this.gameState,
      countdown: this.gameState === 'countdown' ? this.countdownValue : undefined,
    };
  }
  
  isEmpty(): boolean {
    return Array.from(this.players.values()).every(p => !p.connected);
  }
  
  destroy(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }
}
