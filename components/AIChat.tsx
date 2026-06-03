
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, X } from 'lucide-react';
import { getChatResponse } from '../services/geminiService';
import { TranslationStructure } from '../types';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface AIChatProps {
    onClose: () => void;
    t: TranslationStructure;
    isRTL: boolean;
    logoUrl: string;
}

const AIChat: React.FC<AIChatProps> = ({ onClose, t, isRTL, logoUrl }) => {
    // Initialized with a default welcome message from translations
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: t.aiChatWelcome }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    // Reset welcome message if language changes
    useEffect(() => {
        if (messages.length === 1 && messages[0].role === 'model') {
            setMessages([{ role: 'model', text: t.aiChatWelcome }]);
        }
    }, [t]);

    const handleSend = async () => {
        if (input.trim() === '' || loading) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        
        const history = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        try {
            const responseText = await getChatResponse(history, input);
            const modelMessage: Message = { role: 'model', text: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error: any) {
            const errorMessage: Message = { role: 'model', text: error.message || 'Error interacting with AI.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col h-full relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-[#F5F9F5] dark:bg-gray-700/30">
                <div className="flex items-center gap-4">
                    {/* Increased Logo Size in Header */}
                    <div className="w-16 h-16 bg-white rounded-full p-2 shadow-md border-2 border-white overflow-hidden">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[#1A5D1A] dark:text-yade-gold">{t.aiChatTitle}</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {t.online}
                        </p>
                    </div>
                </div>
                <button type="button" onClick={(e) => { e.preventDefault(); onClose(); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 p-1.5 flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden text-center">
                                <img src={logoUrl} className="w-full h-full object-cover rounded-full" />
                            </div>
                        )}
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-6 shadow-sm ${msg.role === 'user' ? (isRTL ? 'bg-[#1A5D1A] text-white rounded-bl-none' : 'bg-[#1A5D1A] text-white rounded-br-none') : (isRTL ? 'bg-gray-50 border border-gray-100 dark:bg-gray-700 dark:border-gray-600 rounded-br-none text-gray-800 dark:text-gray-100' : 'bg-gray-50 border border-gray-100 dark:bg-gray-700 dark:border-gray-600 rounded-bl-none text-gray-800 dark:text-gray-100')}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 items-start justify-start">
                         <div className="w-10 h-10 rounded-full bg-white border border-gray-200 p-1.5 flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden">
                            <img src={logoUrl} className="w-full h-full object-cover rounded-full opacity-50" />
                         </div>
                         <div className={`p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center gap-2 ${isRTL ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                            <Loader2 size={16} className="animate-spin text-[#1A5D1A]"/>
                            <span className="text-xs text-gray-500 dark:text-gray-400">...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={t.typeMessage}
                        className={`w-full py-3.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-[#1A5D1A] outline-none shadow-sm transition-all ${isRTL ? 'pl-12 pr-4' : 'pl-4 pr-12'}`}
                    />
                    <button type="button" onClick={(e) => { e.preventDefault(); handleSend(); }} disabled={loading} className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1A5D1A] text-white rounded-xl flex items-center justify-center hover:bg-green-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md ${isRTL ? 'left-2' : 'right-2'}`}>
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={isRTL ? 'rotate-180' : ''} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChat;
