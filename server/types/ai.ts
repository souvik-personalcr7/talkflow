export interface AIChatRequest {
  message: string;
  context?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AIChatResponse {
  success: boolean;
  reply?: string;
  error?: string;
}

export interface AIServiceResult {
  reply?: string;
  error?: string;
}
