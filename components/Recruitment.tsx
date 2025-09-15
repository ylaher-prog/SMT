
import React, { useState, useMemo } from 'react';
import type { Vacancy, Candidate, Application, Interview, Teacher, AcademicStructure, Permission, Position } from '../types';
import { ApplicationStatus, EmploymentStatus } from '../types';
import { hasPermission } from '../permissions';
import { BriefcaseIcon } from './Icons';

interface RecruitmentProps {
    vacancies: Vacancy[];
    setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
    candidates: Candidate[];
    applications: Application[];
    setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
    interviews: Interview[];
    academicStructure: AcademicStructure;
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    permissions: Permission[];
    logAction: (action: string, details: string) => void;
    currentTenantId: string;
}

const KANBAN_COLUMNS: { id: ApplicationStatus, title: string }[] = [
    { id: ApplicationStatus.Applied, title: 'Applied' },
    { id: ApplicationStatus.Screening, title: 'Screening' },
    { id: ApplicationStatus.Interview, title: 'Interview' },
    { id: ApplicationStatus.Offer, title: 'Offer' },
    { id: ApplicationStatus.Hired, title: 'Hired' },
    { id: ApplicationStatus.Rejected, title: 'Rejected' },
];

const CandidateCard: React.FC<{ application: Application, candidate: Candidate }> = ({ application, candidate }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border dark:border-slate-700 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-3">
                <img src={candidate.avatarUrl} alt={candidate.fullName} className="w-10 h-10 rounded-full" />
                <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{candidate.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{candidate.email}</p>
                </div>
            </div>
        </div>
    );
};


const Recruitment: React.FC<RecruitmentProps> = (props) => {
    const { vacancies, candidates, applications, setApplications, academicStructure, teachers, setTeachers, logAction, permissions, currentTenantId } = props;

    const openVacancies = useMemo(() => vacancies.filter(v => v.status === 'Open' || v.status === 'Interviewing'), [vacancies]);
    const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(openVacancies[0]?.id || null);

    const positionMap = useMemo(() => new Map(academicStructure.positions.map(p => [p.id, p.name])), [academicStructure.positions]);
    const candidateMap = useMemo(() => new Map(candidates.map(c => [c.id, c])), [candidates]);

    const filteredApplications = useMemo(() => {
        if (!selectedVacancyId) return [];
        return applications.filter(app => app.vacancyId === selectedVacancyId);
    }, [applications, selectedVacancyId]);
    
    const handleDragStart = (e: React.DragEvent, applicationId: string) => {
        e.dataTransfer.setData('applicationId', applicationId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetStatus: ApplicationStatus) => {
        e.preventDefault();
        const applicationId = e.dataTransfer.getData('applicationId');
        if (!applicationId) return;

        const application = applications.find(app => app.id === applicationId);
        if (!application) return;

        if (targetStatus === ApplicationStatus.Hired) {
            handleHire(application);
        } else {
            setApplications(prev => prev.map(app => 
                app.id === applicationId ? { ...app, status: targetStatus } : app
            ));
        }
    };

    const handleHire = (application: Application) => {
        if (!hasPermission(permissions, 'action:hire-candidate')) {
            alert("You don't have permission to hire candidates.");
            return;
        }

        const vacancy = vacancies.find(v => v.id === application.vacancyId);
        const candidate = candidateMap.get(application.candidateId);
        if (!vacancy || !candidate) return;

        if (window.confirm(`Are you sure you want to hire ${candidate.fullName} for the ${positionMap.get(vacancy.positionId)} role? This will create a new teacher profile.`)) {
            const newTeacher: Teacher = {
                id: `teacher-${Date.now()}`,
                fullName: candidate.fullName,
                email: candidate.email,
                avatarUrl: candidate.avatarUrl,
                employmentStatus: EmploymentStatus.Probation,
                startDate: new Date().toISOString().split('T')[0],
                positionId: vacancy.positionId,
                maxLearners: 200,
                maxPeriodsByMode: { 'Live': 18 },
                specialties: [],
                markingTasks: 0,
                slas: { messageResponse: 24, markingTurnaround: 72 },
                username: candidate.email.split('@')[0],
                passwordHash: '12345',
                tenantIds: [currentTenantId],
            };
            
            setTeachers(prev => [...prev, newTeacher]);
            setApplications(prev => prev.map(app => app.id === application.id ? {...app, status: ApplicationStatus.Hired} : app));
            logAction('hire:candidate', `Hired ${candidate.fullName} as ${positionMap.get(vacancy.positionId)}`);
            alert(`${candidate.fullName} has been added to the Academic Team.`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-white">Recruitment Pipeline</h3>
                    <div>
                        <label htmlFor="vacancy-select" className="text-sm font-medium mr-2">Vacancy:</label>
                        <select
                            id="vacancy-select"
                            value={selectedVacancyId || ''}
                            onChange={e => setSelectedVacancyId(e.target.value)}
                            className="w-full sm:w-72 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                        >
                            {openVacancies.length === 0 && <option disabled>No open vacancies</option>}
                            {openVacancies.map(v => (
                                <option key={v.id} value={v.id}>
                                    {positionMap.get(v.positionId) || 'Unknown Position'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedVacancyId ? (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {KANBAN_COLUMNS.map(column => {
                        const applicationsInColumn = filteredApplications.filter(app => app.status === column.id);
                        return (
                             <div 
                                key={column.id} 
                                className="w-80 bg-gray-100 dark:bg-slate-800/60 rounded-lg p-3 flex-shrink-0 flex flex-col"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">{column.title} ({applicationsInColumn.length})</h4>
                                <div className="space-y-3 flex-grow overflow-y-auto pr-1 min-h-[200px]">
                                    {applicationsInColumn.map(app => {
                                        const candidate = candidateMap.get(app.candidateId);
                                        if (!candidate) return null;
                                        return (
                                            <div 
                                                key={app.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, app.id)}
                                            >
                                                <CandidateCard application={app} candidate={candidate} />
                                            </div>
                                        );
                                    })}
                                </div>
                             </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm">
                    <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-semibold text-gray-700 dark:text-gray-300">No Open Vacancies</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a new vacancy in Settings to start the recruitment process.</p>
                </div>
            )}
        </div>
    );
};

export default Recruitment;
