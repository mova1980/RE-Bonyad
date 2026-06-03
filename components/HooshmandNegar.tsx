
import React, { useState, useMemo } from 'react';
import { 
    Film, Book, Gamepad2, Palette as PaletteIcon, 
    Video as VideoIcon, Tv, Clapperboard, MonitorPlay,
    BookOpen, Library, PenTool, ScrollText,
    Dices, Smartphone, Glasses, Layers,
    Brush, Diamond, Camera, LayoutTemplate,
    Search, Tags, ChevronRight, Download, Save,
    ExternalLink, Plus, Filter, Info, X, Loader2, Sparkles, User,
    Volume2, VolumeX, Play, Pause, RotateCw, ZoomIn, ZoomOut, Type, Compass, Image as ImageIcon,
    Copy, Check, Trash2
} from 'lucide-react';
import { Document, MartyrProfile } from '../types';
import { MOCK_PROFILES, localizeNumber } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { generateCreativeContent } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface HooshmandNegarProps {
    t: any;
    tags: string[];
    documents: Document[];
    setDocuments?: React.Dispatch<React.SetStateAction<Document[]>>;
}

type ArtCategory = 'cinematic' | 'written' | 'digital' | 'visual';
type ModalState = 'setup' | 'generating' | 'result';

const HooshmandNegar: React.FC<HooshmandNegarProps> = ({ t, tags, documents, setDocuments }) => {
    const [activeCategory, setActiveCategory] = useState<ArtCategory>('cinematic');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagSearch, setTagSearch] = useState('');
    
    // Config Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalState, setModalState] = useState<ModalState>('setup');
    const [generationType, setGenerationType] = useState('');
    
    // Job settings
    const [jobTags, setJobTags] = useState<string[]>([]);
    const [jobProfiles, setJobProfiles] = useState<string[]>([]);
    const [jobPrompt, setJobPrompt] = useState<string>('');
    const [generatedResult, setGeneratedResult] = useState<string | null>(null);

    // Advanced Media Generation states
    const [parsedResult, setParsedResult] = useState<{
        title: string;
        text: string;
        imagePrompt: string;
        mediaType: string;
        extraMetadata?: {
            chapters?: { title: string; content: string }[];
            videoScenes?: { time: string; visualDescription: string; narration: string }[];
        };
    } | null>(null);

    const [imageSeed, setImageSeed] = useState<number>(42);
    const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [videoSceneIdx, setVideoSceneIdx] = useState<number>(0);
    
    // Visual Editing filters
    const [grayscale, setGrayscale] = useState<number>(0);
    const [sepia, setSepia] = useState<number>(0);
    const [brightness, setBrightness] = useState<number>(100);
    const [contrast, setContrast] = useState<number>(100);
    const [isNarrating, setIsNarrating] = useState<boolean>(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const openGenerationSettings = (typeTitle: string) => {
        setGenerationType(typeTitle);
        setJobTags([...selectedTags]);
        setJobProfiles([]);
        setJobPrompt('');
        setModalState('setup');
        setGeneratedResult(null);
        setIsModalOpen(true);
    };

    const handleStartGeneration = async () => {
        setModalState('generating');
        // Reset interactive generator states
        setImageSeed(Math.floor(Math.random() * 90000) + 10000);
        setSelectedChapterIdx(0);
        setIsPlaying(false);
        setVideoSceneIdx(0);
        setGrayscale(0);
        setSepia(0);
        setBrightness(100);
        setContrast(100);
        setIsNarrating(false);
        
        try {
            const contextDocs = documents.filter(doc => doc.tags?.some(tag => jobTags.includes(tag)));
            const profilesData = MOCK_PROFILES.filter(p => jobProfiles.includes(p.id));
            
            const result = await generateCreativeContent({
                type: generationType,
                tags: jobTags,
                contextDocs: contextDocs,
                profiles: profilesData,
                additionalPrompt: jobPrompt
            });
            
            setGeneratedResult(result);
            
            try {
                const parsed = JSON.parse(result);
                setParsedResult(parsed);
            } catch (e) {
                // Parse fallback if legacy pure string
                setParsedResult({
                    title: `طرح بی نام (${generationType})`,
                    text: result,
                    imagePrompt: `An artistic professional painting representing ${generationType}, iranian traditional colors, dramatic clouds, highly detailed concept art, 8k`,
                    mediaType: activeCategory
                });
            }
            
            setModalState('result');
        } catch (error: any) {
            setGeneratedResult(error.message || 'متاسفانه در برقراری ارتباط با مدل هوش مصنوعی خطایی رخ داد.');
            setParsedResult({
                title: 'خطا در ارتباط',
                text: error.message || 'متاسفانه در برقراری ارتباط با مدل هوش مصنوعی خطایی رخ داد.',
                imagePrompt: 'Glitchy technical error screens illustration',
                mediaType: activeCategory
            });
            setModalState('result');
        }
    };

    const handleSaveDocument = () => {
        if (setDocuments && parsedResult) {
            const finalImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(parsedResult.imagePrompt)}?width=800&height=600&nologo=true&seed=${imageSeed}`;
            const newDoc: Document = {
                id: `GEN-${Date.now()}`,
                title: parsedResult.title || `تولید هوشمند: ${generationType}`,
                type: parsedResult.mediaType === 'visual' ? 'image' : (parsedResult.mediaType === 'cinematic' ? 'video' : 'text'),
                category: 'تولیدات هوشمند',
                date: new Date().toLocaleDateString('fa-IR'),
                status: 'processed',
                tags: jobTags,
                thumbnail: finalImage,
                profileId: jobProfiles.length > 0 ? jobProfiles[0] : 'general',
                description: parsedResult.text,
                aiAnalysis: `تولید هنری هوشمند همراه تصاویر مینیاتوری سفارشی شده با تکنیک تصویرگری ${parsedResult.mediaType}. ثبت شده در بایگانی.`,
                extraMetadata: {
                    imagePrompt: parsedResult.imagePrompt,
                    mediaType: parsedResult.mediaType,
                    chapters: parsedResult.extraMetadata?.chapters,
                    videoScenes: parsedResult.extraMetadata?.videoScenes,
                }
            };
            setDocuments(prev => [newDoc, ...prev]);
            (window as any).alert('طرح هنری و بصری خلاقانه با موفقیت به همراه تصاویر اختصاصی مینیاتوری در بخش بایگانی اسناد ثبت گردید.');
        } else {
             (window as any).alert('محتوا با ویژگی فقط خواندنی ایجاد شده است.');
        }
        setIsModalOpen(false);
    };

    const savedCreations = useMemo(() => {
        return documents.filter(doc => doc.category === 'تولیدات هوشمند' || doc.id.startsWith('GEN-'));
    }, [documents]);

    const openSavedDocument = (doc: Document) => {
        setGenerationType(doc.title);
        setJobTags(doc.tags || []);
        setJobProfiles(doc.profileId && doc.profileId !== 'general' ? [doc.profileId] : []);
        setGeneratedResult(null);
        
        let mediaType = 'written';
        if (doc.type === 'image') mediaType = 'visual';
        else if (doc.type === 'video') mediaType = 'cinematic';

        const extra = doc.extraMetadata || {};

        setParsedResult({
            title: doc.title,
            text: doc.description || '',
            imagePrompt: extra.imagePrompt || `Concept illustration of ${doc.title}`,
            mediaType: extra.mediaType || mediaType,
            extraMetadata: {
                chapters: extra.chapters,
                videoScenes: extra.videoScenes
            }
        });

        setImageSeed(42);
        setSelectedChapterIdx(0);
        setIsPlaying(false);
        setVideoSceneIdx(0);
        setGrayscale(0);
        setSepia(0);
        setBrightness(100);
        setContrast(100);
        setIsNarrating(false);

        setModalState('result');
        setIsModalOpen(true);
    };

    const downloadDocText = (doc: Document) => {
        try {
            let fileContent = `=== ${doc.title} ===\n`;
            fileContent += `تاریخ ثبت: ${doc.date}\n`;
            fileContent += `تگ‌های مرتبط: ${doc.tags.join(', ')}\n\n`;
            
            if (doc.extraMetadata?.chapters) {
                doc.extraMetadata.chapters.forEach((ch: any, idx: number) => {
                    fileContent += `\n--- فصل ${localizeNumber(idx + 1, 'fa')}: ${ch.title} ---\n`;
                    fileContent += `${ch.content}\n`;
                });
            } else if (doc.extraMetadata?.videoScenes) {
                doc.extraMetadata.videoScenes.forEach((sc: any, idx: number) => {
                    fileContent += `\n--- سکانس ${localizeNumber(idx + 1, 'fa')} (${sc.time}) ---\n`;
                    fileContent += `تصویر سکانس: ${sc.visualDescription}\n`;
                    fileContent += `نریشن/دیالوگ: ${sc.narration}\n`;
                });
            } else {
                fileContent += `${doc.description}\n`;
            }

            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${doc.title}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            (window as any).alert('خطا در دانلود فایل مکتوب');
        }
    };

    const handleCopyText = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteCreation = (id: string) => {
        if (setDocuments && window.confirm('آیا از حذف این اثر آفرینش هوشمند از گالری و آرشیو اطمینان دارید؟')) {
            setDocuments(prev => prev.filter(doc => doc.id !== id));
        }
    };

    const closeModal = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsNarrating(false);
        setIsModalOpen(false);
    };

    const handleNarrate = (textToRead: string) => {
        if ('speechSynthesis' in window) {
            if (isNarrating) {
                window.speechSynthesis.cancel();
                setIsNarrating(false);
            } else {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.lang = 'fa-IR';
                utterance.rate = 0.95;
                utterance.onend = () => setIsNarrating(false);
                utterance.onerror = () => setIsNarrating(false);
                window.speechSynthesis.speak(utterance);
                setIsNarrating(true);
            }
        } else {
            (window as any).alert('مرورگر شما از قابلیت خوانش صوتی هوشمند پشتیبانی نمی‌کند.');
        }
    };

    const categories = [
        { id: 'cinematic', label: 'آثار ویدئویی و سینمایی', icon: Film, color: 'bg-blue-500' },
        { id: 'written', label: 'آثار مکتوب', icon: Book, color: 'bg-green-500' },
        { id: 'digital', label: 'آثار دیجیتال', icon: Gamepad2, color: 'bg-purple-500' },
        { id: 'visual', label: 'آثار تجسمی', icon: PaletteIcon, color: 'bg-amber-500' },
    ];

    const contentData = {
        cinematic: [
            { title: 'مستند تاریخی ایثار', icon: VideoIcon, desc: 'بازخوانی وقایع ایثار با استفاده از اسناد آرشیوی' },
            { title: 'فیلم داستانی (کوتاه/بلند)', icon: Clapperboard, desc: 'روایت سینمایی با دیالوگ‌نویسی از زندگی شهدا' },
            { title: 'سریال‌های تلویزیونی', icon: Tv, desc: 'سیناپس و چارچوب داستان دنباله‌دار' },
            { title: 'انیمیشن آموزشی', icon: MonitorPlay, desc: 'سناریوی جذاب بر پایه مفاهیم برای نوجوانان' },
        ],
        written: [
            { title: 'کتاب پژوهشی / مستند', icon: Library, desc: 'تدوین ساختار و نگارش فصول مرجع از روی اسناد' },
            { title: 'رمان مستند و بیوگرافی', icon: BookOpen, desc: 'روایت داستانی و ادبی قوی از زندگینامه' },
            { title: 'مجموعه شعر و دلنوشته', icon: ScrollText, desc: 'خلق ادبی متون حماسی و آیینی' },
            { title: 'نمایشنامه حرفه‌ای', icon: PenTool, desc: 'متن نمایشی دیالوگ‌محور برای اجرای صحنه' },
        ],
        digital: [
            { title: 'سناریو بازی رایانه‌ای', icon: Dices, desc: 'طراحی گیم‌پلی و روایت تعاملی عملیات‌ها' },
            { title: 'نقشه راه اپلیکیشن', icon: Smartphone, desc: 'ایده‌پردازی فیچرهای دیجیتال برای گوشی هوشمند' },
            { title: 'تجربه واقعیت مجازی (VR)', icon: Glasses, desc: 'طراحی فضاسازی محیطی و روایی ۳۶۰ درجه' },
            { title: 'محتوای فضای مجازی', icon: Layers, desc: 'تولید رشته توییت، کپشن و تقویم محتوایی' },
        ],
        visual: [
            { title: 'ایده نقاشی دیواری', icon: Brush, desc: 'مفهوم‌سازی تصویرسازی بزرگ همراه پالت رنگی' },
            { title: 'طرح مجسمه و المان', icon: Diamond, desc: 'توصیف جزئیات المان‌های شهری و تندیس مفاخر' },
            { title: 'ایدئولوژی عکاسی هنری', icon: Camera, desc: 'دکوپاژ صحنه‌های بازسازی‌شده برای عکاسی' },
            { title: 'طراحی پوستر گرافیکی', icon: LayoutTemplate, desc: 'شعارهای تبلیغاتی و ترکیب‌بندی هویت بصری' },
        ]
    };

    const toggleMainTag = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const toggleJobProfile = (id: string) => {
        setJobProfiles(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };
    
    const toggleJobTag = (tag: string) => {
        setJobTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const filteredTags = useMemo(() => {
        return tags.filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()));
    }, [tags, tagSearch]);

    const relatedDocsCount = useMemo(() => {
        if (selectedTags.length === 0) return 0;
        return documents.filter(doc => 
            doc.tags?.some(tag => selectedTags.includes(tag))
        ).length;
    }, [documents, selectedTags]);

    return (
        <div className="space-y-8 pb-10">
            {/* Hero Header */}
            <div className="bg-gradient-to-l from-[#1A5D1A] to-[#2A752A] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-right flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <PaletteIcon size={32} className="text-[#D4AF37]" />
                            </div>
                            <h1 className="text-4xl font-black text-white px-2">هوشمند نگارالبرز</h1>
                        </div>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-[#D4AF37] mb-6">هنری ماندگار چون کوه البرز</p>
                        <p className="text-lg opacity-80 leading-relaxed max-w-2xl">مرکز تخصصی تولید و آفرینش آثار هنری، مکتوب و دیجیتال بر پایه گنجینه عظیم اسناد ایثارگران استان البرز.</p>
                    </div>
                    <div className="w-full md:w-auto flex gap-4">
                        <div className="bg-black/20 backdrop-blur-xl p-6 rounded-3xl border border-white/10 text-center">
                            <span className="block text-4xl font-black text-[#D4AF37] mb-1">۴</span>
                            <span className="text-xs opacity-60">حوزه اصلی تولید</span>
                        </div>
                        <div className="bg-black/20 backdrop-blur-xl p-6 rounded-3xl border border-white/10 text-center">
                            <span className="block text-4xl font-black text-[#D4AF37] mb-1">{localizeNumber(selectedTags.length, 'fa')}</span>
                            <span className="text-xs opacity-60">تگ‌های مرتبط</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex flex-wrap gap-4">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id as ArtCategory)}
                        className={`flex-1 min-w-[200px] p-6 rounded-3xl font-bold transition-all flex flex-col items-center gap-3 border-2 ${
                            activeCategory === cat.id 
                            ? 'bg-white dark:bg-gray-800 border-[#1A5D1A] text-[#1A5D1A] shadow-xl dark:shadow-none translate-y-[-4px]' 
                            : 'bg-gray-50/50 dark:bg-gray-900 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        <div className={`p-3 rounded-2xl ${activeCategory === cat.id ? cat.color + ' text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            <cat.icon size={28} />
                        </div>
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Content Cards */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {contentData[activeCategory].map((item, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={idx}
                                className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft hover:shadow-xl transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl group-hover:scale-110 transition-transform">
                                        <item.icon size={24} className="text-[#1A5D1A] dark:text-[#D4AF37]" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{item.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button 
                                        type="button"
                                        onClick={() => openGenerationSettings(item.title)}
                                        className="text-xs font-bold bg-[#1A5D1A]/10 text-[#1A5D1A] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] px-4 py-2 rounded-xl flex items-center gap-1 hover:gap-2 transition-all hover:bg-[#1A5D1A]/20 dark:hover:bg-[#D4AF37]/20"
                                    >
                                        تنظیمات و سفارش تولید <ChevronRight size={14} className="rtl:rotate-180" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Featured Preview / Information */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-soft">
                        <div className="flex items-center gap-3 mb-6">
                            <Info size={24} className="text-[#D4AF37]" />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">توضیحاتی پیرامون فرآیند خلاقیت هوش مصنوعی</h3>
                        </div>
                        <p className="text-sm leading-8 text-gray-600 dark:text-gray-300 mb-6 font-medium">
                            هوشمند نگارالبرز با دریافت کلیدواژه‌ها، ارتباطات پرونده‌ای، مقالات، اسناد واقعی و دستورات خاص شما، از طریق مدل‌های پیشرفته زبانی اقدام به ایده‌پردازی، سناریونویسی و تولید محتوای کاملا بدیع و در عین حال مستند می‌نماید. محصولات تولیدی نهایی در پرونده‌ها قابل ثبت هستند.
                        </p>
                        <div className="relative aspect-video rounded-3xl overflow-hidden mb-6">
                            <img 
                                src="https://lh3.googleusercontent.com/d/1Xg6hM4GjQ9L7pUqN6vJ5_o3tTNYd_IuV" 
                                alt="Hooshmand Negar Creative Process" 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                                <div className="text-white">
                                    <p className="text-2xl font-black mb-2">تلفیق هوش مصنوعی و هنر متعهد</p>
                                    <p className="opacity-80 text-sm">تبدیل لحظات جاودانه نبرد به رمان‌های چندصد صفحه‌ای یا فیلم‌های نفس‌گیر</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pre-selection Tag Context List */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-soft border border-gray-100 dark:border-gray-700 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-[#1A5D1A] dark:text-yade-gold flex items-center gap-2">
                                <Tags size={24} /> راهنمای کانتکست
                            </h3>
                            {selectedTags.length > 0 && (
                                <button type="button" onClick={() => setSelectedTags([])} className="text-xs text-red-500 font-bold">حذف همه</button>
                            )}
                        </div>

                        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                            انتخاب این تگ‌ها کمک می‌کند تا وقتی روی «سفارش تولید» کلیک می‌کنید، تگ‌های مرتبط با نیازتان به صورت پیش‌فرض انتخاب شده باشند و نتایج دقیقی حاصل شود.
                        </p>

                        <div className="relative mb-6">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                placeholder="جستجوی تگ (عملیات، خاطره...)"
                                className="w-full pr-12 pl-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-2 focus:ring-[#1A5D1A] dark:focus:ring-[#D4AF37] outline-none text-right"
                                value={tagSearch}
                                onChange={(e) => setTagSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredTags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleMainTag(tag)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        selectedTags.includes(tag)
                                        ? 'bg-[#1A5D1A] text-white shadow-md'
                                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {selectedTags.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-3">
                                <span className="text-xs text-gray-400 font-bold block">مجموع آثار متناظر پرونده‌های آرشیو:</span>
                                <div className="text-xl font-black text-[#D4AF37]">{localizeNumber(relatedDocsCount, 'fa')} کانتکست فعال</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* گالری آثار آفرینش هوشمند */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-soft space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-50 dark:border-gray-700 pb-5">
                    <div>
                        <h2 className="text-2xl font-black text-[#1A5D1A] dark:text-[#D4AF37] flex items-center gap-2">
                            <Sparkles size={28} className="text-[#D4AF37] animate-pulse" /> بایگانی و گالری آثار آفرینش هوشمند البرز
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">نسخه‌های شبیه‌سازی شده فعال اسنادی شما جهت استفاده در قالب‌های رسانه‌ای رمان، فیلم و آثار هنری</p>
                    </div>
                    <div className="bg-[#1A5D1A]/10 text-[#1A5D1A] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] font-black text-xs px-4 py-2 rounded-2xl">
                        {localizeNumber(savedCreations.length, 'fa')} اثر خلاقانه ثبت‌شده
                    </div>
                </div>

                {savedCreations.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl space-y-4">
                        <PaletteIcon size={48} className="text-gray-300 dark:text-gray-600 mx-auto" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">هیچ اثر هنری یا ادبی هنوز ثبت نشده است</h3>
                            <p className="text-xs text-gray-400">یکی از ۴ حوزه اصلی تولیدات بالا در صفحه را برگزینید و با کلیک بر روی «سفارش تولید»، اولین اثرتان را بیافرینید.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedCreations.map((doc) => {
                            let cardColor = 'border-rose-500/20';
                            let iconColor = 'text-rose-500 bg-rose-500/10';
                            let label = 'طرح رسانه‌ای';
                            let Icon = ScrollText;
                            
                            if (doc.type === 'image') {
                                cardColor = 'border-emerald-500/20';
                                iconColor = 'text-emerald-500 bg-emerald-500/10';
                                label = 'طرح تجسمی و هنری';
                                Icon = Brush;
                            } else if (doc.type === 'video') {
                                cardColor = 'border-blue-500/20';
                                iconColor = 'text-blue-500 bg-blue-500/10';
                                label = 'سیناپس و سناریو خلاقانه';
                                Icon = Film;
                            } else {
                                cardColor = 'border-purple-500/20';
                                iconColor = 'text-purple-500 bg-purple-500/10';
                                label = 'اثر مکتوب و رمان';
                                Icon = BookOpen;
                            }

                            return (
                                <motion.div
                                    key={doc.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ y: -4 }}
                                    className={`bg-gray-50/50 dark:bg-gray-900 border-2 ${cardColor} rounded-3xl p-5 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden`}
                                >
                                    <div>
                                        {/* Header */}
                                        <div className="flex justify-between items-start gap-2 mb-4">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black ${iconColor}`}>
                                                <Icon size={12} /> {label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono">{doc.date}</span>
                                        </div>

                                        {/* Visual Thumbnail Preview if any */}
                                        {doc.thumbnail && (
                                            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-gray-200 dark:bg-gray-800 border dark:border-gray-800 relative group">
                                                <img 
                                                    src={doc.thumbnail} 
                                                    alt={doc.title} 
                                                    referrerPolicy="no-referrer"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                            </div>
                                        )}

                                        {/* Titles */}
                                        <h3 className="font-extrabold text-gray-800 dark:text-white text-base line-clamp-1 mb-2">{doc.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">{doc.description}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => openSavedDocument(doc)}
                                            className="px-3.5 py-2 text-xs font-black bg-[#1A5D1A] text-white rounded-xl hover:bg-green-800 transition-all flex items-center gap-1"
                                            title="بازگشایی در پلیر تعاملی هوش مصنوعی جهت بازپخش سناریو و دکلمه صوتی"
                                        >
                                            <Play size={12} fill="currentColor" /> پخش هوشمند
                                        </button>

                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => downloadDocText(doc)}
                                                className="p-2 text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border-b-2 flex items-center justify-center"
                                                title="دانلود کل متن سناریو و فصول مکتوب"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyText(doc.id, doc.description || '')}
                                                className="p-2 text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-center min-w-[34px]"
                                                title="کپی متن خلاقانه در کلیپ‌بورد"
                                            >
                                                {copiedId === doc.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCreation(doc.id)}
                                                className="p-2 text-rose-500 hover:text-white bg-white dark:bg-gray-800 hover:bg-rose-500 border border-rose-100 dark:border-rose-950 rounded-xl transition-all flex items-center justify-center"
                                                title="حذف کامل این اثر از آرشیو"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-gray-900 rounded-[40px] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative border border-gray-100 dark:border-gray-800"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/80">
                                <h3 className="font-black text-[#1A5D1A] dark:text-[#D4AF37] flex items-center gap-2 text-xl">
                                    <Sparkles size={24} />
                                    اتاق تولید هوشمند: {generationType}
                                </h3>
                                <button type="button" onClick={closeModal} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-gray-900">
                                {modalState === 'setup' && (
                                    <div className="space-y-8 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Attributes Section */}
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                        <Tags size={16} className="text-[#D4AF37]"/> کلیدواژه‌ها (مرجع اسناد)
                                                    </label>
                                                    <div className="flex flex-wrap gap-2 p-4 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 max-h-48 overflow-y-auto">
                                                        {tags.map((tag) => (
                                                            <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={() => toggleJobTag(tag)}
                                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                                    jobTags.includes(tag)
                                                                    ? 'bg-[#1A5D1A] text-white'
                                                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                                                }`}
                                                            >
                                                                {tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
 
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                        <User size={16} className="text-[#D4AF37]"/> انتخاب پرونده اشخاص (قهرمانان داستان)
                                                    </label>
                                                    <div className="flex flex-col gap-2 p-4 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 max-h-48 overflow-y-auto">
                                                        {MOCK_PROFILES.map((profile) => (
                                                            <label key={profile.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="w-4 h-4 rounded text-[#1A5D1A] focus:ring-[#1A5D1A]"
                                                                    checked={jobProfiles.includes(profile.id)}
                                                                    onChange={() => toggleJobProfile(profile.id)}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{profile.name} {profile.family}</span>
                                                                    <span className="text-[10px] text-gray-500">کدملی: {localizeNumber(profile.nationalCode, 'fa')} - {profile.category}</span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
 
                                            {/* Custom Prompt Section */}
                                            <div className="space-y-4 flex flex-col h-full">
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                                                    <PenTool size={16} className="text-[#D4AF37]"/> توضیحات تکمیلی و ایده‌های شما
                                                </label>
                                                <p className="text-[11px] text-gray-500 leading-relaxed mb-1">
                                                    در این بخش مشخص کنید که دقیقاً چه می‌خواهید. برای مثال «یک نمایشنامه دونفره که در سنگر رخ می‌دهد، یکی از مبارزان مجروح شده و نفر دوم سعی دارد او را بیدار نگه دارد.» این توضیحات به شدت روی خروجی هوش مصنوعی تأثیر می‌گذارد.
                                                </p>
                                                <textarea 
                                                    className="w-full flex-1 min-h-[150px] p-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#1A5D1A] resize-none text-sm leading-7 dark:text-white"
                                                    placeholder="شرح دقیق نیاز خود را اینجا بنویسید..."
                                                    value={jobPrompt}
                                                    onChange={(e) => setJobPrompt(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
 
                                {modalState === 'generating' && (
                                    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 animate-fade-in">
                                        <Loader2 size={48} className="animate-spin text-[#D4AF37]" />
                                        <div className="space-y-1 text-gray-500">
                                            <p className="font-bold text-gray-800 dark:text-gray-200">در حال آفرینش مستندات هنری...</p>
                                            <p className="text-sm">این فرآیند به طور مستقیم به مدل‌های تولید تصویر و متن خلاقانه متصل است.</p>
                                        </div>
                                    </div>
                                )}
 
                                {modalState === 'result' && parsedResult && (
                                    <div className="space-y-8 animate-fade-in">
                                        <div className="text-right pb-4 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-xs font-bold text-gray-400">محصول آفرینش هوشمند</span>
                                            <h2 className="text-2xl font-black text-[#1a5d1a] dark:text-[#D4AF37] mt-1">{parsedResult.title}</h2>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                                            {/* Left Column: Rich Interactive Media Preview Hub */}
                                            <div className="lg:col-span-5 space-y-4">
                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 text-center flex flex-col justify-between h-full min-h-[380px]">
                                                    {parsedResult.mediaType === 'visual' && (
                                                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                                                            <div className="space-y-1">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500">
                                                                    <PaletteIcon size={12} /> بوم نقاشی و اثر تجسمی
                                                                </span>
                                                            </div>

                                                            <div className="relative aspect-square max-h-[220px] mx-auto rounded-2xl overflow-hidden shadow-lg border-4 border-amber-900/10 flex items-center justify-center bg-gray-100 dark:bg-gray-900 group">
                                                                <img 
                                                                    src={`https://image.pollinations.ai/prompt/${encodeURIComponent(parsedResult.imagePrompt)}?width=600&height=600&nologo=true&seed=${imageSeed}`}
                                                                    alt={parsedResult.title}
                                                                    referrerPolicy="no-referrer"
                                                                    className="w-full h-full object-cover transition-all duration-300 pointer-events-none"
                                                                    style={{
                                                                        filter: `grayscale(${grayscale}%) sepia(${sepia}%) brightness(${brightness}%) contrast(${contrast}%)`
                                                                    }}
                                                                />
                                                                <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-xs py-1 px-3 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    تکنیک مینیاتور دیجیتال هوشمند
                                                                </div>
                                                            </div>

                                                            {/* Filters Setup */}
                                                            <div className="space-y-2.5 pt-2 text-right">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="font-bold text-gray-500 dark:text-gray-400">گرادیان سیاه و سفید</span>
                                                                    <input 
                                                                        type="range" 
                                                                        min="0" max="100" 
                                                                        className="w-24 accent-[#1a5d1a]"
                                                                        value={grayscale} 
                                                                        onChange={(e) => setGrayscale(Number(e.target.value))}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="font-bold text-gray-500 dark:text-gray-400">افکت سپیا (کهنه‌نما)</span>
                                                                    <input 
                                                                        type="range" 
                                                                        min="0" max="100" 
                                                                        className="w-24 accent-[#1a5d1a]"
                                                                        value={sepia} 
                                                                        onChange={(e) => setSepia(Number(e.target.value))}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="font-bold text-gray-500 dark:text-gray-400">تضاد نوری (کنتراست)</span>
                                                                    <input 
                                                                        type="range" 
                                                                        min="50" max="150" 
                                                                        className="w-24 accent-[#1a5d1a]"
                                                                        value={contrast} 
                                                                        onChange={(e) => setContrast(Number(e.target.value))}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2 pt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setImageSeed(Math.floor(Math.random() * 100000))}
                                                                    className="flex-1 py-2 text-xs font-bold bg-[#1A5D1A]/10 text-[#1A5D1A] dark:text-white dark:bg-[#1A5D1A]/50 rounded-xl hover:bg-[#1A5D1A]/20 transition-all flex items-center justify-center gap-1.5"
                                                                >
                                                                    <RotateCw size={14} className="animate-spin-slow" /> تولید مدل بصری نو
                                                                </button>
                                                                <a
                                                                    href={`https://image.pollinations.ai/prompt/${encodeURIComponent(parsedResult.imagePrompt)}?width=1024&height=768&nologo=true&seed=${imageSeed}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-white rounded-xl flex items-center justify-center"
                                                                    title="دریافت تصویر کامل"
                                                                >
                                                                    <Download size={14} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {parsedResult.mediaType === 'written' && (
                                                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                                                            <div>
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 mb-1">
                                                                    <BookOpen size={12} /> کتابخوان دیجیتال و دیوان صوتی
                                                                </span>
                                                                <p className="text-[10px] text-gray-400">دارای قابلیت ورق زدن الکترونیکی</p>
                                                            </div>

                                                            <div className="relative border-2 border-emerald-900/10 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-inner text-right space-y-3 flex-1 flex flex-col justify-between py-6">
                                                                {parsedResult.extraMetadata?.chapters?.[selectedChapterIdx] ? (
                                                                    <div className="space-y-2 animate-fade-in flex-1">
                                                                        <h4 className="font-extrabold text-sm text-emerald-800 dark:text-[#D4AF37] border-b border-gray-100 dark:border-gray-800 pb-1.5">
                                                                            {parsedResult.extraMetadata.chapters[selectedChapterIdx].title}
                                                                        </h4>
                                                                        <p className="text-[11px] leading-6 text-gray-600 dark:text-gray-300 max-h-[140px] overflow-y-auto custom-scrollbar">
                                                                            {parsedResult.extraMetadata.chapters[selectedChapterIdx].content}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="my-auto text-center text-xs text-gray-400">طرح کتاب کامل در حال تدوین است</div>
                                                                )}

                                                                <div className="flex justify-between items-center font-mono text-[10px] text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                                    <span>صفحه {selectedChapterIdx + 1} از {parsedResult.extraMetadata?.chapters?.length || 1}</span>
                                                                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">آرشیو البرز</span>
                                                                </div>
                                                            </div>

                                                            {/* Chapter Toggles */}
                                                            <div className="flex gap-1 overflow-x-auto py-1 justify-center custom-scrollbar">
                                                                {parsedResult.extraMetadata?.chapters?.map((ch, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        onClick={() => setSelectedChapterIdx(idx)}
                                                                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all shrink-0 ${
                                                                            selectedChapterIdx === idx 
                                                                            ? 'bg-emerald-600 text-white shadow-md'
                                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'
                                                                        }`}
                                                                    >
                                                                        {ch.title.substring(0, 15)}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleNarrate(parsedResult.extraMetadata?.chapters?.[selectedChapterIdx]?.content || parsedResult.text)}
                                                                className={`w-full py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                                                                    isNarrating 
                                                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                                                                }`}
                                                            >
                                                                {isNarrating ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                                {isNarrating ? 'توقف خوانش صوتی کتاب' : 'شنیدن خوانش صوتی بخش'}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {parsedResult.mediaType === 'cinematic' && (
                                                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                                                            <div>
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-500 mb-1">
                                                                    <Clapperboard size={12} /> سینما نگار و سناریو ساز صوتی
                                                                </span>
                                                                <p className="text-[10px] text-gray-400">نمایشگر فریم به فریم و تحلیل همگام سنگر</p>
                                                            </div>

                                                            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-700 bg-black flex items-center justify-center">
                                                                {/* Dynamic video scene backdrop */}
                                                                <img 
                                                                    src={`https://image.pollinations.ai/prompt/${encodeURIComponent(parsedResult.extraMetadata?.videoScenes?.[videoSceneIdx]?.visualDescription || parsedResult.imagePrompt)}?width=600&height=340&nologo=true&seed=${imageSeed + videoSceneIdx}`}
                                                                    alt="Video Frame"
                                                                    referrerPolicy="no-referrer"
                                                                    className={`absolute inset-0 w-full h-full object-cover opacity-85 transition-transform duration-1000 ${
                                                                        isPlaying ? 'scale-110 translate-y-1' : 'scale-100'
                                                                    }`}
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30 flex flex-col justify-between p-3.5 z-10 text-right">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase">LIVE ACTION</span>
                                                                        <span className="font-mono text-[10px] text-blue-400">{parsedResult.extraMetadata?.videoScenes?.[videoSceneIdx]?.time || '00:00'}</span>
                                                                    </div>
                                                                    
                                                                    {/* Synced Narration Overlay Subtitles */}
                                                                    <div className="bg-black/75 p-2.5 rounded-xl border border-white/5 backdrop-blur-xs text-center border-b-2 border-blue-500">
                                                                        <p className="text-[10px] text-gray-300 font-medium">دیالوگ / نریشن همزمان:</p>
                                                                        <p className="text-xs text-white font-extrabold mt-1">
                                                                            {parsedResult.extraMetadata?.videoScenes?.[videoSceneIdx]?.narration || "در حال لود سکانس..."}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Controls */}
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center text-xs text-gray-400 pt-1">
                                                                    <span>سکانس {videoSceneIdx + 1} از {parsedResult.extraMetadata?.videoScenes?.length || 1}</span>
                                                                </div>
                                                                <div className="flex gap-1.5 justify-center">
                                                                    {parsedResult.extraMetadata?.videoScenes?.map((sc, sIdx) => (
                                                                        <button
                                                                            key={sIdx}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setVideoSceneIdx(sIdx);
                                                                                setIsPlaying(true);
                                                                                if (isNarrating) handleNarrate(sc.narration);
                                                                            }}
                                                                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                                                                                videoSceneIdx === sIdx 
                                                                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'
                                                                            }`}
                                                                        >
                                                                            {sc.time}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsPlaying(!isPlaying);
                                                                        if (!isPlaying) {
                                                                            handleNarrate(parsedResult.extraMetadata?.videoScenes?.[videoSceneIdx]?.narration || parsedResult.text);
                                                                        } else {
                                                                            if ('speechSynthesis' in window) {
                                                                                window.speechSynthesis.cancel();
                                                                                setIsNarrating(false);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                                                        isPlaying ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                                                                    }`}
                                                                >
                                                                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                                                    {isPlaying ? 'توقف پخش سکانس' : 'پخش دکلمه و انیمیشن سکانس'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {parsedResult.mediaType === 'digital' && (
                                                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                                                            <div>
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-500 mb-1">
                                                                    <Smartphone size={12} /> مدل‌ساز تعاملی و اپ گراف
                                                                </span>
                                                                <p className="text-[10px] text-gray-400">قابلیت شبیه‌سازی قابلیت‌های دیجیتال</p>
                                                            </div>

                                                            {/* Interactive Mobile outline */}
                                                            <div className="relative mx-auto w-[180px] aspect-[9/16] rounded-3xl border-4 border-gray-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden flex flex-col justify-between p-3.5 text-right font-sans">
                                                                <div className="h-2 w-12 bg-gray-800 rounded-full mx-auto mb-2"></div>
                                                                
                                                                <div className="flex-grow flex flex-col justify-center space-y-2 text-center my-auto">
                                                                    <div className="p-2 bg-purple-500/10 rounded-xl inline-block mx-auto border border-purple-500/20">
                                                                        <Gamepad2 size={24} className="text-purple-600" />
                                                                    </div>
                                                                    <h5 className="text-[10px] font-black dark:text-white line-clamp-1">{parsedResult.title}</h5>
                                                                    <p className="text-[8px] text-gray-400 dark:text-gray-400 px-1 line-clamp-4">شبیه‌ساز هوشمند آثار و پرونده‌های ایثارگران استان البرز</p>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
                                                                    <div className="h-1.5 bg-purple-500 rounded-full w-2/3"></div>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => (window as any).alert(`بخش شبیه‌ساز ${parsedResult.title} با موفقیت تست عملکردی شد.`)}
                                                                        className="w-full py-1 text-[8px] font-bold bg-[#1A5D1A] text-white rounded-lg hover:bg-green-800"
                                                                    >
                                                                        اجرای کانتکست موبایل
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <p className="text-[9px] text-gray-400">ایده‌پردازی الگوهای تعاملی تلفیق با سامانه اسناد</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Column: Detailed Text Narrative and Synopses */}
                                            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft text-right h-full flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        <h3 className="font-extrabold text-lg text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-50 dark:border-gray-700 pb-3">
                                                            <PenTool size={18} className="text-[#D4AF37]" /> شرح سناریو و جزئیات ادبی طرح
                                                        </h3>
                                                        <div className="markdown-body prose dark:prose-invert max-w-none text-sm leading-8 text-gray-600 dark:text-gray-300 max-h-[280px] overflow-y-auto pr-1.5 custom-scrollbar">
                                                            <ReactMarkdown>{parsedResult.text}</ReactMarkdown>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex flex-wrap gap-3 items-center justify-between">
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <Compass size={12} /> موقعیت معنوی: با کانتکست اسناد آرشیوی استان البرز
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleNarrate(parsedResult.text)}
                                                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                                                                isNarrating 
                                                                ? 'bg-red-500 text-white' 
                                                                : 'bg-[#1a5d1a]/10 text-[#1a5d1a] border border-[#1a5d1a]/20 hover:bg-[#1a5d1a]/20 dark:text-white'
                                                            }`}
                                                        >
                                                            {isNarrating ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                            {isNarrating ? 'توقف خواندن دیالوگ' : 'شنیدن صدای دکلمه خوان هوشمند'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex gap-4">
                                {modalState === 'setup' && (
                                    <>
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                                            انصراف
                                        </button>
                                        <button 
                                            type="button"
                                            className="flex-[2] py-4 bg-[#1A5D1A] text-white rounded-2xl font-bold hover:bg-green-800 transition-all shadow-lg flex items-center justify-center gap-2"
                                            onClick={handleStartGeneration}
                                        >
                                            <Sparkles size={20} /> شروع آفرینش هوشمند
                                        </button>
                                    </>
                                )}
                                
                                {modalState === 'result' && (
                                    <>
                                        <button type="button" onClick={() => setModalState('setup')} className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                                            تغییر تنظیمات و تولید مجدد
                                        </button>
                                        <button 
                                            type="button"
                                            className="flex-[2] py-4 bg-[#D4AF37] text-white rounded-2xl font-bold hover:bg-yellow-600 transition-all shadow-lg flex items-center justify-center gap-2"
                                            onClick={handleSaveDocument}
                                        >
                                            <Save size={20} /> ذخیره محصول نهایی در آرشیو
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HooshmandNegar;
