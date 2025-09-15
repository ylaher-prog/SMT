



import React, { lazy, Suspense, useState, useMemo, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase';

// FIX: Add Vendor and Budget to type imports
// FIX: Add Program to type imports to resolve downstream prop error
import type { Teacher, AcademicStructure, TeacherWorkload, PhaseStructure, TeacherAllocation, ClassGroup, LeaveRequest, Observation, MonitoringTemplate, TimetableHistoryEntry, TimeGrid, Permission, Page, Subject, AllocationSettings, GeneralSettings, TimeConstraint, ParentQuery, TaskBoard, Workflow, AuditLog, Notification, ProcurementRequest, TeacherDocument, ProfileChangeRequest, ParentQuerySlaSetting, LeavePolicy, Vendor, Budget, RateCard, PayrollRun, WorkflowTemplate, Vacancy, Candidate, Application, Interview, Tenant, CpdCourse, TeacherCpdRecord, Asset, AssetAssignment, Program } from './types';

// FIX: Add MOCK_PROGRAMS to imports
import { MOCK_TEACHERS, MOCK_ACADEMIC_STRUCTURE, MOCK_PHASE_STRUCTURES, DEFAULT_TIME_GRIDS, DEFAULT_ALLOCATION_SETTINGS, DEFAULT_GENERAL_SETTINGS, DEFAULT_MONITORING_TEMPLATES, MOCK_TASK_BOARDS, MOCK_WORKFLOWS, MOCK_DOCUMENTS, MOCK_CHANGE_REQUESTS, MOCK_PARENT_QUERIES, MOCK_PARENT_QUERY_SLA_SETTINGS, MOCK_LEAVE_POLICIES, MOCK_VENDORS, MOCK_BUDGETS, MOCK_PROCUREMENT_REQUESTS, MOCK_RATE_CARDS, MOCK_WORKFLOW_TEMPLATES, MOCK_VACANCIES, MOCK_CANDIDATES, MOCK_APPLICATIONS, MOCK_INTERVIEWS, MOCK_TENANTS, MOCK_CPD_COURSES, MOCK_TEACHER_CPD_RECORDS, MOCK_ASSETS, MOCK_ASSET_ASSIGNMENTS, MOCK_PROGRAMS } from './constants';
import { getUserPermissions } from './permissions';
import { getSubjectPeriods, getEffectiveLearnerCount } from './utils';
import { generateNotification } from './utils/notifications';
import { formatLogDetails } from './utils/logging';
import TeacherDashboard from './components/TeacherDashboard';


// Lazy load page components for better performance
const AcademicTeam = lazy(() => import('./components/AcademicTeam'));
const Allocations = lazy(() => import('./components/Allocations'));
const Timetable = lazy(() => import('./components/Timetable'));
const Tasks = lazy(() => import('./components/Tasks'));
const Workflow = lazy(() => import('./components/Workflow'));
const Payroll = lazy(() => import('./components/Payroll'));
const Leave = lazy(() => import('./components/Leave'));
const Monitoring = lazy(() => import('./components/Monitoring'));
const Procurement = lazy(() => import('./components/Procurement'));
// FIX: The lazy import for Parents was failing, likely due to a syntax error in an imported dependency (constants.ts). The syntax error is fixed in constants.ts. The import itself is correct.
const Parents = lazy(() => import('./components/Parents'));
const Settings = lazy(() => import('./components/Settings'));
const Recruitment = lazy(() => import('./components/Recruitment'));
const Assets = lazy(() => import('./components/Assets'));
const Analytics = lazy(() => import('./components/Analytics'));

const LoadingFallback: React.FC = () => (
    <div className="flex items-center justify-center h-full">
        <p>Loading page...</p>
    </div>
);

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>('dashboard');

    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (localStorage.getItem('theme') === 'dark') {
            return true;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Global, non-tenant-specific state
    const [allTeachers, setAllTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
    const [allAcademicStructure, setAllAcademicStructure] = useState<AcademicStructure>(MOCK_ACADEMIC_STRUCTURE);
    const [allPhaseStructures, setAllPhaseStructures] = useState<PhaseStructure[]>(MOCK_PHASE_STRUCTURES);
    const [allClassGroups, setAllClassGroups] = useState<ClassGroup[]>([]);
    const [allAllocations, setAllAllocations] = useState<TeacherAllocation[]>([]);
    const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
    const [allObservations, setAllObservations] = useState<Observation[]>([]);
    const [allProcurementRequests, setAllProcurementRequests] = useState<ProcurementRequest[]>(MOCK_PROCUREMENT_REQUESTS);
    const [allParentQueries, setAllQueries] = useState<ParentQuery[]>(MOCK_PARENT_QUERIES);
    const [allTimeGrids, setAllTimeGrids] = useState<TimeGrid[]>(DEFAULT_TIME_GRIDS);
    const [allTimeConstraints, setAllTimeConstraints] = useState<TimeConstraint[]>([]);
    const [allTimetableHistory, setAllTimetableHistory] = useState<TimetableHistoryEntry[]>([]);
    const [allTaskBoards, setAllBoards] = useState<TaskBoard[]>(MOCK_TASK_BOARDS);
    const [allWorkflows, setAllWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
    // FIX: Initialize useState with an array as the type is `AllocationSettings[]`.
    const [allAllocationSettings, setAllAllocationSettings] = useState<AllocationSettings[]>(DEFAULT_ALLOCATION_SETTINGS);
    // FIX: Initialize useState with an array as the type is `GeneralSettings[]`.
    const [allGeneralSettings, setAllGeneralSettings] = useState<GeneralSettings[]>(DEFAULT_GENERAL_SETTINGS);
    const [allMonitoringTemplates, setAllMonitoringTemplates] = useState<MonitoringTemplate[]>(DEFAULT_MONITORING_TEMPLATES);
    const [allAuditLog, setAllAuditLog] = useState<AuditLog[]>([]);
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [allDocuments, setAllDocuments] = useState<TeacherDocument[]>(MOCK_DOCUMENTS);
    const [allChangeRequests, setAllChangeRequests] = useState<ProfileChangeRequest[]>(MOCK_CHANGE_REQUESTS);
    const [allParentQuerySlaSettings, setAllParentQuerySlaSettings] = useState<ParentQuerySlaSetting[]>(MOCK_PARENT_QUERY_SLA_SETTINGS);
    const [allLeavePolicies, setAllLeavePolicies] = useState<LeavePolicy[]>(MOCK_LEAVE_POLICIES);
    const [allVendors, setAllVendors] = useState<Vendor[]>(MOCK_VENDORS);
    const [allBudgets, setAllBudgets] = useState<Budget[]>(MOCK_BUDGETS);
    const [allRateCards, setAllRateCards] = useState<RateCard[]>(MOCK_RATE_CARDS);
    const [allPayrollHistory, setAllPayrollHistory] = useState<PayrollRun[]>([]);
    const [allWorkflowTemplates, setAllWorkflowTemplates] = useState<WorkflowTemplate[]>(MOCK_WORKFLOW_TEMPLATES);
    const [allVacancies, setAllVacancies] = useState<Vacancy[]>(MOCK_VACANCIES);
    const [allApplications, setAllApplications] = useState<Application[]>(MOCK_APPLICATIONS);
    const [allInterviews, setAllInterviews] = useState<Interview[]>(MOCK_INTERVIEWS);
    const [allCpdCourses, setAllCpdCourses] = useState<CpdCourse[]>(MOCK_CPD_COURSES);
    const [allTeacherCpdRecords, setAllTeacherCpdRecords] = useState<TeacherCpdRecord[]>(MOCK_TEACHER_CPD_RECORDS);
    const [allAssets, setAllAssets] = useState<Asset[]>(MOCK_ASSETS);
    const [allAssetAssignments, setAllAssetAssignments] = useState<AssetAssignment[]>(MOCK_ASSET_ASSIGNMENTS);
    // FIX: Add state for programs to pass to Settings component
    const [allPrograms, setAllPrograms] = useState<Program[]>(MOCK_PROGRAMS);


    // Global state (non-data)
    const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
    const [currentAcademicYear, setCurrentAcademicYear] = useState<string>(allAcademicStructure.academicYears[0] || new Date().getFullYear().toString());
    const [selectedPhaseId, setSelectedPhaseId] = useState<string>('all');
    const [selectedCurriculum, setSelectedCurriculum] = useState<string>('all');
    const [selectedMode, setSelectedMode] = useState<string>('all');
    const [teacherListFilters, setTeacherListFilters] = useState<Record<string, any> | null>(null);
    
    // Mock user & tenant state
    const [currentUser, setCurrentUser] = useState<Teacher | null>(allTeachers.find(t => t.username === 'admin') || allTeachers[0]);
    const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
    const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser && currentUser.tenantIds.length > 0) {
            if (!currentTenantId || !currentUser.tenantIds.includes(currentTenantId)) {
                setCurrentTenantId(currentUser.tenantIds[0]);
            }
        }
    }, [currentUser, currentTenantId]);

    // Tenant-specific and Year-specific data derived from global state (simulating RLS + Year filter)
    const tenantData = useMemo(() => {
        if (!currentTenantId) {
            return {
                teachers: [], academicStructure: { ...MOCK_ACADEMIC_STRUCTURE, curricula: [], subjects: [], positions: [] },
                phaseStructures: [], classGroups: [], allocations: [], leaveRequests: [], observations: [],
                procurementRequests: [], parentQueries: [], timeGrids: [], timeConstraints: [],
                timetableHistory: [], taskBoards: [], workflows: [], allocationSettings: DEFAULT_ALLOCATION_SETTINGS[0],
                generalSettings: DEFAULT_GENERAL_SETTINGS[0], monitoringTemplates: [], auditLog: [], notifications: [],
                documents: [], changeRequests: [], parentQuerySlaSettings: [], leavePolicies: [], vendors: [],
                budgets: [], rateCards: [], payrollHistory: [], workflowTemplates: [], vacancies: [],
                applications: [], interviews: [], cpdCourses: [], teacherCpdRecords: [], assets: [], assetAssignments: [], programs: []
            };
        }

        const teachers = allTeachers.filter(t => t.tenantIds.includes(currentTenantId));
        const academicStructure = {
            ...allAcademicStructure,
            curricula: allAcademicStructure.curricula.filter(c => c.tenantId === currentTenantId),
            subjects: allAcademicStructure.subjects.filter(s => s.tenantId === currentTenantId),
            positions: allAcademicStructure.positions.filter(p => p.tenantId === currentTenantId),
        };
        const phaseStructures = allPhaseStructures.filter(p => p.tenantId === currentTenantId);
        const timeGrids = allTimeGrids.filter(p => p.tenantId === currentTenantId);
        const taskBoards = allTaskBoards.filter(p => p.tenantId === currentTenantId);
        const workflows = allWorkflows.filter(p => p.tenantId === currentTenantId);
        const allocationSettings = allAllocationSettings.find(p => p.tenantId === currentTenantId) || DEFAULT_ALLOCATION_SETTINGS[0];
        const generalSettings = allGeneralSettings.find(p => p.tenantId === currentTenantId) || DEFAULT_GENERAL_SETTINGS[0];
        const monitoringTemplates = allMonitoringTemplates.filter(p => p.tenantId === currentTenantId);
        const auditLog = allAuditLog.filter(p => p.tenantId === currentTenantId);
        const notifications = allNotifications.filter(p => p.tenantId === currentTenantId);
        const documents = allDocuments.filter(p => p.tenantId === currentTenantId);
        const changeRequests = allChangeRequests.filter(p => p.tenantId === currentTenantId);
        const parentQuerySlaSettings = allParentQuerySlaSettings.filter(p => p.tenantId === currentTenantId);
        const leavePolicies = allLeavePolicies.filter(p => p.tenantId === currentTenantId);
        const vendors = allVendors.filter(p => p.tenantId === currentTenantId);
        const rateCards = allRateCards.filter(p => p.tenantId === currentTenantId);
        const payrollHistory = allPayrollHistory.filter(p => p.tenantId === currentTenantId);
        const workflowTemplates = allWorkflowTemplates.filter(p => p.tenantId === currentTenantId);
        const applications = allApplications.filter(p => p.tenantId === currentTenantId);
        const interviews = allInterviews.filter(p => p.tenantId === currentTenantId);
        const cpdCourses = allCpdCourses.filter(c => c.tenantId === currentTenantId);
        const teacherCpdRecords = allTeacherCpdRecords.filter(r => r.tenantId === currentTenantId);
        const assets = allAssets.filter(a => a.tenantId === currentTenantId);
        const assetAssignments = allAssetAssignments.filter(a => a.tenantId === currentTenantId);
        const programs = allPrograms.filter(p => p.tenantId === currentTenantId);
        
        // Year-specific filtering
        const budgets = allBudgets.filter(p => p.tenantId === currentTenantId && p.academicYear === currentAcademicYear);
        const vacancies = allVacancies.filter(p => p.tenantId === currentTenantId && p.academicYear === currentAcademicYear);
        const classGroups = allClassGroups.filter(p => p.tenantId === currentTenantId && p.academicYear === currentAcademicYear);
        const validClassGroupIds = new Set(classGroups.map(cg => cg.id));
        const allocations = allAllocations.filter(p => p.tenantId === currentTenantId && validClassGroupIds.has(p.classGroupId));
        const leaveRequests = allLeaveRequests.filter(p => p.tenantId === currentTenantId && p.academicYear === currentAcademicYear);
        const observations = allObservations.filter(p => p.tenantId === currentTenantId && p.academicYear === currentAcademicYear);
        const procurementRequests = allProcurementRequests.filter(p => p.tenantId === currentTenantId && p.academicYear === currentAcademicYear);
        const parentQueries = allParentQueries.filter(p => p.tenantId === currentTenantId && p.academicYear === currentAcademicYear);
        const timeConstraints = allTimeConstraints.filter(p => p.tenantId === currentTenantId && p.academicYear === currentAcademicYear);
        const timetableHistory = allTimetableHistory.filter(p => p.tenantId === currentTenantId && p.academicYear === currentAcademicYear);


        return { teachers, academicStructure, phaseStructures, classGroups, allocations, leaveRequests, observations, procurementRequests, parentQueries, timeGrids, timeConstraints, timetableHistory, taskBoards, workflows, allocationSettings, generalSettings, monitoringTemplates, auditLog, notifications, documents, changeRequests, parentQuerySlaSettings, leavePolicies, vendors, budgets, rateCards, payrollHistory, workflowTemplates, vacancies, applications, interviews, cpdCourses, teacherCpdRecords, assets, assetAssignments, programs };
        
    }, [currentTenantId, currentAcademicYear, allTeachers, allAcademicStructure, allPhaseStructures, allClassGroups, allAllocations, allLeaveRequests, allObservations, allProcurementRequests, allParentQueries, allTimeGrids, allTimeConstraints, allTimetableHistory, allTaskBoards, allWorkflows, allAllocationSettings, allGeneralSettings, allMonitoringTemplates, allAuditLog, allNotifications, allDocuments, allChangeRequests, allParentQuerySlaSettings, allLeavePolicies, allVendors, allBudgets, allRateCards, allPayrollHistory, allWorkflowTemplates, allVacancies, allApplications, allInterviews, allCpdCourses, allTeacherCpdRecords, allAssets, allAssetAssignments, allPrograms]);

    const { teachers, academicStructure, phaseStructures, classGroups, allocations, leaveRequests, observations, procurementRequests, parentQueries, timeGrids, timeConstraints, timetableHistory, taskBoards, workflows, allocationSettings, generalSettings, monitoringTemplates, auditLog, notifications, documents, changeRequests, parentQuerySlaSettings, leavePolicies, vendors, budgets, rateCards, payrollHistory, workflowTemplates, vacancies, applications, interviews, cpdCourses, teacherCpdRecords, assets, assetAssignments, programs } = tenantData;
    
    const permissions = useMemo(() => currentUser ? getUserPermissions(currentUser, academicStructure.positions) : [], [currentUser, academicStructure.positions]);
    
    useEffect(() => {
        if (!currentUser || !currentTenantId) return;

        // In a real app, you would fetch from the DB. Here we just use mock data.
        const mockInitialNotifications: Notification[] = [
            generateNotification(currentUser.id, 'newParentQuery', { parentName: 'Alice Johnson', studentName: 'Bob' }, currentTenantId),
        ].map(n => ({...n, read: false}));
        setAllNotifications(prev => [...prev.filter(n => n.tenantId !== currentTenantId), ...mockInitialNotifications]);
        
    }, [currentUser, currentTenantId]);


    const sendNotification = useCallback(async (userId: string, type: Notification['type'], data: any) => {
        if (!currentUser || !currentTenantId) return;
        const newNotifData = generateNotification(userId, type, data, currentTenantId);
        
        // --- MOCK LOGIC ---
        // In a real-time app, this insert would trigger the Supabase subscription for the target user.
        // For this demo, if the notification is for the current user, we'll add it directly.
        if (userId === currentUser.id) {
             setAllNotifications(prev => [newNotifData, ...prev]);
        }
        console.log(`Mock DB Insert: Notification for ${userId} in tenant ${currentTenantId}`, newNotifData);
    }, [currentUser, currentTenantId]);
    
    const updateNotification = useCallback(async (notificationIds: string[], readStatus: boolean) => {
        setAllNotifications(prev =>
          prev.map(n => (notificationIds.includes(n.id) ? { ...n, read: readStatus } : n))
        );
        console.log(`Mock DB Update: Set notifications ${notificationIds.join(', ')} to read=${readStatus}`);
    }, []);

    const workloads = useMemo(() => {
        const newWorkloads = new Map<string, TeacherWorkload>();
        const subjectMap = new Map(academicStructure.subjects.map(s => [s.id, s]));
        const groupMap = new Map(classGroups.map(g => [g.id, g]));
        const curriculumMap = new Map(academicStructure.curricula.map(c => [c.id, c.name]));

        teachers.forEach(teacher => {
            const workload: TeacherWorkload = {
                totalPeriods: 0, totalLearners: 0, totalClasses: 0, periodsByMode: {},
            };
            const teacherAllocations = allocations.filter(a => a.teacherId === teacher.id);
            const assignedGroupIds = new Set<string>();

            teacherAllocations.forEach(alloc => {
                const group = groupMap.get(alloc.classGroupId);
                const subject = subjectMap.get(alloc.subjectId);
                if (group && subject) {
                    const curriculumName = curriculumMap.get(group.curriculumId) || '';
                    const periods = getSubjectPeriods(subject, group.curriculumId, group.grade, group.mode);
                    workload.totalPeriods += periods;
                    workload.periodsByMode[group.mode] = (workload.periodsByMode[group.mode] || 0) + periods;
                    if (!assignedGroupIds.has(group.id)) {
                        workload.totalLearners += getEffectiveLearnerCount(subject, group, subjectMap);
                        workload.totalClasses++;
                        assignedGroupIds.add(group.id);
                    }
                }
            });
            newWorkloads.set(teacher.id, workload);
        });
        return newWorkloads;
    }, [teachers, allocations, classGroups, academicStructure.subjects, academicStructure.curricula]);
    
    const logAction = useCallback((action: string, details: any) => {
        if (!currentUser || !currentTenantId) return;
        const newLog: AuditLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.fullName,
            action,
            details: typeof details === 'string' ? details : formatLogDetails(action, details),
            tenantId: currentTenantId,
        };
        setAllAuditLog(prev => [newLog, ...prev]);
    }, [currentUser, currentTenantId]);
    
    const resetStateToDefault = () => {
        // This is a powerful "reset" button for the demo.
        localStorage.clear();
        window.location.reload();
    };

    const handleSetAllocationSettings = (newSettingsForCurrentTenant: AllocationSettings) => {
        if (!currentTenantId) return;
        setAllAllocationSettings(prev => 
            prev.map(s => s.tenantId === currentTenantId ? newSettingsForCurrentTenant : s)
        );
    };

    const handleSetGeneralSettings = (newSettingsForCurrentTenant: GeneralSettings) => {
        if (!currentTenantId) return;
        setAllGeneralSettings(prev =>
            prev.map(s => s.tenantId === currentTenantId ? newSettingsForCurrentTenant : s)
        );
    };

    const handleOnKpiClick = (page: Page, filters: Record<string, any>) => {
        setTeacherListFilters(filters);
        setActivePage(page);
    };

    if (!currentUser || !currentTenantId) {
        // In a real app, this would be a login screen or a tenant selection screen.
        return <div className="flex items-center justify-center h-screen">Loading user data or select a school...</div>;
    }

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return <Dashboard teachers={teachers} workloads={workloads} phaseStructures={phaseStructures} permissions={permissions} sendNotification={sendNotification} allocations={allocations} classGroups={classGroups} onKpiClick={handleOnKpiClick} selectedPhaseId={selectedPhaseId} selectedCurriculum={selectedCurriculum} selectedMode={selectedMode} academicStructure={academicStructure} cpdCourses={cpdCourses} teacherCpdRecords={teacherCpdRecords}/>;
            case 'academic-team':
                // FIX: Pass currentTenantId to AcademicTeam component
                // FIX: Pass the 'setAssets' prop down to the AcademicTeam component to resolve a downstream missing prop error.
                return <AcademicTeam teachers={teachers} setTeachers={setAllTeachers} academicStructure={academicStructure} phaseStructures={phaseStructures} workloads={workloads} allocations={allocations} classGroups={classGroups} leaveRequests={leaveRequests} observations={observations} monitoringTemplates={monitoringTemplates} timeGrids={timeGrids} timetableHistory={timetableHistory} permissions={permissions} currentUser={currentUser} logAction={logAction} initialFilters={teacherListFilters} onClearInitialFilters={() => setTeacherListFilters(null)} documents={documents} setDocuments={setAllDocuments} changeRequests={changeRequests} setChangeRequests={setAllChangeRequests} auditLog={auditLog} currentTenantId={currentTenantId} cpdCourses={cpdCourses} teacherCpdRecords={teacherCpdRecords} setTeacherCpdRecords={setAllTeacherCpdRecords} assets={assets} setAssets={setAllAssets} assetAssignments={assetAssignments} setAssetAssignments={setAllAssetAssignments} />;
            case 'allocations':
                // FIX: Pass currentTenantId to Allocations component
                return <Allocations teachers={teachers} setTeachers={setAllTeachers} classGroups={classGroups} allocations={allocations} academicStructure={academicStructure} phaseStructures={phaseStructures} setAllocations={setAllAllocations} teacherWorkloads={workloads} allocationSettings={allocationSettings} generalSettings={generalSettings} timeGrids={timeGrids} timetableHistory={timetableHistory} permissions={permissions} logAction={logAction} currentTenantId={currentTenantId}/>;
            case 'timetable':
                // FIX: Pass currentTenantId to Timetable component
                return <Timetable timeGrids={timeGrids} setTimeGrids={setAllTimeGrids} timeConstraints={timeConstraints} setTimeConstraints={setAllTimeConstraints} timetableHistory={timetableHistory} setTimetableHistory={setAllTimetableHistory} teachers={teachers} classGroups={classGroups} setClassGroups={setAllClassGroups} allocations={allocations} academicStructure={academicStructure} currentAcademicYear={currentAcademicYear} permissions={permissions} logAction={logAction} currentTenantId={currentTenantId} />;
            case 'tasks':
                // FIX: Pass currentTenantId to Tasks component
                return <Tasks boards={taskBoards} setBoards={setAllBoards} allTeachers={allTeachers} currentUser={currentUser} permissions={permissions} workflowTemplates={workflowTemplates} setWorkflowTemplates={setAllWorkflowTemplates} parentQueries={parentQueries} procurementRequests={procurementRequests} observations={observations} currentTenantId={currentTenantId} />;
            case 'workflow':
                 // FIX: Pass currentTenantId to Workflow component
                 return <Workflow workflows={workflows} setWorkflows={setAllWorkflows} allTeachers={allTeachers} taskBoards={taskBoards} permissions={permissions} currentTenantId={currentTenantId} />;
            case 'payroll':
                 // FIX: Pass currentTenantId to Payroll component
                 return <Payroll teachers={teachers} permissions={permissions} logAction={logAction} workloads={workloads} rateCards={rateCards} payrollHistory={payrollHistory} setPayrollHistory={setAllPayrollHistory} currentUser={currentUser} currentTenantId={currentTenantId} />;
            case 'leave':
                // FIX: Pass currentTenantId to Leave component
                return <Leave teachers={teachers} setTeachers={setAllTeachers} leaveRequests={leaveRequests} setLeaveRequests={setAllLeaveRequests} currentAcademicYear={currentAcademicYear} permissions={permissions} logAction={logAction} sendNotification={sendNotification} leavePolicies={leavePolicies} allocations={allocations} timetableHistory={timetableHistory} timeGrids={timeGrids} academicStructure={academicStructure} workloads={workloads} classGroups={classGroups} currentTenantId={currentTenantId} />;
            case 'observations':
                // FIX: Pass currentTenantId to Monitoring component
                return <Monitoring teachers={teachers} observations={observations} setObservations={setAllObservations} academicStructure={academicStructure} phaseStructures={phaseStructures} monitoringTemplates={monitoringTemplates} setMonitoringTemplates={setAllMonitoringTemplates} currentAcademicYear={currentAcademicYear} permissions={permissions} classGroups={classGroups} allocations={allocations} logAction={logAction} currentUser={currentUser} currentTenantId={currentTenantId} />;
            case 'procurement':
                // FIX: Pass currentTenantId to Procurement component
                return <Procurement teachers={teachers} procurementRequests={procurementRequests} setProcurementRequests={setAllProcurementRequests} currentAcademicYear={currentAcademicYear} permissions={permissions} logAction={logAction} currentUser={currentUser} vendors={vendors} setVendors={setAllVendors} budgets={budgets} setBudgets={setAllBudgets} academicStructure={academicStructure} currentTenantId={currentTenantId} />;
            case 'assets':
                return <Assets assets={assets} setAssets={setAllAssets} assetAssignments={assetAssignments} setAssetAssignments={setAllAssetAssignments} teachers={teachers} permissions={permissions} logAction={logAction} currentUser={currentUser} currentTenantId={currentTenantId} />;
            case 'parents':
                // FIX: Pass currentTenantId to Parents component
                return <Parents teachers={teachers} queries={parentQueries} setQueries={setAllQueries} currentAcademicYear={currentAcademicYear} permissions={permissions} logAction={logAction} sendNotification={sendNotification} slaSettings={parentQuerySlaSettings} currentUser={currentUser} currentTenantId={currentTenantId} />;
            case 'analytics':
                 return <Analytics teachers={teachers} workloads={workloads} observations={observations} payrollHistory={payrollHistory} applications={applications} candidates={candidates} />;
            case 'settings':
                // FIX: Pass currentTenantId to Settings component
                // FIX: Pass programs and setAllPrograms to Settings component
                return <Settings teachers={teachers} setTeachers={setAllTeachers} academicStructure={academicStructure} setAcademicStructure={setAllAcademicStructure} phaseStructures={phaseStructures} setPhaseStructures={setAllPhaseStructures} classGroups={classGroups} setClassGroups={setAllClassGroups} allocationSettings={allocationSettings} setAllocationSettings={handleSetAllocationSettings} generalSettings={generalSettings} setGeneralSettings={handleSetGeneralSettings} currentUser={currentUser} onResetState={resetStateToDefault} currentAcademicYear={currentAcademicYear} permissions={permissions} auditLog={auditLog} logAction={logAction} allocations={allocations} workloads={workloads} vacancies={vacancies} setVacancies={setAllVacancies} budgets={budgets} currentTenantId={currentTenantId} cpdCourses={cpdCourses} setCpdCourses={setAllCpdCourses} programs={programs} setAllPrograms={setAllPrograms} />;
            case 'recruitment':
                 // FIX: Pass currentTenantId to Recruitment component
                 return <Recruitment vacancies={vacancies} setVacancies={setAllVacancies} candidates={candidates} applications={applications} setApplications={setAllApplications} interviews={interviews} academicStructure={academicStructure} teachers={teachers} setTeachers={setAllTeachers} permissions={permissions} logAction={logAction} currentTenantId={currentTenantId} />;
            default:
                return <div>Page not found</div>;
        }
    };
    
    // Simple authentication check
    if (!currentUser) {
        // In a real app, you would have a router and a login page.
        // For this demo, we'll show a simple unauthorized message if the 'admin' user isn't found.
        return <div className="p-4">Could not log in. Please check initial data.</div>
    }
    
    if (currentUser.positionId !== 'pos-super-admin' && activePage !== 'dashboard') {
        const workload = workloads.get(currentUser.id);
        const userLeave = leaveRequests.filter(lr => lr.teacherId === currentUser.id);
        const userObservations = observations.filter(o => o.teacherId === currentUser.id);
        const userQueries = parentQueries.filter(q => q.currentAssigneeId === currentUser.id);
        
        return <TeacherDashboard 
            currentUser={currentUser} 
            onLogout={() => setCurrentUser(null)} 
            workload={workload}
            timetableHistory={timetableHistory}
            timeGrids={timeGrids}
            academicStructure={{...academicStructure, monitoringTemplates: monitoringTemplates}}
            leaveRequests={userLeave}
            observations={userObservations}
            parentQueries={userQueries}
            classGroups={classGroups}
            allocations={allocations}
        />
    }

    return (
        <Layout
            activePage={activePage}
            setActivePage={setActivePage}
            currentUser={currentUser}
            onLogout={() => setCurrentUser(null)}
            setTeachers={setAllTeachers}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            academicStructure={academicStructure}
            phaseStructures={phaseStructures}
            currentAcademicYear={currentAcademicYear}
            setCurrentAcademicYear={setCurrentAcademicYear}
            permissions={permissions}
            notifications={notifications}
            onUpdateNotifications={updateNotification}
            selectedPhaseId={selectedPhaseId}
            setSelectedPhaseId={setSelectedPhaseId}
            selectedCurriculum={selectedCurriculum}
            setSelectedCurriculum={setSelectedCurriculum}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            tenants={tenants}
            currentTenantId={currentTenantId}
            setCurrentTenantId={setCurrentTenantId}
        >
            <Suspense fallback={<LoadingFallback />}>
                {renderPage()}
            </Suspense>
        </Layout>
    );
};

export default App;