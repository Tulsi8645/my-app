'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function MCPTestPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hello! I can help you check attendance. Try asking:\n\n• "Who is present today?"\n• "Show me attendance stats"\n• "Get attendance history"',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/mcp/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: input }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || 'Sorry, I encountered an error.',
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Error: Could not connect to AI server.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col h-[85vh] overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 flex items-center gap-4 shadow-sm z-10">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            Attendance AI <Sparkles className="w-4 h-4 text-yellow-300" />
                        </h1>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 border border-teal-200">
                                    <Bot className="w-5 h-5 text-teal-600" />
                                </div>
                            )}

                            <div
                                className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${message.role === 'user'
                                    ? 'bg-teal-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap font-normal">{message.content}</p>
                                <p className={`text-[10px] mt-2 font-medium ${message.role === 'user' ? 'text-teal-100' : 'text-slate-400'
                                    }`}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {message.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4 justify-start animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 border border-teal-200">
                                <Bot className="w-5 h-5 text-teal-600" />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm w-32 flex items-center gap-3">
                                <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                                <span className="text-xs text-slate-400 font-medium">Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white p-4 border-t border-slate-100">
                    <form
                        onSubmit={handleSubmit}
                        className="flex gap-3 items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-300 transition-all"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-transparent border-none px-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none text-sm font-medium"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl p-3 transition-colors shadow-sm"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
                        AI can check history, stats, and live status.
                    </p>
                </div>
            </div>
        </div>
    );
}
