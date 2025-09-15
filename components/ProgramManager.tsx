import React, { useState, useMemo } from 'react';
import type { Program, AcademicStructure } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from './Icons';
import AddEditProgramModal from './AddEditProgramModal';
import ConfirmationModal from './ConfirmationModal';

interface ProgramManagerProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    academicStructure: AcademicStructure;
    currentTenantId: string;
}

const ProgramManager: React.FC<ProgramManagerProps> = ({ programs, setPrograms, academicStructure, currentTenantId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [programToEdit, setProgramToEdit] = useState<Program | null>(null);
    const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

    const handleSave = (program: Program) => {
        if (programToEdit) {
            setPrograms(prev => prev.map(p => p.id === program.id ? program : p));
        } else {
            setPrograms(prev => [...prev, program]);
        }
        setIsModalOpen(false);
        setProgramToEdit(null);
    };

    const handleDelete = () => {
        if (programToDelete) {
            setPrograms(prev => prev.filter(p => p.id !== programToDelete.id));
            setProgramToDelete(null);
        }
    };

    const curriculumMap = useMemo(() => new Map(academicStructure.curricula.map(c => [c.id, c.name])), [academicStructure.curricula]);
    
    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Program Setup</h3>
                    <button onClick={() => { setProgramToEdit(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium">
                        <PlusIcon className="w-4 h-4" /> Add Program
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                         <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left">Program Name</th>
                                <th className="px-4 py-2 text-left">Academic Year</th>
                                <th className="px-4 py-2 text-left">Curriculum</th>
                                <th className="px-4 py-2 text-left">Grade</th>
                                <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {programs.map(program => (
                                <tr key={program.id}>
                                    <td className="px-4 py-2 font-medium">{program.name}</td>
                                    <td className="px-4 py-2">{program.academicYear}</td>
                                    <td className="px-4 py-2">{curriculumMap.get(program.curriculumId) || 'N/A'}</td>
                                    <td className="px-4 py-2">{program.grade}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setProgramToEdit(program); setIsModalOpen(true); }}><PencilIcon className="w-4 h-4 text-brand-accent"/></button>
                                            <button onClick={() => setProgramToDelete(program)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {isModalOpen && (
                <AddEditProgramModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    existingProgram={programToEdit}
                    academicStructure={academicStructure}
                    currentTenantId={currentTenantId}
                />
            )}
            {programToDelete && (
                <ConfirmationModal 
                    isOpen={!!programToDelete}
                    onClose={() => setProgramToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Program"
                    message={`Are you sure you want to delete the program "${programToDelete.name}"?`}
                />
            )}
        </>
    );
};

export default ProgramManager;
