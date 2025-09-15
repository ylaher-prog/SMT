import React, { useState, useMemo } from 'react';
import type { Teacher, AcademicStructure, Vacancy, Budget, TeacherWorkload, TeacherAllocation, ClassGroup, Permission } from '../types';
import TabButton from './TabButton';
import VacancyPlanner from './VacancyPlanner';
import TeacherHoverCard from './TeacherHoverCard';

/*
-- SQL for Supabase Setup
-- Run these commands in the Supabase SQL Editor.

-- 1. Create the vacancies table
CREATE TABLE public.vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id TEXT NOT NULL, -- Corresponds to AcademicStructure.positions.id
  budget_id UUID REFERENCES public.budgets(id),
  proposed_salary NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' -- 'Open', 'Interviewing', 'Filled'
);

-- 2. Alter procurement_requests to support dynamic approvers
-- First, remove the old 'current_stage' if it exists
-- ALTER TABLE public.procurement_requests DROP COLUMN IF EXISTS current_stage;
-- Add the new columns
ALTER TABLE public.procurement_requests
ADD COLUMN status TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN current_approver_id UUID REFERENCES public.teachers(id);

-- Note: The approval_history table should now be used to track the path,
-- while current_approver_id simply points to the person whose action is required.
*/


interface OrganogramProps {
    teachers: Teacher[];
    academicStructure: AcademicStructure;
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    workloads: Map<string, TeacherWorkload>;
    vacancies: Vacancy[];
    setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
    budgets: Budget[];
    permissions: Permission[];
    // FIX: Add currentTenantId to pass down to VacancyPlanner
    currentTenantId: string;
    currentAcademicYear: string;
}

const OrganogramNode: React.FC<{ 
    teacher: Teacher; 
    positionName: string; 
    workload?: TeacherWorkload;
}> = ({ teacher, positionName, workload }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 w-64 text-center group relative">
        <div className="bg-brand-navy dark:bg-slate-700 p-3 rounded-t-lg">
             <img className="w-20 h-20 rounded-full mx-auto border-4 border-white dark:border-slate-600" src={teacher.avatarUrl} alt={teacher.fullName} />
        </div>
        <div className="p-4">
            <h3 className="text-lg font-bold text-brand-navy dark:text-white">{teacher.fullName}</h3>
            <p className="text-sm text-brand-primary dark:text-rose-400 font-semibold">{positionName}</p>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
            <TeacherHoverCard teacher={teacher} positionName={positionName} workload={workload} />
        </div>
    </div>
);

const Organogram: React.FC<OrganogramProps> = (props) => {
    const { teachers, academicStructure } = props;
    const [activeTab, setActiveTab] = useState<'chart' | 'planner'>('chart');
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

    const positionMap = useMemo(() => new Map(academicStructure.positions.map(p => [p.id, p.name])), [academicStructure.positions]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

    const reportsMap = useMemo(() => {
        const map = new Map<string, string[]>();
        teachers.forEach(t => {
            const managerId = t.managerId || 'root';
            if (!map.has(managerId)) {
                map.set(managerId, []);
            }
            map.get(managerId)!.push(t.id);
        });
        return map;
    }, [teachers]);
    
    const toggleCollapse = (teacherId: string) => {
        setCollapsedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teacherId)) {
                newSet.delete(teacherId);
            } else {
                newSet.add(teacherId);
            }
            return newSet;
        });
    };

    const renderTree = (managerId: string = 'root'): JSX.Element[] | null => {
        const reports = reportsMap.get(managerId) || [];
        if (reports.length === 0) return null;

        return reports.map(teacherId => {
            const teacher = teacherMap.get(teacherId);
            if (!teacher) return null;
            
            const isCollapsed = collapsedNodes.has(teacherId);
            const children = !isCollapsed ? renderTree(teacherId) : null;
            const hasChildren = (reportsMap.get(teacherId) || []).length > 0;
            const positionName = positionMap.get(teacher.positionId) || 'N/A';
            const workload = props.workloads.get(teacher.id);

            return (
                <li key={teacherId}>
                    <div className="flex justify-center relative my-4">
                         <OrganogramNode teacher={teacher} positionName={positionName} workload={workload} />
                         {hasChildren && (
                            <button
                                onClick={() => toggleCollapse(teacherId)}
                                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-700 w-6 h-6 rounded-full border dark:border-slate-600 text-sm font-bold z-10 hover:bg-gray-100"
                            >
                                {isCollapsed ? '+' : '-'}
                            </button>
                        )}
                    </div>
                    {children && <ul className="org-chart-branch">{children}</ul>}
                </li>
            );
        });
    };
    
    const rootNodes = renderTree();

    return (
         <div className="space-y-6">
            <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                <TabButton tabId="chart" label="Chart View" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="planner" label="Vacancy Planner" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            </div>

            {activeTab === 'chart' && (
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm overflow-x-auto">
                    <style>{`
                        .org-chart, .org-chart ul {
                            display: inline-flex;
                            position: relative;
                        }
                        .org-chart li {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            padding: 0 1rem;
                            position: relative;
                        }
                        .org-chart-branch > li::before {
                            content: '';
                            position: absolute;
                            top: -2rem;
                            left: 50%;
                            width: 1px;
                            height: 2rem;
                            background-color: #d1d5db; /* gray-300 */
                        }
                        .dark .org-chart-branch > li::before {
                            background-color: #475569; /* slate-600 */
                        }
                        .org-chart-branch > li:first-child::after,
                        .org-chart-branch > li:last-child::after {
                            content: '';
                            position: absolute;
                            top: -2rem;
                            height: 1px;
                            width: 50%;
                            background-color: #d1d5db; /* gray-300 */
                        }
                        .dark .org-chart-branch > li:first-child::after,
                        .dark .org-chart-branch > li:last-child::after {
                            background-color: #475569; /* slate-600 */
                        }
                        .org-chart-branch > li:first-child::after {
                            left: 50%;
                        }
                        .org-chart-branch > li:last-child::after {
                            right: 50%;
                        }
                        .org-chart-branch > li:only-child::after {
                            display: none;
                        }
                        .org-chart li > .flex::before {
                            content: '';
                            position: absolute;
                            bottom: 100%;
                            left: 50%;
                            width: 1px;
                            height: 1rem;
                            background-color: #d1d5db;
                        }
                        .dark .org-chart li > .flex::before {
                            background-color: #475569;
                        }
                    `}</style>
                    <ul className="org-chart">
                        {rootNodes}
                    </ul>
                </div>
            )}
            
            {activeTab === 'planner' && <VacancyPlanner {...props} />}
        </div>
    );
};

export default Organogram;