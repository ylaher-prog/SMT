import React from 'react';
import type { Teacher, ProfileChangeRequest } from '../types';
import { RequestStatus } from '../types';
import { CheckIcon, XMarkIcon } from './Icons';

interface PendingApprovalsProps {
    changeRequests: ProfileChangeRequest[];
    setChangeRequests: React.Dispatch<React.SetStateAction<ProfileChangeRequest[]>>;
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    currentUser: Teacher;
}

const ChangeDetail: React.FC<{ label: string; oldValue: any; newValue: any }> = ({ label, oldValue, newValue }) => (
    <div className="text-sm">
        <span className="font-semibold">{label}:</span>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-red-600 dark:text-red-400 line-through bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                {Array.isArray(oldValue) ? oldValue.join(', ') : oldValue}
            </span>
            <span>&rarr;</span>
            <span className="text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                 {Array.isArray(newValue) ? newValue.join(', ') : newValue}
            </span>
        </div>
    </div>
);


const PendingApprovals: React.FC<PendingApprovalsProps> = ({ changeRequests, setChangeRequests, teachers, setTeachers, currentUser }) => {
    const pending = changeRequests.filter(cr => cr.status === RequestStatus.Pending);
    const teacherMap = new Map(teachers.map(t => [t.id, t]));

    if (pending.length === 0) {
        return null; // Don't render the component if there are no pending requests
    }
    
    const handleReview = (requestId: string, newStatus: RequestStatus.Approved | RequestStatus.Denied) => {
        const request = pending.find(cr => cr.id === requestId);
        if (!request) return;

        if (newStatus === RequestStatus.Approved) {
            setTeachers(prev => prev.map(t => 
                t.id === request.teacherId ? { ...t, ...request.requestedChanges } : t
            ));
        }
        
        setChangeRequests(prev => prev.map(cr => 
            cr.id === requestId 
                ? { ...cr, status: newStatus, reviewedBy: currentUser.id, reviewDate: new Date().toISOString() } 
                : cr
        ));
    };

    return (
        <div className="bg-sky-50 dark:bg-sky-900/20 p-6 rounded-xl shadow-sm border border-sky-200 dark:border-sky-800/50">
            <h3 className="text-lg font-semibold text-sky-800 dark:text-sky-200 mb-4">Pending Profile Change Approvals</h3>
            <div className="space-y-4">
                {pending.map(req => {
                    const teacher = teacherMap.get(req.teacherId);
                    if (!teacher) return null;

                    return (
                        <div key={req.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start gap-4">
                            <div className="flex-1 space-y-2">
                                <p className="font-semibold">{teacher.fullName}</p>
                                {Object.entries(req.requestedChanges).map(([key, value]) => (
                                    <ChangeDetail 
                                        key={key}
                                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        oldValue={(teacher as any)[key]}
                                        newValue={value}
                                    />
                                ))}
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2 self-end md:self-center">
                                <button onClick={() => handleReview(req.id, RequestStatus.Approved)} className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 rounded-full hover:bg-green-200"><CheckIcon className="w-5 h-5" /></button>
                                <button onClick={() => handleReview(req.id, RequestStatus.Denied)} className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 rounded-full hover:bg-red-200"><XMarkIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PendingApprovals;
