import { io, Socket } from 'socket.io-client';
import type { Snapshot, RoomSummary } from '@astro-bumpers/common';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787/game';

class ControllerApp {
  private socket: Socket | null = null;
  private playerId: string = '';
  private inputSeq = 0;
  private currentInput = { steer: 0, boost: 0 };
  
  private connectScreen!: HTMLElement;
  private controlScreen!: HTMLElement;
  private nicknameInput!: HTMLInputElement;
  private roomInput!: HTMLInputElement;
  private joinBtn!: HTMLElement;
  private errorMsg!: HTMLElement;
  private leftBtn!: HTMLElement;
  private rightBtn!: HTMLElement;
  private boostBtn!: HTMLElement;
  private livesDisplay!: HTMLElement;
  
  constructor() {
    this.init();
  }
  
  private init() {
    // Get DOM elements
    this.connectScreen = document.getElementById('connect-screen')!;
    this.controlScreen = document.getElementById('control-screen')!;
    this.nicknameInput = document.getElementById('nickname-input') as HTMLInputElement;
    this.roomInput = document.getElementById('room-input') as HTMLInputElement;
    this.joinBtn = document.getElementById('join-btn')!;
    this.errorMsg = document.getElementById('error-msg')!;
    this.leftBtn = document.getElementById('left-btn')!;
    this.rightBtn = document.getElementById('right-btn')!;
    this.boostBtn = document.getElementById('boost-btn')!;
    this.livesDisplay = document.getElementById('lives')!;
    
    // Check for room code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
      this.roomInput.value = roomCode;
    }
    
    // Setup event listeners
    this.joinBtn.addEventListener('click', () => this.join());
    
    // Setup control listeners
    this.setupControls();
    
    // Start input loop
    setInterval(() => this.sendInput(), 50); // 20 Hz
  }
  
  private setupControls() {
    // Left button
    this.leftBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.currentInput.steer = -1;
      this.leftBtn.classList.add('active');
      this.vibrate(25);
    });
    
    this.leftBtn.addEventListener('pointerup', () => {
      this.currentInput.steer = 0;
      this.leftBtn.classList.remove('active');
    });
    
    this.leftBtn.addEventListener('pointerleave', () => {
      if (this.leftBtn.classList.contains('active')) {
        this.currentInput.steer = 0;
        this.leftBtn.classList.remove('active');
      }
    });
    
    // Right button
    this.rightBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.currentInput.steer = 1;
      this.rightBtn.classList.add('active');
      this.vibrate(25);
    });
    
    this.rightBtn.addEventListener('pointerup', () => {
      this.currentInput.steer = 0;
      this.rightBtn.classList.remove('active');
    });
    
    this.rightBtn.addEventListener('pointerleave', () => {
      if (this.rightBtn.classList.contains('active')) {
        this.currentInput.steer = 0;
        this.rightBtn.classList.remove('active');
      }
    });
    
    // Boost button
    this.boostBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.currentInput.boost = 1;
      this.boostBtn.classList.add('active');
      this.vibrate(50);
    });
    
    this.boostBtn.addEventListener('pointerup', () => {
      this.currentInput.boost = 0;
      this.boostBtn.classList.remove('active');
    });
    
    this.boostBtn.addEventListener('pointerleave', () => {
      if (this.boostBtn.classList.contains('active')) {
        this.currentInput.boost = 0;
        this.boostBtn.classList.remove('active');
      }
    });
  }
  
  private async join() {
    const nickname = this.nicknameInput.value.trim() || 'Player';
    const roomCode = this.roomInput.value.trim().toUpperCase();
    
    if (!roomCode || roomCode.length !== 4) {
      this.errorMsg.textContent = 'Please enter a valid 4-character room code';
      return;
    }
    
    try {
      this.errorMsg.textContent = 'Connecting...';
      
      this.socket = io(WS_URL, {
        transports: ['websocket'],
      });
      
      await new Promise<void>((resolve, reject) => {
        this.socket!.on('connect', resolve);
        this.socket!.on('connect_error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
      
      const response = await new Promise<any>((resolve) => {
        this.socket!.emit('room:join', {
          roomCode,
          nickname,
          device: 'controller',
        }, resolve);
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to join room');
      }
      
      this.playerId = response.welcome.playerId;
      
      // Setup socket listeners
      this.socket.on('state', (data: Snapshot) => this.onSnapshot(data));
      this.socket.on('room:state', (data: RoomSummary) => this.onRoomState(data));
      
      // Switch to control screen
      this.connectScreen.classList.add('hidden');
      this.controlScreen.classList.remove('hidden');
      
    } catch (error) {
      this.errorMsg.textContent = `Error: ${(error as Error).message}`;
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    }
  }
  
  private sendInput() {
    if (!this.socket || !this.playerId) return;
    
    this.socket.emit('input', {
      seq: this.inputSeq++,
      steer: this.currentInput.steer,
      boost: this.currentInput.boost,
      ts: Date.now(),
    });
  }
  
  private onSnapshot(snapshot: Snapshot) {
    const player = snapshot.players.find(p => p.id === this.playerId);
    if (!player) return;
    
    // Update lives display
    const hearts = '❤️'.repeat(Math.max(0, player.lives));
    this.livesDisplay.textContent = hearts || '💀';
    
    // Vibrate on KO
    if (snapshot.events) {
      snapshot.events.forEach(event => {
        if (event.type === 'KO' && event.victim === this.playerId) {
          this.vibrate([60, 30, 60]);
        }
      });
    }
  }
  
  private onRoomState(state: RoomSummary) {
    // Could update UI based on game state
  }
  
  private vibrate(pattern: number | number[]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}

// Initialize app
new ControllerApp();
