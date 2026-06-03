
import React, { useState, useRef } from 'react';
import { performOCR, analyzeFaces, autoCategorize, analyzeSentiment, performImageMatch, analyzeVideoWithReference, searchInternalArchive } from '../services/geminiService';
import { Upload, FileText, Smile, Tag, Loader2, AlertCircle, CheckCircle2, Copy, Video, ScanFace, Key, Search, Save, UserCheck, FolderInput, Database, Server, Network } from 'lucide-react';
import { MOCK_PROFILES, MOCK_DOCUMENTS } from '../data';
import { Document, DocumentType } from '../types';

type ProcessorMode = 'ocr' | 'face' | 'category' | 'sentiment' | 'face-video' | 'image-match' | 'internal-search';

interface AIProcessorProps {
    onSaveDocument: (doc: Document) => void;
}

const AIProcessor: React.FC<AIProcessorProps> = ({ onSaveDocument }) => {
    const [mode, setMode] = useState<ProcessorMode>(() => (localStorage.getItem('ai_mode') as ProcessorMode) || 'ocr');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [refImageUrl, setRefImageUrl] = useState<string | null>(null);
    const [result, setResult] = useState<string>(() => localStorage.getItem('ai_result') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const refImageInputRef = useRef<HTMLInputElement>(null);
    const [sentimentText, setSentimentText] = useState(() => localStorage.getItem('ai_sentimentText') || '');
    const [imageMatchQuery, setImageMatchQuery] = useState(() => localStorage.getItem('ai_imageMatchQuery') || '');
    const [repoPath, setRepoPath] = useState(() => localStorage.getItem('ai_repoPath') || '\\\\192.168.10.5\\Yadegaran_Archive'); 
    const [groundingUrls, setGroundingUrls] = useState<string[]>(() => {
        const saved = localStorage.getItem('ai_groundingUrls');
        return saved ? JSON.parse(saved) : [];
    });

    // Save to Archive State
    const [showSaveForm, setShowSaveForm] = useState(() => localStorage.getItem('ai_showSaveForm') === 'true');
    const [saveDraft, setSaveDraft] = useState<{
        profileId: string;
        title: string;
        category: string;
        description: string;
    }>(() => {
        const saved = localStorage.getItem('ai_saveDraft');
        return saved ? JSON.parse(saved) : { profileId: '', title: '', category: 'سایر', description: '' };
    });

    // 1. Persist Light State (Fast)
    React.useEffect(() => {
        try {
            localStorage.setItem('ai_mode', mode);
            localStorage.setItem('ai_result', result);
            localStorage.setItem('ai_sentimentText', sentimentText);
            localStorage.setItem('ai_imageMatchQuery', imageMatchQuery);
            localStorage.setItem('ai_repoPath', repoPath);
            localStorage.setItem('ai_groundingUrls', JSON.stringify(groundingUrls));
            localStorage.setItem('ai_showSaveForm', String(showSaveForm));
            localStorage.setItem('ai_saveDraft', JSON.stringify(saveDraft));
        } catch (e) {
            console.warn("Storage limit reached for AI settings");
        }
    }, [mode, result, sentimentText, imageMatchQuery, repoPath, groundingUrls, showSaveForm, saveDraft]);

    const resetState = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (refImageUrl) URL.revokeObjectURL(refImageUrl);
        setSelectedFile(null);
        setReferenceImage(null);
        setPreviewUrl(null);
        setRefImageUrl(null);
        setResult('');
        setError(null);
        setSentimentText('');
        setImageMatchQuery('');
        setRepoPath('\\\\192.168.10.5\\Yadegaran_Archive');
        setGroundingUrls([]);
        setShowSaveForm(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isRef: boolean = false) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            if (isRef) {
                if (refImageUrl) URL.revokeObjectURL(refImageUrl);
                setReferenceImage(file);
                setRefImageUrl(url);
            } else {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setSelectedFile(file);
                setPreviewUrl(url);
            }
        }
    };

    const handleProcess = async () => {
        setLoading(true);
        setError(null);
        setResult('');
        setGroundingUrls([]);
        setShowSaveForm(false);

        // Client-side size validation to prevent XHR errors
        if (mode === 'internal-search' && selectedFile && selectedFile.size > 4 * 1024 * 1024) {
             setError("حجم فایل برای پردازش آنلاین نباید بیشتر از ۴ مگابایت باشد.");
             setLoading(false);
             return;
        }

        try {
            let res = '';
            let urls: string[] = [];

            // Explicit file checks
            if (['ocr', 'face', 'category', 'image-match', 'internal-search'].includes(mode) && !selectedFile) {
                throw new Error("لطفاً ابتدا فایل مورد نظر را انتخاب کنید.");
            }

            switch (mode) {
                case 'ocr':
                    if (selectedFile) res = await performOCR(selectedFile);
                    break;
                case 'face':
                    if (selectedFile) res = await analyzeFaces(selectedFile);
                    break;
                case 'category':
                    if (selectedFile) res = await autoCategorize(selectedFile);
                    break;
                case 'sentiment':
                    if (sentimentText) res = await analyzeSentiment(sentimentText);
                    break;
                case 'face-video':
                    if (selectedFile && referenceImage) {
                        res = await analyzeVideoWithReference(selectedFile, referenceImage);
                    } else {
                        throw new Error("لطفاً هم فایل ویدئو و هم تصویر مرجع را بارگذاری کنید.");
                    }
                    break;
                case 'image-match':
                    if (selectedFile && imageMatchQuery) {
                       const matchResult = await performImageMatch(selectedFile, imageMatchQuery);
                       res = matchResult.text;
                       urls = matchResult.urls;
                    } else {
                        throw new Error("لطفاً هم تصویر و هم عبارت جستجو را وارد کنید.");
                    }
                    break;
                case 'internal-search':
                    if (selectedFile && repoPath) {
                        res = await searchInternalArchive(selectedFile, repoPath);
                    } else {
                        throw new Error("لطفاً فایل و مسیر مخزن را مشخص کنید.");
                    }
                    break;
            }
            setResult(res);
            setGroundingUrls(urls);
        } catch (err: any) {
            setError(err.message || 'خطا در ارتباط با سرویس هوشمند. لطفا مجدد تلاش کنید.');
        } finally {
            setLoading(false);
        }
    };

    const initSaveDraft = () => {
        let suggestedProfileId = '';
        // Simple heuristic to find profile name in result text
        const foundProfile = MOCK_PROFILES.find(p => result.includes(p.family) || result.includes(p.name));
        if (foundProfile) suggestedProfileId = foundProfile.id;

        // Guess category based on mode
        let cat = 'سایر';
        if (mode === 'ocr') cat = 'اسناد متنی';
        if (mode === 'face' || mode === 'image-match') cat = 'تصاویر';
        if (mode === 'face-video') cat = 'ویدیو';
        if (mode === 'internal-search') cat = 'سند آرشیوی';

        setSaveDraft({
            profileId: suggestedProfileId,
            title: selectedFile?.name || 'سند پردازش شده',
            category: cat,
            description: result.substring(0, 500) + (result.length > 500 ? '...' : '') // Truncate for description
        });
        setShowSaveForm(true);
    };

    const handleFinalSave = async () => {
        if(!saveDraft.profileId) {
            alert('لطفا پرونده شهید را انتخاب کنید');
            return;
        }
        
        setLoading(true);
        let finalThumbnail = undefined;

        // Try to generate a small base64 thumbnail for persistence
        if (selectedFile && selectedFile.type.includes('image')) {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.src = previewUrl || '';
                await new Promise((resolve) => { img.onload = resolve; });
                
                // Downscale for archive (max 200px)
                const scale = Math.min(200 / img.width, 200 / img.height, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                finalThumbnail = canvas.toDataURL('image/jpeg', 0.7);
            } catch (e) {
                console.warn("Could not generate thumbnail", e);
            }
        }

        let docType: DocumentType = 'text';
        if (mode === 'face-video') docType = 'video';
        else if (mode === 'ocr' || mode === 'sentiment') docType = 'text';
        else if (selectedFile?.type.includes('video')) docType = 'video';
        else docType = 'image';

        const newDoc: Document = {
            id: `DOC-AI-${Date.now()}`,
            title: saveDraft.title,
            type: docType,
            category: saveDraft.category,
            date: new Date().toLocaleDateString('fa-IR'),
            status: 'processed',
            tags: ['هوشمند', 'AI_Processed'],
            profileId: saveDraft.profileId,
            description: saveDraft.description,
            thumbnail: finalThumbnail
        };
        
        onSaveDocument(newDoc);
        setLoading(false);
        alert('سند با موفقیت به پرونده آرشیو اضافه شد.');
        setShowSaveForm(false);
        // Clear AI storage after successful save
        localStorage.removeItem('ai_result');
        localStorage.removeItem('ai_showSaveForm');
        localStorage.removeItem('ai_saveDraft');
        setResult('');
    };

    const modes = [
        { id: 'ocr', label: 'OCR آنلاین', icon: FileText, desc: 'تبدیل تصویر به متن' },
        { id: 'face', label: 'تحلیل چهره (تصویر)', icon: Smile, desc: 'تحلیل سن و احساسات' },
        { id: 'face-video', label: 'تشخیص چهره (ویدئو)', icon: ScanFace, desc: 'شناسایی فرد در ویدئو' },
        { id: 'image-match', label: 'تطبیق چهره (جستجو)', icon: Search, desc: 'جستجو و تطبیق تصویر با ایثارگر' },
        { id: 'internal-search', label: 'جستجوی مخزن داخلی', icon: Database, desc: 'آنالیز سند + جستجوی اینترنت + تطبیق دیتابیس' },
        { id: 'category', label: 'دسته‌بندی هوشمند', icon: Tag, desc: 'تشخیص نوع سند' },
        { id: 'sentiment', label: 'تحلیل احساس (متن)', icon: Smile, desc: 'تحلیل عاطفی خاطرات' },
    ];

    const isProcessButtonDisabled = () => {
        if(loading) return true;
        if(mode === 'sentiment') return !sentimentText;
        if(mode === 'face-video') return !selectedFile || !referenceImage;
        if(mode === 'image-match') return !selectedFile || !imageMatchQuery;
        if(mode === 'internal-search') return !selectedFile || !repoPath;
        return !selectedFile;
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
            {/* Control Panel */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-[#1A5D1A] dark:text-yade-gold mb-4">انتخاب ماژول پردازشی</h3>
                    <div className="space-y-3">
                        {modes.map((m) => (
                            <button 
                                key={m.id} 
                                type="button"
                                onClick={(e) => { e.preventDefault(); setMode(m.id as ProcessorMode); }} 
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${mode === m.id ? 'bg-[#1A5D1A] text-white shadow-lg shadow-green-900/20' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                            >
                                <m.icon size={20} />
                                <div className="text-right">
                                    <span className="block font-bold text-sm">{m.label}</span>
                                    <span className={`block text-xs ${mode === m.id ? 'text-green-100' : 'text-gray-400 dark:text-gray-500'}`}>{m.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-[#1A5D1A] dark:text-yade-gold mb-4">ورودی اطلاعات</h3>
                    
                    {mode === 'sentiment' && (
                         <textarea className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none resize-none text-sm" placeholder="متن خاطره، نامه یا وصیت‌نامه را اینجا وارد کنید..." value={sentimentText} onChange={(e) => setSentimentText(e.target.value)} />
                    )}
                    
                    {mode === 'face-video' && (
                        <div className="mb-4">
                            <label className="text-sm font-bold mb-2 block">تصویر مرجع (شخص)</label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-[#1A5D1A]" onClick={() => refImageInputRef.current?.click()}>
                                {refImageUrl ? <img src={refImageUrl} alt="Reference" className="max-h-24 mx-auto rounded-lg" /> : <span className="text-xs text-gray-400">برای بارگذاری کلیک کنید</span>}
                            </div>
                            <input type="file" ref={refImageInputRef} className="hidden" onChange={(e) => handleFileSelect(e, true)} accept="image/*" />
                        </div>
                    )}
                    
                    {mode === 'image-match' && (
                        <div className="mb-4">
                            <label className="text-sm font-bold mb-2 block">نام و مشخصات ایثارگر برای جستجو</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none text-sm" 
                                placeholder="مثال: شهید مهدی باکری، جانباز علیرضا محمدی"
                                value={imageMatchQuery}
                                onChange={(e) => setImageMatchQuery(e.target.value)}
                            />
                        </div>
                    )}

                    {mode === 'internal-search' && (
                        <div className="mb-4">
                            <label className="text-sm font-bold mb-2 block flex items-center gap-2"><Server size={16}/> مسیر مخزن (IP/URL)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none text-sm ltr font-mono" 
                                    placeholder="\\Server\Path or https://archive..."
                                    value={repoPath}
                                    onChange={(e) => setRepoPath(e.target.value)}
                                />
                                <Network size={18} className="absolute left-3 top-3.5 text-gray-400"/>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">سیستم فایل آپلود شده را تحلیل (OCR/Vision)، سپس در اینترنت راستی‌آزمایی و نهایتاً با پروفایل‌های موجود تطبیق می‌دهد.</p>
                        </div>
                    )}

                    {['ocr', 'face', 'category', 'face-video', 'image-match', 'internal-search'].includes(mode) && (
                        <div>
                            <label className="text-sm font-bold mb-2 block">{mode === 'face-video' ? 'فایل ویدئو' : 'فایل سند (تصویر/متن/ویدئو)'}</label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-[#1A5D1A] transition-all group" onClick={() => fileInputRef.current?.click()}>
                                {previewUrl ? (mode === 'face-video' || selectedFile?.type.includes('video') ? <div className="text-center text-gray-500"><Video size={40} className="mx-auto mb-2"/> <p className="text-xs break-all">{selectedFile?.name}</p></div> : <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />) : (
                                    <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform"><Upload size={32} className="group-hover:text-[#1A5D1A]" /></div>
                                        <span className="text-sm font-medium">برای بارگذاری کلیک کنید</span>
                                        <span className="text-xs">{mode === 'face-video' ? 'MP4, AVI' : 'JPG, PNG, MP4, PDF'}</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e, false)} accept={mode === 'face-video' ? 'video/*' : undefined} />
                        </div>
                    )}

                    <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleProcess(); }} 
                        disabled={isProcessButtonDisabled()} 
                        className={`w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isProcessButtonDisabled() ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#D4AF37] text-white hover:bg-[#b8962e] shadow-lg shadow-yellow-900/20 hover:scale-[1.02]'}`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                        {loading ? 'در حال پردازش...' : 'اجرای پردازش هوشمند'}
                    </button>
                </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 h-full p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <h3 className="text-xl font-bold text-[#2A5CAA] dark:text-blue-400 flex items-center gap-2">
                            <ActivityIcon mode={mode} />
                            نتایج تحلیل
                        </h3>
                        {result && (<button type="button" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(result); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"><Copy size={16} />کپی متن</button>)}
                    </div>
                    
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 overflow-y-auto min-h-[400px] border border-gray-100 dark:border-gray-800 relative">
                        {loading ? (<div className="h-full flex flex-col items-center justify-center text-[#1A5D1A] dark:text-[#D4AF37] gap-4"><Loader2 size={48} className="animate-spin" /><p className="font-bold">هوش مصنوعی در حال تحلیل داده‌ها است...</p><p className="text-xs text-gray-400">لطفا شکیبا باشید</p></div>) : 
                        error ? (<div className="h-full flex flex-col items-center justify-center text-red-500 gap-4"><AlertCircle size={48} /><p className="font-bold text-center">{error}</p></div>) : 
                        result ? (
                            <>
                                <div className="prose prose-sm max-w-none text-right dark:prose-invert mb-8" dir="rtl">
                                    <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 leading-8 text-base bg-transparent border-none p-0">{result}</pre>
                                    {groundingUrls.length > 0 && (
                                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <h4 className="font-bold text-base mb-2">منابع:</h4>
                                            <ul className="list-disc pr-6 space-y-1">
                                                {groundingUrls.map((url, index) => (
                                                    <li key={index}><a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400 text-sm break-all">{url}</a></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Save to Archive Section */}
                                <div className="mt-6 border-t-2 border-dashed border-gray-200 dark:border-gray-700 pt-6">
                                    {!showSaveForm ? (
                                        <div className="flex justify-center">
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); initSaveDraft(); }} 
                                                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-900/20 hover:bg-green-700 transition-all flex items-center gap-2 animate-bounce-custom"
                                            >
                                                <FolderInput size={20} />
                                                بررسی و افزودن به آرشیو
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 animate-fade-in-up">
                                            <h4 className="font-bold text-[#2A5CAA] dark:text-blue-300 mb-4 flex items-center gap-2">
                                                <Save size={18} />
                                                ذخیره سند در پرونده ایثارگر
                                            </h4>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">انتخاب پرونده (پیشنهاد هوشمند)</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-[#2A5CAA]"
                                                            value={saveDraft.profileId}
                                                            onChange={(e) => setSaveDraft({...saveDraft, profileId: e.target.value})}
                                                        >
                                                            <option value="">-- انتخاب کنید --</option>
                                                            {MOCK_PROFILES.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name} {p.family} - {p.nationalCode}</option>
                                                            ))}
                                                        </select>
                                                        {saveDraft.profileId && <UserCheck size={18} className="absolute left-3 top-3.5 text-green-500" />}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">عنوان سند</label>
                                                        <input 
                                                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-[#2A5CAA]"
                                                            value={saveDraft.title}
                                                            onChange={(e) => setSaveDraft({...saveDraft, title: e.target.value})}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">دسته‌بندی</label>
                                                        <input 
                                                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-[#2A5CAA]"
                                                            value={saveDraft.category}
                                                            onChange={(e) => setSaveDraft({...saveDraft, category: e.target.value})}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <button type="button" onClick={(e) => { e.preventDefault(); setShowSaveForm(false); }} className="flex-1 py-2.5 text-gray-500 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl">انصراف</button>
                                                    <button type="button" onClick={(e) => { e.preventDefault(); handleFinalSave(); }} className="flex-1 py-2.5 bg-[#2A5CAA] text-white font-bold rounded-xl hover:bg-blue-800 shadow-md">تایید نهایی و ذخیره</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : 
                        (<div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-4 opacity-70"><ActivityIcon mode={mode} size={64} className="opacity-50" /><p>منتظر ورودی داده برای پردازش...</p></div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActivityIcon = ({ mode, size = 24, className = '' }: { mode: string, size?: number, className?: string }) => {
    switch (mode) {
        case 'ocr': return <FileText size={size} className={className} />;
        case 'face': return <Smile size={size} className={className} />;
        case 'face-video': return <ScanFace size={size} className={className} />;
        case 'image-match': return <Search size={size} className={className} />;
        case 'internal-search': return <Database size={size} className={className} />;
        case 'category': return <Tag size={size} className={className} />;
        case 'sentiment': return <Smile size={size} className={className} />;
        default: return <FileText size={size} className={className} />;
    }
}

export default AIProcessor;
