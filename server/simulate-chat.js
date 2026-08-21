const axios = require('axios');
const http = require('http');

async function run() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api' });
    const ts = Date.now();
    
    // 1. Register User A
    const resA = await api.post('/auth/register', {
      name: 'User A', username: `usera_${ts}`, email: `a_${ts}@test.com`, password: 'password', confirmPassword: 'password'
    });
    const cookieA = resA.headers['set-cookie'][0];
    const userA = resA.data.data.user;
    
    // 2. Register User B
    const resB = await api.post('/auth/register', {
      name: 'User B', username: `userb_${ts}`, email: `b_${ts}@test.com`, password: 'password', confirmPassword: 'password'
    });
    const cookieB = resB.headers['set-cookie'][0];
    const userB = resB.data.data.user;

    // 3. User A creates conversation with User B
    const convRes = await api.post('/conversations', { receiverId: userB.id }, { headers: { Cookie: cookieA } });
    
    // 4. Send message (via socket simulation or we can just connect socket client)
    // Actually, I can just see what the messages API returns. I need to send a message first.
    // I can't send via REST because there is no POST /api/messages. Messages are sent via Socket.io.
    
    // Let's just print the user object to confirm its structure.
    console.log("User A Structure:");
    console.log(JSON.stringify(userA, null, 2));

    // Connect socket client
    const { io } = require('socket.io-client');
    const socket = io('http://localhost:5000', {
      extraHeaders: { Cookie: cookieA }
    });
    
    socket.on('connect', () => {
      console.log('Socket A connected');
      socket.emit('message:send', {
        conversationId: convRes.data.data.conversation.id,
        receiverId: userB.id,
        text: 'Hello from A'
      });
    });

    socket.on('message:new', async (msg) => {
      console.log("Socket message received:");
      console.log(JSON.stringify(msg, null, 2));
      
      // Now fetch from REST API
      const msgsRes = await api.get(`/messages/${userB.id}`, { headers: { Cookie: cookieA } });
      console.log("REST API messages received:");
      console.log(JSON.stringify(msgsRes.data.data.messages, null, 2));
      
      process.exit(0);
    });

  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    process.exit(1);
  }
}
run();
