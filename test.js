const io = require('socket.io-client');

const serverUrl = 'http://localhost:5000';

// Test single login enforcement
async function testSingleLogin() {
  console.log('Testing single login enforcement...');

  const socket1 = io(serverUrl);
  const socket2 = io(serverUrl);

  socket1.on('connect', () => {
    console.log('Socket1 connected');
    socket1.emit('join', '1234567890');
  });

  socket2.on('connect', () => {
    console.log('Socket2 connected');
    socket2.emit('join', '1234567890'); // Same phone
  });

  socket2.on('loginError', (msg) => {
    console.log('Login error for socket2:', msg);
  });

  socket1.on('disconnect', () => console.log('Socket1 disconnected'));
  socket2.on('disconnect', () => console.log('Socket2 disconnected'));

  // Wait a bit
  setTimeout(() => {
    socket1.disconnect();
    socket2.disconnect();
  }, 2000);
}

// Test messaging
async function testMessaging() {
  console.log('Testing messaging...');

  const socket1 = io(serverUrl);
  const socket2 = io(serverUrl);

  socket1.on('connect', () => {
    console.log('Socket1 connected');
    socket1.emit('join', '1111111111');
  });

  socket2.on('connect', () => {
    console.log('Socket2 connected');
    socket2.emit('join', '2222222222');
  });

  socket1.on('messageSent', (data) => {
    console.log('Message sent from socket1:', data);
  });

  socket2.on('receiveMessage', (data) => {
    console.log('Message received by socket2:', data);
  });

  // Send message after join
  setTimeout(() => {
    socket1.emit('sendMessage', { sender: '1111111111', receiver: '2222222222', text: 'Hello from 1111' });
  }, 1000);

  // Wait and disconnect
  setTimeout(() => {
    socket1.disconnect();
    socket2.disconnect();
  }, 3000);
}

// Test fetching chats
async function testFetchChats() {
  console.log('Testing fetch chats...');
  const response = await fetch('http://localhost:5000/chats/1111111111');
  const chats = await response.json();
  console.log('Chats for 1111111111:', chats);
}

// Run tests
testSingleLogin().then(() => {
  setTimeout(() => {
    testMessaging().then(() => {
      setTimeout(() => {
        testFetchChats();
      }, 4000);
    });
  }, 3000);
});
