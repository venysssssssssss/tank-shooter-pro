import { io, Socket } from 'socket.io-client';

export class NetworkManager {
  public onWelcome: ((message: string) => void) | null = null;
  public onStateUpdate: ((state: any) => void) | null = null;
  private url: string;
  private socket: Socket | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.socket = io(this.url);
    this.socket.on('welcome', (data) => {
      if (this.onWelcome) {
        this.onWelcome(data.message);
      }
    });

    this.socket.on('stateUpdate', (state) => {
      if (this.onStateUpdate) {
        this.onStateUpdate(state);
      }
    });
  }

  sendInput(input: any) {
    if (this.socket) {
      this.socket.emit('playerInput', input);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}