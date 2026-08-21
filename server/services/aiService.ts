import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const systemInstruction = `You are TalkFlow AI, a helpful general-purpose AI assistant. 
Be helpful, concise, clear, friendly, and accurate. 
Do not claim to be a human. Do not pretend to be the user's friend or personal romantic partner. 
Keep responses appropriate for a general audience.`;

const model = genAI ? genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  systemInstruction: systemInstruction,
}) : null;

export const generateAIResponse = async (message: string, context: {role: string, content: string}[] = []): Promise<string> => {
  if (!genAI || !model) {
    throw new Error("AI service is not configured properly (missing API key).");
  }

  try {
    const history = context.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from AI.");
  }
};

export const generateAIResponseStream = async (message: string, context: {role: string, content: string}[] = []) => {
  if (!genAI || !model) {
    throw new Error("AI service is not configured properly (missing API key).");
  }

  try {
    const history = context.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessageStream(message);
    return result.stream;
  } catch (error) {
    console.error("Gemini API Streaming Error:", error);
    throw new Error("Failed to get streaming response from AI.");
  }
};
