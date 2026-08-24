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
    handleGeminiError(error, res);
  }
};

const handleGeminiError = (error: any, res: Response) => {
  console.error('AI Controller Error:', error);
  
  if (res.headersSent) {
    res.end();
    return;
  }

  let status = 500;
  let errorMessage = 'Sorry, I couldn\'t get a response right now. Please try again.';

  if (error.message) {
    if (error.message.includes('400')) {
      status = 400;
      errorMessage = 'Invalid request parameters.';
    } else if (error.message.includes('401')) {
      status = 401;
      errorMessage = 'Invalid or missing API key.';
    } else if (error.message.includes('403')) {
      status = 403;
      errorMessage = 'Permission denied to access this model.';
    } else if (error.message.includes('404')) {
      status = 404;
      errorMessage = 'AI model not found or unavailable.';
    } else if (error.message.includes('429')) {
      status = 429;
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.message.includes('503') || error.status === 503) {
      status = 503;
      errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
    } else if (error.message.includes('500')) {
      status = 502;
      errorMessage = 'The AI service encountered an internal error.';
    }
  }

  res.status(status).json({
    success: false,
    error: errorMessage
  });
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

    console.log(`[AI STREAM] Model requested, key configured: ${!!process.env.GEMINI_API_KEY}`);
    const stream = await generateAIResponseStream(message, context || []);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    req.on('close', () => {
      console.log('Client disconnected during stream.');
      res.end();
    });

    for await (const chunk of stream) {
      if (res.writableEnded) break;
      res.write(chunk.text());
    }

    console.log('Stream finished.');
    res.end();

  } catch (error: any) {
    handleGeminiError(error, res);
  }
};
