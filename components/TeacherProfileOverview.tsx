import React from 'react';
import type { Teacher, TeacherWorkload, AcademicStructure } from '../types';
import { CheckCircleIcon } from './Icons';

interface TeacherProfileOverviewProps {
    teacher: Teacher;
    workloads: Map<string, TeacherWorkload>;
    academicStructure: AcademicStructure;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">{title}</h3>
        {children}
    </div>
);

const SkillTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 rounded-full font-medium">
        {children}
    </span>
);

const RadialProgress: React.FC<{ percentage: number; label: string; value: string; color: string }> = ({ percentage, label, value, color }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle className="text-gray-200 dark:text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                    <circle 
                        className={color}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                        transform="rotate(-90 60 60)"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-brand-text-dark dark:text-white">{value}</span>
                    <span className="text-xs text-brand-text-light dark:text-gray-400">{label}</span>
                </div>
            </div>
        </div>
    );
};

const TeacherProfileOverview: React.FC<TeacherProfileOverviewProps> = ({ teacher, workloads, academicStructure }) => {
    const workload = workloads.get(teacher.id);
    const totalMaxPeriods = Object.values(teacher.maxPeriodsByMode || {}).reduce((a, b) => a + b, 0);

    const periodPercentage = totalMaxPeriods > 0 ? ((workload?.totalPeriods || 0) / totalMaxPeriods) * 100 : 0;
    const learnerPercentage = teacher.maxLearners > 0 ? ((workload?.totalLearners || 0) / teacher.maxLearners) * 100 : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
                 <InfoCard title="Workload Dashboard">
                    <div className="flex flex-col sm:flex-row justify-around items-center gap-6">
                         <RadialProgress 
                            percentage={periodPercentage}
                            label="Total Periods"
                            value={`${workload?.totalPeriods || 0}/${totalMaxPeriods}`}
                            color={periodPercentage > 90 ? 'text-red-500' : periodPercentage > 75 ? 'text-amber-500' : 'text-brand-primary'}
                         />
                         <RadialProgress 
                            percentage={learnerPercentage}
                            label="Total Learners"
                            value={`${workload?.totalLearners || 0}/${teacher.maxLearners}`}
                            color={learnerPercentage > 90 ? 'text-red-500' : learnerPercentage > 75 ? 'text-amber-500' : 'text-brand-accent'}
                         />
                    </div>
                </InfoCard>
                <InfoCard title="Skills Matrix">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Subject Specialties</h4>
                            <div className="flex flex-wrap gap-2">
                                {teacher.specialties.map(spec => <SkillTag key={spec}>{spec}</SkillTag>)}
                                {teacher.specialties.length === 0 && <p className="text-sm text-gray-400">No specialties listed.</p>}
                            </div>
                        </div>
                         <div>
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Preferred Grades</h4>
                            <div className="flex flex-wrap gap-2">
                                {(teacher.preferredGrades || []).map(grade => <SkillTag key={grade}>{grade}</SkillTag>)}
                                {(teacher.preferredGrades || []).length === 0 && <p className="text-sm text-gray-400">No preferred grades listed.</p>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Preferred Modes</h4>
                            <div className="flex flex-wrap gap-2">
                                {(teacher.preferredModes || []).map(mode => <SkillTag key={mode}>{mode}</SkillTag>)}
                                {(teacher.preferredModes || []).length === 0 && <p className="text-sm text-gray-400">No preferred modes listed.</p>}
                            </div>
                        </div>
                    </div>
                </InfoCard>
            </div>
            <div className="lg:col-span-1">
                 <InfoCard title="Profile Actions">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Teachers can request changes to their skills and preferences. These requests will be sent to SMT for approval.</p>
                        <button className="w-full bg-brand-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors">
                            Request Profile Change
                        </button>
                    </div>
                </InfoCard>
            </div>
        </div>
    );
};

export default TeacherProfileOverview;
