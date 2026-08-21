import { GoogleGenerativeAI } from '@google/generative-ai';

const systemInstruction = `You are TalkFlow AI, a helpful general-purpose AI assistant. 
Be helpful, concise, clear, friendly, and accurate. 
Do not claim to be a human. Do not pretend to be the user's friend or personal romantic partner. 
Keep responses appropriate for a general audience.`;

const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will not work.");
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    systemInstruction: systemInstruction,
  });
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const executeWithRetry = async <T>(
  operation: () => Promise<T>, 
  modelName: string, 
  maxRetries = 2
): Promise<T> => {
  const delays = [1000, 2500];
  let attempt = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      const is503 = error?.message?.includes('503') || error?.status === 503;
      
      if (!is503 || attempt >= maxRetries) {
        console.error(`[AI SERVICE] Final failure for model ${modelName}:`, error?.message || 'Unknown error');
        throw error;
      }
      
      console.log(`[AI SERVICE] HTTP 503. Retry attempt ${attempt + 1}/${maxRetries} for model ${modelName} in ${delays[attempt]}ms...`);
      await delay(delays[attempt]);
      attempt++;
    }
  }
};

export const generateAIResponse = async (message: string, context: {role: string, content: string}[] = []): Promise<string> => {
  const model = getModel();
  if (!model) {
    throw new Error("AI service is not configured properly (missing API key).");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  console.log(`[AI SERVICE] Non-streaming request | Model: ${modelName} | API Key configured: ${!!process.env.GEMINI_API_KEY}`);

  const history = context.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const chat = model.startChat({
    history: history,
  });

  try {
    const result = await executeWithRetry(() => chat.sendMessage(message), modelName);
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error?.message || error);
    throw error;
  }
};

export const generateAIResponseStream = async (message: string, context: {role: string, content: string}[] = []) => {
  const model = getModel();
  if (!model) {
    throw new Error("AI service is not configured properly (missing API key).");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  console.log(`[AI STREAM] Streaming request | Model: ${modelName} | API Key configured: ${!!process.env.GEMINI_API_KEY}`);

  const history = context.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const chat = model.startChat({
    history: history,
  });

  try {
    const result = await executeWithRetry(() => chat.sendMessageStream(message), modelName);
    return result.stream;
  } catch (error: any) {
    console.error("Gemini API Streaming Error:", error?.message || error);
    throw error;
  }
};
