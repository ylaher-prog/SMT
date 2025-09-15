import type { Permission } from './permissions';

export type { Permission };

export interface Tenant {
  id: string;
  name: string;
  settings?: any;
}

export enum EmploymentStatus {
  Probation = 'Probation',
  Permanent = 'Permanent',
  Contract = 'Contract',
  OnLeave = 'On Leave',
  Exited = 'Exited',
}

export interface Position {
  id: string;
  name: string;
  reportsToId?: string;
  permissions: Permission[];
  tenantId: string;
}

export interface SalaryInfo {
    employeeCode: string;
    salary: number;
    medicalAllowance: number;
    tax: number;
    uifDeduction: number;
    medicalAidDeduction: number;
    vitalityDeduction: number;
    uifContribution: number;
    sdlContribution: number;
    providentFundContribution: number;
    totalEarnings: number;
    totalDeductions: number;

    nettPay: number;
    totalCompanyContributions: number;
    salaryCost: number;
}


export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  employeeCode?: string;
  avatarUrl: string;
  employmentStatus: EmploymentStatus;
  startDate: string;
  positionId: string;
  managerId?: string; // Teacher ID of the manager
  preferredGrades?: string[];
  preferredModes?: string[];
  maxLearners: number;
  maxPeriodsByMode: { [mode: string]: number };
  specialties: string[]; // Subject IDs
  markingTasks: number;
  slas: {
    messageResponse: number; // in hours
    markingTurnaround: number; // in hours
  };
  workloadComments?: string;
  salaryInfo?: SalaryInfo;
  username?: string;
  passwordHash?: string;
  leaveBalances?: { [key in LeaveType]?: number };
  rateCardId?: string;
  moderationHoursLogged?: number;
  notificationPreferences?: {
    emailDigest: 'daily' | 'weekly' | 'none';
    pushEnabled: boolean;
  };
  tenantIds: string[];
}

export type Page = 'dashboard' | 'academic-team' | 'allocations' | 'leave' | 'observations' | 'procurement' | 'settings' | 'parents' | 'payroll' | 'timetable' | 'tasks' | 'workflow' | 'recruitment' | 'assets' | 'analytics';

export enum SubjectCategory {
  Core = 'Core',
  Elective = 'Elective',
}

export interface Subject {
    id: string;
    name: string;
    grades: string[];
    modes: string[];
    curriculumIds: string[];
    periodsByMode: Array<{mode: string, periods: number}>;
    periodOverrides?: Array<{curriculumId: string; grade: string; mode: string; periods: number}>
    category: SubjectCategory;
    electiveGroup?: string;
    tenantId: string;
}

export enum AllocationStrategy {
  Strict = 'strict', // Heavily prioritizes grade consolidation & preferences
  Balanced = 'balanced', // Balances consolidation with workload
  Flexible = 'flexible', // Prioritizes workload balance above all
}

export interface AllocationSettings {
  strategy: AllocationStrategy;
  prioritizePreferredGrades: boolean;
  tenantId: string;
}

export interface SenderEmailAccount {
  id: string;
  email: string;
  isDefault: boolean;
  type: 'manual' | 'google';
}

export interface GeneralSettings {
  senderEmails: SenderEmailAccount[];
  tenantId: string;
}

export interface Curriculum {
  id: string;
  name: string;
  tenantId: string;
}


export interface AcademicStructure {
  curricula: Curriculum[];
  grades: string[];
  subjects: Subject[];
  modes: string[];
  academicPeriods: string[];
  positions: Position[];
  academicYears: string[];
}

export interface PhaseStructure {
  id: string;
  phase: string;
  grades: string[];
  curriculumIds: string[];
  phaseHeadId: string;
  tenantId: string;
}

export interface Program {
    id: string;
    name: string;
    academicYear: string;
    curriculumId: string;
    grade: string;
    tenantId: string;
}

export interface ClassGroup {
    id: string;
    name: string;
    curriculumId: string;
    grade: string;
    mode: string;
    learnerCount: number;
    subjectIds: string[];
    academicYear: string;
    timeGridId?: string;
    addToTimetable?: boolean;
    tenantId: string;
}


export enum AllocationRole {
  Lead = 'Lead',
  CoTeacher = 'Co-Teacher',
  Substitute = 'Substitute',
}

export type ClassMode = 'Live' | 'Flipped' | 'Self-Paced';

export interface TeacherAllocation {
    id: string;
    teacherId: string;
    classGroupId: string;
    subjectId: string;
    role: AllocationRole;
    tenantId: string;
}

export enum LeaveType {
    Annual = 'Annual',
    Sick = 'Sick',
    Maternity = 'Maternity',
    Unpaid = 'Unpaid',
}

export enum RequestStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Denied = 'Denied',
}

export interface LeaveRequest {
    id: string;
    teacherId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    status: RequestStatus;
    reason: string;
    academicYear: string;
    attachment?: {
        fileName: string;
        url: string; // Mock URL
    };
    tenantId: string;
}

export interface LeavePolicy {
    type: LeaveType;
    accrualRate: number; // days per cycle
    accrualFrequency: 'monthly' | 'annually';
    maxBalance: number;
    tenantId: string;
}

// New Monitoring & Observations Types
export type ObservationType = string;

export enum MonitoringStatus {
    Open = 'Open',
    InProgress = 'In-Progress',
    Resolved = 'Resolved',
    Escalated = 'Escalated',
}

export enum ObservationPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export interface EvidenceFile {
    name: string;
    url: string; // This would be the Supabase storage URL
    type: string;
    size: number;
}


export interface Observation {
    id: string;
    observationType: ObservationType; // Now holds the ID of the MonitoringTemplate
    teacherId: string;
    phase: string;
    grade: string;
    curriculum: string; // Stays as string for simplicity of filtering, derived from class group
    phaseHeadId: string;
    observationDate: string;
    status: MonitoringStatus;
    priority: ObservationPriority;
    formData: Record<string, any>; // Stores data from the dynamic form
    followUpDate?: string;
    academicYear: string;
    classGroupId?: string;
    subjectId?: string;
    observerId?: string; // New: ID of the user who created the observation
    calculatedScore?: number; // New: Automatically calculated score from weighted rubric
    evidenceFiles?: EvidenceFile[]; // New: Array of uploaded evidence files
    tenantId: string;
}

// --- Procurement Types ---
export interface Vendor {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    tenantId: string;
}

export interface Budget {
    id: string;
    name: string; // e.g., "Foundation Phase 2024", "Annual Tech Expo"
    totalAmount: number;
    tenantId: string;
    academicYear: string;
}

export interface ApprovalStep {
    stage: string;
    approverId: string;
    status: 'Approved' | 'Denied' | 'Pending';
    timestamp: string;
    comments?: string;
}

export interface ProcurementRequest {
    id:string;
    requesterId: string; // teacherId
    itemDescription: string;
    category: string; // e.g., 'Stationery', 'Technology', 'Event'
    amount: number;
    requestDate: string;
    academicYear: string;
    
    // Updated for dynamic workflow
    status: RequestStatus;
    currentApproverId: string | null; // teacherId of the current approver, or null if finalized
    approvalHistory: ApprovalStep[];
    attachments?: { fileName: string; url: string }[];
    budgetId: string;
    vendorId: string;
    tenantId: string;
}

export interface Vacancy {
    id: string;
    positionId: string;
    budgetId: string;
    proposedSalary: number;
    status: 'Draft' | 'Open' | 'Interviewing' | 'Closed';
    description?: string;
    publishedAt?: string;
    tenantId: string;
    academicYear: string;
}

export interface TeacherWorkload {
  totalPeriods: number;
  totalLearners: number;
  totalClasses: number;
  periodsByMode: { [mode: string]: number };
}

// Monitoring Setup Types
export enum FormFieldType {
    Text = 'Text',
    Textarea = 'Textarea',
    Select = 'Select',
    Rating = 'Rating (1-5)',
    Checkbox = 'Checkbox',
    Date = 'Date',
    Number = 'Number',
    FileUpload = 'File Upload',
}

export interface FormField {
    id: string;
    label: string;
    type: FormFieldType;
    options?: string[];
    required: boolean;
    placeholder?: string;
    weight?: number; // New: Weight for score calculation in rubrics
}

export interface MonitoringTemplate {
    id: string; // Stable ID
    name: ObservationType; // Editable name/type shown to user
    fields: FormField[];
    phaseId?: string; // Optional: Link to a specific phase
    tenantId: string;
}

export enum ParentQueryCategory {
    Academic = 'Academic',
    Behavioral = 'Behavioral',
    Administrative = 'Administrative',
    Technical = 'Technical',
    Other = 'Other',
}

export interface CommunicationLogEntry {
  timestamp: string;
  userId: string;
  userName: string;
  entry: string;
}

export interface ParentQuerySlaSetting {
  category: ParentQueryCategory;
  hours: number;
  tenantId: string;
}

export interface ParentQuery {
  id: string;
  parentName: string;
  parentEmail: string;
  studentName: string;
  teacherId: string; // Initial teacher
  currentAssigneeId: string; // Current person responsible
  queryDetails: string;
  category: ParentQueryCategory;
  status: MonitoringStatus;
  creationDate: string;
  resolutionNotes?: string;
  academicYear: string;
  slaDeadline: string; // ISO string
  communicationLog: CommunicationLogEntry[];
  tenantId: string;
}

// Timetabling
export interface TimetablePeriod {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  type: 'Lesson' | 'Break';
}

export interface TimeGrid {
  id: string;
  name: string;
  days: string[];
  periods: TimetablePeriod[];
  color: string;
  tenantId: string;
}

export interface LessonDefinition {
    id: string; // for UI key management
    count: number; // e.g. '3' lessons
    duration: number; // e.g. '2' periods long (a double period)
}

export type TimeConstraint =
    | {
        id: string;
        type: 'not-available';
        targetType: 'teacher';
        targetId: string;
        day: string;
        periodId: string;
        academicYear: string;
        tenantId: string;
      }
    | {
        id:string;
        type: 'teacher-max-periods-day';
        teacherId: string;
        maxPeriods: number;
        academicYear: string;
        tenantId: string;
      }
    | {
        id: string;
        type: 'teacher-max-consecutive';
        teacherId: string;
        maxPeriods: number;
        academicYear: string;
        tenantId: string;
      }
    | {
        id: string;
        type: 'subject-rule';
        subjectId: string;
        classGroupId: string;
        academicYear: string;
        tenantId: string;
        rules: {
            lessonDefinitions: LessonDefinition[];
            minDaysApart: number;
            maxPeriodsPerDay?: number | null;
            maxConsecutive?: number | null;
            mustBeEveryDay?: boolean;
            preferredTime?: 'any' | 'morning' | 'afternoon';
        }
      };


export interface GeneratedSlot {
  id: string; // combination of group-subject-teacher
  classGroupId: string;
  subjectId: string;
  teacherId: string;
}

// Storing the generated timetable by class group ID for easy lookup
export type GeneratedTimetable = Record<string, Record<string, Record<string, GeneratedSlot[] | null>>>; // { [classGroupId]: { [day]: { [periodId]: GeneratedSlot[] } } }

export interface LockedLesson {
    classGroupId: string;
    subjectId: string;
    teacherId: string;
    day: string;
    periodId: string;
    duration: number;
}

export interface Conflict {
  id: string;
  type: 'Teacher Double-Booked' | 'Placement Failure' | 'Constraint Violation' | 'Locked Lesson Overlap';
  message: string;
  details: {
    teacherId?: string;
    teacherName?: string;
    classGroupId?: string;
    classGroupName?: string;
    subjectId?: string;
    subjectName?: string;
    day?: string;
    periodId?: string;
    periodName?: string;
    conflictingClassGroupId?: string;
    conflictingClassGroupName?: string;
    conflictingSubjectId?: string;
    conflictingSubjectName?: string;
  };
}


export interface TimetableHistoryEntry {
  id: string;
  timestamp: string;
  timetable: GeneratedTimetable;
  conflicts: Conflict[];
  academicYear: string;
  objectiveScore?: number;
  solverSeed?: string;
  solverVersion?: string;
  tenantId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  tenantId: string;
}

// Tasks Module
export enum TaskPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export enum TaskRecurrence {
    None = 'None',
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
}

export type LinkedRecord = {
    type: 'ParentQuery' | 'ProcurementRequest' | 'Observation';
    id: string;
    displayText: string;
};

export interface TaskCard {
    id: string;
    title: string;
    description?: string;
    assignedToId?: string;
    // New Advanced Fields
    priority?: TaskPriority;
    startDate?: string;
    dueDate?: string;
    recurrence?: TaskRecurrence;
    dependencyIds?: string[]; // IDs of tasks that must be completed first
    linkedRecord?: LinkedRecord;
}

export interface TaskColumn {
    id: string;
    title: string;
    cardIds: string[];
}

export interface TaskBoard {
    id: string;
    title: string;
    memberIds: string[];
    columns: TaskColumn[];
    tasks: TaskCard[];
    tenantId: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'leaveStatus' | 'newParentQuery' | 'parentQueryUpdate' | 'slaBreach' | 'parentQueryStatusUpdateToParent' | 'taskDueSoon';
  data: any;
  timestamp: string;
  read: boolean;
  message: string;
  tenantId: string;
}

// Workflow Module
export type WorkflowModule = 'leave' | 'parents' | 'procurement' | 'observations';

export interface WorkflowCondition {
    id: string;
    field: string;
    operator: 'equals' | 'not_equals' | 'is_greater_than' | 'is_less_than' | 'contains';
    value: string;
}

export type WorkflowActionType = 'send_notification' | 'create_task';

export interface WorkflowAction {
    id: string;
    type: WorkflowActionType;
    params: {
        // for send_notification
        recipient?: 'teacher' | 'manager';
        message?: string;
        // for create_task
        boardId?: string;
        title?: string;
        description?: string;
        assignedToId?: string;
    };
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    module: WorkflowModule;
    trigger: 'onCreate' | 'onUpdate';
    isEnabled: boolean;
    conditions: WorkflowCondition[];
    actions: WorkflowAction[];
    tenantId: string;
}

export interface TemplateTask {
    title: string;
    description?: string;
    durationDays: number;
    startAfterDays: number;
    dependencyOffset?: number; // e.g., starts after task at index - 1
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    tasks: TemplateTask[];
    tenantId: string;
}

// Teacher Profile Additions
export interface TeacherDocument {
    id: string;
    teacherId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storagePath: string; // e.g., 'public/teacher_documents/teacher-01/contract.pdf'
    uploadDate: string;
    tenantId: string;
}

export interface ProfileChangeRequest {
    id: string;
    teacherId: string;
    requestDate: string;
    requestedChanges: Partial<Teacher>;
    status: RequestStatus;
    reviewedBy?: string; // SMT member ID
    reviewDate?: string;
    tenantId: string;
}

// --- Payroll Types ---
export interface RateCard {
    id: string;
    name: string;
    baseSalary: number;
    ratePerPeriod: number;
    ratePerModerationHour: number;
    taxPercentage: number;
    standardDeductions: { name: string; amount: number }[];
    tenantId: string;
}

export interface TeacherPayrollData {
    teacherId: string;
    teacherName: string;
    employeeCode?: string;
    rateCardName: string;
    periodsWorked: number;
    moderationHours: number;
    baseSalary: number;
    variablePay: number;
    totalEarnings: number;
    tax: number;
    otherDeductions: number;
    totalDeductions: number;
    nettPay: number;
    totalCompanyContributions: number; // Placeholder
    salaryCost: number;
}

export interface PayrollRun {
    id: string;
    runDate: string;
    approvedBy: string; // User's full name
    payrollData: TeacherPayrollData[];
    totalNettPay: number;
    totalCost: number;
    tenantId: string;
}


// --- Recruitment Types ---
export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  resumeUrl?: string;
}

export enum ApplicationStatus {
    Applied = 'Applied',
    Screening = 'Screening',
    Interview = 'Interview',
    Offer = 'Offer',
    Hired = 'Hired',
    Rejected = 'Rejected',
}

export interface Application {
  id: string;
  vacancyId: string;
  candidateId: string;
  status: ApplicationStatus;
  applicationDate: string;
  coverLetter?: string;
  tenantId: string;
}

export interface Interview {
    id: string;
    applicationId: string;
    scheduledAt: string;
    interviewers: string[]; // array of teacher IDs
    feedbackNotes?: string;
    tenantId: string;
}

// --- CPD Types ---
export enum CpdCourseType {
    Course = 'Course',
    Workshop = 'Workshop',
    Certificate = 'Certificate',
}

export interface CpdCourse {
    id: string;
    title: string;
    provider: string;
    points: number;
    type: CpdCourseType;
    tenantId: string;
}

export interface TeacherCpdRecord {
    id: string;
    teacherId: string;
    courseId: string;
    completionDate: string;
    expiryDate?: string;
    certificateUrl?: string; // Mock URL
    tenantId: string;
}

// --- Asset & Inventory Management Types ---
export enum AssetType {
    Hardware = 'Hardware',
    Software = 'Software',
    Furniture = 'Furniture',
    Other = 'Other',
}

export enum AssetStatus {
    Available = 'Available',
    Assigned = 'Assigned',
    InRepair = 'In Repair',
    Retired = 'Retired',
}

export interface Asset {
    id: string;
    assetTag: string;
    name: string;
    type: AssetType;
    purchaseDate: string;
    status: AssetStatus;
    tenantId: string;
}

export interface AssetAssignment {
    id: string;
    assetId: string;
    teacherId: string;
    assignedDate: string;
    returnedDate?: string;
    tenantId: string;
}