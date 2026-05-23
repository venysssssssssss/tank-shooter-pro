import { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;
let httpServer: HttpServer | null = null;

// Armazena o estado global do jogo (apenas posições simplificadas por agora)
const gameState = {
  players: {} as Record<string, any>
};

export function startServer(port: number, callback: () => void) {
  httpServer = createServer();
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    socket.emit('welcome', { message: 'Connected to Tank Shooter Pro Server' });
    
    gameState.players[socket.id] = { input: { up: false, left: false, shoot: false } };

    socket.on('playerInput', (input) => {
      if (gameState.players[socket.id]) {
        gameState.players[socket.id].input = input;
        
        // No momento, disparamos o stateUpdate imediatamente para teste.
        // Em um cenário real, haveria um tick-loop (ex: setInterval 30 FPS).
        io?.emit('stateUpdate', gameState);
      }
    });

    socket.on('disconnect', () => {
      delete gameState.players[socket.id];
    });
  });

  httpServer.listen(port, () => {
    callback();
  });
}

export function stopServer() {
  if (io) {
    io.close();
  }
  if (httpServer) {
    httpServer.close();
  }
}