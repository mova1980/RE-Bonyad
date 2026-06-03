
import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Image as ImageIcon, Video, ChevronRight, Loader2, Save, Trash2, CheckCircle, AlertCircle, Maximize2, History, UserCheck, FolderInput, Download } from 'lucide-react';
import { Document, MartyrProfile, DocumentType } from '../types';
import { MOCK_PROFILES, MOCK_DOCUMENTS, localizeNumber } from '../data';
import { restoreImage, fileToGenerativePart } from '../services/geminiService';
import { resizeImage } from '../services/imageUtils';

interface RestorationProps {
    onSaveDocument: (doc: Document) => void;
}

const Restoration: React.FC<RestorationProps> = ({ onSaveDocument }) => {
    const [source, setSource] = useState<'upload' | 'archive'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [restoredUrl, setRestoredUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [analysis, setAnalysis] = useState<string>('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveData, setSaveData] = useState({ profileId: '', title: '', category: 'تصاویر ترمیم شده' });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreviewUrl(URL.createObjectURL(f));
            setRestoredUrl(null);
            setAnalysis('');
        }
    };

    const handleRestore = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!file) return;
        setIsProcessing(true);
        setRestoredUrl(null);
        setAnalysis('');
        try {
            console.log("Starting restoration for:", file.name);
            const result = await restoreImage(file);
            console.log("Restoration response received:", result ? "Yes" : "No");
            if (result.base64) {
                setRestoredUrl(result.base64);
            } else {
                setRestoredUrl(previewUrl);
                alert('هوش مصنوعی تحلیلی ارائه داد اما موفق به بازسازی تصویر نشد.');
            }
            setAnalysis(result.analysis || 'تحلیل بازسازی توسط هوش مصنوعی انجام شد.');
        } catch (err: any) {
            console.error("Restoration Error Detailed:", err);
            alert(`خطا در پردازش هوشمند: ${err.message || 'خطای ناشناخته'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadRestored = () => {
        if (!restoredUrl) return;
        const link = document.createElement('a');
        link.href = restoredUrl;
        link.download = `Yade_Restored_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSave = async () => {
        setIsProcessing(true);
        // Optimization: Scale down the thumbnail before saving to avoid blocking state/storage
        let thumbnail = restoredUrl || previewUrl || undefined;
        if (thumbnail && thumbnail.startsWith('data:image')) {
            try {
                thumbnail = await resizeImage(thumbnail, 600, 600);
            } catch (e) {
                console.warn("Resize failed, using original", e);
            }
        }

        const newDoc: Document = {
            id: `REST-${Date.now()}`,
            title: saveData.title || file?.name || 'سند ترمیم شده',
            type: file?.type.includes('video') ? 'video' : 'image',
            category: saveData.category,
            date: new Date().toLocaleDateString('fa-IR'),
            status: 'processed',
            tags: ['AI_Restored', 'تجلی_یافته'],
            profileId: saveData.profileId,
            thumbnail: thumbnail,
            description: `سند ترمیم شده توسط هوش مصنوعی. تحلیل: ${analysis}`
        };
        onSaveDocument(newDoc);
        setIsProcessing(false);
        alert('سند با موفقیت در آرشیو ذخیره شد.');
        setShowSaveModal(false);
        setFile(null);
        setPreviewUrl(null);
        setRestoredUrl(null);
        setAnalysis('');
    };

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-[#1A5D1A] dark:text-yade-gold flex items-center gap-3">
                        <Sparkles size={32} />
                        ترمیم و تجلی اسناد
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">ارتقای کیفیت و بازآفرینی اسناد بصری شهدا و ایثارگران</p>
                </div>
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <button type="button" onClick={() => setSource('upload')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${source === 'upload' ? 'bg-[#1A5D1A] text-white shadow-lg' : 'text-gray-400'}`}>بارگذاری جدید</button>
                    <button type="button" onClick={() => setSource('archive')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${source === 'archive' ? 'bg-[#1A5D1A] text-white shadow-lg' : 'text-gray-400'}`}>انتخاب از آرشیو</button>
                </div>
            </div>

            {!previewUrl ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-96 border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-[40px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
                >
                    <div className="p-8 bg-gray-100 dark:bg-gray-700 rounded-full mb-6 group-hover:scale-110 transition-transform">
                        <Upload size={48} className="text-[#1A5D1A] dark:text-yade-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">انتخاب تصویر یا ویدیو برای ترمیم</h3>
                    <p className="text-sm text-gray-400 mt-2">فایل‌های کم‌کیفیت، سیاه و سفید یا آسیب‌دیده</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect} 
                        accept="image/*,video/*" 
                    />
                    <button type="button" className="mt-4 px-6 py-2 bg-gray-50 dark:bg-gray-700 text-gray-400 rounded-xl text-xs font-bold pointer-events-none">کلیک کنید یا فایل را اینجا بکشید</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Comparison Area */}
                    <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-soft p-6 border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">نمای مقایسه‌ای</span>
                            {restoredUrl && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">پردازش هوشمند تکمیل شد</span>}
                        </div>
                        <div className="relative aspect-square md:aspect-video bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden flex items-center justify-center">
                            {!restoredUrl ? (
                                <img src={previewUrl} className="w-full h-full object-contain filter blur-[2px] opacity-70" />
                            ) : (
                                <div className="w-full h-full flex">
                                    <div className="w-1/2 h-full overflow-hidden border-l border-white/50 relative">
                                        <img src={previewUrl} className="h-full object-cover min-w-[200%] max-w-none grayscale blur-[1px]" />
                                        <span className="absolute top-4 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded">نسخه اصلی</span>
                                    </div>
                                    <div className="w-1/2 h-full overflow-hidden relative">
                                        <img src={restoredUrl} className="h-full object-cover min-w-[200%] max-w-none -translate-x-1/2" />
                                        <span className="absolute top-4 left-4 bg-[#D4AF37] text-white text-[10px] px-2 py-1 rounded">تجلی یافته</span>
                                    </div>
                                </div>
                            )}
                            {isProcessing && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4 z-20">
                                    <Loader2 size={48} className="animate-spin text-yade-gold" />
                                    <div className="text-center">
                                        <p className="font-bold">در حال بازسازی بافت‌ها و اصلاح رنگ...</p>
                                        <p className="text-[10px] opacity-60 mt-1">توسط هوش مصنوعی مولد یادگاران</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls & Analysis */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-soft border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <History size={24} className="text-[#1A5D1A]" />
                                عملیات ترمیم
                            </h3>

                            {!restoredUrl ? (
                                <div className="flex-1">
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-500 leading-7">سیستم ترمیم یادگاران با استفاده از شبکه‌های عصبی عمیق، لایه‌های آسیب دیده تصویر را بازسازی کرده و چهره‌ها را با حفظ اصالت تاریخی شفاف می‌کند.</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
                                                <span className="block text-[10px] text-gray-400 mb-1">وضوح تصویر</span>
                                                <span className="font-bold">LOW-RES</span>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
                                                <span className="block text-[10px] text-gray-400 mb-1">نوع فایل</span>
                                                <span className="font-bold uppercase">{file?.type.split('/')[1]}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleRestore}
                                        disabled={isProcessing}
                                        className="w-full mt-10 bg-[#1A5D1A] text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Sparkles />
                                        شروع ترمیم و تجلی هوشمند
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 overflow-y-auto max-h-64 mb-6">
                                        <h4 className="text-xs font-bold text-[#1A5D1A] mb-3 flex items-center gap-2"><CheckCircle size={14}/> گزارش ترمیم هوشمند:</h4>
                                        <p className="text-sm leading-8 text-gray-600 dark:text-gray-300">{analysis}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <button type="button" onClick={(e) => { e.preventDefault(); setRestoredUrl(null); }} className="py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-colors">تکرار عملیات</button>
                                            <button type="button" onClick={(e) => { e.preventDefault(); handleDownloadRestored(); }} className="py-4 bg-[#2A5CAA] text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                                                <Download size={20} /> دریافت فایل تجلی یافته
                                            </button>
                                        </div>
                                        <button type="button" onClick={(e) => { e.preventDefault(); setShowSaveModal(true); }} className="py-4 bg-[#D4AF37] text-white rounded-2xl font-bold shadow-lg shadow-yellow-900/20 hover:bg-[#b8962e] transition-all flex items-center justify-center gap-2">
                                            <Save size={20} />
                                            ذخیره در آرشیو
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <h3 className="text-xl font-bold text-[#1A5D1A] dark:text-yade-gold">بایگانی سند تجلی یافته</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">انتخاب پرونده ایثارگر (اختیاری)</label>
                                <select 
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#D4AF37] border-none"
                                    value={saveData.profileId}
                                    onChange={(e) => setSaveData({...saveData, profileId: e.target.value})}
                                >
                                    <option value="">اسناد بدون پرونده</option>
                                    {MOCK_PROFILES.map(p => <option key={p.id} value={p.id}>{p.name} {p.family}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">عنوان سند</label>
                                <input 
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#D4AF37] border-none"
                                    placeholder="مثلا: پرتره شهید کلهر - بازسازی شده"
                                    value={saveData.title}
                                    onChange={(e) => setSaveData({...saveData, title: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-gray-50 dark:bg-gray-900/50 flex gap-4">
                            <button type="button" onClick={(e) => { e.preventDefault(); setShowSaveModal(false); }} className="flex-1 py-4 text-gray-500 font-bold">انصراف</button>
                            <button type="button" onClick={(e) => { e.preventDefault(); handleSave(); }} className="flex-1 py-4 bg-[#1A5D1A] text-white rounded-2xl font-bold shadow-lg">تایید نهایی و ذخیره</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Restoration;
