
import React, { useState } from 'react';
import { User, Lock, Loader2, Globe, Check, Quote } from 'lucide-react';
import { LanguageCode, TranslationStructure } from '../types';

interface LoginProps {
    onLogin: (user: any) => void;
    t: TranslationStructure;
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    groupedLanguages: { title: string, langs: { code: string, name: string, native: string }[] }[];
    logoUrl: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, t, language, setLanguage, groupedLanguages, logoUrl }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const isRTL = ['fa', 'ar', 'ku', 'bal'].includes(language);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate API call
        setTimeout(() => {
            if (username === 'admin' && password === '123') {
                onLogin({
                    name: t.admin,
                    role: 'ADMIN',
                    avatar: 'https://lh3.googleusercontent.com/d/18oO9ea3mBJBGQZYonKWxZ9VIxRZAIC8f'
                });
            } else {
                setError('نام کاربری یا کلمه عبور اشتباه است.');
                setLoading(false);
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1A5D1A] relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/islamic-pattern.png')]"></div>
            
            {/* Language Selector Top Right */}
            <div className="absolute top-6 right-6 z-20">
                <div className="relative">
                    <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setShowLangMenu(!showLangMenu); }} 
                        className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-white/20 transition-all shadow-lg"
                    >
                        <Globe size={20} />
                        <span className="font-bold uppercase text-sm">{language}</span>
                    </button>
                    
                    {showLangMenu && (
                         <div className={`absolute top-12 right-0 bg-white rounded-2xl shadow-2xl p-4 w-64 z-30 animate-fade-in-down origin-top max-h-[80vh] overflow-y-auto custom-scrollbar`}>
                            {groupedLanguages.map((group, idx) => (
                                <div key={idx} className="mb-4 last:mb-0">
                                    <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-2 px-2 tracking-wider text-right">{group.title}</h4>
                                    <div className="space-y-1">
                                        {group.langs.map((lang) => (
                                            <button 
                                                key={lang.code}
                                                onClick={() => { setLanguage(lang.code as LanguageCode); setShowLangMenu(false); }}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-right ${language === lang.code ? 'bg-[#1A5D1A]/10 text-[#1A5D1A] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <span>{lang.native}</span>
                                                {language === lang.code && <Check size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl w-full max-w-md z-10 transition-colors duration-300 border-4 border-white/20">
                <div className="text-center mb-8">
                    <div className="w-48 h-48 mx-auto mb-8 bg-white rounded-full p-3 shadow-2xl flex items-center justify-center relative border-4 border-[#D4AF37] group hover:scale-105 transition-transform duration-500 overflow-hidden">
                        <div className="absolute inset-[-8px] rounded-full border-2 border-dashed border-white/30 animate-spin-slow pointer-events-none"></div>
                        <img 
                            src={logoUrl} 
                            alt="Logo" 
                            className="w-full h-full object-cover rounded-full drop-shadow-md"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-[#1A5D1A] dark:text-yade-gold mb-2">{t.loginTitle}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t.loginSubtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.username}</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`w-full py-3.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                placeholder={t.username}
                            />
                            <User className={`absolute top-3.5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={20} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.password}</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full py-3.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                placeholder="••••••••"
                            />
                            <Lock className={`absolute top-3.5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={20} />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center font-bold">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#1A5D1A] hover:bg-[#144814] text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-1"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : t.loginButton}
                    </button>
                </form>
                
                {/* Slogan in Login */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500 italic mb-2">
                        <Quote size={12} className="inline-block mx-1 text-[#D4AF37] rotate-180" />
                        {t.sloganRazm}
                        <Quote size={12} className="inline-block mx-1 text-[#D4AF37]" />
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono tracking-wider opacity-70">{t.version}</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
