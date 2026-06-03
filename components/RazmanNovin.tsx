
import React, { useState } from 'react';
import { TranslationStructure, MartyrProfile } from '../types';
import { Atom, Rocket, Radio, Globe2, ShieldCheck, Cpu, User, Target, Eye, Mic2, BookOpen, Flag, Search, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { MOCK_PROFILES } from '../data';

interface RazmanNovinProps {
    t: TranslationStructure;
}

type MainCategory = 'nuclear' | '12day' | 'modern' | 'regional';
type SubCategory = 'danayan' | 'negahbanan' | 'cyber' | 'tirandazan' | 'cheshmha' | 'jangavaran' | 'zabanha' | 'softwar' | 'mediawar' | 'diplomacy' | 'economy' | 'yemen' | 'syria' | 'lebanon' | 'iraq' | 'palestine';

const RazmanNovin: React.FC<RazmanNovinProps> = ({ t }) => {
    const [activeMain, setActiveMain] = useState<MainCategory | null>(null);
    const [activeSub, setActiveSub] = useState<SubCategory | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<MartyrProfile | null>(null);

    // Helper to get profiles based on logic (since we might not have all mocked, we'll map category logic)
    const getProfiles = (main: MainCategory, sub: SubCategory) => {
        // In a real app, query DB by these tags/categories. 
        // Here we filter MOCK_PROFILES or return placeholder if empty to show the UI working.
        let filtered = MOCK_PROFILES.filter(p => {
            if (main === 'nuclear' && p.category === 'شهدای هسته‌ای') return true;
            if (main === 'regional' && p.category === 'شهدای مقاومت') return true;
            if (p.razmanCategory === sub) return true;
            return false;
        });

        // Add dummy profiles if empty to demonstrate UI
        if (filtered.length === 0) {
            filtered = [
                {
                    id: `DEMO-${sub}-1`,
                    name: 'شهید',
                    family: 'نمونه',
                    fatherName: 'نام پدر',
                    nationalCode: '0000000000',
                    gender: 'مرد',
                    birthDate: '1360/01/01',
                    martyrdomDate: '1400/01/01',
                    education: 'کارشناسی',
                    province: 'البرز',
                    city: 'کرج',
                    unit: 'یگان نمونه',
                    bio: 'این یک پروفایل نمونه برای نمایش عملکرد بخش است.',
                    avatar: 'https://via.placeholder.com/150',
                    status: 'فعال',
                    isVerified: true,
                    category: 'شهدای مقاومت',
                    razmanCategory: sub
                }
            ] as any;
        }
        return filtered;
    };

    const mainCategories = [
        {
            id: 'nuclear',
            title: t.catNuclear,
            icon: Atom,
            color: 'bg-blue-600',
            subItems: [
                { id: 'danayan', title: t.subDanayan, icon: User },
                { id: 'negahbanan', title: t.subNegahbanan, icon: ShieldCheck },
                { id: 'cyber', title: t.subCyberSoldiers, icon: Cpu },
            ]
        },
        {
            id: '12day',
            title: t.cat12DayWar,
            icon: Rocket,
            color: 'bg-red-600',
            subItems: [
                { id: 'tirandazan', title: t.subTirandazan, icon: Target },
                { id: 'cheshmha', title: t.subCheshmha, icon: Eye },
                { id: 'jangavaran', title: t.subJangavaran, icon: Cpu },
                { id: 'zabanha', title: t.subZabanha, icon: Mic2 },
            ]
        },
        {
            id: 'modern',
            title: t.catModernEra,
            icon: Radio,
            color: 'bg-purple-600',
            subItems: [
                { id: 'softwar', title: t.subSoftWar, icon: BookOpen },
                { id: 'mediawar', title: t.subMediaWar, icon: Mic2 },
                { id: 'diplomacy', title: t.subDiplomacy, icon: Globe2 },
                { id: 'economy', title: t.subEconomy, icon: ShieldCheck }, // Using shield for economic resilience
            ]
        },
        {
            id: 'regional',
            title: t.catRegional,
            icon: Globe2,
            color: 'bg-green-600',
            subItems: [
                { id: 'yemen', title: t.subYemen, icon: Flag },
                { id: 'syria', title: t.subSyria, icon: Flag },
                { id: 'lebanon', title: t.subLebanon, icon: Flag },
                { id: 'iraq', title: t.subIraq, icon: Flag },
                { id: 'palestine', title: t.subPalestine, icon: Flag },
            ]
        }
    ];

    const renderMainView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {mainCategories.map((cat) => (
                <div 
                    key={cat.id} 
                    onClick={() => { setActiveMain(cat.id as MainCategory); setActiveSub(cat.subItems[0].id as SubCategory); }}
                    className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-soft hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 h-64 flex flex-col justify-center items-center text-center p-8"
                >
                    <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity ${cat.color}`}></div>
                    <div className={`w-20 h-20 rounded-2xl ${cat.color} text-white flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform`}>
                        <cat.icon size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-[#1A5D1A] dark:group-hover:text-[#D4AF37] transition-colors">{cat.title}</h3>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                        {cat.subItems.map(sub => (
                            <span key={sub.id} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-500 dark:text-gray-300">{sub.title}</span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderDetailView = () => {
        const category = mainCategories.find(c => c.id === activeMain);
        if (!category) return null;

        const profiles = activeSub ? getProfiles(activeMain!, activeSub) : [];

        return (
            <div className="animate-fade-in h-full flex flex-col">
                {/* Header / Breadcrumb */}
                <div className="flex items-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
                    <button type="button" onClick={(e) => { e.preventDefault(); setActiveMain(null); setActiveSub(null); }} className="hover:text-[#1A5D1A] dark:hover:text-[#D4AF37]">
                        {t.razmanNovin}
                    </button>
                    <ChevronRight size={16} className="rtl:rotate-180" />
                    <span className="font-bold text-gray-800 dark:text-gray-200">{category.title}</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 h-full">
                    {/* Sidebar Tabs */}
                    <div className="lg:w-64 flex-shrink-0 space-y-2 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-soft h-fit">
                        {category.subItems.map((sub) => (
                            <button
                                key={sub.id}
                                type="button"
                                onClick={(e) => { e.preventDefault(); setActiveSub(sub.id as SubCategory); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${
                                    activeSub === sub.id 
                                    ? `bg-gray-100 dark:bg-gray-700 text-[#1A5D1A] dark:text-[#D4AF37] shadow-sm ring-1 ring-gray-200 dark:ring-gray-600` 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <sub.icon size={18} />
                                {sub.title}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 min-h-[500px]">
                         <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                {category.subItems.find(s => s.id === activeSub)?.icon && React.createElement(category.subItems.find(s => s.id === activeSub)!.icon, {size: 24, className: "text-[#1A5D1A] dark:text-[#D4AF37]"})}
                                {category.subItems.find(s => s.id === activeSub)?.title}
                            </h3>
                            <span className="bg-[#1A5D1A]/10 text-[#1A5D1A] dark:text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold">
                                {profiles.length} پرونده
                            </span>
                        </div>

                        {profiles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {profiles.map((profile) => (
                                    <div 
                                        key={profile.id} 
                                        onClick={() => setSelectedProfile(profile)}
                                        className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-[#1A5D1A] dark:hover:border-[#D4AF37] cursor-pointer transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            <img src={profile.avatar || 'https://via.placeholder.com/150'} alt={profile.name} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm" />
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm group-hover:text-[#1A5D1A] dark:group-hover:text-[#D4AF37] transition-colors">{profile.name} {profile.family}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{profile.unit || 'واحد نامشخص'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>{profile.city}</span>
                                            <span>{profile.martyrdomDate || 'نامشخص'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                                <Search size={48} className="mb-4 opacity-20" />
                                <p>هیچ اطلاعاتی در این بخش یافت نشد.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-10 h-full">
            {!activeMain ? (
                <>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 border-r-4 border-[#D4AF37] pr-4">
                        {t.razmanNovin}
                        <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-2">آرشیو تخصصی اسناد و معرفی دلاوران عرصه‌های نوین مقاومت</span>
                    </h2>
                    {renderMainView()}
                </>
            ) : renderDetailView()}

            {/* Profile Modal Overlay */}
            {selectedProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedProfile(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={(e) => { e.preventDefault(); setSelectedProfile(null); }} className="absolute top-4 left-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-10"><X size={20}/></button>
                        <div className="h-40 bg-gradient-to-r from-[#1A5D1A] to-[#D4AF37] relative">
                             <img src={selectedProfile.avatar} className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 absolute -bottom-16 right-8 shadow-xl object-cover" />
                        </div>
                        <div className="pt-20 px-8 pb-8">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedProfile.name} {selectedProfile.family}</h2>
                            <p className="text-[#1A5D1A] dark:text-[#D4AF37] font-bold text-sm mt-1">{selectedProfile.category} / {activeSub && mainCategories.find(c => c.id === activeMain)?.subItems.find(s => s.id === activeSub)?.title}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl"><span className="block text-xs text-gray-400 mb-1">کد ملی</span>{selectedProfile.nationalCode}</div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl"><span className="block text-xs text-gray-400 mb-1">تاریخ شهادت</span>{selectedProfile.martyrdomDate}</div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl"><span className="block text-xs text-gray-400 mb-1">یگان</span>{selectedProfile.unit}</div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl"><span className="block text-xs text-gray-400 mb-1">محل سکونت</span>{selectedProfile.city}</div>
                            </div>
                            
                            <div className="mt-6">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">زندگینامه</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-7 text-justify">{selectedProfile.bio}</p>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button type="button" onClick={(e) => { e.preventDefault(); }} className="flex-1 py-3 bg-[#1A5D1A] text-white rounded-xl font-bold shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-transform">مشاهده اسناد آرشیو</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RazmanNovin;
