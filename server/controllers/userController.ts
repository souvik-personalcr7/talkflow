import { Request, Response } from 'express';
import { User } from '../models/User';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary';

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

// @route   POST /api/users/profile-picture
// @desc    Upload or update profile picture
// @access  Private
export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image provided' });
      return;
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Delete old image from cloudinary if exists
    if (user.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImagePublicId);
      } catch (err) {
        console.error('Error destroying old image in cloudinary:', err);
      }
    }

    // Upload new image via stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'talkflow_avatars',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          res.status(500).json({ success: false, message: 'Image upload failed' });
          return;
        }

        if (result) {
          user.profileImage = result.secure_url;
          user.profileImagePublicId = result.public_id;
          await user.save();

          res.status(200).json({
            success: true,
            data: {
              profilePicture: {
                url: user.profileImage,
                publicId: user.profileImagePublicId,
              }
            }
          });
        }
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, message: 'Server error uploading picture' });
  }
};

// @route   DELETE /api/users/profile-picture
// @desc    Remove profile picture
// @access  Private
export const removeProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImagePublicId);
      } catch (err) {
        console.error('Error destroying old image in cloudinary:', err);
      }
    }

    user.profileImage = '';
    user.profileImagePublicId = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ success: false, message: 'Server error removing picture' });
  }
};
