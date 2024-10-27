const { Server } = require('socket.io');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', 
    },
  });

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    socket.on('mensaje', (msg) => {
      console.log('Mensaje recibido:', msg);
      io.emit('mensaje', msg); 
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });

  return io;
};

module.exports = setupSocket;