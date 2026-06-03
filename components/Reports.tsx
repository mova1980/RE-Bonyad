
import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { MOCK_USERS, MOCK_PROFILES, localizeNumber } from '../data';
import { Download, Printer, Filter, FilePlus, ChevronRight } from 'lucide-react';
import { IsargarCategory, AlborzCity, LanguageCode, Document } from '../types';

interface ReportsProps {
    language: LanguageCode;
    documents: Document[];
    onNavigate: (tab: string) => void;
}

const Reports: React.FC<ReportsProps> = ({ language, documents, onNavigate }) => {
    const [viewMode, setViewMode] = useState<'dashboard' | 'builder'>('dashboard');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        category: '',
        docType: '',
    });

    // --- Helpers for Charts ---
    const docTypeData = [
        { name: 'تصاویر', value: documents.filter(d => d.type === 'image').length },
        { name: 'ویدیو', value: documents.filter(d => d.type === 'video').length },
        { name: 'صوت', value: documents.filter(d => d.type === 'audio').length },
        { name: 'متن', value: documents.filter(d => d.type === 'text').length },
        { name: 'PDF', value: documents.filter(d => d.type === 'pdf').length },
    ];

    const docStatusData = [
        { name: 'پردازش شده', value: documents.filter(d => d.status === 'processed').length, fill: '#4CAF50' },
        { name: 'در انتظار', value: documents.filter(d => d.status === 'pending').length, fill: '#FF9800' },
        { name: 'خطا', value: documents.filter(d => d.status === 'failed').length, fill: '#F44336' },
    ];
    
    const isargarCategoryData = Object.values(IsargarCategory).map(category => ({
        name: category,
        value: MOCK_PROFILES.filter(p => p.category === category).length
    })).filter(item => item.value > 0);

    const isargarCityData = Object.values(AlborzCity).map(city => ({
        name: city,
        value: MOCK_PROFILES.filter(p => p.city === city).length
    })).filter(item => item.value > 0);
    
    const COLORS_1 = ['#1A5D1A', '#D4AF37', '#2A5CAA', '#3A3A3A', '#8884d8'];
    const COLORS_2 = ['#FF6347', '#4682B4', '#DAA520', '#6A5ACD', '#CD5C5C', '#5F9EA0', '#D2B48C', '#8FBC8F', '#B0C4DE'];

    // --- Report Builder Logic ---
    const filteredDocs = documents.filter(doc => {
        let isValid = true;
        if (filters.docType && doc.type !== filters.docType) isValid = false;
        // Date filtering logic would go here (simplified for mock dates)
        // if (filters.startDate && doc.date < filters.startDate) isValid = false;
        
        if (filters.category) {
            // Find profile for this doc
            const profile = MOCK_PROFILES.find(p => p.id === doc.profileId);
            if (!profile || profile.category !== filters.category) isValid = false;
        }
        return isValid;
    });

    const handleExportCSV = () => {
        const headers = ["ID", "Title", "Type", "Category", "Date", "Tags"];
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + filteredDocs.map(e => `${e.id},"${e.title}",${e.type},${e.category},${e.date},"${e.tags.join('|')}"`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "yadegaran_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    if (viewMode === 'builder') {
        return (
            <div className="space-y-6 pb-10 animate-fade-in">
                <div className="flex items-center gap-2 mb-6">
                    <button onClick={() => setViewMode('dashboard')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <ChevronRight className="rtl:rotate-180" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ایجاد گزارش جدید</h2>
                </div>

                {/* Filter Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-bold mb-2">نوع سند</label>
                            <select 
                                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:border-[#1A5D1A]"
                                value={filters.docType}
                                onChange={(e) => setFilters({...filters, docType: e.target.value})}
                            >
                                <option value="">همه</option>
                                <option value="image">تصویر</option>
                                <option value="video">ویدیو</option>
                                <option value="text">متن/نامه</option>
                                <option value="pdf">PDF</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">دسته‌بندی ایثارگر</label>
                            <select 
                                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:border-[#1A5D1A]"
                                value={filters.category}
                                onChange={(e) => setFilters({...filters, category: e.target.value})}
                            >
                                <option value="">همه</option>
                                {Object.values(IsargarCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 flex justify-end gap-3">
                            <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg">
                                <Download size={18} /> خروجی اکسل (CSV)
                            </button>
                            <button onClick={handlePrint} className="bg-[#2A5CAA] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg">
                                <Printer size={18} /> چاپ / PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Result Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden print:shadow-none print:border-none">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                        <h3 className="font-bold text-lg">نتایج گزارش ({localizeNumber(filteredDocs.length, language)} رکورد)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="p-4">عنوان</th>
                                    <th className="p-4">نوع</th>
                                    <th className="p-4">دسته‌بندی</th>
                                    <th className="p-4">تاریخ</th>
                                    <th className="p-4">وضعیت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredDocs.map(doc => (
                                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-4 font-bold">{doc.title}</td>
                                        <td className="p-4">{doc.type}</td>
                                        <td className="p-4">{doc.category}</td>
                                        <td className="p-4">{localizeNumber(doc.date, language)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs ${doc.status === 'processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-2">
                    <button onClick={() => onNavigate('dashboard')} className="bg-white dark:bg-gray-800 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors">
                        <ChevronRight className="rtl:rotate-180 text-gray-500" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">داشبورد تحلیلی و گزارشات</h1>
                 </div>
                 <button onClick={() => setViewMode('builder')} className="flex items-center gap-2 px-6 py-3 bg-[#1A5D1A] text-white rounded-xl text-sm font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-900/20 hover:scale-105">
                     <FilePlus size={18}/>
                     ایجاد گزارش جدید
                 </button>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Document Type Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4">تفکیک اسناد بر اساس نوع</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={docTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => localizeNumber(value, language)}>
                                    {docTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_1[index % COLORS_1.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [localizeNumber(value, language), '']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Document Status */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4">وضعیت پردازش اسناد</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={docStatusData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={(val) => localizeNumber(val, language)} />
                                <YAxis type="category" dataKey="name" width={80} tick={{ fontFamily: 'Vazirmatn' }} />
                                <Tooltip formatter={(value: number) => [localizeNumber(value, language), '']} />
                                <Bar dataKey="value" name="تعداد اسناد" background={{ fill: '#eee' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Isargar Category Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4">توزیع پرونده‌ها بر اساس دسته‌بندی</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={isargarCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label={({ value }) => localizeNumber(value, language)}>
                                    {isargarCategoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_2[index % COLORS_2.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [localizeNumber(value, language), '']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Isargar City Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 lg:col-span-2">
                    <h3 className="text-lg font-bold mb-4">توزیع پرونده‌ها بر اساس شهر</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={isargarCityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontFamily: 'Vazirmatn', textAnchor: 'end' }} height={60} interval={0} />
                                <YAxis tickFormatter={(val) => localizeNumber(val, language)} />
                                <Tooltip formatter={(value: number) => [localizeNumber(value, language), '']} />
                                <Legend />
                                <Bar dataKey="value" name="تعداد پرونده" fill="#2A5CAA" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary Table */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-bold">خلاصه وضعیت سیستم</h3>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">شاخص</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">مقدار</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">توضیحات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        <tr>
                            <td className="px-6 py-4 font-bold">کل اسناد</td>
                            <td className="px-6 py-4">{localizeNumber(documents.length, language)}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">تعداد کل اسناد موجود در آرشیو</td>
                        </tr>
                         <tr>
                            <td className="px-6 py-4 font-bold">کل ایثارگران (پرونده)</td>
                            <td className="px-6 py-4">{localizeNumber(MOCK_PROFILES.length, language)}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">تعداد کل پرونده‌های ایثارگران ثبت‌شده در سیستم</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-bold">کل کاربران</td>
                            <td className="px-6 py-4">{localizeNumber(MOCK_USERS.length, language)}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">تعداد کل کاربران ثبت‌شده در سیستم</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-bold">نرخ پردازش موفق اسناد</td>
                            <td className="px-6 py-4 text-green-600 font-bold">
                                {localizeNumber(documents.length > 0 ? ((docStatusData[0].value / documents.length) * 100).toFixed(1) : '0', language)}%
                            </td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">درصد اسنادی که با موفقیت پردازش شده‌اند</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
