import React, { useState, useEffect, useRef } from 'react';
import { useAIChat, AIMessage } from '@/hooks/useAIChat';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { format } from 'date-fns';
import { ArrowLeft, Send, Square, RefreshCw, Copy, RotateCcw, Bot } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

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
    <div className="flex flex-col h-full max-h-full min-h-0 w-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200/80 dark:border-slate-800 transition-colors overflow-hidden relative">
      {/* Header */}
      <div className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center px-4 md:px-6 justify-between sticky top-0 z-10 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Bot size={20} />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">TalkFlow AI</h2>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  Assistant
                </span>
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {isGenerating ? 'Generating response...' : 'Online • Ready to assist'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && !isGenerating && (
            <button
              onClick={clearMessages}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4 relative"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Bot size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">TalkFlow AI Assistant</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
              Ask anything, summarize text, draft messages, or brainstorm ideas with real-time intelligence.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
              {[
                "How's your day going?", 
                "Tell me a fun fact or joke 😄", 
                "Help me draft a professional message", 
                "Summarize key trends in AI messaging"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(suggestion)}
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-700/60 transition-all text-left shadow-sm font-medium cursor-pointer"
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
                <div key={msg.id} className="flex w-full justify-end">
                  <div className="max-w-[78%] md:max-w-[65%] px-4 py-2.5 rounded-2xl bg-indigo-600 text-white rounded-br-xs shadow-sm">
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                    <div className="text-[10px] mt-1 text-right flex justify-end items-center space-x-1 text-indigo-200">
                      <span>{format(new Date(msg.createdAt), 'h:mm a')}</span>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={msg.id} className="flex w-full justify-start items-start gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-sm">
                    <Bot size={14} />
                  </div>
                  <div className="max-w-[85%] md:max-w-[75%]">
                    <div className={`px-4 py-3 rounded-2xl border text-slate-900 dark:text-slate-100 shadow-sm ${
                      msg.status === 'error' 
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 rounded-tl-xs' 
                        : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-800 rounded-tl-xs'
                    }`}>
                      {msg.status === 'error' ? (
                        <div className="text-sm font-medium text-rose-600 dark:text-rose-400">{msg.content}</div>
                      ) : (
                        <div className="text-sm leading-relaxed break-words prose dark:prose-invert max-w-none prose-p:text-slate-800 dark:prose-p:text-slate-200 prose-headings:text-slate-900 dark:prose-headings:text-white prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-800 dark:prose-li:text-slate-200">
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{msg.content}</ReactMarkdown>
                          {msg.status === 'streaming' && (
                            <span className="inline-block ml-1 w-1.5 h-3.5 bg-indigo-500 animate-pulse align-middle" />
                          )}
                        </div>
                      )}
                      
                      <div className="text-[11px] mt-2.5 flex justify-between items-center text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                        <div className="flex space-x-3">
                          {(msg.status === 'complete' || msg.status === 'aborted') && (
                            <>
                              <button 
                                onClick={() => copyToClipboard(msg.content)} 
                                className="flex items-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                              >
                                <Copy size={11} className="mr-1" /> Copy
                              </button>
                              {isLast && (
                                <button 
                                  onClick={regenerate} 
                                  className="flex items-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                                >
                                  <RefreshCw size={11} className="mr-1" /> Regenerate
                                </button>
                              )}
                            </>
                          )}
                          {msg.status === 'error' && isLast && (
                            <button 
                              onClick={() => {
                                const prevUserMsg = messages.slice().reverse().find(m => m.role === 'user');
                                if (prevUserMsg) retry(prevUserMsg.content);
                              }} 
                              className="flex items-center text-rose-500 hover:text-rose-600 transition-colors font-medium cursor-pointer"
                            >
                              <RotateCcw size={11} className="mr-1" /> Retry
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
          <div className="flex w-full justify-start items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <Bot size={14} />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white rounded-tl-xs shadow-sm flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Floating Stop Button during generation */}
      {isGenerating && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none z-20">
          <button
            onClick={stopGenerating}
            className="pointer-events-auto flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200 text-xs font-semibold px-4 py-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
          >
            <Square size={12} className="fill-slate-700 dark:fill-slate-300" />
            <span>Stop generating</span>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="sticky bottom-0 p-2 sm:p-3 md:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-3 md:pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200/80 dark:border-slate-800 shadow-sm z-20 flex-shrink-0 w-full">
        <div className="flex items-end space-x-1.5 sm:space-x-2 max-w-4xl mx-auto w-full min-w-0">
          <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask TalkFlow AI anything..."
              className="w-full min-w-0 max-h-32 min-h-[42px] sm:min-h-[44px] py-2.5 sm:py-3 px-3 sm:px-4 bg-transparent resize-none focus:outline-none text-sm text-black dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              rows={1}
              style={{ overflowY: 'auto' }}
              disabled={isGenerating}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isGenerating}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-500/20 cursor-pointer"
            aria-label="Send message"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
