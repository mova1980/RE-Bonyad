
import React, { useState, useRef, useMemo } from 'react';
import { MOCK_PROFILES, localizeNumber } from '../data';
import { 
    Search, ChevronLeft, FileText, Image as ImageIcon, Video, Mic, 
    Calendar, X, ChevronsRight, Filter, RefreshCcw, UserPlus, 
    MoreVertical, Edit2, Trash2, Eye, Upload, Save, FilePlus, 
    Grid, ListTree, Folder, ChevronDown, ChevronRight as ChevronRightIcon, 
    UploadCloud, Check, FileCheck, Loader2, Sparkles, Inbox, 
    UserCheck, AlertTriangle, CheckCircle2, Files, SortAsc,
    Plus, Download, Volume2, ShieldCheck, User
} from 'lucide-react';
import { MartyrProfile, Document, DocumentType, IsargarCategory, AlborzCity, TranslationStructure, LanguageCode } from '../types';
import { analyzeFileForArchive, generateSpeech, semanticSearch } from '../services/geminiService';

interface ArchiveProps {
    t: TranslationStructure;
    language: LanguageCode;
    documents: Document[];
    setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
    categories?: string[];
}

const normalizeSearchTerm = (str: string) => {
    if (!str) return '';
    return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
              .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
              .toLowerCase()
              .trim();
};

const Archive: React.FC<ArchiveProps> = ({ t, language, documents, setDocuments, categories = ['سایر'] }) => {
    const [activeTab, setActiveTab] = useState<'archive' | 'inbox'>('archive');
    const [searchTerm, setSearchTerm] = useState('');
    const [semanticLoading, setSemanticLoading] = useState(false);
    const [profiles, setProfiles] = useState<MartyrProfile[]>(MOCK_PROFILES);
    const [selectedProfile, setSelectedProfile] = useState<MartyrProfile | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'tree'>('tree');
    const [sortBy, setSortBy] = useState<'city' | 'date'>('city');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [showStandalone, setShowStandalone] = useState(false);

    // Smart Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadQueue, setUploadQueue] = useState<{name: string, status: 'pending'|'processing'|'done'}[]>([]);
    const smartUploadRef = useRef<HTMLInputElement>(null);

    // Modal States
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileModalTab, setProfileModalTab] = useState<'info' | 'docs'>('info');
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [viewDoc, setViewDoc] = useState<Document | null>(null); 
    const [editDoc, setEditDoc] = useState<Partial<Document> | null>(null); 
    const [isTtsPlaying, setIsTtsPlaying] = useState(false);
    
    // Profile Form State
    const [newProfile, setNewProfile] = useState<Partial<MartyrProfile>>({
        name: '', family: '', fatherName: '', nationalCode: '', gender: 'مرد',
        birthDate: '', status: 'فعال', unit: '', bio: '', avatar: '',
        province: 'البرز', city: AlborzCity.OTHER, category: IsargarCategory.MARTYR,
        education: '', martyrdomDate: '', burialPlace: ''
    });
    const [newProfileDocs, setNewProfileDocs] = useState<Partial<Document>[]>([]);
    const profileImageInputRef = useRef<HTMLInputElement>(null);
    const profileDocsInputRef = useRef<HTMLInputElement>(null);

    // --- Fix: Added missing handleSemanticSearch function to allow AI-powered search interaction ---
    const handleSemanticSearch = async () => {
        if (!searchTerm.trim()) return;
        setSemanticLoading(true);
        try {
            const results = await semanticSearch(searchTerm, profiles, documents);
            // Provide visual feedback for semantic search results in the console
            console.debug('Semantic Search Results:', results);
            // In a production environment, this would filter the displayed entities based on semantic relevance
        } catch (error) {
            console.error('Semantic Search Error:', error);
        } finally {
            setSemanticLoading(false);
        }
    };

    // --- Fix: Added missing handleSpeakVasiat function for text-to-speech functionality ---
    const handleSpeakVasiat = async (text: string) => {
        if (!text) return;
        setIsTtsPlaying(true);
        try {
            await generateSpeech(text);
        } catch (error) {
            console.error('TTS Error:', error);
        } finally {
            setIsTtsPlaying(false);
        }
    };

    // Filtering & Grouping Logic
    const filteredProfiles = useMemo(() => {
        const term = normalizeSearchTerm(searchTerm);
        if (!term) return profiles;
        return profiles.filter(p => 
            p.name.includes(term) || 
            p.family.includes(term) || 
            p.nationalCode.includes(term) || 
            p.id.includes(term)
        );
    }, [profiles, searchTerm]);
    
    const standaloneDocs = useMemo(() => {
        return documents.filter(d => (!d.profileId || d.profileId === 'general') && d.status === 'processed');
    }, [documents]);

    const pendingDocs = documents.filter(d => d.status === 'pending');
    const archiveDocs = selectedProfile ? documents.filter(doc => doc.profileId === selectedProfile.id && doc.status === 'processed') : [];

    const groupedData = useMemo(() => {
        const groups: Record<string, MartyrProfile[]> = {};
        filteredProfiles.forEach(p => {
            let key = sortBy === 'city' ? p.city : (p.martyrdomDate || p.birthDate || 'نامشخص').split('/')[0];
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return groups;
    }, [filteredProfiles, sortBy]);

    const toggleFolder = (key: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) newSet.delete(key);
            else newSet.add(key);
            return newSet;
        });
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'image': return <ImageIcon size={18} className="text-blue-500"/>;
            case 'video': return <Video size={18} className="text-red-500"/>;
            case 'audio': return <Mic size={18} className="text-purple-500"/>;
            case 'pdf': return <FileText size={18} className="text-orange-500"/>;
            default: return <FileText size={18} className="text-green-500"/>;
        }
    };

    // --- Robust Download Helper ---
    const forceDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error('Network error');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            window.open(url, '_blank');
        }
    };

    const handleDownload = (doc: Document | null) => {
        if (!doc || !doc.thumbnail) {
            alert('فایل قابل دانلودی برای این رکورد یافت نشد.');
            return;
        }
        forceDownload(doc.thumbnail, `${doc.title || 'document'}.jpg`);
    };

    const handleBulkDownload = (docs: Document[]) => {
        const docsWithFiles = docs.filter(d => !!d.thumbnail);
        if (docsWithFiles.length === 0) {
            alert('هیچ سندی با فایل تصویری برای دریافت یافت نشد.');
            return;
        }
        
        if (docsWithFiles.length > 5) {
             const confirmLong = window.confirm(`شما در حال دریافت ${localizeNumber(docsWithFiles.length, language)} فایل هستید. فایل‌ها به ترتیب در تب‌های جداگانه یا به صورت دانلودی باز می‌شوند. ادامه می‌دهید؟`);
             if(!confirmLong) return;
        }

        docsWithFiles.forEach((doc, index) => {
            setTimeout(() => {
                forceDownload(doc.thumbnail!, `${doc.title || 'document'}_${index}.jpg`);
            }, index * 1000); 
        });
    };

    const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => setNewProfile(prev => ({ ...prev, avatar: ev.target?.result as string }));
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleProfileDocsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files) as File[];
        const processed = files.map((f) => ({
            title: f.name.split('.')[0],
            type: (f.type.includes('image') ? 'image' : f.type.includes('pdf') ? 'pdf' : f.type.includes('video') ? 'video' : 'text') as DocumentType,
            category: 'سایر',
            status: 'processed' as const,
            date: new Date().toLocaleDateString('fa-IR'),
            tags: ['بارگذاری اولیه'],
            thumbnail: f.type.includes('image') ? URL.createObjectURL(f) : undefined
        }));
        setNewProfileDocs(prev => [...prev, ...processed]);
    };

    const handleSaveProfile = () => {
        if (!newProfile.name || !newProfile.family || !newProfile.nationalCode) {
            alert('اطلاعات ضروری (نام، فامیلی و کد ملی) را وارد کنید.');
            return;
        }
        const profileId = `P-${Date.now()}`;
        const profile: MartyrProfile = {
            ...newProfile as MartyrProfile,
            id: profileId,
            status: 'فعال',
            isVerified: true,
            avatar: newProfile.avatar || 'https://via.placeholder.com/150'
        };

        const finalizedDocs = newProfileDocs.map((doc, idx) => ({
            ...doc,
            id: `DOC-NEW-${profileId}-${idx}-${Math.floor(Math.random()*1000)}`,
            profileId: profileId,
        })) as Document[];

        setProfiles([profile, ...profiles]);
        setDocuments(prev => [...finalizedDocs, ...prev]);
        setIsProfileModalOpen(false);
        setNewProfileDocs([]);
        setNewProfile({ name: '', family: '', gender: 'مرد', city: AlborzCity.OTHER, category: IsargarCategory.MARTYR });
        setProfileModalTab('info');
    };

    const handleDeleteDoc = (id: string, e?: React.MouseEvent, isCancelAction: boolean = false) => {
        if (e) e.stopPropagation();
        
        if (isCancelAction) {
            setDocuments(prev => prev.filter(d => d.id !== id));
            return;
        }

        if (window.confirm('آیا از حذف دائمی این سند اطمینان دارید؟')) {
            setDocuments(prev => prev.filter(d => d.id !== id));
            if (viewDoc?.id === id) {
                setIsDocModalOpen(false);
                setViewDoc(null);
            }
        }
    };

    const handleEditDocSave = () => {
        if (!editDoc?.title) return;
        if (editDoc.id) {
            setDocuments(prev => prev.map(d => d.id === editDoc.id ? { ...d, ...editDoc } as Document : d));
        } else {
            const newDoc: Document = {
                id: `DOC-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                title: editDoc.title || '',
                category: editDoc.category || 'سایر',
                date: new Date().toLocaleDateString('fa-IR'),
                status: 'processed',
                tags: editDoc.tags || [],
                type: editDoc.type || 'image',
                profileId: editDoc.profileId || '',
                description: editDoc.description,
                thumbnail: editDoc.thumbnail
            };
            setDocuments(prev => [newDoc, ...prev]);
        }
        setEditDoc(null);
        setIsDocModalOpen(false);
    };

    const handleApproveDoc = (doc: Document) => {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'processed' } : d));
    };

    const handleSmartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setIsUploading(true);
        const files = Array.from(e.target.files) as File[];
        setUploadQueue(files.map(f => ({ name: f.name, status: 'pending' })));

        const newPendingDocs: Document[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item));
            try {
                const analysis = await analyzeFileForArchive(file);
                const doc: Document = {
                    id: `DOC-PENDING-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`,
                    title: file.name.split('.')[0],
                    category: analysis.category,
                    date: new Date().toLocaleDateString('fa-IR'),
                    status: 'pending',
                    tags: ['هوشمند', `اطمینان_${analysis.confidence}%`],
                    type: file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : file.type.includes('video') ? 'video' : 'text',
                    profileId: (analysis.suggestedId && analysis.suggestedId !== 'None') ? analysis.suggestedId : '',
                    aiSuggestedProfileName: analysis.suggestedName,
                    aiAnalysis: analysis.analysis,
                    thumbnail: file.type.includes('image') ? URL.createObjectURL(file) : undefined
                };
                newPendingDocs.push(doc);
            } catch (err) { 
                console.error(err); 
                newPendingDocs.push({
                    id: `DOC-FAILED-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`,
                    title: file.name.split('.')[0],
                    category: 'سایر',
                    date: new Date().toLocaleDateString('fa-IR'),
                    status: 'pending',
                    tags: ['خطا_در_تحلیل'],
                    type: 'image',
                    profileId: '',
                    thumbnail: file.type.includes('image') ? URL.createObjectURL(file) : undefined
                });
            }
            setUploadQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'done' } : item));
        }
        
        setDocuments(prev => [...newPendingDocs, ...prev]);
        
        setTimeout(() => { 
            setIsUploading(false); 
            setUploadQueue([]); 
            setActiveTab('inbox'); 
            alert('بارگذاری و تحلیل هوشمند با موفقیت انجام شد. فایل‌ها در صندوق بررسی آماده تایید هستند.');
        }, 800);
    };

    const openDocModal = (doc?: Document) => {
        if (doc) { setViewDoc(doc); setEditDoc(null); }
        else { setViewDoc(null); setEditDoc({ profileId: selectedProfile?.id || '', type: 'image', category: 'سایر' }); }
        setIsDocModalOpen(true);
    };

    return (
        <div className="pb-10">
            {/* Main Tabs */}
            <div className="flex gap-4 mb-6">
                <button type="button" onClick={(e) => { e.preventDefault(); setActiveTab('archive'); setSelectedProfile(null); setShowStandalone(false); }} className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${activeTab === 'archive' ? 'bg-[#1A5D1A] text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    <Folder size={20} /> آرشیو و پرونده‌ها
                </button>
                <button type="button" onClick={(e) => { e.preventDefault(); setActiveTab('inbox'); }} className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${activeTab === 'inbox' ? 'bg-[#1A5D1A] text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    <Inbox size={20} /> بررسی و تأیید هوشمند
                    {pendingDocs.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mr-2">{pendingDocs.length}</span>}
                </button>
            </div>

            {/* Smart Upload Banner */}
            <div className={`mb-8 p-6 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed transition-all ${isUploading ? 'border-[#D4AF37]' : 'border-[#1A5D1A]/30'} flex flex-col md:flex-row items-center gap-6`}>
                <div className={`p-4 rounded-2xl ${isUploading ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                    {isUploading ? <Loader2 size={40} className="text-[#D4AF37] animate-spin" /> : <UploadCloud size={40} className="text-[#1A5D1A]" />}
                </div>
                <div className="flex-1 text-center md:text-right">
                    <h3 className="font-bold text-lg mb-1">{isUploading ? 'در حال پردازش هوشمند فایل‌ها...' : 'آپلود هوشمند و سریع'}</h3>
                    <p className="text-sm text-gray-500">فایل‌ها را انتخاب کنید تا هوش مصنوعی آن‌ها را طبقه‌بندی، تحلیل و به پرونده‌ها متصل کند.</p>
                </div>
                {!isUploading && (
                    <button type="button" onClick={(e) => { e.preventDefault(); smartUploadRef.current?.click(); }} className="bg-[#1A5D1A] text-white px-6 py-3 rounded-xl font-bold hover:bg-green-800 shadow-lg flex items-center gap-2 transition-all active:scale-95 text-sm">
                        <Upload size={18} /> انتخاب فایل‌ها
                    </button>
                )}
                <input type="file" ref={smartUploadRef} className="hidden" multiple onChange={handleSmartUpload} />
                
                {isUploading && (
                    <div className="flex flex-col gap-1 min-w-[150px]">
                        <span className="text-[10px] text-gray-400">تعداد در صف: {localizeNumber(uploadQueue.length, language)}</span>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#D4AF37] h-full animate-shimmer" style={{ width: '60%' }}></div>
                        </div>
                    </div>
                )}
            </div>

            {selectedProfile && activeTab === 'archive' ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <button type="button" onClick={(e) => { e.preventDefault(); setSelectedProfile(null); }} className="flex items-center gap-2 text-sm font-bold text-[#2A5CAA] dark:text-blue-400 hover:translate-x-1 transition-transform">
                            <ChevronsRight size={18} className="rtl:rotate-180" /> بازگشت به لیست پرونده‌ها
                        </button>
                        <button type="button" onClick={(e) => { e.preventDefault(); handleBulkDownload(archiveDocs); }} className="flex items-center gap-2 bg-[#D4AF37] text-white px-5 py-2 rounded-xl text-[11px] font-bold shadow-lg hover:bg-yellow-700 transition-all">
                            <Download size={16} /> دریافت کلیه اسناد پرونده ({localizeNumber(archiveDocs.filter(d => !!d.thumbnail).length, language)})
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#1A5D1A]/5 rounded-bl-[100px]"></div>
                        <img src={selectedProfile.avatar} className="w-40 h-40 rounded-3xl object-contain bg-gray-50 border-4 border-[#D4AF37] shadow-xl z-10" />
                        <div className="flex-1 z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <h2 className="text-3xl font-bold text-[#1A5D1A] dark:text-yade-gold">{selectedProfile.name} {selectedProfile.family}</h2>
                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold">پرونده فعال</span>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl"><span className="opacity-60 block mb-1 text-[10px]">کد ملی</span><span className="font-bold">{localizeNumber(selectedProfile.nationalCode, language)}</span></div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl"><span className="opacity-60 block mb-1 text-[10px]">استان/شهر</span><span className="font-bold">{selectedProfile.province} - {selectedProfile.city}</span></div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl"><span className="opacity-60 block mb-1 text-[10px]">یگان خدمتی</span><span className="font-bold">{selectedProfile.unit || '---'}</span></div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl"><span className="opacity-60 block mb-1 text-[10px]">تاریخ شهادت</span><span className="font-bold text-red-600 dark:text-red-400">{localizeNumber(selectedProfile.martyrdomDate || '---', language)}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {archiveDocs.map(doc => (
                            <div key={doc.id} onClick={() => openDocModal(doc)} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden group hover:shadow-2xl cursor-pointer border border-gray-100 dark:border-gray-700 transition-all relative">
                                <div className="h-44 bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden">
                                    {doc.thumbnail ? <img src={doc.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <FileText size={48} className="text-gray-300" />}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="text-white" size={24}/>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="font-bold text-sm truncate text-gray-800 dark:text-gray-100">{doc.title}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded-md">{doc.category}</span>
                                        {doc.category === 'وصیت‌نامه' && <Volume2 size={14} className="text-[#D4AF37]" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={(e) => { e.preventDefault(); openDocModal(); }} className="h-full min-h-[220px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center text-gray-400 hover:text-[#1A5D1A] hover:border-[#1A5D1A] hover:bg-green-50/50 transition-all">
                            <Plus size={40} /><span className="text-sm font-bold mt-2">افزودن سند جدید</span>
                        </button>
                    </div>
                </div>
            ) : activeTab === 'inbox' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {pendingDocs.map(doc => (
                        <div key={doc.id} className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft border-2 border-blue-50 dark:border-blue-900/10 flex gap-6 relative overflow-hidden group hover:border-[#1A5D1A]/30 transition-all">
                            <div className="w-44 h-44 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 dark:border-gray-600">
                                {doc.thumbnail ? <img src={doc.thumbnail} className="w-full h-full object-cover" /> : getTypeIcon(doc.type)}
                            </div>
                            <div className="flex-1 flex flex-col">
                                <h4 className="font-bold text-lg mb-2 truncate text-[#1A5D1A] dark:text-yade-gold">{doc.title}</h4>
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl mb-4 text-[11px] border border-blue-100/50">
                                    <p className="font-bold text-[#2A5CAA] dark:text-blue-400 mb-1 flex items-center gap-1"><Sparkles size={12}/> پیشنهاد هوشمند: {doc.aiSuggestedProfileName || 'عدم شناسایی'}</p>
                                    <p className="text-gray-500 dark:text-gray-400 line-clamp-3 leading-5">{doc.aiAnalysis}</p>
                                </div>
                                <div className="mt-auto space-y-3">
                                    <div className="relative">
                                        <select className="w-full bg-gray-50 dark:bg-gray-700 p-2.5 rounded-xl text-xs outline-none border border-gray-200 dark:border-gray-600 appearance-none pr-8" value={doc.profileId || ''} onChange={e => setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, profileId: e.target.value } : d))}>
                                            <option value="">-- اسناد آزاد (بدون پرونده) --</option>
                                            {profiles.map(p => <option key={p.id} value={p.id}>{p.name} {p.family}</option>)}
                                        </select>
                                        <Folder size={14} className="absolute right-3 top-2.5 text-gray-400"/>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={(e) => { e.preventDefault(); handleApproveDoc(doc); }} className="flex-1 bg-[#1A5D1A] text-white py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 hover:bg-green-800 transition-all shadow-md"><Check size={16} /> تأیید و بایگانی</button>
                                        <button type="button" onClick={(e) => { e.preventDefault(); setEditDoc(doc); setIsDocModalOpen(true); }} className="px-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="ویرایش کامل"><Edit2 size={16} /></button>
                                        <button type="button" onClick={(e) => handleDeleteDoc(doc.id, e, true)} className="px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all font-bold text-[10px]" title="انصراف از بررسی">انصراف</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {pendingDocs.length === 0 && (
                        <div className="col-span-full py-28 text-center bg-white dark:bg-gray-800 rounded-[40px] border-4 border-dashed border-gray-100 dark:border-gray-700">
                             <CheckCircle2 size={64} className="mx-auto text-green-200 mb-4"/>
                             <h4 className="font-bold text-xl text-gray-400">صندوق بررسی هوشمند خالی است</h4>
                             <p className="text-sm text-gray-300 mt-2">تمامی فایل‌های بارگذاری شده تعیین تکلیف شده‌اند.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* FILTERS & SEARCH - Compact Version */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                        <div className="relative w-full md:w-[500px] flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    placeholder={t.searchPlaceholder} 
                                    className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-soft border-2 border-transparent focus:border-[#1A5D1A] outline-none transition-all dark:text-white text-sm" 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    onKeyDown={e => {
                                        if(e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSemanticSearch();
                                        }
                                    }}
                                />
                                <Search className="absolute right-4 top-3 text-gray-400" size={18} />
                            </div>
                            <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleSemanticSearch(); }}
                                disabled={semanticLoading}
                                className="bg-[#1A5D1A] text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-800 transition-all disabled:opacity-50 shadow-md text-sm"
                            >
                                {semanticLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16}/>}
                                <span className="hidden md:inline">جستجوی معنایی</span>
                            </button>
                        </div>
                        
                        <div className="flex items-center flex-wrap gap-2">
                            <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-soft flex border border-gray-100 dark:border-gray-700">
                                <button type="button" onClick={(e) => { e.preventDefault(); setViewMode('grid'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#1A5D1A] text-white shadow-md' : 'text-gray-400'}`} title="نمای شبکه‌ای"><Grid size={18} /></button>
                                <button type="button" onClick={(e) => { e.preventDefault(); setViewMode('tree'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'tree' ? 'bg-[#1A5D1A] text-white shadow-md' : 'text-gray-400'}`} title="نمای درختی (فولدربندی)"><ListTree size={18} /></button>
                            </div>
                            
                            {viewMode === 'tree' && (
                                <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 flex items-center gap-1">
                                    <button type="button" onClick={(e) => { e.preventDefault(); setSortBy('city'); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'city' ? 'bg-[#D4AF37] text-white shadow-md' : 'text-gray-400'}`}>بر اساس شهر</button>
                                    <button type="button" onClick={(e) => { e.preventDefault(); setSortBy('date'); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'date' ? 'bg-[#D4AF37] text-white shadow-md' : 'text-gray-400'}`}>بر اساس سال</button>
                                </div>
                            )}

                            <button type="button" onClick={(e) => { e.preventDefault(); setShowStandalone(!showStandalone); }} className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-soft border-2 text-xs ${showStandalone ? 'bg-orange-500 text-white border-transparent' : 'bg-white dark:bg-gray-800 text-orange-600 border-orange-50 dark:border-orange-900/30'}`}>
                                <Files size={16} /> <span>{showStandalone ? 'نمایش پرونده‌ها' : 'اسناد بدون پرونده'}</span>
                            </button>
                            
                            <button type="button" onClick={(e) => { e.preventDefault(); setIsProfileModalOpen(true); setProfileModalTab('info'); }} className="bg-[#1A5D1A] text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-green-800 transition-all text-sm">
                                <UserPlus size={18} /> تشکیل پرونده
                            </button>
                        </div>
                    </div>

                    {showStandalone ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {standaloneDocs.map(doc => (
                                <div key={doc.id} onClick={() => openDocModal(doc)} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden group hover:shadow-2xl cursor-pointer border border-gray-100 dark:border-gray-700 transition-all relative">
                                    <div className="h-44 bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden">
                                        {doc.thumbnail ? <img src={doc.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <FileText size={48} className="text-gray-300" />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Eye className="text-white" size={24}/></div>
                                    </div>
                                    <div className="p-4"><p className="font-bold text-sm truncate text-gray-800 dark:text-gray-100">{doc.title}</p><p className="text-[10px] text-gray-400 mt-1 uppercase">{doc.category}</p></div>
                                </div>
                            ))}
                            {standaloneDocs.length === 0 && <div className="col-span-full py-28 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-[40px] border-4 border-dashed">هیچ سند بدون پرونده‌ای یافت نشد.</div>}
                        </div>
                    ) : (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProfiles.map(p => (
                                    <div key={p.id} onClick={() => setSelectedProfile(p)} className="bg-white dark:bg-gray-800 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 hover:-translate-y-2 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#1A5D1A]/5 to-transparent rounded-bl-[60px]"></div>
                                        <div className="flex items-center gap-4 relative z-10">
                                            <img src={p.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37] shadow-lg group-hover:scale-110 transition-transform" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold truncate text-gray-800 dark:text-gray-100 group-hover:text-[#1A5D1A] transition-colors">{p.name} {p.family}</h3>
                                                <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-wider">{p.category}</p>
                                                <p className="text-xs text-gray-500 mt-0.5 font-mono">{localizeNumber(p.nationalCode, language)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-5 pt-5 border-t border-gray-50 dark:border-gray-700 flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                                            <span className="flex items-center gap-1"><ShieldCheck size={12}/> {p.city}</span>
                                            <span className="flex items-center gap-1"><Calendar size={12}/> {localizeNumber(p.martyrdomDate || p.birthDate, language)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-soft p-8 border border-gray-100 dark:border-gray-700">
                                {(Object.entries(groupedData) as [string, MartyrProfile[]][]).map(([key, groupProfiles]) => (
                                    <div key={key} className="mb-4 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden transition-all hover:border-[#1A5D1A]/30 shadow-sm">
                                        <div className={`p-5 cursor-pointer flex items-center justify-between transition-colors ${expandedFolders.has(key) ? 'bg-[#1A5D1A]/5 dark:bg-[#1A5D1A]/10' : 'bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700'}`} onClick={() => toggleFolder(key)}>
                                            <div className="flex items-center gap-4">
                                                {expandedFolders.has(key) ? <ChevronDown size={22} className="text-[#1A5D1A]" /> : <ChevronRightIcon size={22} className="rtl:rotate-180 text-gray-400" />}
                                                <Folder size={24} className={expandedFolders.has(key) ? "text-[#1A5D1A]" : "text-[#D4AF37]"} />
                                                <span className={`font-bold text-lg ${expandedFolders.has(key) ? 'text-[#1A5D1A]' : 'text-gray-700 dark:text-gray-300'}`}>{localizeNumber(key, language)}</span>
                                            </div>
                                            <span className="text-xs bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-gray-400 shadow-sm font-bold">{localizeNumber(groupProfiles.length, language)} پرونده</span>
                                        </div>
                                        {expandedFolders.has(key) && (
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 border-t border-gray-100 dark:border-gray-700 animate-fade-in-down bg-gray-50/30 dark:bg-gray-900/30">
                                                {groupProfiles.map(p => (
                                                    <div key={p.id} onClick={() => setSelectedProfile(p)} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-[#1A5D1A] hover:shadow-lg transition-all cursor-pointer group">
                                                        <img src={p.avatar} className="w-12 h-12 rounded-xl object-cover shadow-md group-hover:scale-110 transition-transform" />
                                                        <div className="overflow-hidden flex-1">
                                                            <h4 className="font-bold text-sm truncate text-gray-800 dark:text-gray-100">{p.name} {p.family}</h4>
                                                            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">{p.category}</span>
                                                        </div>
                                                        <ChevronLeft size={16} className="text-gray-300 rtl:rotate-180 group-hover:text-[#1A5D1A] group-hover:translate-x-1 transition-all"/>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* NEW PROFILE MODAL */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
                        <div className="p-8 border-b flex justify-between items-center bg-white dark:bg-gray-800">
                            <h3 className="text-2xl font-bold text-[#1A5D1A] dark:text-yade-gold flex items-center gap-3"><UserPlus size={32}/> تشکیل پرونده و مدیریت مستندات</h3>
                            <button onClick={() => setIsProfileModalOpen(false)} className="p-3 rounded-full hover:bg-gray-100 transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/50">
                            <button type="button" onClick={(e) => { e.preventDefault(); setProfileModalTab('info'); }} className={`flex-1 py-5 font-bold text-sm transition-all flex items-center justify-center gap-2 ${profileModalTab === 'info' ? 'bg-white dark:bg-gray-800 text-[#1A5D1A] border-b-4 border-[#1A5D1A] shadow-inner' : 'text-gray-400 hover:bg-white/50'}`}><User size={18}/> ۱. اطلاعات پایه ایثارگر</button>
                            <button type="button" onClick={(e) => { e.preventDefault(); setProfileModalTab('docs'); }} className={`flex-1 py-5 font-bold text-sm transition-all flex items-center justify-center gap-2 ${profileModalTab === 'docs' ? 'bg-white dark:bg-gray-800 text-[#1A5D1A] border-b-4 border-[#1A5D1A] shadow-inner' : 'text-gray-400 hover:bg-white/50'}`}><FilePlus size={18}/> ۲. مدیریت مستندات ({localizeNumber(newProfileDocs.length, language)})</button>
                        </div>

                        <div className="p-10 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/20 dark:bg-gray-900/20">
                            {profileModalTab === 'info' ? (
                                <div className="space-y-8 max-w-3xl mx-auto">
                                    <div className="flex justify-center mb-10">
                                        <div className="relative w-40 h-40 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#1A5D1A] transition-colors" onClick={() => profileImageInputRef.current?.click()}>
                                            {newProfile.avatar ? <img src={newProfile.avatar} className="w-full h-full object-cover" /> : <Upload className="text-gray-300" size={48}/>}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">تغییر تصویر</div>
                                        </div>
                                        <input type="file" ref={profileImageInputRef} className="hidden" onChange={handleProfileImageUpload} accept="image/*" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div><label className="text-xs font-bold text-gray-500 mb-2 block">نام</label><input className="w-full p-4 border-2 border-transparent rounded-2xl bg-white dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-[#1A5D1A] transition-all" value={newProfile.name} onChange={e => setNewProfile({...newProfile, name: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-gray-500 mb-2 block">نام خانوادگی</label><input className="w-full p-4 border-2 border-transparent rounded-2xl bg-white dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-[#1A5D1A] transition-all" value={newProfile.family} onChange={e => setNewProfile({...newProfile, family: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-gray-500 mb-2 block">کد ملی</label><input className="w-full p-4 border-2 border-transparent rounded-2xl bg-white dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-[#1A5D1A] transition-all" value={newProfile.nationalCode} onChange={e => setNewProfile({...newProfile, nationalCode: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-gray-500 mb-2 block">تاریخ تولد</label><input className="w-full p-4 border-2 border-transparent rounded-2xl bg-white dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-[#1A5D1A] transition-all" value={newProfile.birthDate} onChange={e => setNewProfile({...newProfile, birthDate: e.target.value})} placeholder="13XX/XX/XX" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 mb-2 block">دسته‌بندی</label><select className="w-full p-4 border-2 border-transparent rounded-2xl bg-white dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-[#1A5D1A] transition-all" value={newProfile.category} onChange={e => setNewProfile({...newProfile, category: e.target.value as any})}>{Object.values(IsargarCategory).map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                        <div><label className="text-xs font-bold text-gray-500 mb-2 block">شهر</label><select className="w-full p-4 border-2 border-transparent rounded-2xl bg-white dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-[#1A5D1A] transition-all" value={newProfile.city} onChange={e => setNewProfile({...newProfile, city: e.target.value as any})}>{Object.values(AlborzCity).map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                    </div>
                                    <div><label className="text-xs font-bold text-gray-500 mb-2 block">خلاصه زندگینامه و سوابق ایثارگری</label><textarea className="w-full p-6 border-2 border-transparent rounded-3xl bg-white dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-[#1A5D1A] h-40 resize-none transition-all leading-8" value={newProfile.bio} onChange={e => setNewProfile({...newProfile, bio: e.target.value})} /></div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="border-4 border-dashed border-[#1A5D1A]/20 rounded-[40px] p-16 text-center cursor-pointer hover:bg-white dark:hover:bg-gray-800 hover:border-[#1A5D1A]/40 transition-all group" onClick={() => profileDocsInputRef.current?.click()}>
                                        <UploadCloud size={72} className="mx-auto text-[#1A5D1A] mb-6 group-hover:scale-110 group-hover:text-green-600 transition-all"/>
                                        <h4 className="font-bold text-xl mb-2">آپلود گروهی اسناد پرونده</h4>
                                        <p className="text-sm text-gray-400">تصاویر، فیلم‌ها و اسناد متنی را برای الحاق به این پرونده انتخاب کنید.</p>
                                        <input type="file" ref={profileDocsInputRef} className="hidden" multiple onChange={handleProfileDocsUpload} />
                                    </div>
                                    {newProfileDocs.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {newProfileDocs.map((doc, idx) => (
                                                <div key={idx} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border">
                                                        {doc.thumbnail ? <img src={doc.thumbnail} className="w-full h-full object-cover" /> : getTypeIcon(doc.type!)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-xs font-bold truncate block text-gray-700 dark:text-gray-200">{doc.title}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase">{doc.type}</span>
                                                    </div>
                                                    <button onClick={() => setNewProfileDocs(prev => prev.filter((_, i) => i !== idx))} className="p-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-colors"><Trash2 size={20}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-8 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-4 border-t dark:border-gray-700">
                            <button type="button" onClick={(e) => { e.preventDefault(); setIsProfileModalOpen(false); }} className="px-10 py-4 text-sm font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all">انصراف</button>
                            <button type="button" onClick={(e) => { e.preventDefault(); handleSaveProfile(); }} className="px-12 py-4 bg-[#1A5D1A] text-white rounded-2xl text-sm font-bold shadow-xl flex items-center gap-3 hover:bg-green-800 hover:scale-[1.02] transition-all"><Save size={20}/> ذخیره نهایی پرونده</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Details/Edit Modal */}
            {isDocModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-[40px] w-full max-w-6xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border border-white/10">
                        <div className="flex-1 bg-black/95 flex items-center justify-center relative min-h-[400px]">
                            {editDoc?.thumbnail || viewDoc?.thumbnail ? (
                                <img src={editDoc?.thumbnail || viewDoc?.thumbnail} className="max-w-full max-h-full object-contain shadow-2xl" />
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-gray-600">
                                    <FileText size={100} className="opacity-20" />
                                    <p className="font-mono text-sm tracking-widest uppercase">No Visual Media Attached</p>
                                </div>
                            )}
                            <div className="absolute top-6 left-6 flex gap-3">
                                <button type="button" onClick={(e) => { e.preventDefault(); handleDownload(viewDoc); }} className="p-4 bg-white/10 text-white rounded-full hover:bg-[#1A5D1A] transition-all backdrop-blur-md" title="دریافت فایل"><Download size={22}/></button>
                                <button type="button" onClick={(e) => { e.preventDefault(); setIsDocModalOpen(false); }} className="p-4 bg-white/10 text-white rounded-full hover:bg-red-500 transition-all backdrop-blur-md" title="بستن"><X size={22}/></button>
                            </div>
                        </div>
                        <div className="w-full md:w-[450px] bg-white dark:bg-gray-800 flex flex-col p-10">
                            <h3 className="font-bold text-2xl mb-10 border-b dark:border-gray-700 pb-6 text-[#1A5D1A] dark:text-yade-gold flex items-center gap-2">
                                <FileCheck size={28}/>
                                {(editDoc || !viewDoc?.id) ? 'ویرایش اطلاعات سند' : 'جزئیات سند آرشیوی'}
                            </h3>
                            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                                <div><label className="text-xs font-bold text-gray-500 mb-2 block">عنوان سند</label><input className="w-full p-4 border-2 border-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-2xl outline-none focus:border-[#1A5D1A] transition-all" value={editDoc?.title || viewDoc?.title || ''} onChange={e => setEditDoc({... (editDoc || viewDoc || {}), title: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 mb-2 block">انتخاب پرونده ایثارگر</label><select className="w-full p-4 border-2 border-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-2xl outline-none focus:border-[#1A5D1A] transition-all" value={editDoc?.profileId || viewDoc?.profileId || ''} onChange={e => setEditDoc({... (editDoc || viewDoc || {}), profileId: e.target.value})}><option value="">-- اسناد آزاد (بدون پرونده) --</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name} {p.family}</option>)}</select></div>
                                <div><label className="text-xs font-bold text-gray-500 mb-2 block">توضیحات، تحلیل و پیوست‌ها</label><textarea className="w-full p-6 border-2 border-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-3xl h-44 resize-none outline-none focus:border-[#1A5D1A] transition-all leading-8" value={editDoc?.description || viewDoc?.description || ''} onChange={e => setEditDoc({... (editDoc || viewDoc || {}), description: e.target.value})} /></div>
                            </div>
                            <div className="pt-8 border-t dark:border-gray-700 mt-8 flex flex-col gap-4">
                                {viewDoc?.category === 'وصیت‌نامه' && (
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); handleSpeakVasiat(viewDoc.description || ''); }}
                                        disabled={isTtsPlaying}
                                        className="w-full py-4 bg-[#D4AF37] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-yellow-700 transition-all disabled:opacity-50 shadow-lg shadow-yellow-900/20"
                                    >
                                        {isTtsPlaying ? <Loader2 className="animate-spin" /> : <Volume2 size={24}/>}
                                        {t.speakVasiat}
                                    </button>
                                )}
                                <div className="flex gap-4">
                                    <button type="button" onClick={(e) => { e.preventDefault(); setIsDocModalOpen(false); }} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl transition-all">انصراف</button>
                                    <button type="button" onClick={(e) => { e.preventDefault(); handleEditDocSave(); }} className="flex-1 py-4 bg-[#1A5D1A] text-white rounded-2xl font-bold shadow-xl hover:bg-green-800 transition-all">ذخیره نهایی</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Archive;
