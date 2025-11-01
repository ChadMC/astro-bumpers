import { Server as IOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { GameRoom } from './game-room.js';
import type { JoinReq, Welcome, HostCommand, InputIntent, MapId, ModeId } from '@astro-bumpers/common';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private socketToPlayer: Map<string, string> = new Map();
  
  constructor(private io: IOServer) {}
  
  createRoom(data: { public?: boolean; map?: MapId; mode?: ModeId }): { roomCode: string } {
    const roomCode = this.generateRoomCode();
    const room = new GameRoom(roomCode, this.io.of('/game'), data.map, data.mode);
    this.rooms.set(roomCode, room);
    
    console.log(`Room created: ${roomCode}`);
    return { roomCode };
  }
  
  joinRoom(socket: Socket, data: JoinReq): Welcome {
    const room = this.rooms.get(data.roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Sanitize nickname
    const nickname = data.nickname.trim().substring(0, 20) || 'Player';
    
    const playerId = uuidv4();
    const token = jwt.sign({ playerId, roomCode: data.roomCode }, JWT_SECRET, {
      expiresIn: '24h',
    });
    
    room.addPlayer(socket, playerId, nickname, data.device);
    
    this.socketToRoom.set(socket.id, data.roomCode);
    this.socketToPlayer.set(socket.id, playerId);
    
    socket.join(data.roomCode);
    
    const welcome: Welcome = {
      playerId,
      roomState: room.getRoomSummary(),
      jwt: token,
    };
    
    console.log(`Player ${playerId} (${nickname}) joined room ${data.roomCode} as ${data.device}`);
    
    return welcome;
  }
  
  handleInput(socketId: string, data: InputIntent): void {
    const roomCode = this.socketToRoom.get(socketId);
    const playerId = this.socketToPlayer.get(socketId);
    
    if (!roomCode || !playerId) return;
    
    const room = this.rooms.get(roomCode);
    if (room) {
      room.handleInput(playerId, data);
    }
  }
  
  handleHostCommand(socketId: string, data: HostCommand): void {
    const roomCode = this.socketToRoom.get(socketId);
    const playerId = this.socketToPlayer.get(socketId);
    
    if (!roomCode || !playerId) return;
    
    const room = this.rooms.get(roomCode);
    if (room) {
      room.handleHostCommand(playerId, data);
    }
  }
  
  handlePong(socketId: string, data: { ts: number }): void {
    const roomCode = this.socketToRoom.get(socketId);
    const playerId = this.socketToPlayer.get(socketId);
    
    if (!roomCode || !playerId) return;
    
    const room = this.rooms.get(roomCode);
    if (room) {
      room.handlePong(playerId, data.ts);
    }
  }
  
  handleDisconnect(socketId: string): void {
    const roomCode = this.socketToRoom.get(socketId);
    const playerId = this.socketToPlayer.get(socketId);
    
    if (roomCode && playerId) {
      const room = this.rooms.get(roomCode);
      if (room) {
        room.handleDisconnect(playerId);
        
        // Clean up empty rooms
        if (room.isEmpty()) {
          room.destroy();
          this.rooms.delete(roomCode);
          console.log(`Room ${roomCode} destroyed (empty)`);
        }
      }
    }
    
    this.socketToRoom.delete(socketId);
    this.socketToPlayer.delete(socketId);
  }
  
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure uniqueness
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    
    return code;
  }
}
