import Phaser from 'phaser';
import QRCode from 'qrcode';
import { network } from '../network.js';
import type { RoomSummary } from '@astro-bumpers/common';

export class LobbyScene extends Phaser.Scene {
  private roomCode: string = '';
  private roomState: RoomSummary | null = null;
  private qrImage: Phaser.GameObjects.Image | null = null;
  private codeText: Phaser.GameObjects.Text | null = null;
  private playerTexts: Phaser.GameObjects.Text[] = [];
  private startButton: Phaser.GameObjects.Rectangle | null = null;
  private startButtonText: Phaser.GameObjects.Text | null = null;
  
  constructor() {
    super({ key: 'LobbyScene' });
  }
  
  async create() {
    // Background
    this.add.rectangle(960, 540, 1920, 1080, 0x0a0f1e);
    
    // Title
    this.add.text(960, 100, 'ASTRO BUMPERS', {
      fontSize: '96px',
      fontFamily: 'system-ui, sans-serif',
      color: '#58d7ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Connect and create room
    try {
      await network.connect();
      const room = await network.createRoom();
      this.roomCode = room.roomCode;
      
      await network.joinRoom(this.roomCode, 'Host');
      
      // Setup listeners
      network.on('room:state', this.onRoomState.bind(this));
      
      // Display room code
      this.codeText = this.add.text(960, 250, `Room Code: ${this.roomCode}`, {
        fontSize: '72px',
        fontFamily: 'system-ui, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      
      // Generate and display QR code
      await this.generateQR();
      
      // Instructions
      this.add.text(960, 700, 'Scan QR code or visit the controller URL\\nto join on your phone', {
        fontSize: '32px',
        fontFamily: 'system-ui, sans-serif',
        color: '#cccccc',
        align: 'center',
      }).setOrigin(0.5);
      
      // Player list title
      this.add.text(1400, 300, 'Players:', {
        fontSize: '48px',
        fontFamily: 'system-ui, sans-serif',
        color: '#ffffff',
      });
      
      // Start button
      this.startButton = this.add.rectangle(960, 950, 400, 100, 0x58d7ff)
        .setInteractive()
        .on('pointerdown', this.onStartGame.bind(this))
        .on('pointerover', () => this.startButton?.setFillStyle(0x70e9ff))
        .on('pointerout', () => this.startButton?.setFillStyle(0x58d7ff));
      
      this.startButtonText = this.add.text(960, 950, 'START GAME', {
        fontSize: '48px',
        fontFamily: 'system-ui, sans-serif',
        color: '#0a0f1e',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      
    } catch (error) {
      console.error('Failed to setup lobby:', error);
      this.add.text(960, 540, 'Failed to connect to server', {
        fontSize: '48px',
        fontFamily: 'system-ui, sans-serif',
        color: '#ff3b3b',
      }).setOrigin(0.5);
    }
  }
  
  private async generateQR() {
    const httpOrigin = import.meta.env.VITE_HTTP_ORIGIN || 'http://localhost:8787';
    const controllerUrl = `${httpOrigin.replace('8787', '5174')}/?room=${this.roomCode}`;
    
    try {
      const dataUrl = await QRCode.toDataURL(controllerUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#0a0f1e',
        },
      });
      
      // Load as texture
      const texture = this.textures.createCanvas('qr-code', 300, 300);
      const image = new Image();
      image.onload = () => {
        texture?.draw(0, 0, image);
        texture?.refresh();
        
        this.qrImage = this.add.image(500, 500, 'qr-code');
      };
      image.src = dataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  }
  
  private onRoomState(state: RoomSummary) {
    this.roomState = state;
    
    // Update player list
    this.playerTexts.forEach(text => text.destroy());
    this.playerTexts = [];
    
    const players = state.players.filter(p => p.device === 'controller');
    players.forEach((player, index) => {
      const text = this.add.text(
        1400,
        380 + index * 60,
        `${player.emoji} ${player.nickname} ${player.isBot ? '(BOT)' : ''}`,
        {
          fontSize: '36px',
          fontFamily: 'system-ui, sans-serif',
          color: player.color,
        }
      );
      this.playerTexts.push(text);
    });
    
    // Check if game state changed
    if (state.state === 'countdown' || state.state === 'playing') {
      this.scene.start('GameScene');
    }
  }
  
  private onStartGame() {
    network.sendHostCommand('start');
  }
}
