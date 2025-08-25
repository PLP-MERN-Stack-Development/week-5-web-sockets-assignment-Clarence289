const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://192.168.0.203',
  'http://192.168.0.203:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
}));

app.use(express.json());

let messagesStore = [];

for (let i = 1; i <= 50; i++) {
  messagesStore.push({
    room: 'test',
    sender: 'User' + i,
    avatar: null,
    message: 'Test message ' + i,
    image: null,
    voice: null,
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    private: false
  });
}

// Get paginated messages for a room
app.get('/api/messages', (req, res) => {
  const { room, before } = req.query;
  if (!room) return res.status(400).json({ error: 'Room required' });

  let filtered = messagesStore.filter(
    m => m.room === room && !m.private
  );

  if (before) {
    filtered = filtered.filter(m => new Date(m.timestamp) < new Date(before));
  }

  filtered = filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const page = filtered.slice(-20);

  res.json(page);
});

// Search messages by text content in a room (case-insensitive)
app.get('/api/search', (req, res) => {
  const { room, q } = req.query;
  if (!room || !q) return res.status(400).json({ error: 'Room and query required' });

  const results = messagesStore
    .filter(m =>
      m.room === room &&
      !m.private &&
      (m.message && m.message.toLowerCase().includes(q.toLowerCase()))
    )
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json(results);
});

// --- Socket.io with namespace and rooms ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Use /chat namespace for chat optimization
const chatNamespace = io.of('/chat');

let users = {};
let nameToSocket = {};

chatNamespace.on('connection', (socket) => {
  console.log('✅ New client connected to /chat namespace');

  socket.on('user_join', ({ name, room, avatar }) => {
    users[socket.id] = { name, room, avatar, active: true };
    nameToSocket[name] = socket.id;
    socket.join(room);

    socket.to(room).emit('user_event', { type: 'join', user: name });

    const roomUsers = Object.values(users)
      .filter(u => u.room === room && u.active)
      .map(u => u.name);

    chatNamespace.to(room).emit('active_users', roomUsers);
  });

  socket.on('send_message', (data) => {
    const user = users[socket.id];
    const sender = user?.name || 'Anonymous';
    const room = data.room || user?.room;
    const avatar = user?.avatar || data.avatar || null;

    const messageData = {
      sender,
      room,
      avatar,
      message: data.message || '',
      image: data.image || null,
      voice: data.voice || null,
      timestamp: new Date().toISOString(),
      _clientId: data._clientId || null // Pass through clientId for ack
    };

    messagesStore.push({ ...messageData, private: false });

    chatNamespace.to(room).emit('receive_message', messageData);

    // Delivery acknowledgment to sender only
    if (data._clientId) {
      socket.emit('message_ack', { _clientId: data._clientId });
    }
  });

  socket.on('private_message', (data) => {
    const user = users[socket.id];
    const { sender, recipient, message, image, voice, _clientId } = data;
    const recipientSocketId = nameToSocket[recipient];
    const avatar = user?.avatar || data.avatar || null;

    const privateMessage = {
      sender,
      avatar,
      message,
      image,
      voice,
      timestamp: new Date().toISOString(),
      private: true,
      _clientId: _clientId || null
    };

    messagesStore.push({ ...privateMessage, room: user?.room });

    if (recipientSocketId) {
      chatNamespace.to(recipientSocketId).emit('receive_message', privateMessage);
    }

    socket.emit('receive_message', privateMessage);

    // Delivery acknowledgment to sender only
    if (_clientId) {
      socket.emit('message_ack', { _clientId });
    }
  });

  socket.on('typing', ({ username, room, isTyping }) => {
    socket.to(room).emit('typing', { username, isTyping });
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      user.active = false;
      socket.to(user.room).emit('user_event', { type: 'leave', user: user.name });

      const roomUsers = Object.values(users)
        .filter(u => u.room === user.room && u.active)
        .map(u => u.name);
      chatNamespace.to(user.room).emit('active_users', roomUsers);
      delete nameToSocket[user.name];
      delete users[socket.id];
    }
  });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://192.168.0.203:${PORT}`);
});