import Phaser from 'phaser';
import { network } from '../network.js';
import type { Snapshot, PlayerSnapshot, RoomSummary } from '@astro-bumpers/common';
import { COLORS } from '@astro-bumpers/common';
import { sfxHit, sfxKO, sfxBoost, startMusic } from '@astro-bumpers/synth';

export class GameScene extends Phaser.Scene {
  private ships: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private lastSnapshot: Snapshot | null = null;
  private audioContext: AudioContext | null = null;
  private musicControl: { stop: () => void } | null = null;
  
  constructor() {
    super({ key: 'GameScene' });
  }
  
  create() {
    // Background
    this.add.rectangle(960, 540, 1920, 1080, 0x0a0f1e);
    
    // Initialize audio
    this.audioContext = new AudioContext();
    this.musicControl = startMusic(this.audioContext);
    
    // Setup listeners
    network.on('state', this.onSnapshot.bind(this));
    network.on('room:state', this.onRoomState.bind(this));
    
    // Timer text
    this.add.text(960, 50, 'Round in progress...', {
      fontSize: '36px',
      fontFamily: 'system-ui, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
  }
  
  private onSnapshot(snapshot: Snapshot) {
    this.lastSnapshot = snapshot;
    
    // Play SFX for events
    if (snapshot.events && this.audioContext) {
      snapshot.events.forEach(event => {
        switch (event.type) {
          case 'KO':
            sfxKO(this.audioContext!);
            break;
          case 'PWR':
            break;
        }
      });
    }
  }
  
  private onRoomState(state: RoomSummary) {
    if (state.state === 'podium') {
      this.musicControl?.stop();
      this.scene.start('PodiumScene');
    }
  }
  
  update() {
    if (!this.lastSnapshot) return;
    
    // Update ship positions
    this.lastSnapshot.players.forEach(player => {
      let ship = this.ships.get(player.id);
      
      if (!ship) {
        ship = this.add.graphics();
        this.ships.set(player.id, ship);
      }
      
      ship.clear();
      ship.setPosition(960 + player.x, 540 + player.y);
      ship.setRotation(player.a);
      
      // Draw ship
      const color = Phaser.Display.Color.HexStringToColor('#58d7ff').color;
      ship.fillStyle(color);
      ship.fillCircle(0, -15, 15);
      ship.fillRect(-15, -15, 30, 30);
      ship.fillCircle(0, 15, 15);
      
      // Draw outline
      ship.lineStyle(3, 0xffffff);
      ship.strokeCircle(0, -15, 15);
      ship.strokeRect(-15, -15, 30, 30);
      ship.strokeCircle(0, 15, 15);
    });
    
    // Remove destroyed ships
    const activeIds = new Set(this.lastSnapshot.players.map(p => p.id));
    this.ships.forEach((ship, id) => {
      if (!activeIds.has(id)) {
        ship.destroy();
        this.ships.delete(id);
      }
    });
  }
  
  shutdown() {
    this.musicControl?.stop();
    super.shutdown();
  }
}
