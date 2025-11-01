const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize Firebase
const serviceAccount = require('./firebase-service-account.json'); // You'll need to add this file
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://chat-app-fa974-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

const db = admin.database();

// Track active users: phone -> socketId
const activeUsers = new Map();

// API Routes
app.post('/register', async (req, res) => {
  const { phone, name, password } = req.body;
  try {
    const userRef = db.ref(`users/${phone}`);
    const snapshot = await userRef.once('value');
    const user = snapshot.val();

    if (user) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    await userRef.set({ phone, name, password, role: 'user' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { phone, name, password } = req.body;
  try {
    const userRef = db.ref(`users/${phone}`);
    const snapshot = await userRef.once('value');
    const user = snapshot.val();

    if (!user) {
      return res.status(400).json({ error: 'User not found. Please register first.' });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    if (activeUsers.has(phone)) {
      return res.status(400).json({ error: 'User already logged in' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/chats/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    const messagesRef = db.ref('messages');
    const snapshot = await messagesRef.once('value');
    const allMessages = snapshot.val() || {};

    const chats = {};
    Object.values(allMessages).forEach(msg => {
      if (msg.sender === phone || msg.receiver === phone) {
        const other = msg.sender === phone ? msg.receiver : msg.sender;
        if (!chats[other]) chats[other] = [];
        chats[other].push({
          sender: msg.sender,
          text: msg.text,
          time: new Date(msg.time).toLocaleTimeString()
        });
      }
    });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin routes
app.get('/admin/users', async (req, res) => {
  try {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    const users = snapshot.val() || {};
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/users/:phone', async (req, res) => {
  const { phone } = req.params;
  const { name, password, role } = req.body;
  try {
    const userRef = db.ref(`users/${phone}`);
    await userRef.update({ name, password, role });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/users/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    const userRef = db.ref(`users/${phone}`);
    await userRef.remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/messages', async (req, res) => {
  try {
    const messagesRef = db.ref('messages');
    const snapshot = await messagesRef.once('value');
    const messages = snapshot.val() || {};
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  try {
    const messageRef = db.ref(`messages/${messageId}`);
    await messageRef.remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (phone) => {
    if (activeUsers.has(phone)) {
      socket.emit('loginError', 'User already logged in');
      socket.disconnect();
      return;
    }
    activeUsers.set(phone, socket.id);
    socket.join(phone);
    console.log(`User ${phone} joined`);
  });

  socket.on('sendMessage', async (data) => {
    const { sender, receiver, text } = data;
    const messageRef = db.ref('messages').push();
    const messageData = { sender, receiver, text, time: Date.now() };
    await messageRef.set(messageData);

    const msgData = {
      sender,
      text,
      time: new Date(messageData.time).toLocaleTimeString()
    };
    // Emit to receiver if online
    io.to(receiver).emit('receiveMessage', msgData);
    // Emit back to sender for consistency
    socket.emit('receiveMessage', msgData);
  });

  socket.on('disconnect', () => {
    for (let [phone, id] of activeUsers) {
      if (id === socket.id) {
        activeUsers.delete(phone);
        console.log(`User ${phone} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
