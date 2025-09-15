
import React, { useState } from 'react';
import type { Teacher, AcademicStructure, TeacherWorkload, PhaseStructure, TeacherAllocation, ClassGroup, LeaveRequest, Observation, MonitoringTemplate, TimetableHistoryEntry, TimeGrid, Permission, TeacherDocument, ProfileChangeRequest, AuditLog, CpdCourse, TeacherCpdRecord, Asset, AssetAssignment } from '../types';
import TabButton from './TabButton';
import TeacherProfileOverview from './TeacherProfileOverview';
import TeacherProfileAllocations from './TeacherProfileAllocations';
import TeacherProfileDocuments from './TeacherProfileDocuments';
import TeacherProfileAudit from './TeacherProfileAudit';
// FIX: Import the missing ArrowLeftIcon.
import { ArrowLeftIcon } from './Icons';
import TeacherProfileCpd from './TeacherProfileCpd';
import TeacherProfileAssets from './TeacherProfileAssets';

interface TeacherProfileProps {
    teacher: Teacher;
    onBack: () => void;
    // Pass through all the main state props
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
    teacherDocs: TeacherDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<TeacherDocument[]>>;
    changeRequests: ProfileChangeRequest[];
    setChangeRequests: React.Dispatch<React.SetStateAction<ProfileChangeRequest[]>>;
    auditLog: AuditLog[];
    cpdCourses: CpdCourse[];
    teacherCpdRecords: TeacherCpdRecord[];
    setTeacherCpdRecords: React.Dispatch<React.SetStateAction<TeacherCpdRecord[]>>;
    currentTenantId: string;
    assets: Asset[];
    assetAssignments: AssetAssignment[];
    setAssetAssignments: React.Dispatch<React.SetStateAction<AssetAssignment[]>>;
    // FIX: Add missing 'setAssets' prop to the interface to satisfy TeacherProfileAssetsProps.
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

type ProfileTab = 'overview' | 'allocations' | 'cpd' | 'assets' | 'documents' | 'audit';

const TeacherProfile: React.FC<TeacherProfileProps> = (props) => {
    const { teacher, onBack } = props;
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <TeacherProfileOverview {...props} />;
            case 'allocations':
                return <TeacherProfileAllocations {...props} />;
            case 'cpd':
                // FIX: Pass currentTenantId to TeacherProfileCpd component
                return <TeacherProfileCpd {...props} currentTenantId={props.currentTenantId} />;
            case 'assets':
                return <TeacherProfileAssets {...props} />;
            case 'documents':
                 return <TeacherProfileDocuments {...props} />;
            case 'audit':
                return <TeacherProfileAudit {...props} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4">
                    <img src={teacher.avatarUrl} alt={teacher.fullName} className="w-16 h-16 rounded-full" />
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text-dark dark:text-white">{teacher.fullName}</h2>
                        <p className="text-brand-text-light dark:text-gray-400">{props.academicStructure.positions.find(p => p.id === teacher.positionId)?.name}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-200 dark:border-slate-700">
                <nav className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1">
                    <TabButton tabId="overview" label="Overview" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="allocations" label="Allocations" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="cpd" label="CPD" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="assets" label="Assets" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="documents" label="Documents" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="audit" label="Audit Trail" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                </nav>
            </div>
            
            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default TeacherProfile;
