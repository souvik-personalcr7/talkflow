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

import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailService';
import bcrypt from 'bcrypt';

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    // Standard response to avoid email enumeration
    const genericResponse = { success: true, message: 'If an account exists with this email, an OTP has been sent.' };
    
    const user = await User.findOne({ email });
    if (!user) {
      res.status(200).json(genericResponse);
      return;
    }

    // Cooldown check (60s)
    if (user.passwordResetOtpLastSentAt) {
      const timeSinceLastSent = Date.now() - user.passwordResetOtpLastSentAt.getTime();
      if (timeSinceLastSent < 60000) {
        res.status(429).json({ success: false, message: 'Please wait a minute before requesting another OTP.' });
        return;
      }
    }

    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = new Date();
    await user.save();

    await sendPasswordResetEmail(user.email, otp);

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpires) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    if (user.passwordResetOtpExpires < new Date()) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      return;
    }

    if (user.passwordResetOtpAttempts! >= 5) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpires = undefined;
      await user.save();
      res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
      return;
    }

    const isValid = await bcrypt.compare(otp, user.passwordResetOtpHash);
    
    if (!isValid) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      res.status(400).json({ success: false, message: 'Invalid OTP' });
      return;
    }

    // Generate a short-lived temporary token specifically for resetting password
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password_reset' }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '15m' }
    );

    res.status(200).json({ 
      success: true, 
      message: 'OTP verified successfully',
      data: { resetToken } 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resendResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      res.status(200).json({ success: true, message: 'OTP resent if account exists.' });
      return;
    }

    // Cooldown check (60s)
    if (user.passwordResetOtpLastSentAt) {
      const timeSinceLastSent = Date.now() - user.passwordResetOtpLastSentAt.getTime();
      if (timeSinceLastSent < 60000) {
        res.status(429).json({ success: false, message: 'Please wait a minute before requesting another OTP.' });
        return;
      }
    }

    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = new Date();
    await user.save();

    await sendPasswordResetEmail(user.email, otp);

    res.status(200).json({ success: true, message: 'OTP resent if account exists.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resetToken, newPassword } = req.body;
    
    if (!resetToken || !newPassword) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET as string);
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    if (decoded.purpose !== 'password_reset') {
      res.status(401).json({ success: false, message: 'Invalid token purpose' });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Hash and save new password
    // (Note: userSchema.pre('save') handles hashing if the password field is modified)
    user.password = newPassword;
    
    // Invalidate OTPs
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpAttempts = 0;
    
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
