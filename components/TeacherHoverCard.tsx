import React from 'react';
import type { Teacher, TeacherWorkload } from '../types';

interface TeacherHoverCardProps {
    teacher: Teacher;
    positionName: string;
    workload?: TeacherWorkload;
}

const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200">{value}</span>
    </div>
);

const TeacherHoverCard: React.FC<TeacherHoverCardProps> = ({ teacher, positionName, workload }) => {
    
    const totalMaxPeriods = Object.values(teacher.maxPeriodsByMode || {}).reduce((a,b) => a + b, 0);

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-2xl border dark:border-slate-700">
            <div className="flex items-center gap-4">
                <img src={teacher.avatarUrl} alt={teacher.fullName} className="w-16 h-16 rounded-full" />
                <div>
                    <h4 className="font-bold text-brand-navy dark:text-white">{teacher.fullName}</h4>
                    <p className="text-sm text-brand-primary dark:text-rose-400">{positionName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{teacher.email}</p>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t dark:border-slate-700 space-y-2">
                <InfoRow label="Status" value={teacher.employmentStatus} />
                <InfoRow label="Period Load" value={`${workload?.totalPeriods || 0} / ${totalMaxPeriods}`} />
                <InfoRow label="Learner Load" value={`${workload?.totalLearners || 0} / ${teacher.maxLearners}`} />
                <InfoRow label="Class Load" value={workload?.totalClasses || 0} />
            </div>
        </div>
    );
};

export default TeacherHoverCard;