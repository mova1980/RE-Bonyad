
import React, { useState, useRef } from 'react';
import { Mic, Square, Save, Loader2, User, History, MessageSquare, Sparkles, Tag, CheckCircle2, Trash2, ShieldCheck, Inbox, Plus, X, UserCheck, FilePlus } from 'lucide-react';
import { transcribeMemoir } from '../services/geminiService';
import { MOCK_PROFILES, localizeNumber } from '../data';
import { Memoir, Document } from '../types';

interface RevayatNatamamProps {
    documents: Document[];
    setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
    memoirs: Memoir[];
    setMemoirs: React.Dispatch<React.SetStateAction<Memoir[]>>;
}

const RevayatNatamam: React.FC<RevayatNatamamProps> = ({ documents, setDocuments, memoirs, setMemoirs }) => {
    const [activeTab, setActiveTab] = useState<'register' | 'inbox'>('register');
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [selectedProfile, setSelectedProfile] = useState('');
    const [senderName, setSenderName] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [currentTags, setCurrentTags] = useState<string[]>([]);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/pcm' });
                setLoading(true);
                try {
                    const text = await transcribeMemoir(blob);
                    setTranscription(prev => prev + (prev ? '\n' : '') + text);
                    // AI Suggest Tags based on content
                    if (text.includes('عملیات')) addTag('دفاع مقدس');
                } catch (err) {
                    alert('خطا در تبدیل صوت به متن');
                } finally {
                    setLoading(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            alert('اجازه دسترسی به میکروفون داده نشد.');
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const addTag = (tag: string) => {
        const clean = tag.trim();
        if (clean && !currentTags.includes(clean)) {
            setCurrentTags(prev => [...prev, clean]);
        }
    };

    const handleSaveMemoir = () => {
        if (!transcription || !selectedProfile) {
            alert('لطفا متن خاطره و پرونده مرتبط را مشخص کنید.');
            return;
        }
        const newMemoir: Memoir = {
            id: `M-${Date.now()}`,
            profileId: selectedProfile,
            senderName: senderName || 'ناشناس',
            content: transcription,
            date: new Date().toLocaleDateString('fa-IR'),
            type: 'text',
            tags: currentTags,
            status: 'pending'
        };
        setMemoirs(prev => [newMemoir, ...prev]);
        setTranscription('');
        setSenderName('');
        setCurrentTags([]);
        alert('روایت شما با موفقیت برای بررسی کارشناسان ثبت شد.');
    };

    const handleApprove = (memoir: Memoir) => {
        setMemoirs(prev => prev.map(m => m.id === memoir.id ? { ...m, status: 'approved' } : m));
    };

    const handleAddToArchive = (memoir: Memoir) => {
        const profile = MOCK_PROFILES.find(p => p.id === memoir.profileId);
        const newDoc: Document = {
            id: `DOC-MEMOIR-${memoir.id}`,
            title: `خاطره شفاهی - ${memoir.senderName}`,
            type: 'text',
            category: 'خاطرات',
            date: memoir.date,
            status: 'processed',
            tags: memoir.tags,
            profileId: memoir.profileId,
            description: memoir.content
        };
        
        setDocuments(prev => [newDoc, ...prev]);
        setMemoirs(prev => prev.map(m => m.id === memoir.id ? { ...m, status: 'archived' } : m));
        alert(`خاطره با موفقیت به پرونده ${profile?.name} ${profile?.family} اضافه شد.`);
    };

    const getProfileName = (id: string) => {
        const p = MOCK_PROFILES.find(x => x.id === id);
        return p ? `${p.name} ${p.family}` : 'نامشخص';
    };

    const pendingMemoirs = memoirs.filter(m => m.status === 'pending');
    const approvedMemoirs = memoirs.filter(m => m.status === 'approved');

    return (
        <div className="space-y-8 pb-10">
            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button onClick={() => setActiveTab('register')} className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${activeTab === 'register' ? 'bg-[#1A5D1A] text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    <Mic size={20} /> ثبت روایت جدید
                </button>
                <button onClick={() => setActiveTab('inbox')} className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${activeTab === 'inbox' ? 'bg-[#1A5D1A] text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    <Inbox size={20} /> صندوق بررسی روایت‌ها
                    {pendingMemoirs.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingMemoirs.length}</span>}
                </button>
            </div>

            {activeTab === 'register' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-soft border border-gray-100 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-[#1A5D1A] dark:text-yade-gold mb-6 flex items-center gap-3">
                                <Sparkles />
                                ثبت روایت ناتمام
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-2 block">انتخاب ایثارگر مرتبط</label>
                                        <select 
                                            className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#1A5D1A]"
                                            value={selectedProfile}
                                            onChange={(e) => setSelectedProfile(e.target.value)}
                                        >
                                            <option value="">جستجوی پرونده...</option>
                                            {MOCK_PROFILES.map(p => <option key={p.id} value={p.id}>{p.name} {p.family}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-2 block">نام راوی / همرزم</label>
                                        <input 
                                            className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#1A5D1A]"
                                            placeholder="نام خود را وارد کنید"
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea 
                                        className="w-full h-64 p-6 bg-gray-50 dark:bg-gray-700 rounded-3xl outline-none focus:ring-2 focus:ring-[#1A5D1A] resize-none leading-8 text-lg"
                                        placeholder="خاطره را اینجا بنویسید یا دکمه میکروفون را برای ضبط لمس کنید..."
                                        value={transcription}
                                        onChange={(e) => setTranscription(e.target.value)}
                                    />
                                    {loading && (
                                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
                                            <Loader2 size={48} className="animate-spin text-[#1A5D1A]" />
                                            <p className="mt-4 font-bold text-[#1A5D1A]">در حال تبدیل صوت به متن...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
                                    <label className="text-xs font-bold text-gray-400 block mb-3">تگ‌گذاری روایت:</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {currentTags.map(tag => (
                                            <span key={tag} className="bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                                {tag}
                                                <X size={12} className="cursor-pointer" onClick={() => setCurrentTags(prev => prev.filter(t => t !== tag))} />
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 bg-white dark:bg-gray-800 p-2 rounded-xl text-sm border-none outline-none" 
                                            placeholder="تگ جدید (مثلا: هویزه)..."
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (addTag(tagInput), setTagInput(''))}
                                        />
                                        <button onClick={() => {addTag(tagInput); setTagInput('');}} className="bg-[#1A5D1A] text-white p-2 rounded-xl"><Plus size={18}/></button>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${isRecording ? 'bg-red-500 text-white' : 'bg-[#1A5D1A] text-white hover:bg-green-800 shadow-lg'}`}
                                    >
                                        {isRecording ? <Square size={24} /> : <Mic size={24} />}
                                        {isRecording ? 'توقف ضبط' : 'شروع ضبط خاطره'}
                                    </button>
                                    <button 
                                        onClick={handleSaveMemoir}
                                        disabled={!transcription || !selectedProfile}
                                        className="px-10 bg-[#D4AF37] text-white rounded-2xl font-bold hover:bg-yellow-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                                    >
                                        <Save />
                                        ثبت نهایی
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick History Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-soft border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                <History />
                                روایت‌های اخیر من
                            </h3>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {memoirs.slice(0, 5).map(m => (
                                    <div key={m.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-[#2A5CAA]">{m.senderName}</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${m.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                {m.status === 'pending' ? 'در حال بررسی' : 'تایید شده'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-5 mb-2">{m.content}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {m.tags.map(t => <span key={t} className="text-[8px] bg-gray-200 dark:bg-gray-700 px-1 rounded">#{t}</span>)}
                                        </div>
                                    </div>
                                ))}
                                {memoirs.length === 0 && (
                                    <div className="text-center py-10 opacity-30">
                                        <MessageSquare size={48} className="mx-auto mb-2" />
                                        <p className="text-sm">هنوز روایتی ثبت نشده است.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {/* Pending Section */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-yellow-600"><ShieldCheck /> روایت‌های در انتظار تایید</h3>
                        {pendingMemoirs.map(m => (
                            <div key={m.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-yellow-100 dark:border-yellow-900/20">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-[#1A5D1A]">{m.senderName}</h4>
                                        <p className="text-[10px] text-gray-400">مرتبط با: {getProfileName(m.profileId)}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400">{m.date}</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-4">
                                    <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">{m.content}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleApprove(m)} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-700 transition-all"><CheckCircle2 size={14}/> تایید محتوا</button>
                                    <button onClick={() => setMemoirs(prev => prev.filter(x => x.id !== m.id))} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs hover:bg-red-100 transition-all"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                        {pendingMemoirs.length === 0 && <p className="text-center py-10 text-gray-400 italic">موردی برای بررسی وجود ندارد.</p>}
                    </div>

                    {/* Approved Section */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-green-600"><UserCheck /> روایت‌های تایید شده</h3>
                        {approvedMemoirs.map(m => (
                            <div key={m.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-green-100 dark:border-green-900/20">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-[#1A5D1A]">{m.senderName}</h4>
                                    <span className="text-[10px] text-gray-400">{m.date}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {m.tags.map(t => <span key={t} className="text-[9px] bg-blue-50 text-blue-600 px-2 rounded">#{t}</span>)}
                                </div>
                                <button 
                                    onClick={() => handleAddToArchive(m)} 
                                    className="w-full bg-[#D4AF37] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-yellow-700 shadow-md transition-all animate-glow"
                                >
                                    <FilePlus size={16}/> الحاق به پرونده آرشیوی {getProfileName(m.profileId)}
                                </button>
                            </div>
                        ))}
                        {approvedMemoirs.length === 0 && <p className="text-center py-10 text-gray-400 italic">روایتی آماده الحاق نیست.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevayatNatamam;
