import React, { useState, useEffect, useRef } from 'react';
import { useAIChat, AIMessage } from '@/hooks/useAIChat';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { format } from 'date-fns';
import { ArrowLeft, Send, Square, RefreshCw, Copy, RotateCcw, Bot } from 'lucide-react';

interface AIChatWindowProps {
  onBack: () => void;
}

export default function AIChatWindow({ onBack }: AIChatWindowProps) {
  const { messages, requestState, sendMessage, stopGenerating, retry, regenerate, clearMessages } = useAIChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [userIsScrolling, setUserIsScrolling] = useState(false);

  const isGenerating = requestState === 'sending' || requestState === 'streaming';

  const scrollToBottom = (force = false) => {
    if (!userIsScrolling || force) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setUserIsScrolling(!isNearBottom);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, requestState]);

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      stopGenerating();
    };
  }, [stopGenerating]);

  const handleSend = () => {
    if (inputText.trim() && !isGenerating) {
      sendMessage(inputText);
      setInputText('');
      setUserIsScrolling(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-slate-900 border-l border-gray-200 dark:border-gray-800 transition-colors">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 flex items-center px-4 justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="md:hidden mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-inner mr-3">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">TalkFlow AI</h2>
              <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                {isGenerating ? 'Generating...' : 'AI Assistant'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 relative"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center mb-4 shadow-sm border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400">
              <Bot size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">TalkFlow AI</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">How can I help you today? I'm your personal AI assistant.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
              {["What is React?", "Explain JWT", "Help me understand MongoDB", "Explain Socket.IO"].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(suggestion)}
                  className="px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-200 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-slate-700 transition-all text-left shadow-sm font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLast = index === messages.length - 1;
            
            if (isUser) {
              return (
                <div key={msg.id} className="flex w-full justify-end mb-4">
                  <div className="max-w-[75%] px-4 py-2.5 rounded-2xl bg-black dark:bg-indigo-600 text-white rounded-br-sm shadow-sm">
                    <p className="text-base leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                    <div className="text-xs mt-1 text-right flex justify-end items-center space-x-1 text-gray-400 dark:text-indigo-200">
                      <span>{format(new Date(msg.createdAt), 'h:mm a')}</span>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={msg.id} className="flex w-full justify-start mb-4">
                  <div className="max-w-[85%]">
                    <div className={`px-4 py-3 rounded-2xl border text-gray-900 dark:text-gray-100 shadow-sm ${
                      msg.status === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-bl-sm' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 rounded-bl-sm'
                    }`}>
                      {msg.status === 'error' ? (
                        <div className="text-base font-medium text-red-700 dark:text-red-400">{msg.content}</div>
                      ) : (
                        <div className="text-base leading-relaxed break-words prose dark:prose-invert max-w-none prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-li:text-gray-900 dark:prose-li:text-gray-100">
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{msg.content}</ReactMarkdown>
                          {msg.status === 'streaming' && (
                            <span className="inline-block ml-1 w-1.5 h-4 bg-gray-500 animate-pulse align-middle" />
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs mt-2 flex justify-between items-center text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2">
                        <div className="flex space-x-3">
                          {(msg.status === 'complete' || msg.status === 'aborted') && (
                            <>
                              <button onClick={() => copyToClipboard(msg.content)} className="flex items-center hover:text-gray-600 transition-colors">
                                <Copy size={12} className="mr-1" /> Copy
                              </button>
                              {isLast && (
                                <button onClick={regenerate} className="flex items-center hover:text-gray-600 transition-colors">
                                  <RefreshCw size={12} className="mr-1" /> Regenerate
                                </button>
                              )}
                            </>
                          )}
                          {msg.status === 'error' && isLast && (
                            <button onClick={() => {
                              // We need the last user message text to retry. 
                              // Since the retry logic inside hook does this based on last user msg, we can just call retry with empty string or modify retry.
                              // Our hook retry takes text. Let's pass the previous user's text.
                              const prevUserMsg = messages.slice().reverse().find(m => m.role === 'user');
                              if (prevUserMsg) retry(prevUserMsg.content);
                            }} className="flex items-center text-red-500 hover:text-red-700 transition-colors font-medium">
                              <RotateCcw size={12} className="mr-1" /> Retry
                            </button>
                          )}
                        </div>
                        <span>{format(new Date(msg.createdAt), 'h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          })
        )}
        
        {requestState === 'sending' && (
          <div className="flex w-full justify-start mb-4">
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 flex items-center gap-1"><Bot size={14} /> Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Floating Stop Button during generation */}
      {isGenerating && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none z-20">
          <button
            onClick={stopGenerating}
            className="pointer-events-auto flex items-center space-x-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Square size={14} className="fill-gray-700 dark:fill-gray-300" />
            <span>Stop generating</span>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 shadow-sm z-10 relative">
        <div className="flex items-end space-x-2 max-w-4xl mx-auto">
          <div className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask TalkFlow AI..."
              className="w-full max-h-32 min-h-[44px] py-3 px-4 bg-transparent resize-none focus:outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{ overflowY: 'auto' }}
              disabled={isGenerating}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isGenerating}
            className="h-11 w-11 rounded-full bg-black dark:bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 dark:hover:bg-indigo-700 transition-colors shadow-sm"
            aria-label="Send message"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-400">AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}
