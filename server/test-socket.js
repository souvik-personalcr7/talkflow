import { io } from 'socket.io-client';
import http from 'http';
import { parse } from 'cookie';

// Mock test for sockets
async function run() {
  const login = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const cookies = res.headers.get('set-cookie');
    const data = await res.json();
    return { token: cookies, user: data.data.user };
  };

  const souvik = await login('souvik@example.com', 'password123'); // assuming these exist, I'll just check the DB logic manually if this fails.
  console.log("Logged in Souvik");
}
run();
