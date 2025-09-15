import React from 'react';
import Modal from './Modal';
import type { Notification } from '../types';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onUpdateNotifications: (ids: string[], read: boolean) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, notifications, onUpdateNotifications }) => {
    
    const handleMarkAsRead = (id: string) => {
        onUpdateNotifications([id], true);
    };
    
    const handleMarkAllAsRead = () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            onUpdateNotifications(unreadIds, true);
        }
    };

    const footer = (
        <div className="flex justify-center">
            <button onClick={handleMarkAllAsRead} className="w-full text-center text-sm font-medium text-brand-primary hover:underline">
                Mark all as read
            </button>
        </div>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Notifications"
            footer={notifications.length > 0 ? footer : undefined}
        >
            {notifications.length > 0 ? (
                <div className="space-y-2 -m-6">
                    {notifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => !n.read && handleMarkAsRead(n.id)}
                            className={`p-4 border-b dark:border-slate-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 ${!n.read ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></div>}
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(n.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">You're all caught up!</p>
            )}
        </Modal>
    );
};

export default NotificationCenter;