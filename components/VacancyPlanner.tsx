



import React, { useState, useMemo } from 'react';
import type { Vacancy, Budget, AcademicStructure, Permission, Teacher } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './Icons';
import KpiCard from './KpiCard';
import AddEditVacancyModal from './AddEditVacancyModal';
import ConfirmationModal from './ConfirmationModal';
import { hasPermission } from '../permissions';

interface VacancyPlannerProps {
    vacancies: Vacancy[];
    setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
    budgets: Budget[];
    academicStructure: AcademicStructure;
    permissions: Permission[];
    currentTenantId: string;
    currentAcademicYear: string;
}

const VacancyPlanner: React.FC<VacancyPlannerProps> = (props) => {
    const { vacancies, setVacancies, budgets, academicStructure, permissions, currentTenantId, currentAcademicYear } = props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [vacancyToEdit, setVacancyToEdit] = useState<Vacancy | null>(null);
    const [vacancyToDelete, setVacancyToDelete] = useState<Vacancy | null>(null);

    const positionMap = useMemo(() => new Map(academicStructure.positions.map(p => [p.id, p.name])), [academicStructure.positions]);
    const budgetMap = useMemo(() => new Map(budgets.map(b => [b.id, b.name])), [budgets]);
    const canEdit = hasPermission(permissions, 'edit:settings-positions'); // Re-using permission

    const kpiData = useMemo(() => {
        // FIX: The status 'Filled' is not valid for a Vacancy. The correct status to exclude is 'Closed'.
        const totalOpenings = vacancies.filter(v => v.status !== 'Closed').length;
        const budgetImpact = vacancies
            // FIX: The status 'Filled' is not valid for a Vacancy. The correct status to exclude is 'Closed'.
            .filter(v => v.status !== 'Closed')
            .reduce((sum, v) => sum + v.proposedSalary, 0);
        return { totalOpenings, budgetImpact };
    }, [vacancies]);

    const handleSave = (vacancy: Vacancy) => {
        if (vacancyToEdit) {
            setVacancies(prev => prev.map(v => v.id === vacancy.id ? vacancy : v));
        } else {
            setVacancies(prev => [...prev, vacancy]);
        }
        setIsModalOpen(false);
        setVacancyToEdit(null);
    };

    const handleDelete = () => {
        if (vacancyToDelete) {
            setVacancies(prev => prev.filter(v => v.id !== vacancyToDelete.id));
            setVacancyToDelete(null);
        }
    };

    return (
        <>
            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <KpiCard title="Total Open Vacancies" value={kpiData.totalOpenings} icon={<PlusIcon />} />
                    <KpiCard title="Total Budget Impact (Annual)" value={`R ${kpiData.budgetImpact.toLocaleString()}`} icon={<PlusIcon />} />
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Vacancy List</h3>
                        {canEdit && (
                            <button onClick={() => { setVacancyToEdit(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium">
                                <PlusIcon className="w-4 h-4" /> Add Vacancy
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-4 py-2 text-left">Position</th>
                                    <th className="px-4 py-2 text-left">Budget</th>
                                    <th className="px-4 py-2 text-left">Proposed Salary (Annual)</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    {canEdit && <th className="px-4 py-2 text-left">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {vacancies.map(v => (
                                    <tr key={v.id} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-2 font-semibold">{positionMap.get(v.positionId) || 'N/A'}</td>
                                        <td className="px-4 py-2">{budgetMap.get(v.budgetId) || 'N/A'}</td>
                                        <td className="px-4 py-2">R {v.proposedSalary.toLocaleString()}</td>
                                        <td className="px-4 py-2">{v.status}</td>
                                        {canEdit && (
                                            <td className="px-4 py-2">
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setVacancyToEdit(v); setIsModalOpen(true); }}><PencilIcon className="w-4 h-4 text-brand-accent"/></button>
                                                    <button onClick={() => setVacancyToDelete(v)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && canEdit && (
                <AddEditVacancyModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    existingVacancy={vacancyToEdit}
                    budgets={budgets}
                    academicStructure={academicStructure}
                    currentTenantId={currentTenantId}
                    currentAcademicYear={currentAcademicYear}
                />
            )}
            {vacancyToDelete && canEdit && (
                <ConfirmationModal 
                    isOpen={!!vacancyToDelete}
                    onClose={() => setVacancyToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Vacancy"
                    message={`Are you sure you want to delete the vacancy for ${positionMap.get(vacancyToDelete.positionId)}?`}
                />
            )}
        </>
    );
};

export default VacancyPlanner;