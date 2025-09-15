
import React, { useState, useMemo } from 'react';
import type { Teacher, Observation, AcademicStructure, PhaseStructure, MonitoringTemplate, Permission, ClassGroup, TeacherAllocation, Subject } from '../types';
import TabButton from './TabButton';
import MonitoringDashboard from './MonitoringDashboard';
import MonitoringData from './MonitoringData';
import MonitoringSetup from './MonitoringSetup';
import MultiSelectFilter from './MultiSelectFilter';
import AIReportGenerator from './AIReportGenerator';
import CalibrationDashboard from './CalibrationDashboard';
import PerformanceHistoryDashboard from './PerformanceHistoryDashboard';

/*
-- SQL for Supabase Setup
-- Run these commands in the Supabase SQL Editor.

-- 1. Add new columns to the observations table
ALTER TABLE public.observations
ADD COLUMN observer_id UUID REFERENCES public.teachers(id),
ADD COLUMN calculated_score NUMERIC(5, 2),
ADD COLUMN evidence_files JSONB; -- Store an array of file objects

-- 2. Create the table for evidence files (if you want a relational link)
-- This is a more robust approach than a JSONB column.
CREATE TABLE public.observation_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id UUID REFERENCES public.observations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  upload_date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Set up Supabase Storage bucket for evidence
-- Go to Storage -> Create a new bucket.
-- Name it 'observation_evidence' and make it a public bucket for this demo.
-- In a real app, you would use signed URLs and stricter RLS policies for security.

-- 4. Enable Row Level Security (RLS) on the new table
ALTER TABLE public.observation_evidence ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies:
-- Allow observers to upload for their observations, and allow involved parties (teacher, phase head) to view.
-- This requires a more complex function to check roles/relationships.
*/

interface MonitoringProps {
    teachers: Teacher[];
    observations: Observation[];
    setObservations: React.Dispatch<React.SetStateAction<Observation[]>>;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    monitoringTemplates: MonitoringTemplate[];
    setMonitoringTemplates: React.Dispatch<React.SetStateAction<MonitoringTemplate[]>>;
    currentAcademicYear: string;
    permissions: Permission[];
    classGroups: ClassGroup[];
    allocations: TeacherAllocation[];
    logAction: (action: string, details: string) => void;
    currentUser: Teacher;
    currentTenantId: string;
}

type MonitoringTab = 'dashboard' | 'data' | 'calibration' | 'history' | 'setup' | 'ai';

const Monitoring: React.FC<MonitoringProps> = (props) => {
    const { teachers, observations, academicStructure, phaseStructures, classGroups, currentTenantId } = props;
    const [activeTab, setActiveTab] = useState<MonitoringTab>('dashboard');
    
    const [filters, setFilters] = useState({
        phases: [] as string[],
        teachers: [] as string[],
        classGroups: [] as string[],
        subjects: [] as string[],
    });

    const handleFilterChange = (filterName: keyof typeof filters, selectedValues: string[]) => {
        setFilters(prev => ({ ...prev, [filterName]: selectedValues }));
    };

    const phaseMap = useMemo(() => new Map(phaseStructures.map(p => [p.id, p])), [phaseStructures]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    const classGroupMap = useMemo(() => new Map(classGroups.map(cg => [cg.id, cg])), [classGroups]);

    const filteredObservations = useMemo(() => {
        return observations.filter(obs => {
            const teacher = teacherMap.get(obs.teacherId);
            const classGroup = obs.classGroupId ? classGroupMap.get(obs.classGroupId) : null;
            
            const phaseForObs = phaseStructures.find(p => p.grades.includes(obs.grade) && p.curriculumIds.includes(obs.curriculum));
            const phaseMatch = filters.phases.length === 0 || (phaseForObs && filters.phases.includes(phaseForObs.id));
            const teacherMatch = filters.teachers.length === 0 || (teacher && filters.teachers.includes(teacher.id));
            const classGroupMatch = filters.classGroups.length === 0 || (classGroup && filters.classGroups.includes(classGroup.id));
            const subjectMatch = filters.subjects.length === 0 || (obs.subjectId && filters.subjects.includes(obs.subjectId));

            return teacherMatch && classGroupMatch && subjectMatch && phaseMatch;
        });
    }, [filters, observations, teacherMap, classGroupMap, phaseMap, phaseStructures]);

    const renderContent = () => {
        const dashboardProps = { ...props, observations: filteredObservations };
        switch(activeTab) {
            case 'dashboard':
                return <MonitoringDashboard {...dashboardProps} />;
            case 'data':
                return <MonitoringData {...dashboardProps} />;
            case 'calibration':
                return <CalibrationDashboard {...dashboardProps} />;
            case 'history':
                return <PerformanceHistoryDashboard {...dashboardProps} />;
            case 'setup':
                return <MonitoringSetup {...props} currentTenantId={currentTenantId} />;
            case 'ai':
                return <AIReportGenerator {...dashboardProps} />;
            default:
                return null;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-200 dark:border-slate-700">
                <nav className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1">
                    <TabButton tabId="dashboard" label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="data" label="Data Entries" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="calibration" label="Calibration" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="history" label="Performance History" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="setup" label="Setup" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="ai" label="AI Insights" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                </nav>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <MultiSelectFilter label="Phases" options={phaseStructures.map(p => ({id: p.id, name: p.phase}))} selected={filters.phases} onChange={s => handleFilterChange('phases', s)} />
                     <MultiSelectFilter label="Teachers" options={teachers.map(t => ({id: t.id, name: t.fullName}))} selected={filters.teachers} onChange={s => handleFilterChange('teachers', s)} />
                     <MultiSelectFilter label="Class Groups" options={classGroups.map(cg => ({id: cg.id, name: cg.name}))} selected={filters.classGroups} onChange={s => handleFilterChange('classGroups', s)} />
                     <MultiSelectFilter label="Subjects" options={academicStructure.subjects.map(s => ({id: s.id, name: s.name}))} selected={filters.subjects} onChange={s => handleFilterChange('subjects', s)} />
                </div>
            </div>

            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default Monitoring;
