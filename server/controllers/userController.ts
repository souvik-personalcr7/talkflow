import { Request, Response } from 'express';
import { User } from '../models/User';
import mongoose from 'mongoose';

// @route   GET /api/users
// @desc    Get all users except current logged in user
// @access  Private
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('-password -__v')
      .sort({ name: 1 });

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      username: user.username,
      profileImage: user.profileImage,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }));

    res.status(200).json({
      success: true,
      data: { users: formattedUsers }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

// @route   GET /api/users/search
// @desc    Search users by name or username
// @access  Private
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    const { q } = req.query;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (!q || typeof q !== 'string') {
      res.status(200).json({ success: true, data: { users: [] } });
      return;
    }

    const searchQuery = q.trim();

    if (searchQuery.length === 0) {
      res.status(200).json({ success: true, data: { users: [] } });
      return;
    }

    const regex = new RegExp(searchQuery, 'i');

    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        {
          $or: [
            { name: { $regex: regex } },
            { username: { $regex: regex } }
          ]
        }
      ]
    }).select('-password -__v').limit(20);

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      username: user.username,
      profileImage: user.profileImage,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }));

    res.status(200).json({
      success: true,
      data: { users: formattedUsers }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Server error searching users' });
  }
};

// @route   GET /api/users/:id
// @desc    Get user details by ID
// @access  Private
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(id).select('-password -__v');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          profileImage: user.profileImage,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
};
