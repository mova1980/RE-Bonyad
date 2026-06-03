
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { 
    Users, FileText, Activity, ShieldCheck, Clock, CheckCircle2, 
    AlertTriangle, UserSquare2, TrendingUp, User, Quote, Calendar, 
    X, Plus, Trash2, Save, Info, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { StatCardProps, IsargarCategory, TranslationStructure, LanguageCode, Document, HistoricalEvent } from '../types';
import { localizeNumber, REAL_STATS } from '../data';

const COLORS = ['#1A5D1A', '#D4AF37', '#2A5CAA', '#8A2BE2', '#FF6347', '#4682B4'];

interface ExtendedStatCardProps extends StatCardProps {
    onClick?: () => void;
}

const StatCard: React.FC<ExtendedStatCardProps> = ({ title, value, icon: Icon, color, trend, onClick }) => {
    const colorClasses = {
        green: 'bg-gradient-to-br from-[#1A5D1A] to-[#144514] text-white shadow-lg shadow-green-900/30',
        gold: 'bg-gradient-to-br from-[#D4AF37] to-[#B4941F] text-white shadow-lg shadow-yellow-900/30',
        blue: 'bg-gradient-to-br from-[#2A5CAA] to-[#1e4079] text-white shadow-lg shadow-blue-900/30',
        gray: 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 shadow-soft'
    };
    const iconBg = {
        green: 'bg-white/20', gold: 'bg-white/20', blue: 'bg-white/20',
        gray: 'bg-gray-100 dark:bg-gray-700 text-[#1A5D1A]'
    };
    return (
        <div onClick={onClick} className={`p-6 rounded-2xl flex items-center justify-between transition-all hover:translate-y-[-2px] hover:shadow-xl cursor-pointer ${colorClasses[color]}`}>
            <div>
                <p className={`text-sm mb-1 font-medium ${color === 'gray' ? 'text-gray-500 dark:text-gray-400' : 'text-white/80'}`}>{title}</p>
                <h3 className="text-3xl font-bold font-sans">{value}</h3>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs mt-3 px-2 py-1 rounded-lg w-fit ${color === 'gray' ? 'bg-green-100 text-green-700' : 'bg-white/20 backdrop-blur-sm'}`}>
                        <TrendingUp size={14} />
                        <span>{trend}</span>
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-2xl ${iconBg[color]}`}><Icon size={32} strokeWidth={1.5} /></div>
        </div>
    );
};

interface DashboardProps {
    t: TranslationStructure;
    language: LanguageCode;
    documents: Document[];
    events: HistoricalEvent[];
    setEvents: React.Dispatch<React.SetStateAction<HistoricalEvent[]>>;
    onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ t, language, documents, events, setEvents, onNavigate }) => {
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [isNewEventFormOpen, setIsNewEventFormOpen] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<HistoricalEvent>>({ day: 1, month: 1, title: '', description: '' });

    // تشخیص تاریخ امروز شمسی به صورت عملیاتی
    const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/');
    const currentDay = parseInt(today[2]);
    const currentMonth = parseInt(today[1]);

    // پیدا کردن رویداد امروز
    const todayEvent = events.find(e => e.day === currentDay && e.month === currentMonth) || {
        title: 'امروز رویدادی ثبت نشده است',
        description: 'شما می‌توانید رویدادهای جبهه و شهادت را در بخش تنظیمات تقویم ثبت کنید.',
        day: currentDay,
        month: currentMonth
    };

    const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

    const handleAddEvent = () => {
        if (!newEvent.title || !newEvent.description) {
            alert('لطفاً تمامی فیلدها را پر کنید.');
            return;
        }
        setEvents(prev => [...prev, newEvent as HistoricalEvent]);
        setNewEvent({ day: 1, month: 1, title: '', description: '' });
        setIsNewEventFormOpen(false);
    };

    const handleDeleteEvent = (index: number) => {
        if (window.confirm('آیا از حذف این رویداد اطمینان دارید؟')) {
            setEvents(prev => prev.filter((_, i) => i !== index));
        }
    };

    const docsByMonthData = useMemo(() => {
        const data = months.map(m => ({ name: m, docs: Math.floor(Math.random() * 500) + 200 }));
        return data;
    }, []);

    const pieData = useMemo(() => {
        return [
            { name: 'شهدا', value: REAL_STATS.totalMartyrs },
            { name: 'جانبازان', value: REAL_STATS.totalJanbazan },
            { name: 'آزادگان', value: REAL_STATS.totalAzadegan },
        ];
    }, []);

    return (
        <div className="space-y-8 pb-10">
            {/* Styles for motion effects removed */}
            <style>{`
                /* No infinite animations */
            `}</style>

            {/* Top Row: Slogan & Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Slogan with Custom Background Image and Enhanced Motion Effect */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-[40px] shadow-2xl border-2 border-white/20 flex flex-col items-center justify-center text-center p-8 min-h-[350px]">
                    {/* Background Layer with Motion */}
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://lh3.googleusercontent.com/d/13fJHIBuyemJHY5O9S5QHgeIjn0R0GNYi" 
                            alt="Ferdowsi Poem Background" 
                            className="w-full h-full object-cover transition-opacity duration-1000"
                        />
                        {/* Gradients to ensure text readability */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70 backdrop-blur-[1px]"></div>
                    </div>

                    {/* Content Layer */}
                    <div className="relative z-10 w-full px-4">
                        <Quote className="text-[#D4AF37] mx-auto mb-6 opacity-80" size={48} />
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 font-sans leading-relaxed whitespace-pre-line drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">{t.sloganSaadi}</h2>
                        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto my-8 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.7)]"></div>
                        <p className="text-[#D4AF37] italic font-bold font-sans text-xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] tracking-wide">{t.sloganRazm}</p>
                    </div>
                </div>
                
                {/* Historical Calendar Card - Background Removed and Theme-consistent */}
                <div className="relative overflow-hidden rounded-3xl shadow-soft border-2 border-[#1A5D1A]/20 dark:border-[#D4AF37]/20 flex flex-col justify-between group min-h-[350px] bg-white dark:bg-gray-800 transition-colors">
                    {/* Overlay replaced with simple gradient */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#1A5D1A]/5 via-transparent to-[#D4AF37]/5 dark:from-[#D4AF37]/5 dark:to-[#1A5D1A]/5"></div>

                    <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-[#1A5D1A] dark:text-[#D4AF37] flex items-center gap-2">
                                    <Calendar size={20}/> 
                                    تقویم جبهه و شهادت
                                </h3>
                                <span className="text-[11px] bg-[#1A5D1A] dark:bg-[#D4AF37] text-white dark:text-[#1A5D1A] px-3 py-1 rounded-full font-black shadow-lg shadow-[#1A5D1A]/20">
                                    {localizeNumber(currentDay, language)} {months[currentMonth - 1]}
                                </span>
                            </div>
                            <div className="bg-gray-50/80 dark:bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                                <h4 className="font-bold text-xl mb-2 text-gray-800 dark:text-white">{todayEvent.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-100 leading-relaxed line-clamp-4">{todayEvent.description}</p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setIsCalendarModalOpen(true); }}
                            className="mt-6 py-3 bg-[#1A5D1A]/10 dark:bg-white/10 backdrop-blur-md border border-[#1A5D1A]/20 dark:border-white/20 rounded-xl text-xs font-bold text-[#1A5D1A] dark:text-white hover:bg-[#1A5D1A]/20 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Info size={16} />
                            مشاهده رویدادهای کامل ماه و تنظیمات
                        </button>
                    </div>
                </div>
            </div>

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t.statsProfiles} value={localizeNumber(REAL_STATS.totalIsargaran, language)} icon={UserSquare2} color="green" trend="کل ایثارگران البرز" onClick={() => onNavigate('archive')} />
                <StatCard title={t.statsDocs} value={localizeNumber(REAL_STATS.totalDocuments, language)} icon={FileText} color="gold" trend="اسناد آرشیوی" onClick={() => onNavigate('archive')} />
                <StatCard title={t.statsUsers} value={localizeNumber(REAL_STATS.activeUsers, language)} icon={Users} color="blue" trend="پرسنل فعال" onClick={() => onNavigate('users')} />
                <StatCard title={t.statsStatus} value={t.online} icon={ShieldCheck} color="gray" trend={`آپ‌تایم ۹۹.۹٪`} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-[#1A5D1A] transition-colors" onClick={() => onNavigate('reports')}>
                    <h3 className="text-xl font-bold text-[#1A5D1A] dark:text-yade-gold mb-8">{t.chartDocsTrend} (تجمیعی البرز)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={docsByMonthData}>
                                <defs><linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1A5D1A" stopOpacity={0.2}/><stop offset="95%" stopColor="#1A5D1A" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-gray-700" />
                                <XAxis dataKey="name" tick={{fontFamily: 'Vazirmatn', fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{fontFamily: 'Vazirmatn', fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => localizeNumber(val, language)} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px'}} formatter={(value: number) => [localizeNumber(value, language), 'تعداد']}/>
                                <Area type="monotone" dataKey="docs" name="تعداد سند" stroke="#1A5D1A" strokeWidth={3} fillOpacity={1} fill="url(#colorDocs)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col cursor-pointer hover:border-[#1A5D1A] transition-colors" onClick={() => onNavigate('reports')}>
                    <h3 className="text-xl font-bold text-[#1A5D1A] dark:text-yade-gold mb-2">{t.chartCategories}</h3>
                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name" cornerRadius={6}>
                                    {pieData.map((e, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} strokeWidth={0} />)}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '12px'}} formatter={(value: number) => [localizeNumber(value, language), '']} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-2xl font-bold text-gray-800 dark:text-white font-sans">{localizeNumber(REAL_STATS.totalIsargaran, language)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Event Manager Modal */}
            {isCalendarModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#D4AF37] text-white rounded-2xl shadow-lg">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#1A5D1A] dark:text-yade-gold">مدیریت رویدادهای تقویم جبهه</h3>
                                    <p className="text-xs text-gray-400 mt-1">نمایش و ثبت رویدادهای تاریخی {months[currentMonth - 1]}</p>
                                </div>
                            </div>
                            <button type="button" onClick={(e) => { e.preventDefault(); setIsCalendarModalOpen(false); }} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300">لیست رویدادهای ثبت شده</h4>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setIsNewEventFormOpen(!isNewEventFormOpen); }}
                                    className="px-4 py-2 bg-[#1A5D1A] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-green-800 shadow-md transition-all"
                                >
                                    {isNewEventFormOpen ? <X size={16}/> : <Plus size={16} />}
                                    {isNewEventFormOpen ? 'انصراف' : 'ثبت رویداد جدید'}
                                </button>
                            </div>

                            {isNewEventFormOpen && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 mb-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1">روز</label>
                                            <input type="number" min="1" max="31" value={newEvent.day} onChange={e => setNewEvent({...newEvent, day: parseInt(e.target.value)})} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1">ماه</label>
                                            <select value={newEvent.month} onChange={e => setNewEvent({...newEvent, month: parseInt(e.target.value)})} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none text-sm">
                                                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="lg:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1">عنوان رویداد</label>
                                            <input type="text" placeholder="مثلاً: عملیات طریق‌القدس" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none text-sm" />
                                        </div>
                                        <div className="md:col-span-2 lg:col-span-4">
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1">شرح رویداد</label>
                                            <textarea placeholder="شرح مختصری از رویداد..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none text-sm h-20 resize-none" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button type="button" onClick={(e) => { e.preventDefault(); handleAddEvent(); }} className="bg-[#D4AF37] text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-yellow-700">
                                            <Save size={18} /> ذخیره رویداد
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-soft">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold">
                                        <tr>
                                            <th className="p-4">تاریخ</th>
                                            <th className="p-4">عنوان رویداد</th>
                                            <th className="p-4">شرح</th>
                                            <th className="p-4 text-center">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {events.sort((a, b) => a.month - b.month || a.day - b.day).map((event, index) => (
                                            <tr key={index} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${event.day === currentDay && event.month === currentMonth ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                                                <td className="p-4 whitespace-nowrap font-bold text-[#2A5CAA]">
                                                    {localizeNumber(event.day, language)} {months[event.month - 1]}
                                                </td>
                                                <td className="p-4 font-bold text-gray-800 dark:text-gray-200">{event.title}</td>
                                                <td className="p-4 text-xs text-gray-500 line-clamp-1 max-w-xs" title={event.description}>{event.description}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button type="button" onClick={(e) => { e.preventDefault(); handleDeleteEvent(index); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
