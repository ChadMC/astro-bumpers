import { io, Socket } from 'socket.io-client';
import type { RoomSummary, Snapshot, Welcome } from '@astro-bumpers/common';

const WS_URL = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8787/game';

export class NetworkManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(WS_URL, {
        transports: ['websocket'],
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });
      
      this.socket.on('room:state', (data: RoomSummary) => {
        this.emit('room:state', data);
      });
      
      this.socket.on('state', (data: Snapshot) => {
        this.emit('state', data);
      });
      
      this.socket.on('event', (data: any) => {
        this.emit('event', data);
      });
      
      this.socket.on('error', (data: any) => {
        console.error('Server error:', data);
        this.emit('error', data);
      });
    });
  }
  
  createRoom(data?: { map?: string; mode?: string }): Promise<{ roomCode: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }
      
      this.socket.emit('room:create', data || {}, (response: any) => {
        if (response.success) {
          resolve(response.room);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
  
  joinRoom(roomCode: string, nickname: string): Promise<Welcome> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }
      
      this.socket.emit('room:join', {
        roomCode,
        nickname,
        device: 'host',
      }, (response: any) => {
        if (response.success) {
          resolve(response.welcome);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
  
  sendHostCommand(type: 'start' | 'rematch' | 'switchMap' | 'switchMode', data?: any): void {
    if (!this.socket) return;
    this.socket.emit('host:command', { type, data });
  }
  
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const network = new NetworkManager();
