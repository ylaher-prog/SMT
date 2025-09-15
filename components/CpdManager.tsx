import React, { useState } from 'react';
import type { CpdCourse } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from './Icons';
import AddEditCpdCourseModal from './AddEditCpdCourseModal';
import ConfirmationModal from './ConfirmationModal';

interface CpdManagerProps {
    cpdCourses: CpdCourse[];
    setCpdCourses: React.Dispatch<React.SetStateAction<CpdCourse[]>>;
    currentTenantId: string;
}

const CpdManager: React.FC<CpdManagerProps> = ({ cpdCourses, setCpdCourses, currentTenantId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [courseToEdit, setCourseToEdit] = useState<CpdCourse | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<CpdCourse | null>(null);

    const handleSave = (course: CpdCourse) => {
        if (courseToEdit) {
            setCpdCourses(prev => prev.map(c => c.id === course.id ? course : c));
        } else {
            setCpdCourses(prev => [...prev, course]);
        }
        setIsModalOpen(false);
        setCourseToEdit(null);
    };

    const handleDelete = () => {
        if (courseToDelete) {
            setCpdCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
            setCourseToDelete(null);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">CPD Courses</h3>
                    <button onClick={() => { setCourseToEdit(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium">
                        <PlusIcon className="w-4 h-4" /> Add Course
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                         <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left">Title</th>
                                <th className="px-4 py-2 text-left">Provider</th>
                                <th className="px-4 py-2 text-left">Type</th>
                                <th className="px-4 py-2 text-left">Points</th>
                                <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {cpdCourses.map(course => (
                                <tr key={course.id}>
                                    <td className="px-4 py-2 font-medium">{course.title}</td>
                                    <td className="px-4 py-2">{course.provider}</td>
                                    <td className="px-4 py-2">{course.type}</td>
                                    <td className="px-4 py-2">{course.points}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setCourseToEdit(course); setIsModalOpen(true); }}><PencilIcon className="w-4 h-4 text-brand-accent"/></button>
                                            <button onClick={() => setCourseToDelete(course)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {isModalOpen && (
                <AddEditCpdCourseModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    existingCourse={courseToEdit}
                    currentTenantId={currentTenantId}
                />
            )}
            {courseToDelete && (
                <ConfirmationModal 
                    isOpen={!!courseToDelete}
                    onClose={() => setCourseToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete CPD Course"
                    message="Are you sure you want to delete this course? This might affect existing teacher records."
                />
            )}
        </>
    );
};

export default CpdManager;
