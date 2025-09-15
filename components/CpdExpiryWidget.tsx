import React, { useMemo } from 'react';
import type { Teacher, CpdCourse, TeacherCpdRecord } from '../types';
import { AcademicCapIcon } from './Icons';

interface CpdExpiryWidgetProps {
    teachers: Teacher[];
    cpdCourses: CpdCourse[];
    teacherCpdRecords: TeacherCpdRecord[];
}

const CpdExpiryWidget: React.FC<CpdExpiryWidgetProps> = ({ teachers, cpdCourses, teacherCpdRecords }) => {
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);
    const courseMap = useMemo(() => new Map(cpdCourses.map(c => [c.id, c.title])), [cpdCourses]);

    const expiringSoon = useMemo(() => {
        const now = new Date();
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(now.getDate() + 90);

        return teacherCpdRecords
            .filter(record => record.expiryDate && new Date(record.expiryDate) <= ninetyDaysFromNow && new Date(record.expiryDate) >= now)
            .map(record => ({
                ...record,
                teacherName: teacherMap.get(record.teacherId) || 'Unknown',
                courseName: courseMap.get(record.courseId) || 'Unknown Course',
                daysLeft: Math.round((new Date(record.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            }))
            .sort((a, b) => a.daysLeft - b.daysLeft);
    }, [teacherCpdRecords, teacherMap, courseMap]);

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-brand-primary" />
                Certifications Expiring Soon
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {expiringSoon.length > 0 ? (
                    expiringSoon.map(record => (
                        <div key={record.id} className="text-sm">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{record.courseName}</span>
                                <span className={`font-bold ${record.daysLeft < 30 ? 'text-red-500' : 'text-amber-500'}`}>
                                    {record.daysLeft} days
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{record.teacherName}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-center text-gray-400 py-4">No certifications expiring in the next 90 days.</p>
                )}
            </div>
        </div>
    );
};

export default CpdExpiryWidget;
