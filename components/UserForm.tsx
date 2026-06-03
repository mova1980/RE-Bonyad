
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { X, Eye, EyeOff, Lock } from 'lucide-react';

interface UserFormProps {
    user: User | null;
    onSave: (user: User) => void;
    onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<User & { password?: string, confirmPassword?: string }>>({
        name: '',
        username: '',
        role: UserRole.USER,
        status: 'active',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: '', confirmPassword: '' });
        } else {
             setFormData({
                name: '',
                username: '',
                role: UserRole.USER,
                status: 'active',
                password: '',
                confirmPassword: ''
            });
        }
        setError(null);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!user && !formData.password) {
            setError('لطفاً کلمه عبور را وارد کنید.');
            return;
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError('کلمه عبور و تایید آن با هم مطابقت ندارند.');
            return;
        }

        if (formData.password && formData.password.length < 4) {
            setError('کلمه عبور باید حداقل ۴ کاراکتر باشد.');
            return;
        }

        // Prepare object for saving (excluding internal confirmPassword)
        const { confirmPassword, ...saveData } = formData;
        onSave(saveData as User);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg m-4 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-[#F5F9F5] dark:bg-gray-900/50">
                    <h3 className="text-lg font-bold text-[#1A5D1A] dark:text-yade-gold">{user ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام کامل</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-transparent focus:ring-2 focus:ring-[#D4AF37] outline-none dark:text-white transition-all" placeholder="مثلاً: علی محمدی" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام کاربری</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-transparent focus:ring-2 focus:ring-[#D4AF37] outline-none dark:text-white transition-all ltr" placeholder="username" required />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">نقش دسترسی</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#D4AF37] outline-none dark:text-white transition-all cursor-pointer">
                                    <option value={UserRole.ADMIN}>مدیر کل</option>
                                    <option value={UserRole.MANAGER}>مدیر بخش</option>
                                    <option value={UserRole.EXPERT}>کارشناس</option>
                                    <option value={UserRole.USER}>کاربر عادی</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">وضعیت</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#D4AF37] outline-none dark:text-white transition-all cursor-pointer">
                                    <option value="active">فعال</option>
                                    <option value="inactive">غیرفعال</option>
                                </select>
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4 space-y-4">
                            <h4 className="text-xs font-bold text-[#2A5CAA] dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <Lock size={14} />
                                {user ? 'تغییر کلمه عبور (اختیاری)' : 'تنظیم کلمه عبور'}
                            </h4>
                            
                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{user ? 'کلمه عبور جدید' : 'کلمه عبور'}</label>
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-transparent focus:ring-2 focus:ring-[#D4AF37] outline-none dark:text-white transition-all ltr pr-10" 
                                    placeholder="••••••••"
                                    required={!user} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">تایید کلمه عبور</label>
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    name="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-transparent focus:ring-2 focus:ring-[#D4AF37] outline-none dark:text-white transition-all ltr pr-10" 
                                    placeholder="••••••••"
                                    required={!!formData.password} 
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold animate-shake">
                                {error}
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-bold border border-gray-200 dark:border-gray-600 hover:bg-gray-100 transition-colors">انصراف</button>
                        <button type="submit" className="px-8 py-2.5 rounded-xl bg-[#1A5D1A] text-white text-sm font-bold shadow-lg shadow-green-900/20 hover:bg-green-800 transition-all transform hover:scale-[1.02]">
                            {user ? 'ذخیره تغییرات' : 'ایجاد کاربر'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
};

export default UserForm;
