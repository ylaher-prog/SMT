import React, { useState, useMemo } from 'react';
import type { Teacher, CpdCourse, TeacherCpdRecord } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from './Icons';
import AddEditTeacherCpdRecordModal from './AddEditTeacherCpdRecordModal';
import ConfirmationModal from './ConfirmationModal';

interface TeacherProfileCpdProps {
    teacher: Teacher;
    cpdCourses: CpdCourse[];
    teacherCpdRecords: TeacherCpdRecord[];
    setTeacherCpdRecords: React.Dispatch<React.SetStateAction<TeacherCpdRecord[]>>;
    currentTenantId: string;
}

const TeacherProfileCpd: React.FC<TeacherProfileCpdProps> = ({ teacher, cpdCourses, teacherCpdRecords, setTeacherCpdRecords, currentTenantId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<TeacherCpdRecord | null>(null);
    const [recordToDelete, setRecordToDelete] = useState<TeacherCpdRecord | null>(null);

    const courseMap = useMemo(() => new Map(cpdCourses.map(c => [c.id, c])), [cpdCourses]);
    const teacherRecords = useMemo(() => teacherCpdRecords.filter(r => r.teacherId === teacher.id), [teacherCpdRecords, teacher.id]);

    const totalPoints = useMemo(() => 
        teacherRecords.reduce((sum, record) => sum + (courseMap.get(record.courseId)?.points || 0), 0)
    , [teacherRecords, courseMap]);

    const handleSave = (record: TeacherCpdRecord) => {
        if (recordToEdit) {
            setTeacherCpdRecords(prev => prev.map(r => r.id === record.id ? record : r));
        } else {
            setTeacherCpdRecords(prev => [...prev, record]);
        }
        setIsModalOpen(false);
        setRecordToEdit(null);
    };

    const handleDelete = () => {
        if (recordToDelete) {
            setTeacherCpdRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
            setRecordToDelete(null);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-semibold">CPD Records</h3>
                        <p className="text-sm font-bold text-brand-primary dark:text-rose-400">Total Points: {totalPoints}</p>
                    </div>
                    <button onClick={() => { setRecordToEdit(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium">
                        <PlusIcon className="w-4 h-4" /> Add Record
                    </button>
                </div>
                <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                         <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left">Course/Certificate</th>
                                <th className="px-4 py-2 text-left">Provider</th>
                                <th className="px-4 py-2 text-left">Date Completed</th>
                                <th className="px-4 py-2 text-left">Expiry Date</th>
                                <th className="px-4 py-2 text-left">Points</th>
                                <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {teacherRecords.map(record => {
                                const course = courseMap.get(record.courseId);
                                return (
                                    <tr key={record.id}>
                                        <td className="px-4 py-2 font-medium">{course?.title || 'N/A'}</td>
                                        <td className="px-4 py-2">{course?.provider || 'N/A'}</td>
                                        <td className="px-4 py-2">{record.completionDate}</td>
                                        <td className="px-4 py-2">{record.expiryDate || '-'}</td>
                                        <td className="px-4 py-2">{course?.points || 0}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setRecordToEdit(record); setIsModalOpen(true); }}><PencilIcon className="w-4 h-4 text-brand-accent"/></button>
                                                <button onClick={() => setRecordToDelete(record)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && (
                <AddEditTeacherCpdRecordModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    existingRecord={recordToEdit}
                    teacherId={teacher.id}
                    cpdCourses={cpdCourses}
                    currentTenantId={currentTenantId}
                />
            )}
            {recordToDelete && (
                <ConfirmationModal 
                    isOpen={!!recordToDelete}
                    onClose={() => setRecordToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete CPD Record"
                    message="Are you sure you want to delete this CPD record?"
                />
            )}
        </>
    );
};

export default TeacherProfileCpd;
