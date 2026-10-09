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

export const sanitizeHistory = (context: { role: string; content: string }[]) => {
  const validHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  for (const msg of context) {
    if (!msg.content || typeof msg.content !== 'string' || !msg.content.trim()) {
      continue;
    }
    const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';

    // Gemini API requires first turn to be 'user'
    if (validHistory.length === 0 && role !== 'user') {
      continue;
    }

    // Gemini API requires alternating turns; merge if consecutive same roles
    if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === role) {
      validHistory[validHistory.length - 1].parts[0].text += `\n\n${msg.content.trim()}`;
    } else {
      validHistory.push({
        role,
        parts: [{ text: msg.content.trim() }],
      });
    }
  }

  // Gemini API requires the last history message to be 'model' so that chat.sendMessage(userPrompt) is the next 'user' turn
  if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
    validHistory.pop();
  }

  return validHistory;
};

export const generateAIResponse = async (message: string, context: {role: string, content: string}[] = []): Promise<string> => {
  const model = getModel();
  if (!model) {
    throw new Error("AI service is not configured properly (missing API key).");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const history = sanitizeHistory(context);

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
  const history = sanitizeHistory(context);

  const chat = model.startChat({
    history: history,
  });

  try {
    const result = await executeWithRetry(() => chat.sendMessageStream(message), modelName);
    return { stream: result.stream, modelName };
  } catch (error: any) {
    console.error("Gemini API Streaming Error:", error?.message || error);
    throw error;
  }
};
