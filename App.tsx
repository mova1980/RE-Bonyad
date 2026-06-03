
import React, { useState, useEffect } from 'react'; 
import { 
    LayoutDashboard, FolderOpen, Search, Tags, ScanText, UserCheck, 
    SmilePlus, Users, BarChart3, Settings, Menu, Bell, LogOut, Moon, 
    Sun, ChevronLeft, BotMessageSquare, X, MessageSquareText, Globe, Check,
    Sword, Mountain, Sparkles, MessageSquareHeart, Palette
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import AIProcessor from './components/AIProcessor';
import Archive from './components/Archive';
import Restoration from './components/Restoration';
import UsersList from './components/UsersList';
import Login from './components/Login';
import Reports from './components/Reports';
import AppSettings from './components/Settings';
import AIChat from './components/AIChat';
import Notifications from './components/Notifications';
import BulkTagger from './components/BulkTagger'; 
import RazmanNovin from './components/RazmanNovin';
import FarazJavidan from './components/FarazJavidan';
import HooshmandNegar from './components/HooshmandNegar';
import RevayatNatamam from './components/RevayatNatamam'; 
import { NavItem, UserRole, LanguageCode, Document, Memoir, HistoricalEvent } from './types';
import { MOCK_NOTIFICATIONS, TRANSLATIONS, MOCK_DOCUMENTS, SAMPLE_TAGS, MOCK_PROFILES, MOCK_HISTORY } from './data';

const Placeholder = ({ title, desc }: { title: string, desc: string }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-dashed border-gray-300 dark:border-gray-700 animate-fade-in">
        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <Tags size={48} className="text-gray-300 dark:text-gray-500" />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-gray-700 dark:text-gray-200">{title}</h2>
        <p className="text-lg opacity-60">{desc}</p>
    </div>
);

type NavGroup = {
    id: string;
    titleKey: string;
    items: NavItem[];
};

// Fixed Direct Link for Google Drive Image Hosting
const APP_LOGO_URL = "https://lh3.googleusercontent.com/d/1B4LxZPtFDYXwZwkJwxLd1utCBpzafl8m";

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuth') === 'true');
    const [user, setUser] = useState<any>(() => {
        const savedUser = localStorage.getItem('user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false); 
    const [language, setLanguage] = useState<LanguageCode>(() => (localStorage.getItem('language') as LanguageCode) || 'fa');
    const [showLangMenu, setShowLangMenu] = useState(false);

    // Global States for Persistence with Debounced Save
    const [globalDocuments, setGlobalDocuments] = useState<Document[]>(() => {
        try {
            const saved = localStorage.getItem('globalDocs');
            return saved ? JSON.parse(saved) : MOCK_DOCUMENTS;
        } catch (e) { return MOCK_DOCUMENTS; }
    });
    const [globalMemoirs, setGlobalMemoirs] = useState<Memoir[]>(() => {
        try {
            const saved = localStorage.getItem('globalMemoirs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [globalEvents, setGlobalEvents] = useState<HistoricalEvent[]>(() => {
        try {
            const saved = localStorage.getItem('globalEvents');
            return saved ? JSON.parse(saved) : MOCK_HISTORY;
        } catch (e) { return MOCK_HISTORY; }
    });
    const [globalTags, setGlobalTags] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('globalTags');
            return saved ? JSON.parse(saved) : SAMPLE_TAGS;
        } catch (e) { return SAMPLE_TAGS; }
    });
    
    const [docCategories, setDocCategories] = useState<string[]>([
        'وصیت‌نامه', 'تصاویر', 'خاطرات', 'صوت', 'مدارک', 
        'مدارک شناسایی', 'نامه اداری', 'پزشکی', 'احکام', 
        'آثار هنری', 'فیلم', 'دست‌نوشته', 'مصاحبه', 'سایر'
    ]);

    const t = TRANSLATIONS[language];
    const isRTL = ['fa', 'ar', 'ku', 'bal'].includes(language);

    useEffect(() => {
        try {
            if (darkMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('darkMode', 'false');
            }
        } catch (e) { console.error("Storage error:", e); }
    }, [darkMode]);

    useEffect(() => {
        try {
            localStorage.setItem('language', language);
            document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
            document.documentElement.lang = language;
        } catch (e) { console.error("Storage error:", e); }
    }, [language, isRTL]);

    useEffect(() => {
        try {
            localStorage.setItem('activeTab', activeTab);
        } catch (e) { console.error("Storage error:", e); }
    }, [activeTab]);

    useEffect(() => {
        try {
            localStorage.setItem('globalDocs', JSON.stringify(globalDocuments));
        } catch (e) { console.error("Storage quota exceeded for docs"); }
    }, [globalDocuments]);

    useEffect(() => {
        try {
            localStorage.setItem('globalMemoirs', JSON.stringify(globalMemoirs));
        } catch (e) { console.error("Storage error for memoirs:", e); }
    }, [globalMemoirs]);

    useEffect(() => {
        try {
            localStorage.setItem('globalEvents', JSON.stringify(globalEvents));
        } catch (e) { console.error("Storage error for events:", e); }
    }, [globalEvents]);

    useEffect(() => {
        try {
            localStorage.setItem('globalTags', JSON.stringify(globalTags));
        } catch (e) { console.error("Storage error for tags:", e); }
    }, [globalTags]);

    const handleSaveDocument = (newDoc: Document) => {
        setGlobalDocuments(prev => [newDoc, ...prev]);
    };

    const handleLogin = (userData: any) => {
        setUser(userData);
        setIsAuthenticated(true);
        try {
            localStorage.setItem('isAuth', 'true');
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) { console.error("Storage error on login:", e); }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('isAuth');
        localStorage.removeItem('user');
        // Cleanup AI session markers to free space
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('ai_')) localStorage.removeItem(key);
        });
        sessionStorage.clear();
    };

    const handleAddCategory = (category: string) => {
        if (category && !docCategories.includes(category)) {
            setDocCategories(prev => [...prev, category]);
        }
    };

    const handleDeleteCategory = (category: string) => {
        if (category === 'سایر') { alert('حذف دسته‌بندی پیش‌فرض "سایر" امکان‌پذیر نیست.'); return; }
        const affectedDocsCount = globalDocuments.filter(d => d.category === category).length;
        if (window.confirm(`آیا از حذف دسته‌بندی "${category}" اطمینان دارید؟`)) {
            if (affectedDocsCount > 0) setGlobalDocuments(prev => prev.map(d => d.category === category ? { ...d, category: 'سایر' } : d));
            setDocCategories(prev => prev.filter(c => c !== category));
        }
    };

    const navGroups: NavGroup[] = [
        {
            id: 'general',
            titleKey: 'menuGeneral',
            items: [
                { id: 'dashboard', titleKey: 'dashboard', icon: LayoutDashboard, role: [UserRole.USER, UserRole.EXPERT, UserRole.MANAGER, UserRole.ADMIN] },
                { id: 'revayat', titleKey: 'revayatTitle', icon: MessageSquareHeart, role: [UserRole.USER, UserRole.EXPERT, UserRole.ADMIN] }, 
            ]
        },
        {
            id: 'smart_archive',
            titleKey: 'menuSmartArchive',
            items: [
                { id: 'archive', titleKey: 'archive', icon: FolderOpen, role: [UserRole.EXPERT, UserRole.MANAGER, UserRole.ADMIN] },
                { id: 'restoration', titleKey: 'restoration', icon: Sparkles, role: [UserRole.EXPERT, UserRole.ADMIN] }, 
                { id: 'ai-processor', titleKey: 'aiProcessor', icon: ScanText, role: [UserRole.EXPERT, UserRole.ADMIN] }, 
                { id: 'tags', titleKey: 'tags', icon: Tags, role: [UserRole.EXPERT, UserRole.ADMIN] },
                { id: 'reports', titleKey: 'reports', icon: BarChart3, role: [UserRole.MANAGER, UserRole.ADMIN] },
            ]
        },
        {
            id: 'strategic',
            titleKey: 'menuStrategic',
            items: [
                { id: 'razman-novin', titleKey: 'razmanNovin', icon: Sword, role: [UserRole.USER, UserRole.EXPERT, UserRole.MANAGER, UserRole.ADMIN] },
                { id: 'hooshmand-negar', titleKey: 'hooshmandNegar', icon: Palette, role: [UserRole.USER, UserRole.EXPERT, UserRole.MANAGER, UserRole.ADMIN] },
                { id: 'faraz-javidan', titleKey: 'farazJavidan', icon: Mountain, role: [UserRole.USER, UserRole.EXPERT, UserRole.MANAGER, UserRole.ADMIN] },
            ]
        },
        {
            id: 'base_info',
            titleKey: 'menuBaseInfo',
            items: [
                { id: 'users', titleKey: 'users', icon: Users, role: [UserRole.ADMIN] },
                { id: 'settings', titleKey: 'settings', icon: Settings, role: [UserRole.ADMIN] },
            ]
        }
    ];

    const allNavItems = navGroups.flatMap(g => g.items);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard t={t} language={language} documents={globalDocuments} events={globalEvents} setEvents={setGlobalEvents} onNavigate={setActiveTab} />;
            case 'revayat': return <RevayatNatamam documents={globalDocuments} setDocuments={setGlobalDocuments} memoirs={globalMemoirs} setMemoirs={setGlobalMemoirs} />; 
            case 'razman-novin': return <RazmanNovin t={t} />;
            case 'hooshmand-negar': return <HooshmandNegar t={t} tags={globalTags} documents={globalDocuments} setDocuments={setGlobalDocuments} />;
            case 'faraz-javidan': return <FarazJavidan t={t} language={language} />;
            case 'ai-processor': return <AIProcessor onSaveDocument={handleSaveDocument} />;
            case 'archive': return <Archive t={t} language={language} documents={globalDocuments} setDocuments={setGlobalDocuments} categories={docCategories} />;
            case 'restoration': return <Restoration onSaveDocument={handleSaveDocument} />; 
            case 'tags': return <BulkTagger documents={globalDocuments} setDocuments={setGlobalDocuments} tags={globalTags} setTags={setGlobalTags} profiles={MOCK_PROFILES} />; 
            case 'users': return <UsersList />;
            case 'reports': return <Reports language={language} documents={globalDocuments} onNavigate={setActiveTab} />;
            case 'settings': return <AppSettings categories={docCategories} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} />;
            default: return <Placeholder title={t.placeholderTitle} desc={t.placeholderDesc} />;
        }
    };

    const groupedLanguages = [
        { title: t.langCatNative, langs: [{ code: 'fa', name: 'Persian', native: 'فارسی' }] },
        { title: t.langCatResistance, langs: [{ code: 'ar', name: 'Arabic', native: 'العربية' }, { code: 'en', name: 'English', native: 'English' }] },
        { title: t.langCatRegional, langs: [{ code: 'tr', name: 'Turkish', native: 'Türkçe' }, { code: 'ku', name: 'Kurdish', native: 'Kurdî' }, { code: 'bal', name: 'Baluchi', native: 'بلوچی' }] },
        { title: t.langCatIntl, langs: [{ code: 'ru', name: 'Russian', native: 'Русский' }, { code: 'zh', name: 'Chinese', native: '中文' }, { code: 'es', name: 'Spanish', native: 'Espaiol' }] }
    ];

    if (!isAuthenticated) return <Login onLogin={handleLogin} t={t} language={language} setLanguage={setLanguage} groupedLanguages={groupedLanguages} logoUrl={APP_LOGO_URL} />;

    return (
        <div className={`flex h-screen bg-[#F8F9FA] dark:bg-gray-900 overflow-hidden text-right transition-colors duration-300 font-sans`} dir={isRTL ? 'rtl' : 'ltr'}>
            <aside className={`bg-[#1A5D1A] dark:bg-[#0f350f] text-white flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl z-30 relative ${sidebarOpen ? 'w-80' : 'w-24'}`}>
                <div className={`flex items-center justify-center border-b border-white/10 relative overflow-hidden shrink-0 transition-all duration-300 ${sidebarOpen ? 'h-72 py-8' : 'h-24 py-4'}`}>
                    <div className={`flex flex-col items-center gap-6 z-10 transition-all duration-300 w-full`}>
                        <div className={`bg-white rounded-full p-2 shadow-2xl border-4 border-[#D4AF37] transition-all duration-500 hover:scale-105 overflow-hidden ${sidebarOpen ? 'w-40 h-40' : 'w-12 h-12'}`}>
                            <img src={APP_LOGO_URL} alt="Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                        {sidebarOpen && (
                            <div className="flex flex-col items-center text-center w-full px-2">
                                <h1 className="text-3xl font-black text-[#D4AF37] tracking-tight font-sans drop-shadow-lg leading-tight">
                                    {t.appTitle}
                                </h1>
                                <div className="h-0.5 w-12 bg-[#D4AF37]/50 mt-2 rounded-full"></div>
                            </div>
                        )}
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
                    {navGroups.map((group) => (
                        <div key={group.id} className={`${group.id !== 'general' ? 'bg-white/5 rounded-2xl p-2 border border-white/10 shadow-inner' : ''}`}>
                            {group.id !== 'general' && sidebarOpen && (<h3 className="text-xs font-bold text-[#D4AF37] mb-3 px-2 flex items-center gap-2 opacity-80"><span className="w-1 h-1 bg-[#D4AF37] rounded-full"></span>{t[group.titleKey as keyof typeof t]}</h3>)}
                            <div className="space-y-2">
                                {group.items.map((item) => (
                                    <button 
                                        key={item.id} 
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setActiveTab(item.id); }} 
                                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${activeTab === item.id ? 'bg-[#D4AF37] text-[#1A5D1A] font-bold shadow-lg shadow-yellow-900/20' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        <item.icon size={22} className={`flex-shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                                        <span className={`text-sm whitespace-nowrap transition-all duration-300 font-sans ${sidebarOpen ? 'opacity-100 translate-x-0' : `opacity-0 absolute ${isRTL ? 'translate-x-4' : '-translate-x-4'}`}`}>{t[item.titleKey as keyof typeof t]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
                <div className="p-4 border-t border-white/10 bg-black/10 shrink-0">
                    <div className="flex items-center gap-3 justify-center">
                        <img src={user?.avatar || "https://via.placeholder.com/150"} alt="Admin" className="w-12 h-12 rounded-full border-2 border-[#D4AF37] object-cover shadow-sm cursor-pointer hover:scale-105 transition-transform" />
                        {sidebarOpen && (<div className={`flex flex-col flex-1 overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}><span className="text-sm font-bold truncate font-sans">{user?.name}</span><span className="text-xs text-[#D4AF37] font-sans">{t.admin}</span></div>)}
                        {sidebarOpen && (<button type="button" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="text-white/60 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-xl"><LogOut size={20} /></button>)}
                    </div>
                </div>
            </aside>
            <main className="flex-1 flex flex-col h-full overflow-hidden relative font-sans">
                <header className="h-20 bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-8 shadow-sm z-20 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={(e) => { e.preventDefault(); setSidebarOpen(!sidebarOpen); }} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-colors">{sidebarOpen ? (isRTL ? <ChevronLeft size={24} /> : <ChevronLeft className="rotate-180" size={24} />) : <Menu size={24} />}</button>
                        <h2 className="text-xl font-bold text-[#1A5D1A] dark:text-[#D4AF37] tracking-tight">{t[allNavItems.find(i => i.id === activeTab)?.titleKey as keyof typeof t]}</h2>
                    </div>
                    {/* Theme Toggle Button Restored and Verified */}
                    <div className="flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setDarkMode(!darkMode); }} 
                            className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-sm group"
                            title={darkMode ? "حالت روشن" : "حالت تاریک"}
                        >
                            {darkMode ? <Sun size={20} className="text-yellow-500 transition-transform group-hover:rotate-45" /> : <Moon size={20} className="text-indigo-600 transition-transform group-hover:-rotate-12" />}
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8F9FA] dark:bg-gray-900 scroll-smooth"><div className="container mx-auto">{renderContent()}</div></div>
                <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowChatbot(!showChatbot); }} 
                    className={`fixed bottom-8 ${isRTL ? 'left-8' : 'right-8'} w-20 h-20 rounded-full shadow-[0_10px_30px_rgba(26,93,26,0.4)] hover:shadow-[0_15px_40px_rgba(26,93,26,0.5)] active:scale-95 transition-all z-50 flex items-center justify-center border-4 border-[#1A5D1A] bg-white overflow-hidden group`}
                >
                    {showChatbot ? (
                        <X size={32} className="text-[#1A5D1A]" />
                    ) : (
                        <div className="w-full h-full p-2 group-hover:scale-110 transition-transform duration-300 overflow-hidden rounded-full">
                            <img 
                                src={APP_LOGO_URL} 
                                alt="AI Logo" 
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                    )}
                </button>
                {showChatbot && <div className={`fixed bottom-32 ${isRTL ? 'left-8' : 'right-8'} z-50 w-full max-w-sm h-[600px]`}><AIChat onClose={() => setShowChatbot(false)} t={t} isRTL={isRTL} logoUrl={APP_LOGO_URL} /></div>}
            </main>
        </div>
    );
};

export default App;
