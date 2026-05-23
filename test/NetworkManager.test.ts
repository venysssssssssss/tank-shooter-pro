import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NetworkManager } from '../src/NetworkManager';
import { startServer, stopServer } from '../server/server';

describe('NetworkManager', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      startServer(3002, () => resolve());
    });
  });

  afterAll(() => {
    stopServer();
  });

  it('should connect to the server and trigger onWelcome callback', () => {
    return new Promise<void>((resolve) => {
      const networkManager = new NetworkManager('http://localhost:3002');
      networkManager.onWelcome = (message) => {
        expect(message).toBe('Connected to Tank Shooter Pro Server');
        networkManager.disconnect();
        resolve();
      };
      networkManager.connect();
    });
  });

  it('should send input and receive stateUpdate', () => {
    return new Promise<void>((resolve) => {
      const networkManager = new NetworkManager('http://localhost:3002');

      networkManager.onStateUpdate = (state: any) => {
        expect(state.players).toBeDefined();
        networkManager.disconnect();
        resolve();
      };

      networkManager.onWelcome = () => {
        networkManager.sendInput({ up: true, left: false, shoot: false });
      };

      networkManager.connect();
    });
  });
});