import React, { useState, useEffect } from 'react';
import { MOCK_USERS } from '../data';
import { MoreHorizontal, UserPlus, Search, Shield, Edit, Trash2 } from 'lucide-react';
import { User, UserRole } from '../types';
import UserForm from './UserForm';

const UsersList: React.FC = () => {
    const [users, setUsers] = useState<User[]>(() => {
        const saved = localStorage.getItem('yadegaran_users');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse yadegaran_users:", e);
            }
        }
        return MOCK_USERS;
    });
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        localStorage.setItem('yadegaran_users', JSON.stringify(users));
    }, [users]);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (userId: number) => {
        const userToDelete = users.find(u => u.id === userId);
        if (userToDelete && userToDelete.username === 'admin') {
            return;
        }
        setUsers(users.filter(user => user.id !== userId));
    };

    const handleSaveUser = (user: User) => {
        if (editingUser) {
            setUsers(users.map(u => (u.id === user.id ? user : u)));
        } else {
            const newUser: User = { 
                ...user, 
                id: Date.now(), 
                status: 'active' as const, 
                lastLogin: 'هم‌اکنون' 
            };
            setUsers([...users, newUser]);
        }
        setIsModalOpen(false);
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-soft">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="جستجوی کاربر..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-4 pr-10 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm border-none outline-none dark:text-white focus:ring-2 focus:ring-[#1A5D1A]"
                    />
                    <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                <button onClick={handleAddUser} className="bg-[#1A5D1A] hover:bg-green-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <UserPlus size={18} />
                    افزودن کاربر
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs">
                        <tr>
                            <th className="px-6 py-4 text-right font-medium">کاربر</th>
                            <th className="px-6 py-4 text-right font-medium">نقش دسترسی</th>
                            <th className="px-6 py-4 text-right font-medium">وضعیت</th>
                            <th className="px-6 py-4 text-right font-medium">آخرین بازدید</th>
                            <th className="px-6 py-4 text-center font-medium">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center overflow-hidden">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-gray-500 dark:text-gray-300">{user.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">{user.name}</div>
                                            <div className="text-xs text-gray-400">@{user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Shield size={14} className="text-[#D4AF37]" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {user.role === 'ADMIN' ? 'مدیر کل' : user.role === 'MANAGER' ? 'مدیر بخش' : user.role === 'EXPERT' ? 'کارشناس' : 'کاربر عادی'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${user.status === 'active' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                        {user.status === 'active' ? 'فعال' : 'غیرفعال'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 ltr text-right">
                                    {user.lastLogin}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleEditUser(user)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-blue-500 transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        {user.username !== 'admin' && (
                                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400 font-bold">
                                    کاربری با مشخصات وارد شده یافت نشد.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {isModalOpen && (
                <UserForm 
                    user={editingUser} 
                    onSave={handleSaveUser} 
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default UsersList;
