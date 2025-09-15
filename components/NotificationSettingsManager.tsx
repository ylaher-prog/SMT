import React from 'react';
import type { Teacher } from '../types';
import { Fieldset, PrimaryButton } from './FormControls';

interface NotificationSettingsManagerProps {
    currentUser: Teacher;
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

const NotificationSettingsManager: React.FC<NotificationSettingsManagerProps> = ({ currentUser, setTeachers }) => {
    const preferences = currentUser.notificationPreferences || { emailDigest: 'daily', pushEnabled: false };

    const handleChange = (field: keyof typeof preferences, value: any) => {
        const newPreferences = { ...preferences, [field]: value };
        setTeachers(prev => prev.map(t => t.id === currentUser.id ? { ...t, notificationPreferences: newPreferences } : t));
    };
    
    const handlePushToggle = () => {
        // This is a mock. In a real app, this would trigger the browser's permission prompt
        // and register a service worker for push notifications.
        if (preferences.pushEnabled) {
            handleChange('pushEnabled', false);
            alert("Push notifications disabled.");
        } else {
            alert("Browser permission prompt would appear here to enable push notifications.");
            handleChange('pushEnabled', true);
        }
    };
    
    const handleSave = () => {
        // In a real app, this would save to the database.
        // Here, the state is already updated, so we just show a confirmation.
        alert("Notification preferences saved!");
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm space-y-6">
            <Fieldset legend="Email Digests">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Receive a summary of your notifications via email.
                </p>
                <select 
                    value={preferences.emailDigest} 
                    onChange={e => handleChange('emailDigest', e.target.value)}
                    className="w-full sm:w-64 p-2.5 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                >
                    <option value="daily">Daily Summary</option>
                    <option value="weekly">Weekly Summary</option>
                    <option value="none">Never</option>
                </select>
            </Fieldset>
            
            <Fieldset legend="Push Notifications">
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Get real-time alerts directly on your device.
                </p>
                <PrimaryButton onClick={handlePushToggle} className={preferences.pushEnabled ? '!bg-red-600 hover:!bg-red-700' : ''}>
                    {preferences.pushEnabled ? 'Disable Push Notifications' : 'Enable Push Notifications'}
                </PrimaryButton>
            </Fieldset>

            <div className="flex justify-end pt-4 border-t dark:border-slate-700">
                <PrimaryButton onClick={handleSave}>
                    Save Preferences
                </PrimaryButton>
            </div>
        </div>
    );
};

export default NotificationSettingsManager;