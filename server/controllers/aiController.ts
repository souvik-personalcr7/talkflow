import { Request, Response } from 'express';
import { generateAIResponse, generateAIResponseStream } from '../services/aiService';
import { AIChatRequest, AIChatResponse } from '../types/ai';

export const handleAIChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body as AIChatRequest;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ success: false, error: 'Message is required and must be a non-empty string' });
      return;
    }

    if (message.length > 4000) {
      res.status(400).json({ success: false, error: 'Message is too long (max 4000 characters)' });
      return;
    }

    const reply = await generateAIResponse(message, context || []);

    res.status(200).json({
      success: true,
      reply
    });

  } catch (error: any) {
    console.error('AI Controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Sorry, I couldn\'t get a response right now. Please try again.'
    });
  }
};

export const handleAIChatStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body as AIChatRequest;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ success: false, error: 'Message is required and must be a non-empty string' });
      return;
    }

    if (message.length > 4000) {
      res.status(400).json({ success: false, error: 'Message is too long (max 4000 characters)' });
      return;
    }

    const stream = await generateAIResponseStream(message, context || []);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');

    req.on('close', () => {
      console.log('Client disconnected during stream.');
      res.end();
    });

    for await (const chunk of stream) {
      if (req.closed) break;
      res.write(chunk.text());
    }

    res.end();

  } catch (error: any) {
    console.error('AI Controller streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Sorry, I couldn\'t get a response right now. Please try again.'
      });
    } else {
      res.end();
    }
  }
};
