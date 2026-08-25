import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?._id;
    const { otherUserId } = req.params;

    if (!currentUserId || !otherUserId) {
      res.status(400).json({ success: false, message: 'Missing user ID' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(otherUserId as string)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    // Verify other user exists
    const otherUser = await User.findById(otherUserId as string);
    if (!otherUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Find the private conversation between these two users
    const conversation = await Conversation.findOne({
      type: 'private',
      $and: [
        { participants: { $size: 2 } },
        { participants: { $all: [currentUserId, new mongoose.Types.ObjectId(otherUserId as string)] } }
      ]
    });

    if (!conversation) {
      // If no conversation exists, return empty array rather than error
      res.status(200).json({
        success: true,
        data: {
          messages: []
        }
      });
      return;
    }

    // Fetch messages for this conversation
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(500); // Limit to prevent massive payloads

    // Format to match the client's expected Message interface
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      text: msg.text,
      senderType: msg.senderType,
      messageType: msg.messageType,
      imageUrl: msg.imageUrl,
      attachment: msg.attachment,
      contact: msg.contact,
      isSeen: msg.isSeen,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        messages: formattedMessages
      }
    });
  } catch (error: any) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
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

    // Upload image via stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'talkflow_messages',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          res.status(500).json({ success: false, message: 'Image upload failed' });
          return;
        }

        if (result) {
          res.status(200).json({
            success: true,
            data: {
              url: result.secure_url,
              publicId: result.public_id,
            }
          });
        }
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Error uploading message image:', error);
    res.status(500).json({ success: false, message: 'Server error uploading image' });
  }
};

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }

    // Upload generic file via stream with resource_type: 'auto'
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'talkflow_messages_files',
        resource_type: 'auto',
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          res.status(500).json({ success: false, message: 'File upload failed' });
          return;
        }

        if (result) {
          res.status(200).json({
            success: true,
            data: {
              url: result.secure_url,
              publicId: result.public_id,
              name: req.file?.originalname || 'file',
              size: req.file?.size || 0,
              mimeType: req.file?.mimetype || 'application/octet-stream',
            }
          });
        }
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Error uploading message file:', error);
    res.status(500).json({ success: false, message: 'Server error uploading file' });
  }
};
