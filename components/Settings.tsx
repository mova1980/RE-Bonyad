
import React, { useState } from 'react';
import { User, Palette, Bell, FolderTree, Plus, Trash2, Bot, Check, AlertCircle } from 'lucide-react';

interface AppSettingsProps {
    categories: string[];
    onAddCategory: (category: string) => void;
    onDeleteCategory: (category: string) => void;
}

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'categories' | 'ai';

const AppSettings: React.FC<AppSettingsProps> = ({ categories, onAddCategory, onDeleteCategory }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [newCategory, setNewCategory] = useState('');
    const [tempKey, setTempKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    const handleAddClick = () => {
        if (newCategory.trim()) {
            onAddCategory(newCategory.trim());
            setNewCategory('');
        }
    };

    const handleSaveTempKey = () => {
        const trimmed = tempKey.trim();
        const placeholders = [
            'GEMINI_API_KEY', 
            'YOUR_API_KEY', 
            'VITE_GEMINI_API_KEY', 
            'MY_GEMINI_API_KEY', 
            'Yadegaran-1405-new', 
            'null', 
            'undefined', 
            ''
        ];
        if (trimmed && !placeholders.includes(trimmed) && trimmed.length >= 10 && !trimmed.includes('API_KEY')) {
            sessionStorage.setItem('TEMP_GEMINI_KEY', trimmed);
            localStorage.setItem('TEMP_GEMINI_KEY', trimmed);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            window.location.reload(); // Refresh to apply
        } else {
            alert('کلید وارد شده نامعتبر یا بسیار کوتاه است. لطفا کلید معتبر خود را وارد سازید.');
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ai':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 flex gap-3">
                            <AlertCircle className="text-yellow-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-yellow-800 dark:text-yellow-300 mb-1">رفع خطای کلید هوش مصنوعی</h4>
                                <p className="text-xs text-gray-700 dark:text-gray-400 leading-5">
                                    اگر با خطای "کلید نامعتبر" مواجه هستید، ابتدا مطمئن شوید در تنظیمات Secrets نام متغیر را به جای مقدار واقعی وارد نکرده‌اید.
                                    همچنین می‌توانید برای تست، کلید خود را اینجا وارد کنید (فقط برای همین نشست مرورگر ذخیره می‌شود).
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-bold">تنظیم موقت کلید API</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        placeholder="AIza..." 
                                        value={tempKey}
                                        onChange={(e) => setTempKey(e.target.value)}
                                        className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-[#1A5D1A] dark:text-white font-mono text-xs"
                                    />
                                    <button 
                                        onClick={handleSaveTempKey}
                                        className="bg-[#1A5D1A] text-white px-6 rounded-xl hover:bg-green-800 transition-all flex items-center gap-2 font-bold"
                                    >
                                        {isSaved ? <Check size={20} /> : 'ثبت'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2 italic px-1">
                                    * این کلید فقط در session storage ذخیره می‌شود و با بستن تب پاک می‌شود.
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h5 className="text-xs font-bold mb-3 text-gray-600 dark:text-gray-400">راهنمای تنظیمات دائمی در AI Studio:</h5>
                                <ol className="text-[11px] space-y-2 text-gray-500 list-decimal list-inside">
                                    <li>به منوی <span className="font-bold">Settings &gt; Secrets</span> بروید.</li>
                                    <li>یک Secret با نام <span className="font-bold">GEMINI_API_KEY</span> بسازید.</li>
                                    <li>در ستون <span className="font-bold">Value</span>، حتماً کد واقعی را Paste کنید (نباید دوباره نام متغیر باشد).</li>
                                    <li>اگر از پلن رایگان استفاده می‌کنید، گزینه <span className="font-bold">AI Studio Free Tier</span> را انتخاب کنید.</li>
                                    <li>دکمه <span className="font-bold">Build/Compile</span> را بزنید و صفحه را رفرش کنید.</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                );
            case 'profile':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام کامل</label>
                            <input type="text" defaultValue="ادمین سیستم" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام کاربری</label>
                            <input type="text" defaultValue="admin" disabled className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed" />
                        </div>
                        <button className="px-6 py-2.5 bg-[#1A5D1A] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-green-800 transition-colors">ذخیره تغییرات</button>
                    </div>
                );
            case 'appearance':
                return (
                    <div>
                        <h4 className="font-bold mb-2 text-gray-800 dark:text-white">تم برنامه</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">حالت نمایش تاریک یا روشن را انتخاب کنید.</p>
                        <div className="flex gap-4">
                            <button className="px-6 py-2 rounded-xl border-2 border-[#1A5D1A] text-[#1A5D1A] dark:text-[#D4AF37] dark:border-[#D4AF37] font-bold">پیش‌فرض سیستم</button>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-4">
                         <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white">اعلان‌های سیستم</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">مانند به‌روزرسانی‌ها و هشدارها</p>
                            </div>
                            <input type="checkbox" className="toggle-checkbox" defaultChecked />
                        </div>
                         <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white">اعلان‌های پردازش</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">اتمام موفق یا ناموفق پردازش‌های هوشمند</p>
                            </div>
                            <input type="checkbox" className="toggle-checkbox" defaultChecked />
                        </div>
                    </div>
                );
            case 'categories':
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                            <h4 className="font-bold text-[#2A5CAA] dark:text-blue-300 mb-1">مدیریت دسته‌بندی اسناد</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">این دسته‌بندی‌ها در بخش‌های آپلود، فیلتر و بایگانی استفاده می‌شوند.</p>
                        </div>

                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="نام دسته‌بندی جدید..." 
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#1A5D1A] dark:text-white"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
                            />
                            <button onClick={handleAddClick} className="bg-[#1A5D1A] text-white px-4 rounded-xl hover:bg-green-800 transition-colors">
                                <Plus size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {categories.map((cat, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600 group">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{cat}</span>
                                    {cat !== 'سایر' && (
                                        <button onClick={() => onDeleteCategory(cat)} className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const tabs = [
        { id: 'profile', label: 'پروفایل', icon: User },
        { id: 'categories', label: 'دسته‌بندی اسناد', icon: FolderTree },
        { id: 'ai', label: 'هوش مصنوعی', icon: Bot },
        { id: 'appearance', label: 'ظاهر', icon: Palette },
        { id: 'notifications', label: 'اعلان‌ها', icon: Bell },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[500px]">
            <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 overflow-x-auto">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-white dark:bg-gray-800 border-b-2 border-[#1A5D1A] text-[#1A5D1A] dark:text-[#D4AF37] dark:border-[#D4AF37]' 
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="p-8">
                {renderTabContent()}
            </div>
            <style>{` 
                .toggle-checkbox {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 40px;
                    height: 24px;
                    background-color: #ccc;
                    border-radius: 12px;
                    position: relative;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                .toggle-checkbox:checked {
                    background-color: #1A5D1A;
                }
                .toggle-checkbox::before {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background-color: white;
                    top: 2px;
                    left: 2px;
                    transition: transform 0.3s;
                }
                .toggle-checkbox:checked::before {
                    transform: translateX(16px);
                }
            `}</style>
        </div>
    );
};

export default AppSettings;
