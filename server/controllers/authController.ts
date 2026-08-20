import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    if (!name || !username || !email || !password || !confirmPassword) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Passwords do not match' });
      return;
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400).json({ success: false, message: 'Email is already taken' });
      return;
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      res.status(400).json({ success: false, message: 'Username is already taken' });
      return;
    }

    const user = await User.create({
      name,
      username,
      email,
      password,
      isOnline: true, // Auto login
    });

    const token = generateToken(user._id as string);

    res.cookie('talkflow_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userObj = user.toJSON();
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: { id: userObj._id, name: userObj.name, username: userObj.username, email: userObj.email } },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id as string);

    res.cookie('talkflow_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userObj = user.toJSON();
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: { id: userObj._id, name: userObj.name, username: userObj.username, email: userObj.email, profileImage: userObj.profileImage } },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user) {
      req.user.isOnline = false;
      req.user.lastSeen = new Date();
      await req.user.save();
    }
    
    res.cookie('talkflow_token', '', {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userObj = req.user!.toJSON();
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: userObj._id,
          name: userObj.name,
          username: userObj.username,
          email: userObj.email,
          profileImage: userObj.profileImage,
          isOnline: userObj.isOnline,
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
