import { useState, useCallback, useRef, useEffect } from 'react';

export type AIMessageStatus = 'streaming' | 'complete' | 'error' | 'aborted';

export type AIMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  status?: AIMessageStatus;
};

export type RequestState = 'idle' | 'sending' | 'streaming' | 'completed' | 'error' | 'aborted';

export const useAIChat = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [requestState, setRequestState] = useState<RequestState>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const sendPrompt = useCallback(async (text: string, isRetry = false) => {
    if (!text.trim() || (requestState === 'sending' || requestState === 'streaming')) return;

    let userMsgId = Date.now().toString();
    
    if (!isRetry) {
      const userMsg: AIMessage = {
        id: userMsgId,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => {
        const newMsgs = [...prev, userMsg];
        // Enforce 20 message limit
        return newMsgs.length > 20 ? newMsgs.slice(newMsgs.length - 20) : newMsgs;
      });
    }

    const aiMsgId = (Date.now() + 1).toString();
    const newAiMsg: AIMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: 'streaming',
    };

    setMessages(prev => [...prev, newAiMsg]);
    setRequestState('sending');
    
    abortControllerRef.current = new AbortController();

    try {
      // Build context: remove current AI msg and the user msg we just added (if not retry) to get history.
      const msgsToSlice = setMessages.length > 20 ? 20 : setMessages.length;
      // We need the messages array up to the user's new message.
      const historyMsgs = isRetry ? messages : messages.slice(-19); // approx latest
      const context = historyMsgs.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          context: context.filter(m => m.content.trim() !== ''),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorData = 'An error occurred';
        try {
          const errJson = await response.json();
          errorData = errJson.error || errorData;
        } catch (e) {}
        throw new Error(errorData);
      }

      setRequestState('streaming');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          console.log('Received chunk:', chunk);
          
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMsgId) {
              return { ...msg, content: msg.content + chunk };
            }
            return msg;
          }));
        }
      }
      
      setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, status: 'complete' } : msg));
      setRequestState('completed');

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setRequestState('aborted');
        setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, status: 'aborted' } : msg));
      } else {
        console.error('AI Chat Error:', error);
        setRequestState('error');
        setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, status: 'error', content: msg.content || error.message || 'Sorry, I couldn\'t get a response right now.' } : msg));
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [messages, requestState]);

  const sendMessage = useCallback((text: string) => {
    sendPrompt(text, false);
  }, [sendPrompt]);

  const retry = useCallback((text: string) => {
    // Remove the errored message first
    setMessages(prev => prev.filter(m => m.status !== 'error' && m.status !== 'aborted'));
    sendPrompt(text, true);
  }, [sendPrompt]);

  const regenerate = useCallback(() => {
    if (messages.length < 2) return;
    
    // Find the last user message
    let lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove the last assistant message(s) after that user message
      const userIndex = messages.findIndex(m => m.id === lastUserMsg.id);
      setMessages(messages.slice(0, userIndex + 1));
      sendPrompt(lastUserMsg.content, true);
    }
  }, [messages, sendPrompt]);

  const stopGenerating = useCallback(() => {
    cleanup();
    setRequestState('aborted');
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.status === 'streaming') {
        return prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, status: 'aborted' } : msg);
      }
      return prev;
    });
  }, [cleanup]);

  const clearMessages = useCallback(() => {
    cleanup();
    setMessages([]);
    setRequestState('idle');
  }, [cleanup]);

  return { messages, requestState, sendMessage, stopGenerating, retry, regenerate, clearMessages };
};
