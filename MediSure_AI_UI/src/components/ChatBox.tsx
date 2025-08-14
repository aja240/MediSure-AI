import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, User, Bot, Copy, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';
import { pdfApi } from '../services/api';
import { useToast } from '../hooks/useToast';

interface ChatBoxProps {
  selectedPDF: string | null;
}

const EXAMPLE_QUESTIONS = [
  "What is the main topic of this document?",
  "Can you provide a summary of the key points?",
  "What are the main conclusions or findings?",
  "Who are the authors or key contributors mentioned?",
  "What methodology or approach is described?",
  "Are there any important dates or numbers mentioned?",
];

const ChatBox: React.FC<ChatBoxProps> = ({ selectedPDF }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !selectedPDF || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await pdfApi.askQuestion(selectedPDF, currentQuestion);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer || 'I apologize, but I couldn\'t find an answer to your question.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Ask question error:', err);
      error(err.message || 'Failed to get answer');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success('Copied to clipboard');
    } catch (err) {
      error('Failed to copy text');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInputValue('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <MessageCircle className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ask Questions</h2>
            <p className="text-sm text-gray-600">
              {selectedPDF ? `Chatting about: ${selectedPDF}` : 'Select a PDF to start chatting'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !selectedPDF && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Help!</h3>
            <p className="text-gray-600">Upload and select a PDF to start asking questions about it.</p>
          </div>
        )}

        {messages.length === 0 && selectedPDF && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Let's Explore Your PDF!</h3>
              <p className="text-gray-600">Ask me anything about <span className="font-medium text-purple-600">{selectedPDF}</span></p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Try these example questions:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {EXAMPLE_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(question)}
                    className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              flex max-w-[80%] space-x-3
              ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}
            `}>
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${message.type === 'user' ? 'bg-blue-600' : 'bg-purple-600'}
              `}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`
                flex-1 p-4 rounded-2xl
                ${message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
                }
              `}>
                <div className="group relative">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <button
                    onClick={() => copyToClipboard(message.content)}
                    className={`
                      absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                      p-1 rounded
                      ${message.type === 'user' 
                        ? 'hover:bg-blue-700' 
                        : 'hover:bg-gray-200'
                      }
                    `}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className={`
                  text-xs mt-2 opacity-70
                  ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}
                `}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              !selectedPDF 
                ? "Select a PDF first..." 
                : "Ask a question about the PDF..."
            }
            disabled={!selectedPDF || isLoading}
            className={`
              flex-1 px-4 py-3 border border-gray-300 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              transition-all duration-200
              ${!selectedPDF || isLoading 
                ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                : 'hover:border-gray-400'
              }
            `}
          />
          <button
            type="submit"
            disabled={!selectedPDF || !inputValue.trim() || isLoading}
            className={`
              px-6 py-3 rounded-xl font-medium transition-all duration-200
              flex items-center space-x-2
              ${!selectedPDF || !inputValue.trim() || isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 active:transform active:scale-95'
              }
            `}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Asking...' : 'Ask'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;