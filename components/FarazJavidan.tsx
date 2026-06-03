
import React, { useState, useRef, useEffect } from 'react';
import { TranslationStructure, LanguageCode, MartyrProfile } from '../types';
import { MOCK_PROFILES, localizeNumber } from '../data';
import { 
    Image, Book, Target, Lock, Users, ChevronRight, Play, Award, 
    Map as MapIcon, Mic, FileText, Globe, Search, Shield, MessageSquare, 
    Radio, Activity, Crosshair, Hexagon, Pause, CheckCircle2, X, Send, Eye
} from 'lucide-react';

interface FarazJavidanProps {
    t: TranslationStructure;
    language: LanguageCode;
}

type SectionKey = 'heroes' | 'encyclopedia' | 'training' | 'secrets' | 'forum';

// --- Local Mock Data ---
const MOCK_ARTICLES = [
    { id: 1, title: 'استراتژی عملیات والفجر ۸', category: 'تاکتیک', content: 'عملیات والفجر ۸ یکی از پیچیده‌ترین عملیات‌های آبی-خاکی در تاریخ جنگ‌های کلاسیک جهان است. عبور از رودخانه خروشان اروند با عرض متغیر و جزر و مد شدید، نیازمند محاسبات دقیق مهندسی و اطلاعاتی بود...' },
    { id: 2, title: 'پهپاد مهاجر-۶', category: 'تسلیحات', content: 'مهاجر-۶ پهپاد تاکتیکی و رزمی ساخت ایران است که توانایی حمل بمب‌های هدایت دقیق قائم را دارد. این پهپاد برای مأموریت‌های شناسایی و تهاجمی در عمق خاک دشمن طراحی شده است...' },
    { id: 3, title: 'جغرافیای نظامی شلمچه', category: 'جغرافیا', content: 'شلمچه منطقه‌ای مرزی در غرب خرمشهر و نزدیکترین نقطه مرزی به شهر بصره عراق است. زمین این منطقه هموار و دارای خاک رسی است که در فصل بارندگی تردد خودروهای سنگین را دشوار می‌کند...' },
];

const MOCK_COURSES = [
    { id: 1, title: 'دوره مقدماتی سایبری', level: 'مبتدی', progress: 0, status: 'شروع نشده' },
    { id: 2, title: 'تاکتیک‌های نبرد شهری', level: 'پیشرفته', progress: 45, status: 'در حال برگزاری' },
    { id: 3, title: 'پدافند غیرعامل', level: 'متوسط', progress: 100, status: 'تکمیل شده' }
];

const MOCK_QUIZ = {
    question: 'کدام عملیات منجر به آزادسازی خرمشهر شد؟',
    options: ['عملیات خیبر', 'عملیات بیت‌المقدس', 'عملیات رمضان', 'عملیات ثامن‌الائمه'],
    correct: 1
};

const MOCK_SECRET_DOCS = [
    { id: 'DOC-S001', title: 'نقشه عملیاتی کربلای ۵ - نسخه فرماندهی', type: 'Map', date: '۱۳۶۵/۱۰/۱۸', security: 'Top Secret' },
    { id: 'DOC-S002', title: 'گزارش محرمانه وضعیت لجستیک غرب', type: 'Report', date: '۱۴۰۳/۰۲/۱۵', security: 'Confidential' },
    { id: 'DOC-S003', title: 'تحلیل استراتژیک تحرکات مرزی', type: 'Analysis', date: '۱۴۰۳/۰۲/۲۰', security: 'Secret' },
];

const MOCK_CHATS = [
    { id: 1, user: 'فرمانده گردان', role: 'Commander', message: 'برادران، برای یادواره شهدای غرب کشور هماهنگی‌های لازم انجام شده است. لیست سخنرانان نهایی شد.', time: '10:30', replies: [] },
    { id: 2, user: 'رزمنده بسیجی', role: 'Member', message: 'آیا دوره آموزشی پهپاد برای عموم رزمندگان باز است یا نیاز به معرفی‌نامه دارد؟', time: '10:45', replies: ['بله، نیاز به معرفی‌نامه از یگان مربوطه دارید.'] },
];

const FarazJavidan: React.FC<FarazJavidanProps> = ({ t, language }) => {
    const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
    const [subView, setSubView] = useState<string | null>(null); // To track detailed views within sections
    
    // States for specific interactive elements
    const [audioPlaying, setAudioPlaying] = useState<number | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
    const [secretAccess, setSecretAccess] = useState(false);
    const [viewingSecretDoc, setViewingSecretDoc] = useState<any>(null);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState(MOCK_CHATS);

    const mainSections = [
        { 
            id: 'heroes', 
            title: t.secHeroes, 
            icon: Image, 
            color: 'from-[#1A5D1A] to-[#144514]',
            description: 'نگارخانه جاودان و یادبودهای تعاملی شهدا'
        },
        { 
            id: 'encyclopedia', 
            title: t.secEncyclopedia, 
            icon: Book, 
            color: 'from-[#2A5CAA] to-[#1e4079]',
            description: 'مخزن دانش نظامی و تاریخ عملیات‌ها'
        },
        { 
            id: 'training', 
            title: t.secTraining, 
            icon: Target, 
            color: 'from-[#D4AF37] to-[#B4941F]',
            description: 'مرکز آموزش‌های نوین و شبیه‌سازهای رزمی'
        },
        { 
            id: 'secrets', 
            title: t.secSecrets, 
            icon: Lock, 
            color: 'from-[#3A3A3A] to-[#252525]',
            description: 'دسترسی ویژه به اسناد و تحلیل‌های استراتژیک'
        },
        { 
            id: 'forum', 
            title: t.secForum, 
            icon: Users, 
            color: 'from-[#FF6347] to-[#CC4F38]',
            description: 'شبکه تعاملی و تخصصی رزم‌آوران'
        }
    ];

    const renderLanding = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pb-10">
            {mainSections.map(section => (
                <div 
                    key={section.id} 
                    onClick={() => { setActiveSection(section.id as SectionKey); setSubView(null); }}
                    className={`relative overflow-hidden rounded-3xl h-64 cursor-pointer group shadow-soft hover:shadow-2xl transition-all duration-500`}
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                    <div className="absolute inset-0 p-8 flex flex-col justify-between text-white">
                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
                            <section.icon size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2 font-sans">{section.title}</h3>
                            <p className="text-white/80 text-sm">{section.description}</p>
                        </div>
                        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 rtl:group-hover:-translate-x-0">
                            <div className="bg-white text-black rounded-full p-2">
                                <ChevronRight size={20} className="rtl:rotate-180" />
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                </div>
            ))}
        </div>
    );

    // --- 1. Heroes Gallery ---
    const renderHeroesGallery = () => {
        return (
            <div className="space-y-8 animate-fade-in-up pb-10">
                {/* Featured Interactive Memorial */}
                <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl group">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
                    <img src="https://lh3.googleusercontent.com/d/1YOO6Uj97xuKfA25fBxJJ-aFetfOCUEy2" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Memorial" />
                    <div className="absolute bottom-0 left-0 w-full p-8 z-20 bg-gradient-to-t from-black/90 to-transparent">
                        <h3 className="text-3xl font-bold text-white mb-2">یادمان مجازی شهدای شلمچه</h3>
                        <p className="text-white/80 max-w-2xl mb-6">سفری تعاملی به مشهد شهیدان کربلای ۵. با استفاده از فناوری واقعیت مجازی، در خاک مقدس قدم بزنید.</p>
                        <button type="button" onClick={(e) => { e.preventDefault(); }} className="bg-[#D4AF37] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#b8962e] transition-colors flex items-center gap-2">
                            <Activity size={20} /> شروع زیارت مجازی
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Audio Biographies */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold mb-6 flex items-center gap-2 text-[#2A5CAA] border-b pb-3 dark:border-gray-700"><Mic size={24}/> {t.subAudioBio}</h4>
                        <div className="space-y-4">
                            {[
                                { id: 1, title: 'روایت فتح - قسمت ۱', author: 'سید مرتضی آوینی', duration: '14:20' },
                                { id: 2, title: 'وصیت‌نامه صوتی شهید باکری', author: 'مهدی باکری', duration: '08:45' },
                                { id: 3, title: 'مصاحبه بیسیم‌چی لشکر ۲۷', author: 'آرشیو جنگ', duration: '22:10' }
                            ].map((item) => (
                                <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${audioPlaying === item.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <div>
                                        <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.title}</h5>
                                        <p className="text-xs text-gray-500 mt-1">{item.author}</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setAudioPlaying(audioPlaying === item.id ? null : item.id); }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${audioPlaying === item.id ? 'bg-[#2A5CAA] text-white' : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 shadow-sm'}`}
                                    >
                                        {audioPlaying === item.id ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3D Statues Grid */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold mb-6 flex items-center gap-2 text-[#D4AF37] border-b pb-3 dark:border-gray-700"><Award size={24}/> {t.subDigitalStatue}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {MOCK_PROFILES.slice(0, 4).map((p) => (
                                <div key={p.id} className="relative group cursor-pointer perspective-1000">
                                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 relative shadow-inner transform transition-transform duration-500 group-hover:rotate-y-6">
                                        <img src={p.avatar} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" alt={p.name} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-center">
                                            <span className="text-white font-bold text-sm">{p.name} {p.family}</span>
                                            <span className="text-[#D4AF37] text-xs">مشاهده تندیس ۳ بعدی</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- 2. Encyclopedia ---
    const renderEncyclopedia = () => {
        if (selectedArticle) {
            return (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft p-8 animate-fade-in border border-gray-100 dark:border-gray-700">
                    <button type="button" onClick={(e) => { e.preventDefault(); setSelectedArticle(null); }} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[#2A5CAA] transition-colors">
                        <ChevronRight size={20} className="rtl:rotate-180" /> بازگشت به لیست مقالات
                    </button>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">{selectedArticle.category}</span>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{selectedArticle.title}</h2>
                    <div className="prose dark:prose-invert max-w-none text-justify leading-8 text-gray-600 dark:text-gray-300">
                        <p>{selectedArticle.content}</p>
                        <p>لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.</p>
                        <div className="my-8 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border-r-4 border-[#2A5CAA]">
                            <h4 className="font-bold mb-2 text-[#2A5CAA]">نکته تاکتیکی:</h4>
                            <p className="text-sm">رعایت اصول استتار در این منطقه جغرافیایی به دلیل پوشش گیاهی خاص، نیازمند تجهیزات ویژه بوده است.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {['همه', 'تاکتیک', 'تسلیحات', 'جغرافیا', 'تاریخچه'].map((filter, idx) => (
                        <button key={idx} type="button" onClick={(e) => { e.preventDefault(); }} className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${idx === 0 ? 'bg-[#2A5CAA] text-white shadow-lg shadow-blue-900/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_ARTICLES.map((article) => (
                        <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 hover:border-[#2A5CAA] cursor-pointer transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-[#2A5CAA]">
                                    <BookOpenIcon category={article.category} />
                                </div>
                                <span className="text-xs text-gray-400">شناسه: {localizeNumber(article.id, language)}</span>
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 group-hover:text-[#2A5CAA] transition-colors">{article.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4">{article.content}</p>
                            <div className="flex items-center text-[#2A5CAA] text-sm font-bold">
                                مطالعه کامل <ChevronRight size={16} className="mr-1 rtl:rotate-180" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- 3. Training ---
    const renderTraining = () => {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
                <div className="lg:col-span-2 space-y-8">
                    {/* Active Courses */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Target size={24} className="text-[#D4AF37]"/> دوره‌های فعال من</h3>
                        <div className="space-y-6">
                            {MOCK_COURSES.map((course) => (
                                <div key={course.id}>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{course.title}</span>
                                        <span className="text-xs text-gray-500">{course.status} - {localizeNumber(course.progress, language)}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#D4AF37]" style={{ width: `${course.progress}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Simulation Access */}
                    <div className="bg-gradient-to-br from-[#1A5D1A] to-[#0f350f] rounded-3xl p-8 text-white relative overflow-hidden group cursor-pointer">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><Crosshair /> شبیه‌ساز عملیات</h3>
                            <p className="mb-6 opacity-90 max-w-md">ورود به محیط شبیه‌سازی شده عملیات بیت‌المقدس. فرماندهی یگان زرهی را بر عهده بگیرید.</p>
                            <button type="button" onClick={(e) => { e.preventDefault(); }} className="bg-white text-[#1A5D1A] px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">شروع شبیه‌سازی</button>
                        </div>
                        <MapIcon className="absolute bottom-4 left-4 opacity-20 transform group-hover:scale-125 transition-transform duration-700" size={120} />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {/* Daily Quiz */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 h-full">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#2A5CAA]"><Hexagon size={24}/> آزمون روزانه</h3>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl mb-6">
                            <p className="font-bold text-gray-800 dark:text-gray-200 mb-4">{MOCK_QUIZ.question}</p>
                            <div className="space-y-2">
                                {MOCK_QUIZ.options.map((opt, idx) => (
                            <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); setQuizAnswer(idx); }}
                                className={`w-full text-right p-3 rounded-xl text-sm transition-colors ${
                                    quizAnswer === idx 
                                    ? (idx === MOCK_QUIZ.correct ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200')
                                    : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'
                                } border ${quizAnswer !== null && idx === MOCK_QUIZ.correct ? 'border-green-500 ring-1 ring-green-500' : 'border-transparent'}`}
                                disabled={quizAnswer !== null}
                            >
                                        {opt}
                                        {quizAnswer !== null && idx === MOCK_QUIZ.correct && <CheckCircle2 size={16} className="float-left text-green-600"/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400 mb-2">امتیاز شما: {localizeNumber(1250, language)}</p>
                            <div className="inline-block bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-1 rounded-full text-xs font-bold border border-[#D4AF37]/20">رتبه: سرگرد مجازی</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- 4. Hall of Secrets (Talare Asrar) ---
    const renderSecrets = () => {
        if (!secretAccess) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[500px] bg-black rounded-3xl relative overflow-hidden animate-fade-in border-4 border-gray-800">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <Shield size={80} className="text-red-600 mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-2 font-mono">تالار اســرار</h2>
                    <p className="text-gray-400 mb-8 font-mono text-sm tracking-widest uppercase">سطح دسترسی: فوق محرمانه</p>
                    <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setSecretAccess(true); }}
                        className="bg-red-700 hover:bg-red-600 text-white px-8 py-3 rounded-none clip-path-polygon font-bold tracking-widest border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all hover:shadow-[0_0_25px_rgba(220,38,38,0.8)]"
                    >
                        احراز هویت بیومتریک
                    </button>
                </div>
            );
        }

        if (viewingSecretDoc) {
            return (
                <div className="bg-[#1a1a1a] rounded-3xl p-8 min-h-[600px] border border-gray-800 text-gray-300 relative overflow-hidden animate-fade-in">
                    <button type="button" onClick={(e) => { e.preventDefault(); setViewingSecretDoc(null); }} className="absolute top-6 left-6 text-gray-500 hover:text-white"><X size={24}/></button>
                    <div className="max-w-3xl mx-auto border-2 border-red-900/30 p-10 bg-black/40 relative">
                        {/* Stamp */}
                        <div className="absolute top-10 right-10 border-4 border-red-700 text-red-700 text-xl font-bold p-2 transform rotate-12 opacity-50 select-none pointer-events-none">
                            {viewingSecretDoc.security}
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-2 border-b border-gray-700 pb-4">{viewingSecretDoc.title}</h2>
                        <div className="flex justify-between text-xs font-mono text-gray-500 mb-8">
                            <span>کد سند: {viewingSecretDoc.id}</span>
                            <span>تاریخ: {localizeNumber(viewingSecretDoc.date, language)}</span>
                        </div>
                        
                        <div className="space-y-4 font-mono text-sm leading-7">
                            <p>این سند حاوی اطلاعات طبقه‌بندی شده درباره عملیات شناسایی در عمق ۱۰ کیلومتری محور شمالی است.</p>
                            <div className="bg-gray-900 p-4 border border-gray-700 my-4">
                                <p className="text-red-400 mb-2">[بخش محرمانه]</p>
                                <p className="blur-[4px] select-none">لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.</p>
                            </div>
                            <p>تصاویر ماهواره‌ای نشان‌دهنده تحرکات جدید یگان‌های زرهی دشمن در مختصات ۳۴.۵۶ شمالی و ۴۵.۱۲ شرقی می‌باشد.</p>
                            <p>پیشنهاد عملیاتی: اعزام تیم شناسایی پهپادی جهت تأیید نهایی اهداف.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-[#0f0f0f] rounded-3xl p-8 min-h-[600px] border border-gray-800 relative animate-fade-in">
                <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-red-600" size={28} />
                        آرشیو اسناد ویژه
                    </h3>
                    <div className="flex gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></span>
                        <span className="text-xs text-green-500 font-mono">اتصال امن برقرار است</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_SECRET_DOCS.map((doc) => (
                        <div key={doc.id} onClick={() => setViewingSecretDoc(doc)} className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-800 hover:border-red-900 cursor-pointer transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-900/20 to-transparent -mr-8 -mt-8 rounded-full blur-xl group-hover:bg-red-900/40 transition-colors"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <FileText className="text-gray-500 group-hover:text-red-500 transition-colors" size={24} />
                                <span className="text-[10px] font-mono text-red-500 border border-red-900/50 px-2 py-0.5 rounded bg-red-900/10">{doc.security}</span>
                            </div>
                            <h4 className="font-bold text-gray-200 text-sm mb-2 group-hover:text-white">{doc.title}</h4>
                            <div className="flex justify-between items-end mt-4">
                                <span className="text-[10px] text-gray-600 font-mono">{doc.id}</span>
                                <span className="text-[10px] text-gray-500">{localizeNumber(doc.date, language)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- 5. Forum (Simulated) ---
    const renderForum = () => {
        const handleSendMessage = () => {
            if (!chatInput.trim()) return;
            const newMsg = {
                id: Date.now(),
                user: 'شما',
                role: 'User',
                message: chatInput,
                time: new Date().toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'}),
                replies: []
            };
            setChatMessages([...chatMessages, newMsg]);
            setChatInput('');
        };

        return (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in-up h-[600px]">
                {/* Sidebar */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col">
                    <button type="button" onClick={(e) => { e.preventDefault(); }} className="w-full bg-[#FF6347] text-white py-3 rounded-xl font-bold mb-6 shadow-lg shadow-red-900/20 hover:scale-105 transition-transform flex items-center justify-center gap-2">
                        <MessageSquare size={18} /> گفتگوی جدید
                    </button>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        <h5 className="text-xs font-bold text-gray-400 mb-2 px-2">کانال‌های فعال</h5>
                        {[t.subSpecialCircles, t.subOpsCoord, t.subCommNetwork].map((item, idx) => (
                            <button key={idx} type="button" onClick={(e) => { e.preventDefault(); }} className={`w-full text-right p-3 rounded-xl text-sm transition-colors flex items-center justify-between group ${idx === 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                <span># {item}</span>
                                {idx === 0 && <span className="w-2 h-2 bg-[#FF6347] rounded-full"></span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-3 bg-[#e5ddd5] dark:bg-[#1f2937] rounded-3xl shadow-soft overflow-hidden flex flex-col relative border border-gray-200 dark:border-gray-700">
                    {/* Chat Header */}
                    <div className="bg-white dark:bg-gray-800 p-4 flex justify-between items-center shadow-sm z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FF6347] rounded-full flex items-center justify-center text-white font-bold">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white text-sm">تالار هماهنگی عملیات</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{localizeNumber(128, language)} عضو آنلاین</p>
                            </div>
                        </div>
                        <Search size={20} className="text-gray-400" />
                    </div>

                    {/* Chat Background Pattern */}
                    <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-0">
                        {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === 'User' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm relative ${msg.role === 'User' ? 'bg-[#dcf8c6] dark:bg-[#056162] text-gray-800 dark:text-white rounded-tl-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-tr-none'}`}>
                                    <p className={`text-xs font-bold mb-1 ${msg.role === 'Commander' ? 'text-red-500' : 'text-blue-500'}`}>{msg.user}</p>
                                    <p className="text-sm leading-6">{msg.message}</p>
                                    <span className="text-[10px] text-gray-400 block text-left mt-1">{localizeNumber(msg.time, language)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="bg-white dark:bg-gray-800 p-4 flex gap-2 items-center z-10">
                        <input 
                            type="text" 
                            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 outline-none text-sm dark:text-white"
                            placeholder="پیام خود را بنویسید..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button type="button" onClick={(e) => { e.preventDefault(); handleSendMessage(); }} className="bg-[#FF6347] text-white p-3 rounded-xl shadow-lg hover:bg-red-600 transition-colors">
                            <Send size={20} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const BookOpenIcon = ({category}: {category: string}) => {
        switch(category) {
            case 'تاکتیک': return <Crosshair size={24} />;
            case 'تسلیحات': return <Target size={24} />;
            case 'جغرافیا': return <MapIcon size={24} />;
            default: return <Book size={24} />;
        }
    }

    return (
        <div className="pb-10 min-h-screen">
            {!activeSection ? (
                <>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 font-serif border-r-4 border-[#1A5D1A] pr-4 leading-relaxed">
                        {t.farazJavidan}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 pr-5 text-sm">منظومه جامع فرهنگی، آموزشی و عملیاتی ایثارگران</p>
                    {renderLanding()}
                </>
            ) : (
                <div className="flex flex-col h-full">
                    {/* Breadcrumb Header */}
                    <div className="flex items-center gap-2 mb-8 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm w-fit">
                        <button type="button" onClick={(e) => { e.preventDefault(); setActiveSection(null); setSelectedArticle(null); setSecretAccess(false); setViewingSecretDoc(null); }} className="hover:text-[#1A5D1A] font-bold transition-colors">
                            {t.farazJavidan}
                        </button>
                        <ChevronRight size={16} className="rtl:rotate-180" />
                        <span className="font-bold text-[#1A5D1A] dark:text-[#D4AF37]">
                            {mainSections.find(s => s.id === activeSection)?.title}
                        </span>
                    </div>

                    {/* Section Content */}
                    <div className="flex-1">
                        {activeSection === 'heroes' && renderHeroesGallery()}
                        {activeSection === 'encyclopedia' && renderEncyclopedia()}
                        {activeSection === 'training' && renderTraining()}
                        {activeSection === 'secrets' && renderSecrets()}
                        {activeSection === 'forum' && renderForum()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarazJavidan;
