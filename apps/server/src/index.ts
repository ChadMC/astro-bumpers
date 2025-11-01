import { Server } from 'socket.io';
import { createServer } from 'http';
import { config } from 'dotenv';
import { RoomManager } from './room-manager.js';

config();

const PORT = parseInt(process.env.PORT || '8787', 10);
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(',');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
});

const roomManager = new RoomManager(io);

const gameNamespace = io.of('/game');

gameNamespace.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('room:create', (data, callback) => {
    try {
      const room = roomManager.createRoom(data);
      callback({ success: true, room });
    } catch (error) {
      callback({ success: false, error: (error as Error).message });
    }
  });
  
  socket.on('room:join', (data, callback) => {
    try {
      const welcome = roomManager.joinRoom(socket, data);
      callback({ success: true, welcome });
    } catch (error) {
      callback({ success: false, error: (error as Error).message });
    }
  });
  
  socket.on('input', (data) => {
    roomManager.handleInput(socket.id, data);
  });
  
  socket.on('host:command', (data) => {
    roomManager.handleHostCommand(socket.id, data);
  });
  
  socket.on('pong', (data) => {
    roomManager.handlePong(socket.id, data);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`✓ Server listening on port ${PORT}`);
  console.log(`✓ CORS origins: ${CORS_ORIGIN.join(', ')}`);
});
