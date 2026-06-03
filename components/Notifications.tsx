import React from 'react';
import { Notification } from '../types';
import { AlertCircle, CheckCircle2, User, X } from 'lucide-react';

interface NotificationsProps {
    notifications: Notification[];
    onClose: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onClose }) => {
    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'ai': return <CheckCircle2 className="text-green-500" size={20} />;
            case 'system': return <AlertCircle className="text-red-500" size={20} />;
            case 'user': return <User className="text-blue-500" size={20} />;
            default: return <AlertCircle size={20} />;
        }
    };

    return (
        <div className="absolute top-16 left-0 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 animate-fade-in-down" dir="rtl">
            <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold">اعلانات</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={18} />
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.map(notif => (
                    <div key={notif.id} className={`p-4 flex items-start gap-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                        <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
                        <div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 text-center rounded-b-2xl">
                <button className="text-sm font-medium text-[#2A5CAA] dark:text-blue-400 hover:underline">
                    مشاهده همه
                </button>
            </div>
        </div>
    );
};

export default Notifications;
