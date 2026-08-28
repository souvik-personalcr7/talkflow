import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db';

dotenv.config();

// Connect to database
// NOTE: Commented out for now so the server doesn't crash on start without real credentials
connectDB();

const app = express();
app.set('trust proxy', 1); // Trust the reverse proxy (Render) to allow secure cookies
const server = http.createServer(app);

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import conversationRoutes from './routes/conversationRoutes';
import aiRoutes from './routes/aiRoutes';
import messageRoutes from './routes/messageRoutes';

// Configure CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow any origin that sends a request (useful for dev across network IPs)
    callback(null, true);
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', messageRoutes);

// Basic route to verify server is running
app.get('/', (req, res) => {
  res.send('TalkFlow API is running...');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

import { initializeSocket } from './socket';
import { errorHandler } from './middleware/errorHandler';

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    },
    credentials: true,
  },
});

initializeSocket(io);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
