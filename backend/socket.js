const { Server } = require('socket.io');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('showtime:join', ({ showtimeId }) => {
      if (!showtimeId) return;
      socket.join(`showtime:${showtimeId}`);
    });

    socket.on('showtime:leave', ({ showtimeId }) => {
      if (!showtimeId) return;
      socket.leave(`showtime:${showtimeId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };

