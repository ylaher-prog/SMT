import type { Tenant, Teacher, AcademicStructure, PhaseStructure, MonitoringTemplate, AllocationSettings, GeneralSettings, TimeGrid, TaskBoard, Workflow, Subject, Curriculum, TeacherDocument, ProfileChangeRequest, ParentQuery, ParentQuerySlaSetting, LeavePolicy, Vendor, Budget, ProcurementRequest, RateCard, WorkflowTemplate, Vacancy, Candidate, Application, Interview, CpdCourse, TeacherCpdRecord, Asset, AssetAssignment, Program } from './types';
import { EmploymentStatus, LeaveType, RequestStatus, FormFieldType, AllocationStrategy, SubjectCategory, ParentQueryCategory, MonitoringStatus, TaskPriority, TaskRecurrence, ApplicationStatus, CpdCourseType, AssetType, AssetStatus } from './types';
import { ALL_PERMISSIONS } from './permissions';

// In a real app, this hash would be generated securely on the server.
// For this frontend demo, we'll use a simple scheme. 'password123'
const MOCK_PASSWORD_HASH = '12345'; 

export const MOCK_TENANTS: Tenant[] = [
    { id: 'tenant-1', name: 'Qurtuba Online Academy' },
    { id: 'tenant-2', name: 'Qurtuba Primary Phase' },
];

export const MOCK_TEACHERS: Teacher[] = [
    {
        id: 'super-admin-01',
        fullName: 'Admin',
        email: 'admin@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user1/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2020-01-01',
        positionId: 'pos-super-admin',
        maxLearners: 999,
        maxPeriodsByMode: {},
        specialties: [],
        markingTasks: 0,
        slas: { messageResponse: 24, markingTurnaround: 48 },
        username: 'admin',
        passwordHash: MOCK_PASSWORD_HASH,
        leaveBalances: { [LeaveType.Annual]: 21, [LeaveType.Sick]: 10 },
        rateCardId: 'rc-smt',
        moderationHoursLogged: 0,
        notificationPreferences: { emailDigest: 'daily', pushEnabled: true },
        tenantIds: ['tenant-1', 'tenant-2'],
    },
    {
        id: 'smt-01',
        fullName: 'Aisha Ahmed',
        email: 'aisha.ahmed@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user4/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2020-06-01',
        positionId: 'pos-smt',
        managerId: 'super-admin-01',
        maxLearners: 500,
        maxPeriodsByMode: {},
        specialties: ['School Management'],
        markingTasks: 0,
        slas: { messageResponse: 24, markingTurnaround: 48 },
        username: 'aisha',
        passwordHash: MOCK_PASSWORD_HASH,
        leaveBalances: { [LeaveType.Annual]: 21, [LeaveType.Sick]: 10 },
        rateCardId: 'rc-smt',
        moderationHoursLogged: 5,
        notificationPreferences: { emailDigest: 'weekly', pushEnabled: false },
        tenantIds: ['tenant-1'],
    },
    {
        id: 'phase-head-01',
        fullName: 'Fatima Khan',
        email: 'fatima.khan@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user2/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2021-05-10',
        positionId: 'pos-phase-head',
        managerId: 'smt-01',
        maxLearners: 250,
        maxPeriodsByMode: { 'Live': 15, 'Flipped Afternoon': 5 },
        specialties: ['subj-math', 'subj-phys'],
        preferredGrades: ['8', '9'],
        preferredModes: ['Live'],
        markingTasks: 5,
        slas: { messageResponse: 18, markingTurnaround: 40 },
        username: 'fatima',
        passwordHash: MOCK_PASSWORD_HASH,
        leaveBalances: { [LeaveType.Annual]: 18, [LeaveType.Sick]: 7 },
        rateCardId: 'rc-senior',
        moderationHoursLogged: 12,
        notificationPreferences: { emailDigest: 'daily', pushEnabled: false },
        tenantIds: ['tenant-1'],
    },
    {
        id: 'subject-leader-01',
        fullName: 'Ben Carter',
        email: 'ben.carter@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user5/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2022-01-15',
        positionId: 'pos-subject-leader',
        managerId: 'phase-head-01',
        maxLearners: 220,
        maxPeriodsByMode: { 'Live': 16 },
        specialties: ['subj-math'],
        preferredGrades: ['6', '7', '8'],
        preferredModes: ['Live'],
        markingTasks: 8,
        slas: { messageResponse: 20, markingTurnaround: 42 },
        username: 'ben',
        passwordHash: MOCK_PASSWORD_HASH,
        leaveBalances: { [LeaveType.Annual]: 15, [LeaveType.Sick]: 8 },
        rateCardId: 'rc-senior',
        moderationHoursLogged: 8,
        notificationPreferences: { emailDigest: 'none', pushEnabled: true },
        tenantIds: ['tenant-1'],
    },
    {
        id: 'teacher-01',
        fullName: 'John Doe',
        email: 'john.doe@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user3/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2022-08-01',
        positionId: 'pos-teacher',
        managerId: 'subject-leader-01',
        maxLearners: 200,
        maxPeriodsByMode: { 'Live': 18 },
        specialties: ['subj-eng', 'subj-hist'],
        preferredGrades: ['7', '8'],
        preferredModes: ['Live', 'Flipped Morning'],
        markingTasks: 10,
        slas: { messageResponse: 22, markingTurnaround: 48 },
        username: 'john',
        passwordHash: MOCK_PASSWORD_HASH,
        leaveBalances: { [LeaveType.Annual]: 12, [LeaveType.Sick]: 4 },
        rateCardId: 'rc-junior',
        moderationHoursLogged: 4,
        notificationPreferences: { emailDigest: 'weekly', pushEnabled: false },
        tenantIds: ['tenant-1'],
    },
];

export const MOCK_LEAVE_POLICIES: LeavePolicy[] = [
    { type: LeaveType.Annual, accrualRate: 1.75, accrualFrequency: 'monthly', maxBalance: 25, tenantId: 'tenant-1' },
    { type: LeaveType.Sick, accrualRate: 1, accrualFrequency: 'monthly', maxBalance: 120, tenantId: 'tenant-1' },
    { type: LeaveType.Maternity, accrualRate: 0, accrualFrequency: 'annually', maxBalance: 0, tenantId: 'tenant-1' },
    { type: LeaveType.Unpaid, accrualRate: 0, accrualFrequency: 'annually', maxBalance: 0, tenantId: 'tenant-1' },
];

const MOCK_CURRICULA: Curriculum[] = [
  { id: 'curr-brit', name: 'British', tenantId: 'tenant-1' },
  { id: 'curr-caps', name: 'CAPS', tenantId: 'tenant-1' },
  { id: 'curr-camb', name: 'Cambridge', tenantId: 'tenant-1' },
];

const MOCK_SUBJECTS: Subject[] = [
    { id: 'subj-math', name: 'Mathematics', grades: ['6','7','8','9'], modes: ['Live'], curriculumIds: ['curr-brit', 'curr-caps'], periodsByMode: [{mode: 'Live', periods: 4}], category: SubjectCategory.Core, tenantId: 'tenant-1' },
    { id: 'subj-eng', name: 'English', grades: ['6','7','8','9'], modes: ['Live', 'Flipped Afternoon'], curriculumIds: ['curr-brit', 'curr-caps'], periodsByMode: [{mode: 'Live', periods: 5}, {mode: 'Flipped Afternoon', periods: 2}], category: SubjectCategory.Core, tenantId: 'tenant-1' },
    { id: 'subj-phys', name: 'Physics', grades: ['8','9'], modes: ['Live'], curriculumIds: ['curr-brit'], periodsByMode: [{mode: 'Live', periods: 3}], category: SubjectCategory.Core, tenantId: 'tenant-1' },
    { id: 'subj-hist', name: 'History', grades: ['7','8'], modes: ['Flipped Morning'], curriculumIds: ['curr-brit', 'curr-caps'], periodsByMode: [{mode: 'Flipped Morning', periods: 2}], category: SubjectCategory.Elective, electiveGroup: 'Humanities', tenantId: 'tenant-1' },
    { id: 'subj-geo', name: 'Geography', grades: ['7','8'], modes: ['Flipped Morning'], curriculumIds: ['curr-brit', 'curr-caps'], periodsByMode: [{mode: 'Flipped Morning', periods: 2}], category: SubjectCategory.Elective, electiveGroup: 'Humanities', tenantId: 'tenant-1' },
];


export const MOCK_ACADEMIC_STRUCTURE: AcademicStructure = {
  curricula: MOCK_CURRICULA,
  grades: ['6', '7', '8', '9'],
  subjects: MOCK_SUBJECTS,
  modes: ['Flipped Afternoon', 'Flipped Morning', 'Live', 'Self-Paced'],
  academicPeriods: [],
  positions: [
      { id: 'pos-super-admin', name: 'Super Admin', permissions: ALL_PERMISSIONS, tenantId: 'tenant-1' },
      { id: 'pos-smt', name: 'SMT', permissions: ['view:analytics'], reportsToId: 'pos-super-admin', tenantId: 'tenant-1' },
      { id: 'pos-phase-head', name: 'Phase Head', permissions: [], reportsToId: 'pos-smt', tenantId: 'tenant-1' },
      { id: 'pos-subject-leader', name: 'Subject Leader', permissions: [], reportsToId: 'pos-phase-head', tenantId: 'tenant-1' },
      { id: 'pos-teacher', name: 'Teacher', permissions: [], reportsToId: 'pos-subject-leader', tenantId: 'tenant-1' },
  ],
  academicYears: ['2026', '2025'],
};

export const MOCK_PROGRAMS: Program[] = [
    { id: 'prog-1', name: 'British - 2025 - Grade 9', academicYear: '2025', curriculumId: 'curr-brit', grade: '9', tenantId: 'tenant-1' },
    { id: 'prog-2', name: 'CAPS - 2025 - Grade 8', academicYear: '2025', curriculumId: 'curr-caps', grade: '8', tenantId: 'tenant-1' },
    { id: 'prog-3', name: 'British - 2026 - Grade 7', academicYear: '2026', curriculumId: 'curr-brit', grade: '7', tenantId: 'tenant-1' },
];

export const DEFAULT_ALLOCATION_SETTINGS: AllocationSettings[] = [
 {
  strategy: AllocationStrategy.Balanced,
  prioritizePreferredGrades: true,
  tenantId: 'tenant-1'
 },
 {
  strategy: AllocationStrategy.Strict,
  prioritizePreferredGrades: true,
  tenantId: 'tenant-2'
 }
];

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings[] = [
 {
  senderEmails: [{ id: 'default-1', email: 'noreply@qurtubaonline.co.za', isDefault: true, type: 'manual' }],
  tenantId: 'tenant-1'
 },
 {
  senderEmails: [{ id: 'default-2', email: 'primary@qurtubaprimary.co.za', isDefault: true, type: 'manual' }],
  tenantId: 'tenant-2'
 }
];

export const MOCK_PHASE_STRUCTURES: PhaseStructure[] = [
    {id: 'phase-1', phase: 'Senior Phase', grades: ['8', '9'], curriculumIds: ['curr-brit'], phaseHeadId: 'phase-head-01', tenantId: 'tenant-1' },
];

export const DEFAULT_MONITORING_TEMPLATES: MonitoringTemplate[] = [
    {
        id: 'kpa1-live-lesson',
        name: 'KPA1 – Live Lesson Observation',
        fields: [
            { id: 'engagement', label: 'Learner Engagement', type: FormFieldType.Rating, required: true, weight: 2 },
            { id: 'pacing', label: 'Lesson Pacing & Timing', type: FormFieldType.Rating, required: true, weight: 1 },
            { id: 'content_accuracy', label: 'Content Accuracy', type: FormFieldType.Rating, required: true, weight: 3 },
            { id: 'feedback_quality', label: 'Quality of Feedback', type: FormFieldType.Rating, required: true, weight: 2 },
            { id: 'notes', label: 'General Notes', type: FormFieldType.Textarea, required: true },
            { id: 'evidence', label: 'Evidence File', type: FormFieldType.FileUpload, required: false },
        ],
        tenantId: 'tenant-1',
    },
    {
        id: 'kpa2-moderation',
        name: 'KPA2 – Moderation',
        fields: [
            { id: 'alignment', label: 'Alignment to Curriculum', type: FormFieldType.Rating, required: true, weight: 3 },
            { id: 'consistency', label: 'Marking Consistency', type: FormFieldType.Rating, required: true, weight: 2 },
            { id: 'feedback_timeliness', label: 'Feedback Timeliness (Turnaround)', type: FormFieldType.Number, required: true, placeholder: 'Hours' },
            { id: 'notes', label: 'Moderation Comments', type: FormFieldType.Textarea, required: true },
        ],
        tenantId: 'tenant-1',
    },
    {
        id: 'pmr',
        name: 'KPA3 – PMR',
        fields: [
            { id: 'details', label: 'Details / Notes', type: FormFieldType.Textarea, required: true, options: [] },
            { id: 'actionTaken', label: 'Action Taken', type: FormFieldType.Textarea, required: true, options: [] },
            { id: 'nextSteps', label: 'Next Steps', type: FormFieldType.Text, required: false, options: [] },
        ],
        tenantId: 'tenant-1',
    },
];

export const TIME_GRID_COLORS = [
  '#4A90E2', // Blue
  '#50E3C2', // Teal
  '#F5A623', // Orange
  '#9013FE', // Purple
  '#BD10E0', // Magenta
  '#7ED321', // Green
];

export const DEFAULT_TIME_GRIDS: TimeGrid[] = [
  {
    id: 'grid-live',
    name: 'Live',
    color: TIME_GRID_COLORS[0],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periods: [
      { id: 'p1', name: '08:00 - 08:30', startTime: '08:00', endTime: '08:30', type: 'Lesson' },
      { id: 'p2', name: '08:30 - 09:00', startTime: '08:30', endTime: '09:00', type: 'Lesson' },
      { id: 'p3', name: '09:00 - 09:30', startTime: '09:00', endTime: '09:30', type: 'Lesson' },
      { id: 'p4', name: '09:30 - 10:00', startTime: '09:30', endTime: '10:00', type: 'Lesson' },
      { id: 'b1', name: 'Break', startTime: '10:00', endTime: '10:30', type: 'Break' },
      { id: 'p5', name: '10:30 - 11:00', startTime: '10:30', endTime: '11:00', type: 'Lesson' },
      { id: 'p6', name: '11:00 - 11:30', startTime: '11:00', endTime: '11:30', type: 'Lesson' },
      { id: 'p7', name: '11:30 - 12:00', startTime: '11:30', endTime: '12:00', type: 'Lesson' },
      { id: 'b2', name: 'Lunch', startTime: '12:00', endTime: '12:30', type: 'Break' },
      { id: 'p8', name: '12:30 - 13:00', startTime: '12:30', endTime: '13:00', type: 'Lesson' },
      { id: 'p9', name: '13:00 - 13:30', startTime: '13:00', endTime: '13:30', type: 'Lesson' },
    ],
    tenantId: 'tenant-1',
  },
  {
    id: 'grid-flipped-am',
    name: 'Flipped Morning',
    color: TIME_GRID_COLORS[1],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    periods: [
      { id: 'fm1', name: '1', startTime: '10:00', endTime: '10:30', type: 'Lesson' },
      { id: 'fm2', name: '2', startTime: '10:30', endTime: '11:00', type: 'Lesson' },
    ],
    tenantId: 'tenant-1',
  },
  {
    id: 'grid-flipped-pm',
    name: 'Flipped Afternoon',
    color: TIME_GRID_COLORS[2],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    periods: [
      { id: 'fp3', name: '3', startTime: '15:00', endTime: '15:30', type: 'Lesson' },
      { id: 'fp4', name: '4', startTime: '15:30', endTime: '16:00', type: 'Lesson' },
    ],
    tenantId: 'tenant-1',
  }
];

export const MOCK_TASK_BOARDS: TaskBoard[] = [
    {
        id: 'board-1',
        title: 'Admin Tasks (Q3)',
        memberIds: ['super-admin-01', 'phase-head-01', 'teacher-01'],
        tasks: [
            { id: 'task-1', title: 'Finalize Q4 budget proposal', assignedToId: 'phase-head-01', dueDate: '2024-09-15', priority: TaskPriority.High },
            { id: 'task-2', title: 'Organize annual staff training day', priority: TaskPriority.Medium, recurrence: TaskRecurrence.None },
            { id: 'task-3', title: 'Review new curriculum submissions', assignedToId: 'super-admin-01', dependencyIds: ['task-1'] },
            { id: 'task-4', title: 'Submit Q2 performance reviews', dueDate: '2024-06-30', priority: TaskPriority.Low, linkedRecord: { type: 'Observation', id: 'obs-1', displayText: 'KPA1 for John Doe' } },
        ],
        columns: [
            { id: 'col-1', title: 'To Do', cardIds: ['task-1'] },
            { id: 'col-2', title: 'In Progress', cardIds: ['task-2'] },
            { id: 'col-3', title: 'Done', cardIds: ['task-3', 'task-4'] }
        ],
        tenantId: 'tenant-1',
    }
];

export const MOCK_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'template-exam-mod',
        name: 'Exam Moderation Cycle',
        description: 'Standard workflow for preparing, conducting, and finalizing exam moderation for a subject.',
        tasks: [
            { title: 'Draft Exam Paper', durationDays: 5, startAfterDays: 0 },
            { title: 'Internal Review of Draft', durationDays: 3, startAfterDays: 5, dependencyOffset: -1 },
            { title: 'Finalize Exam Paper', durationDays: 2, startAfterDays: 8, dependencyOffset: -1 },
            { title: 'Conduct Moderation Session', durationDays: 1, startAfterDays: 10, dependencyOffset: -1 },
            { title: 'Submit Moderation Report', durationDays: 2, startAfterDays: 11, dependencyOffset: -1 },
        ],
        tenantId: 'tenant-1',
    },
    {
        id: 'template-new-term',
        name: 'New Term Setup',
        description: 'Checklist for all administrative and academic tasks to be completed before the start of a new term.',
        tasks: [
            { title: 'Finalize Class Lists', durationDays: 3, startAfterDays: 0 },
            { title: 'Update Teacher Allocations', durationDays: 5, startAfterDays: 0 },
            { title: 'Generate & Publish Timetables', durationDays: 2, startAfterDays: 5, dependencyOffset: -1 },
            { title: 'Send Welcome Email to Parents', durationDays: 1, startAfterDays: 7, dependencyOffset: -1 },
        ],
        tenantId: 'tenant-1',
    },
];

export const MOCK_WORKFLOWS: Workflow[] = [
    {
        id: 'wf-1',
        name: 'Notify Manager on High Priority Observation',
        module: 'observations',
        trigger: 'onCreate',
        isEnabled: true,
        conditions: [
            { id: 'c1', field: 'priority', operator: 'equals', value: 'High' }
        ],
        actions: [
            { 
                id: 'a1', 
                type: 'send_notification',
                params: {
                    recipient: 'manager',
                    message: 'A new high priority observation has been logged for {{record.teacherName}}.'
                }
            },
            {
                id: 'a2',
                type: 'create_task',
                params: {
                    boardId: 'board-1',
                    title: 'Follow up on high priority observation for {{record.teacherName}}',
                    assignedToId: '{{record.phaseHeadId}}'
                }
            }
        ],
        tenantId: 'tenant-1',
    },
];

export const MOCK_DOCUMENTS: TeacherDocument[] = [
    { id: 'doc-1', teacherId: 'teacher-01', fileName: 'Employment Contract.pdf', fileType: 'application/pdf', fileSize: 120456, storagePath: '', uploadDate: '2022-08-01', tenantId: 'tenant-1'},
    { id: 'doc-2', teacherId: 'teacher-01', fileName: 'SACE Certificate.pdf', fileType: 'application/pdf', fileSize: 89034, storagePath: '', uploadDate: '2022-08-01', tenantId: 'tenant-1'},
];

export const MOCK_CHANGE_REQUESTS: ProfileChangeRequest[] = [
    { id: 'cr-1', teacherId: 'teacher-01', requestDate: new Date().toISOString(), status: RequestStatus.Pending, requestedChanges: { preferredGrades: ['6', '7', '8'], preferredModes: ['Live'] }, tenantId: 'tenant-1' },
];

export const MOCK_PARENT_QUERY_SLA_SETTINGS: ParentQuerySlaSetting[] = [
    { category: ParentQueryCategory.Academic, hours: 24, tenantId: 'tenant-1' },
    { category: ParentQueryCategory.Behavioral, hours: 24, tenantId: 'tenant-1' },
    { category: ParentQueryCategory.Administrative, hours: 48, tenantId: 'tenant-1' },
    { category: ParentQueryCategory.Technical, hours: 72, tenantId: 'tenant-1' },
    { category: ParentQueryCategory.Other, hours: 48, tenantId: 'tenant-1' },
];

const now = new Date();
const addHours = (date: Date, h: number) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + h);
    return newDate.toISOString();
};

export const MOCK_PARENT_QUERIES: ParentQuery[] = [
  {
    id: 'pq-1',
    parentName: 'Alice Johnson',
    parentEmail: 'alice.j@example.com',
    studentName: 'Bob Johnson',
    teacherId: 'teacher-01',
    currentAssigneeId: 'teacher-01',
    queryDetails: 'Bob is struggling with his recent math homework on algebra. Can we schedule a brief call?',
    category: ParentQueryCategory.Academic,
    status: MonitoringStatus.Open,
    creationDate: now.toISOString(),
    academicYear: '2025',
    slaDeadline: addHours(now, 24),
    communicationLog: [
        { timestamp: now.toISOString(), userId: 'smt-01', userName: 'Aisha Ahmed', entry: 'Query logged and assigned to John Doe.' }
    ],
    tenantId: 'tenant-1',
  },
  {
    id: 'pq-2',
    parentName: 'Charlie Brown',
    parentEmail: 'charlie.b@example.com',
    studentName: 'Sally Brown',
    teacherId: 'teacher-01',
    currentAssigneeId: 'phase-head-01', // Escalated
    queryDetails: 'There seems to be an issue with Sally\'s final grade calculation for History. The initial teacher was unable to resolve.',
    category: ParentQueryCategory.Administrative,
    status: MonitoringStatus.Escalated,
    creationDate: new Date(now.getTime() - 86400000 * 2).toISOString(), // 2 days ago
    academicYear: '2025',
    slaDeadline: addHours(new Date(now.getTime() - 86400000 * 2), 48), // Breached
    communicationLog: [
        { timestamp: new Date(now.getTime() - 86400000 * 2).toISOString(), userId: 'smt-01', userName: 'Aisha Ahmed', entry: 'Query logged and assigned to John Doe.' },
        { timestamp: new Date(now.getTime() - 86400000 * 1).toISOString(), userId: 'teacher-01', userName: 'John Doe', entry: 'Escalated to Fatima Khan.' }
    ],
    tenantId: 'tenant-1',
  },
    {
    id: 'pq-3',
    parentName: 'David Williams',
    parentEmail: 'david.w@example.com',
    studentName: 'Emily Williams',
    teacherId: 'phase-head-01',
    currentAssigneeId: 'phase-head-01',
    queryDetails: 'Just wanted to say thanks for the great communication this term!',
    category: ParentQueryCategory.Other,
    status: MonitoringStatus.Resolved,
    creationDate: new Date(now.getTime() - 86400000 * 5).toISOString(),
    academicYear: '2025',
    slaDeadline: addHours(new Date(now.getTime() - 86400000 * 5), 48),
    communicationLog: [
        { timestamp: new Date(now.getTime() - 86400000 * 5).toISOString(), userId: 'smt-01', userName: 'Aisha Ahmed', entry: 'Query logged and assigned to Fatima Khan.' },
        { timestamp: new Date(now.getTime() - 86400000 * 4).toISOString(), userId: 'phase-head-01', userName: 'Fatima Khan', entry: 'Status changed to Resolved.' }
    ],
    tenantId: 'tenant-1',
  }
];

export const MOCK_VENDORS: Vendor[] = [
    { id: 'v-1', name: 'Staples', contactPerson: 'John Smith', email: 'john@staples.com', phone: '123-456-7890', tenantId: 'tenant-1' },
    { id: 'v-2', name: 'Dell Technologies', contactPerson: 'Jane Doe', email: 'jane@dell.com', phone: '098-765-4321', tenantId: 'tenant-1' },
    { id: 'v-3', name: 'Local Catering Co.', contactPerson: 'Mike Ross', email: 'catering@local.com', phone: '555-555-5555', tenantId: 'tenant-1' },
];

export const MOCK_BUDGETS: Budget[] = [
    { id: 'b-1', name: 'Foundation Phase 2025', totalAmount: 15000, tenantId: 'tenant-1', academicYear: '2025' },
    { id: 'b-2', name: 'Senior Phase 2025', totalAmount: 25000, tenantId: 'tenant-1', academicYear: '2025' },
    { id: 'b-3', name: 'Annual Tech Expo', totalAmount: 10000, tenantId: 'tenant-1', academicYear: '2025' },
];

export const MOCK_PROCUREMENT_REQUESTS: ProcurementRequest[] = [
    {
        id: 'pr-1',
        requesterId: 'teacher-01',
        itemDescription: '50x new whiteboard markers',
        category: 'Stationery',
        amount: 850,
        requestDate: new Date(now.getTime() - 86400000 * 5).toISOString(),
        academicYear: '2025',
        budgetId: 'b-1',
        vendorId: 'v-1',
        status: RequestStatus.Pending,
        currentApproverId: 'subject-leader-01', // Teacher -> Subject Leader
        approvalHistory: [
            { stage: 'Submission', approverId: 'teacher-01', status: 'Approved', timestamp: new Date(now.getTime() - 86400000 * 5).toISOString() }
        ],
        attachments: [{ fileName: 'quote1.pdf', url: '#' }],
        tenantId: 'tenant-1',
    },
    {
        id: 'pr-2',
        requesterId: 'phase-head-01',
        itemDescription: '3x Dell Latitude Laptops for new staff',
        category: 'Technology',
        amount: 45000,
        requestDate: new Date(now.getTime() - 86400000 * 2).toISOString(),
        academicYear: '2025',
        budgetId: 'b-2',
        vendorId: 'v-2',
        status: RequestStatus.Pending,
        currentApproverId: 'smt-01', // Phase Head -> SMT
        approvalHistory: [
            { stage: 'Submission', approverId: 'phase-head-01', status: 'Approved', timestamp: new Date(now.getTime() - 86400000 * 2).toISOString() },
        ],
        tenantId: 'tenant-1',
    },
    {
        id: 'pr-3',
        requesterId: 'teacher-01',
        itemDescription: 'Catering for Parent-Teacher evening',
        category: 'Event',
        amount: 3500,
        requestDate: new Date(now.getTime() - 86400000 * 10).toISOString(),
        academicYear: '2025',
        budgetId: 'b-3',
        vendorId: 'v-3',
        status: RequestStatus.Approved,
        currentApproverId: null, // Finalized
        approvalHistory: [
             { stage: 'Submission', approverId: 'teacher-01', status: 'Approved', timestamp: new Date(now.getTime() - 86400000 * 10).toISOString() },
             { stage: 'Approval', approverId: 'subject-leader-01', status: 'Approved', timestamp: new Date(now.getTime() - 86400000 * 9).toISOString() },
             { stage: 'Approval', approverId: 'phase-head-01', status: 'Approved', timestamp: new Date(now.getTime() - 86400000 * 8).toISOString() },
             { stage: 'Approval', approverId: 'smt-01', status: 'Approved', timestamp: new Date(now.getTime() - 86400000 * 7).toISOString() },
             { stage: 'Approval', approverId: 'super-admin-01', status: 'Approved', timestamp: new Date(now.getTime() - 86400000 * 6).toISOString() },
        ],
        tenantId: 'tenant-1',
    }
];

export const MOCK_RATE_CARDS: RateCard[] = [
    {
        id: 'rc-senior',
        name: 'Senior Teacher',
        baseSalary: 40000,
        ratePerPeriod: 150,
        ratePerModerationHour: 200,
        taxPercentage: 25,
        standardDeductions: [
            { name: 'Pension Fund', amount: 2500 },
            { name: 'Medical Aid', amount: 1500 },
        ],
        tenantId: 'tenant-1',
    },
    {
        id: 'rc-junior',
        name: 'Junior Teacher',
        baseSalary: 28000,
        ratePerPeriod: 120,
        ratePerModerationHour: 150,
        taxPercentage: 18,
        standardDeductions: [
            { name: 'Pension Fund', amount: 1800 },
            { name: 'Medical Aid', amount: 1200 },
        ],
        tenantId: 'tenant-1',
    },
    {
        id: 'rc-smt',
        name: 'SMT',
        baseSalary: 65000,
        ratePerPeriod: 0,
        ratePerModerationHour: 0,
        taxPercentage: 35,
        standardDeductions: [
            { name: 'Pension Fund', amount: 4500 },
            { name: 'Medical Aid', amount: 2500 },
        ],
        tenantId: 'tenant-1',
    },
];

export const MOCK_VACANCIES: Vacancy[] = [
    { id: 'vac-1', positionId: 'pos-teacher', budgetId: 'b-2', proposedSalary: 350000, status: 'Open', description: 'Seeking a passionate Mathematics teacher for our senior phase.', publishedAt: '2024-07-01', tenantId: 'tenant-1', academicYear: '2025' },
    { id: 'vac-2', positionId: 'pos-subject-leader', budgetId: 'b-2', proposedSalary: 500000, status: 'Interviewing', description: 'Experienced Subject Leader for the English department.', publishedAt: '2024-06-15', tenantId: 'tenant-1', academicYear: '2025' },
    { id: 'vac-3', positionId: 'pos-teacher', budgetId: 'b-1', proposedSalary: 320000, status: 'Closed', description: 'Foundation phase teacher position has been filled.', publishedAt: '2024-05-20', tenantId: 'tenant-1', academicYear: '2025' },
];

export const MOCK_CANDIDATES: Candidate[] = [
    { id: 'cand-1', fullName: 'Emily White', email: 'emily.w@example.com', phone: '555-0101', avatarUrl: 'https://picsum.photos/seed/cand1/40/40', resumeUrl: '#' },
    { id: 'cand-2', fullName: 'David Green', email: 'david.g@example.com', phone: '555-0102', avatarUrl: 'https://picsum.photos/seed/cand2/40/40', resumeUrl: '#' },
    { id: 'cand-3', fullName: 'Sarah Blue', email: 'sarah.b@example.com', phone: '555-0103', avatarUrl: 'https://picsum.photos/seed/cand3/40/40', resumeUrl: '#' },
    { id: 'cand-4', fullName: 'Michael Brown', email: 'michael.b@example.com', phone: '555-0104', avatarUrl: 'https://picsum.photos/seed/cand4/40/40', resumeUrl: '#' },
];

export const MOCK_APPLICATIONS: Application[] = [
    // Applications for Vacancy 1 (Math Teacher)
    { id: 'app-1', vacancyId: 'vac-1', candidateId: 'cand-1', status: ApplicationStatus.Interview, applicationDate: '2024-07-05', coverLetter: 'I am passionate about mathematics...', tenantId: 'tenant-1' },
    { id: 'app-2', vacancyId: 'vac-1', candidateId: 'cand-2', status: ApplicationStatus.Screening, applicationDate: '2024-07-06', tenantId: 'tenant-1' },
    // Applications for Vacancy 2 (Subject Leader)
    { id: 'app-3', vacancyId: 'vac-2', candidateId: 'cand-3', status: ApplicationStatus.Applied, applicationDate: '2024-06-20', tenantId: 'tenant-1' },
    { id: 'app-4', vacancyId: 'vac-2', candidateId: 'cand-4', status: ApplicationStatus.Offer, applicationDate: '2024-06-18', tenantId: 'tenant-1' },
    { id: 'app-5', vacancyId: 'vac-2', candidateId: 'cand-1', status: ApplicationStatus.Rejected, applicationDate: '2024-06-21', tenantId: 'tenant-1' },
];

export const MOCK_INTERVIEWS: Interview[] = [
    { id: 'int-1', applicationId: 'app-1', scheduledAt: '2024-07-15T10:00:00Z', interviewers: ['phase-head-01', 'subject-leader-01'], feedbackNotes: 'Strong candidate, good pedagogical knowledge.', tenantId: 'tenant-1' }
];

export const MOCK_CPD_COURSES: CpdCourse[] = [
    { id: 'cpd-c-1', title: 'Advanced Classroom Management', provider: 'SACE', points: 15, type: CpdCourseType.Course, tenantId: 'tenant-1' },
    { id: 'cpd-w-1', title: 'Digital Tools for Educators', provider: 'Google for Education', points: 5, type: CpdCourseType.Workshop, tenantId: 'tenant-1' },
    { id: 'cpd-cert-1', title: 'First Aid Level 1', provider: 'St John Ambulance', points: 10, type: CpdCourseType.Certificate, tenantId: 'tenant-1' },
    { id: 'cpd-cert-2', title: 'SENCO Accreditation', provider: 'University of Cape Town', points: 25, type: CpdCourseType.Certificate, tenantId: 'tenant-1' },
];

const ninetyDaysFromNow = new Date();
ninetyDaysFromNow.setDate(now.getDate() + 90);
const thirtyDaysFromNow = new Date();
thirtyDaysFromNow.setDate(now.getDate() + 30);
const lastYear = new Date();
lastYear.setFullYear(lastYear.getFullYear() - 1);

export const MOCK_TEACHER_CPD_RECORDS: TeacherCpdRecord[] = [
    { id: 'tcpd-1', teacherId: 'teacher-01', courseId: 'cpd-c-1', completionDate: '2023-05-15', tenantId: 'tenant-1' },
    { id: 'tcpd-2', teacherId: 'teacher-01', courseId: 'cpd-cert-1', completionDate: lastYear.toISOString().split('T')[0], expiryDate: thirtyDaysFromNow.toISOString().split('T')[0], tenantId: 'tenant-1' },
    { id: 'tcpd-3', teacherId: 'phase-head-01', courseId: 'cpd-cert-2', completionDate: '2022-11-20', expiryDate: ninetyDaysFromNow.toISOString().split('T')[0], tenantId: 'tenant-1' },
    { id: 'tcpd-4', teacherId: 'subject-leader-01', courseId: 'cpd-w-1', completionDate: '2024-01-10', tenantId: 'tenant-1' },
];

export const MOCK_ASSETS: Asset[] = [
    { id: 'asset-1', assetTag: 'QOA-LAP-001', name: 'Dell Latitude 7420', type: AssetType.Hardware, purchaseDate: '2023-01-15', status: AssetStatus.Assigned, tenantId: 'tenant-1' },
    { id: 'asset-2', assetTag: 'QOA-LAP-002', name: 'Dell Latitude 7420', type: AssetType.Hardware, purchaseDate: '2023-01-15', status: AssetStatus.Assigned, tenantId: 'tenant-1' },
    { id: 'asset-3', assetTag: 'QOA-MON-005', name: 'LG 27" 4K Monitor', type: AssetType.Hardware, purchaseDate: '2022-11-20', status: AssetStatus.Available, tenantId: 'tenant-1' },
    { id: 'asset-4', assetTag: 'QOA-SOF-012', name: 'Adobe Creative Cloud', type: AssetType.Software, purchaseDate: '2024-01-01', status: AssetStatus.Assigned, tenantId: 'tenant-1' },
    { id: 'asset-5', assetTag: 'QOA-FURN-034', name: 'Ergonomic Chair', type: AssetType.Furniture, purchaseDate: '2021-05-10', status: AssetStatus.InRepair, tenantId: 'tenant-1' },
];

export const MOCK_ASSET_ASSIGNMENTS: AssetAssignment[] = [
    { id: 'assign-1', assetId: 'asset-1', teacherId: 'teacher-01', assignedDate: '2023-02-01', tenantId: 'tenant-1' },
    { id: 'assign-2', assetId: 'asset-2', teacherId: 'phase-head-01', assignedDate: '2023-02-01', tenantId: 'tenant-1' },
    { id: 'assign-3', assetId: 'asset-4', teacherId: 'teacher-01', assignedDate: '2024-01-10', tenantId: 'tenant-1' },
];