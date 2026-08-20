import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import '../types/express.d'; // Ensure types are loaded

interface JwtPayload {
  userId: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.talkflow_token;

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found, please login again' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed, invalid token' });
  }
};
