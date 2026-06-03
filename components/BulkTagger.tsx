
import React, { useState } from 'react';
import { Tag, CheckSquare, Square, Tags, Plus, Minus, X, Trash2, Search, FileText, Image as ImageIcon, Video, Mic, Hash, Edit3, Save, AlertTriangle, User, AlertOctagon } from 'lucide-react';
import { Document, MartyrProfile } from '../types';
import { localizeNumber } from '../data';

interface BulkTaggerProps {
    documents: Document[];
    setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
    tags: string[];
    setTags: React.Dispatch<React.SetStateAction<string[]>>;
    profiles: MartyrProfile[];
}

const BulkTagger: React.FC<BulkTaggerProps> = ({ documents, setDocuments, tags, setTags, profiles }) => {
    const [activeTab, setActiveTab] = useState<'apply' | 'manage'>('apply');
    
    // Apply Tab States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
    const [tagsToApply, setTagsToApply] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState<'add' | 'remove' | 'replace'>('add');
    const [newTagInput, setNewTagInput] = useState('');

    // Manage Tab States
    const [manageSearchTerm, setManageSearchTerm] = useState('');
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [editedTagValue, setEditedTagValue] = useState('');
    const [newMasterTag, setNewMasterTag] = useState('');

    // --- Helpers ---
    const getProfileInfo = (profileId: string) => {
        const profile = profiles.find(p => p.id === profileId);
        return profile ? `${profile.name} ${profile.family} (${localizeNumber(profile.nationalCode, 'fa')})` : 'نامشخص';
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'image': return <ImageIcon size={16} className="text-blue-500"/>;
            case 'video': return <Video size={16} className="text-red-500"/>;
            case 'audio': return <Mic size={16} className="text-purple-500"/>;
            case 'pdf': return <FileText size={16} className="text-orange-500"/>;
            default: return <FileText size={16} className="text-green-500"/>;
        }
    };

    const filteredDocuments = documents.filter(doc => 
        doc.title.includes(searchTerm) || 
        doc.tags.some(tag => tag.includes(searchTerm)) ||
        getProfileInfo(doc.profileId).includes(searchTerm)
    );

    const filteredTags = tags.filter(t => t.includes(manageSearchTerm));

    // --- Handlers: Selection ---
    const handleSelectDoc = (docId: string) => {
        setSelectedDocs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docId)) newSet.delete(docId);
            else newSet.add(docId);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedDocs.size === filteredDocuments.length) {
            setSelectedDocs(new Set());
        } else {
            setSelectedDocs(new Set(filteredDocuments.map(doc => doc.id)));
        }
    };

    // --- Handlers: Apply Tags ---
    const handleAddTagToApply = (tag: string) => {
        if (tag.trim() && !tagsToApply.includes(tag.trim())) {
            setTagsToApply(prev => [...prev, tag.trim()]);
            // If it's a new tag not in master list, assume user wants to use it ad-hoc (or add to master later)
            if (tag === newTagInput) setNewTagInput('');
        }
    };

    const handleRemoveTagFromApply = (tagToRemove: string) => {
        setTagsToApply(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const handleBulkApply = () => {
        if (selectedDocs.size === 0 || tagsToApply.length === 0) {
            alert('لطفاً حداقل یک سند و یک تگ را انتخاب کنید.');
            return;
        }

        const updatedDocuments = documents.map(doc => {
            if (selectedDocs.has(doc.id)) {
                let updatedTags: string[] = [];
                switch (bulkAction) {
                    case 'add':
                        updatedTags = [...new Set([...doc.tags, ...tagsToApply])];
                        break;
                    case 'remove':
                        updatedTags = doc.tags.filter(tag => !tagsToApply.includes(tag));
                        break;
                    case 'replace':
                        updatedTags = tagsToApply;
                        break;
                }
                return { ...doc, tags: updatedTags };
            }
            return doc;
        });

        setDocuments(updatedDocuments);
        alert(`تغییرات با موفقیت روی ${selectedDocs.size} سند اعمال شد.`);
        setSelectedDocs(new Set());
        setTagsToApply([]);
    };

    // --- Handlers: Master Tag Management (CRUD) ---
    
    // Create
    const handleCreateMasterTag = () => {
        if (newMasterTag.trim() && !tags.includes(newMasterTag.trim())) {
            setTags(prev => [...prev, newMasterTag.trim()]);
            setNewMasterTag('');
        } else if (tags.includes(newMasterTag.trim())) {
            alert('این تگ قبلاً وجود دارد.');
        }
    };

    // Delete (Cascade)
    const handleDeleteMasterTag = (tagToDelete: string) => {
        // Count affected docs
        const affectedCount = documents.filter(d => d.tags.includes(tagToDelete)).length;
        
        if (window.confirm(`آیا از حذف دائمی تگ "${tagToDelete}" اطمینان دارید؟\n\nاین تگ از ${affectedCount} سند حذف خواهد شد و قابل بازگشت نیست.`)) {
            // Update Docs
            const updatedDocs = documents.map(doc => ({
                ...doc,
                tags: doc.tags.filter(t => t !== tagToDelete)
            }));
            setDocuments(updatedDocs);
            
            // Update Master List
            setTags(prev => prev.filter(t => t !== tagToDelete));
        }
    };

    // Edit (Cascade)
    const startEditing = (tag: string) => {
        setEditingTag(tag);
        setEditedTagValue(tag);
    };

    const saveEditedTag = () => {
        if (!editingTag || !editedTagValue.trim() || editingTag === editedTagValue.trim()) {
            setEditingTag(null);
            return;
        }

        const newTagName = editedTagValue.trim();
        if (tags.includes(newTagName)) {
            alert('تگی با این نام وجود دارد. نمی‌توان نام تکراری انتخاب کرد.');
            return;
        }

        // Count affected docs
        const affectedCount = documents.filter(d => d.tags.includes(editingTag)).length;

        if (window.confirm(`آیا از تغییر نام تگ "${editingTag}" به "${newTagName}" اطمینان دارید؟\n\nاین تغییر در ${affectedCount} سند اعمال خواهد شد.`)) {
            // Update Docs
            const updatedDocs = documents.map(doc => {
                if (doc.tags.includes(editingTag)) {
                    return {
                        ...doc,
                        tags: doc.tags.map(t => t === editingTag ? newTagName : t)
                    };
                }
                return doc;
            });
            setDocuments(updatedDocs);

            // Update Master List
            setTags(prev => prev.map(t => t === editingTag ? newTagName : t));
            setEditingTag(null);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button 
                    onClick={() => setActiveTab('apply')}
                    className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'apply' ? 'text-[#1A5D1A] dark:text-[#D4AF37]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    تگ‌گذاری اسناد
                    {activeTab === 'apply' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#1A5D1A] dark:bg-[#D4AF37] rounded-t-full"></span>}
                </button>
                <button 
                    onClick={() => setActiveTab('manage')}
                    className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'manage' ? 'text-[#1A5D1A] dark:text-[#D4AF37]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    مدیریت تگ‌ها (ویرایش و حذف)
                    {activeTab === 'manage' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#1A5D1A] dark:bg-[#D4AF37] rounded-t-full"></span>}
                </button>
            </div>

            {activeTab === 'apply' ? (
                // --- Apply Mode ---
                <>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-soft flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative flex-1 w-full md:w-auto">
                            <input 
                                type="text" 
                                placeholder="جستجوی سند (عنوان، تگ، نام شخص)..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#D4AF37] dark:text-white outline-none" 
                            />
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                        </div>
                        <div className="w-full md:w-auto flex items-center gap-2">
                            <button onClick={handleSelectAll} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-bold flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                                {selectedDocs.size > 0 && selectedDocs.size === filteredDocuments.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                انتخاب همه
                            </button>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({selectedDocs.size} سند)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Document List */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-[#1A5D1A] dark:text-yade-gold">لیست اسناد</h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                                {filteredDocuments.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">سندی یافت نشد.</div>
                                ) : (
                                    filteredDocuments.map(doc => (
                                        <div key={doc.id} className={`flex items-center gap-4 p-4 transition-colors cursor-pointer ${selectedDocs.has(doc.id) ? 'bg-green-50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`} onClick={() => handleSelectDoc(doc.id)}>
                                            {selectedDocs.has(doc.id) ? <CheckSquare size={20} className="text-[#1A5D1A]" /> : <Square size={20} className="text-gray-400" />}
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
                                                {doc.thumbnail ? <img src={doc.thumbnail} alt={doc.title} className="w-full h-full object-cover" /> : getTypeIcon(doc.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{doc.title}</p>
                                                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">{doc.category}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                                                    <User size={12}/>
                                                    {getProfileInfo(doc.profileId)}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {doc.tags.map((tag, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-[10px]">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400 shrink-0">{localizeNumber(doc.date, 'fa')}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Tagging Control */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-6 space-y-6 sticky top-24">
                                <h3 className="text-lg font-bold text-[#2A5CAA] dark:text-blue-400 border-r-4 border-[#D4AF37] pr-3">اعمال تگ</h3>

                                {/* Tags to apply */}
                                <div>
                                    <label className="block text-sm font-bold mb-2">تگ‌های انتخابی:</label>
                                    <div className="flex flex-wrap gap-2 border border-gray-200 dark:border-gray-700 rounded-xl p-3 min-h-[50px] bg-gray-50 dark:bg-gray-700/30">
                                        {tagsToApply.length === 0 && <span className="text-gray-400 text-sm">هیچ تگی انتخاب نشده است.</span>}
                                        {tagsToApply.map((tag, index) => (
                                            <span key={index} className="flex items-center gap-1 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold animate-fade-in">
                                                {tag}
                                                <button onClick={() => handleRemoveTagFromApply(tag)} className="ml-1 text-white/80 hover:text-white"><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex mt-3 gap-2">
                                        <input 
                                            type="text" 
                                            value={newTagInput} 
                                            onChange={(e) => setNewTagInput(e.target.value)} 
                                            placeholder="افزودن تگ جدید..." 
                                            className="flex-1 p-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#1A5D1A]"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTagToApply(newTagInput)}
                                        />
                                        <button onClick={() => handleAddTagToApply(newTagInput)} className="bg-[#1A5D1A] text-white p-2 rounded-xl hover:bg-green-800 transition-colors"><Plus size={18} /></button>
                                    </div>
                                </div>

                                {/* Suggested Tags */}
                                <div>
                                    <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                                        <Hash size={16} className="text-gray-400" />
                                        تگ‌های موجود در سیستم
                                    </label>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1 border border-gray-100 dark:border-gray-700 rounded-xl">
                                        {tags.map((tag, idx) => (
                                            <button 
                                                key={idx} 
                                                onClick={() => handleAddTagToApply(tag)} 
                                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Bulk Action Type */}
                                <div>
                                    <label className="block text-sm font-bold mb-2">نوع عملیات:</label>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <input type="radio" name="bulkAction" value="add" checked={bulkAction === 'add'} onChange={() => setBulkAction('add')} className="form-radio text-[#1A5D1A] dark:text-[#D4AF37] h-4 w-4" />
                                            افزودن به تگ‌های موجود
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <input type="radio" name="bulkAction" value="remove" checked={bulkAction === 'remove'} onChange={() => setBulkAction('remove')} className="form-radio text-red-500 h-4 w-4" />
                                            حذف این تگ‌ها از اسناد
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <input type="radio" name="bulkAction" value="replace" checked={bulkAction === 'replace'} onChange={() => setBulkAction('replace')} className="form-radio text-blue-500 h-4 w-4" />
                                            جایگزینی کامل تگ‌ها
                                        </label>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleBulkApply} 
                                    disabled={selectedDocs.size === 0 || tagsToApply.length === 0}
                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedDocs.size === 0 || tagsToApply.length === 0 ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#1A5D1A] text-white hover:bg-green-800 shadow-lg shadow-green-900/20'}`}
                                >
                                    <Tags size={20} />
                                    اعمال روی {selectedDocs.size} سند
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // --- Manage Mode (CRUD) ---
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tag List */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#2A5CAA] dark:text-blue-400">لیست کل تگ‌های سیستم</h3>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-500">{filteredTags.length} تگ</span>
                        </div>
                        
                        <div className="mb-4 relative">
                            <input 
                                type="text" 
                                placeholder="جستجوی تگ..." 
                                value={manageSearchTerm} 
                                onChange={(e) => setManageSearchTerm(e.target.value)} 
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#D4AF37]"
                            />
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                        </div>

                        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {filteredTags.map(tag => (
                                <div key={tag} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                                    {editingTag === tag ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input 
                                                type="text" 
                                                value={editedTagValue} 
                                                onChange={(e) => setEditedTagValue(e.target.value)}
                                                className="flex-1 p-1 bg-white dark:bg-gray-600 rounded border border-[#D4AF37] outline-none text-sm"
                                                autoFocus
                                            />
                                            <button onClick={saveEditedTag} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><CheckSquare size={16}/></button>
                                            <button onClick={() => setEditingTag(null)} className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"><X size={16}/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Hash size={14} className="text-gray-400"/>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{tag}</span>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEditing(tag)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="ویرایش"><Edit3 size={16}/></button>
                                                <button onClick={() => handleDeleteMasterTag(tag)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="حذف دائمی"><Trash2 size={16}/></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info & Add New */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-[#1A5D1A] dark:text-yade-gold mb-4">ایجاد تگ جدید</h3>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="نام تگ جدید..." 
                                    value={newMasterTag}
                                    onChange={(e) => setNewMasterTag(e.target.value)}
                                    className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#1A5D1A]"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateMasterTag()}
                                />
                                <button onClick={handleCreateMasterTag} className="bg-[#1A5D1A] text-white px-4 rounded-xl hover:bg-green-800 transition-colors font-bold text-sm">
                                    ایجاد
                                </button>
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-2 mb-3 text-yellow-700 dark:text-yellow-500 font-bold">
                                <AlertOctagon size={24}/>
                                توجه مهم
                            </div>
                            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-400 list-disc list-inside leading-6">
                                <li>ویرایش نام تگ در این بخش، باعث <b>تغییر خودکار</b> آن در تمام اسنادی می‌شود که از این تگ استفاده کرده‌اند.</li>
                                <li>حذف تگ در این بخش، باعث <b>حذف دائمی</b> آن از کلیه اسناد آرشیو خواهد شد.</li>
                                <li>پیش از حذف یا ویرایش، سیستم تعداد اسناد تحت تأثیر را محاسبه کرده و از شما تاییدیه می‌گیرد.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkTagger;
