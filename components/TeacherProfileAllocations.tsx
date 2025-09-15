import React, { useMemo } from 'react';
import type { Teacher, ClassGroup, Subject, TeacherAllocation, AcademicStructure } from '../types';

interface TeacherProfileAllocationsProps {
    teacher: Teacher;
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    academicStructure: AcademicStructure;
}

const TeacherProfileAllocations: React.FC<TeacherProfileAllocationsProps> = ({ teacher, allocations, classGroups, academicStructure }) => {
    
    const curriculumMap = useMemo(() => new Map(academicStructure.curricula.map(c => [c.id, c.name])), [academicStructure.curricula]);
    
    const teacherAllocations = useMemo(() => {
        const classGroupMap = new Map(classGroups.map(cg => [cg.id, cg]));
        const subjectMap = new Map(academicStructure.subjects.map(s => [s.id, s]));
        
        return allocations
            .filter(a => a.teacherId === teacher.id)
            .map(a => ({
                ...a,
                classGroup: classGroupMap.get(a.classGroupId),
                subject: subjectMap.get(a.subjectId)
            }))
            .filter(a => a.classGroup && a.subject)
            .sort((a, b) => a.classGroup!.name.localeCompare(b.classGroup!.name));
    }, [teacher.id, allocations, classGroups, academicStructure.subjects]);

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Current Allocations</h3>
            {teacherAllocations.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class Group</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Curriculum</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Learners</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                            {teacherAllocations.map(alloc => (
                                <tr key={alloc.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">{alloc.classGroup!.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{alloc.subject!.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{alloc.classGroup!.grade}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{curriculumMap.get(alloc.classGroup!.curriculumId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{alloc.classGroup!.learnerCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">This teacher has no allocations.</p>
            )}
        </div>
    );
};

export default TeacherProfileAllocations;
