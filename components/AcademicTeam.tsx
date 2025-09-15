
import React, { useState } from 'react';
import type { Teacher, AcademicStructure, TeacherWorkload, PhaseStructure, TeacherAllocation, ClassGroup, LeaveRequest, Observation, MonitoringTemplate, TimetableHistoryEntry, TimeGrid, Permission, TeacherDocument, ProfileChangeRequest, AuditLog, CpdCourse, TeacherCpdRecord, Asset, AssetAssignment } from '../types';
import TeacherList from './TeacherList';
import TeacherProfile from './TeacherProfile';
import PendingApprovals from './PendingApprovals';
import { hasPermission } from '../permissions';

/*
-- SQL for Supabase Setup
-- Run these commands in the Supabase SQL Editor.

-- 1. Add new columns to the teachers table for self-service
ALTER TABLE public.teachers
ADD COLUMN preferred_grades TEXT[],
ADD COLUMN preferred_modes TEXT[],
ADD COLUMN workload_comments TEXT;

-- 2. Create the table for teacher documents
CREATE TABLE public.teacher_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create the table for profile change requests
CREATE TABLE public.teacher_profile_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  request_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  requested_changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Denied
  reviewed_by UUID REFERENCES public.teachers(id),
  review_date TIMESTAMPTZ
);

-- 4. Set up Supabase Storage bucket for documents
-- Go to Storage -> Create a new bucket.
-- Name it 'teacher_documents' and make it a public bucket for this demo.
-- In a real app, you would use signed URLs and stricter RLS policies.

-- 5. Row Level Security (RLS) Policies (Example for a secure setup)
-- Enable RLS on the new tables
ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profile_changes ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can see their own documents.
CREATE POLICY "Allow individual read access"
ON public.teacher_documents
FOR SELECT USING (auth.uid() = teacher_id);

-- Policy: SMT/Admins can see all documents (assuming you have a way to check roles).
-- This requires a custom function `get_my_claim('user_role')` which you'd set up with custom claims in JWT.
-- CREATE POLICY "Allow admin read access"
-- ON public.teacher_documents
-- FOR SELECT USING (get_my_claim('user_role') = 'admin');

-- Similar policies would be needed for inserts, updates, and deletes, and for the teacher_profile_changes table.
*/


interface AcademicTeamProps {
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    workloads: Map<string, TeacherWorkload>;
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    leaveRequests: LeaveRequest[];
    observations: Observation[];
    monitoringTemplates: MonitoringTemplate[];
    timeGrids: TimeGrid[];
    timetableHistory: TimetableHistoryEntry[];
    permissions: Permission[];
    currentUser: Teacher;
    logAction: (action: string, details: string) => void;
    initialFilters?: Record<string, any> | null;
    onClearInitialFilters: () => void;
    documents: TeacherDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<TeacherDocument[]>>;
    changeRequests: ProfileChangeRequest[];
    setChangeRequests: React.Dispatch<React.SetStateAction<ProfileChangeRequest[]>>;
    auditLog: AuditLog[];
    currentTenantId: string;
    cpdCourses: CpdCourse[];
    teacherCpdRecords: TeacherCpdRecord[];
    setTeacherCpdRecords: React.Dispatch<React.SetStateAction<TeacherCpdRecord[]>>;
    assets: Asset[];
    assetAssignments: AssetAssignment[];
    setAssetAssignments: React.Dispatch<React.SetStateAction<AssetAssignment[]>>;
    // FIX: Add 'setAssets' prop to the interface to be passed down.
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}


const AcademicTeam: React.FC<AcademicTeamProps> = (props) => {
    const { permissions, changeRequests, setChangeRequests, currentUser, setTeachers, auditLog } = props;
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    
    const canViewApprovals = hasPermission(permissions, 'approve:leave'); // Using leave permission as a proxy for SMT

    const handleBackToList = () => {
        setSelectedTeacher(null);
    };

    if (selectedTeacher) {
        return <TeacherProfile 
            teacher={selectedTeacher} 
            onBack={handleBackToList} 
            {...props} 
            teacherDocs={props.documents.filter(d => d.teacherId === selectedTeacher.id)}
            auditLog={auditLog.filter(log => log.userId === selectedTeacher.id)}
        />;
    }

    return (
        <div className="space-y-6">
            {canViewApprovals && (
                <PendingApprovals 
                    changeRequests={changeRequests}
                    setChangeRequests={setChangeRequests}
                    teachers={props.teachers}
                    setTeachers={setTeachers}
                    currentUser={currentUser}
                />
            )}
            <TeacherList {...props} onSelectTeacher={setSelectedTeacher} />
        </div>
    );
};

export default AcademicTeam;
