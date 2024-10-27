const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const socketIo = require('socket.io');
const cors = require('cors');
const sequelize = require('./bd'); // Importar la conexión a la base de datos
const User = require('./user'); // Importar el modelo de usuario
require('dotenv').config();

// Inicializar la aplicación de Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Sincronizar el modelo con la base de datos
sequelize.sync()
  .then(() => console.log('Base de datos sincronizada'))
  .catch((err) => console.error('Error al sincronizar la base de datos:', err));

// Ruta de registro
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ msg: 'Username y password son requeridos' });
  }

  try {
    let user = await User.findOne({ where: { username } });
    if (user) return res.status(400).json({ msg: 'Usuario ya existe' });

    user = await User.create({
      username,
      password: await bcrypt.hash(password, 10),
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
  } catch (err) {
    console.error(err); // Imprime el error en la consola
    res.status(500).json({ msg: 'Error del servidor', error: err.message });
  }
});


// Ruta de login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
});

// Middleware de autenticación
function authMiddleware(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No hay token, autorización denegada' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token no válido' });
  }
}

// Rutas protegidas de ejemplo
app.get('/protected', authMiddleware, (req, res) => {
  res.send('Esta es una ruta protegida');
});

// Configuración de WebSockets
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

const path = require('path');

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Puerto del servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});


