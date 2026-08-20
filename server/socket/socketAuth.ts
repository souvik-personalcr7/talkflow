import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

// Extend Socket interface to include our custom user property
export interface AuthenticatedSocket extends Socket {
  user?: IUser;
}

export const socketAuth = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('Authentication error: No cookies'));
    }

    // Parse cookie string manually
    const cookies = cookieHeader.split(';').reduce((res: Record<string, string>, c: string) => {
      const [key, val] = c.trim().split('=').map(decodeURIComponent);
      res[key] = val;
      return res;
    }, {});
    
    const token = cookies.talkflow_token;

    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};
