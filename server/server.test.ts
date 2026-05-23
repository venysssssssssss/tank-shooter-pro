import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { startServer, stopServer } from './server';

describe('Multiplayer Server', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      startServer(3003, () => resolve());
    });
  });

  afterAll(() => {
    stopServer();
  });

  it('should allow a client to connect and receive a welcome message', () => {
    return new Promise<void>((resolve) => {
      const clientSocket = io('http://localhost:3003');
      clientSocket.on('welcome', (data) => {
        expect(data.message).toBe('Connected to Tank Shooter Pro Server');
        clientSocket.disconnect();
        resolve();
      });
    });
  });

  it('should receive playerInput and broadcast stateUpdate', () => {
    return new Promise<void>((resolve) => {
      const clientSocket1 = io('http://localhost:3003');
      
      clientSocket1.on('connect', () => {
        clientSocket1.emit('playerInput', { up: true, left: false, shoot: false });
      });

      clientSocket1.on('stateUpdate', (state) => {
        expect(state.players).toBeDefined();
        const player = state.players[clientSocket1.id];
        expect(player).toBeDefined();
        expect(player.input.up).toBe(true);
        clientSocket1.disconnect();
        resolve();
      });
    });
  });
});