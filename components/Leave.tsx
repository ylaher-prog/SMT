
import React, { useMemo, useState, useCallback } from 'react';
// FIX: Add ClassGroup to type imports
import type { Teacher, LeaveRequest, Permission, LeavePolicy, TeacherAllocation, TimetableHistoryEntry, TimeGrid, AcademicStructure, TeacherWorkload, ClassGroup } from '../types';
import { RequestStatus, LeaveType } from '../types';
import StatusTag from './StatusTag';
import { CheckIcon, HandThumbDownIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon, ExclamationTriangleIcon, PlusIcon } from './Icons';
import { TableFilterInput, TableFilterSelect } from './FormControls';
import TabButton from './TabButton';
import AddEditLeaveRequestModal from './AddEditLeaveRequestModal';
import LeaveConflictModal from './LeaveConflictModal';
import LeaveCalendarView from './LeaveCalendarView';
import LeaveBalances from './LeaveBalances';

/*
-- SQL for Supabase Setup
-- Run these commands in the Supabase SQL Editor.

-- 1. Add leave balances column to teachers table
-- Using JSONB is flexible for different leave types.
ALTER TABLE public.teachers
ADD COLUMN leave_balances JSONB DEFAULT '{}'::jsonb;

-- Example to update a teacher:
-- UPDATE public.teachers
-- SET leave_balances = '{"Annual": 21, "Sick": 10}'
-- WHERE id = 'some-teacher-uuid';

-- 2. Add attachment column to leave_requests table
ALTER TABLE public.leave_requests
ADD COLUMN attachment JSONB; -- Store { "fileName": "...", "storagePath": "..." }

-- 3. Create leave_policies table
CREATE TABLE public.leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type TEXT UNIQUE NOT NULL,
  accrual_rate NUMERIC(5, 2) NOT NULL,
  accrual_frequency TEXT NOT NULL, -- 'monthly' or 'annually'
  max_balance INT NOT NULL
);

-- Example: Insert default policies
INSERT INTO public.leave_policies (leave_type, accrual_rate, accrual_frequency, max_balance)
VALUES
  ('Annual', 1.75, 'monthly', 25),
  ('Sick', 1.0, 'monthly', 120);

-- 4. Set up Supabase Storage bucket for leave attachments
-- Go to Storage -> Create a new bucket.
-- Name it 'leave_attachments'.
*/

interface LeaveProps {
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    leaveRequests: LeaveRequest[];
    setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
    currentAcademicYear: string;
    permissions: Permission[];
    logAction: (action: string, details: string) => void;
    sendNotification: (userId: string, type: 'leaveStatus', data: any) => void;
    leavePolicies: LeavePolicy[];
    allocations: TeacherAllocation[];
    timetableHistory: TimetableHistoryEntry[];
    timeGrids: TimeGrid[];
    academicStructure: AcademicStructure;
    workloads: Map<string, TeacherWorkload>;
    // FIX: Add missing classGroups prop
    classGroups: ClassGroup[];
    currentTenantId: string;
}

type SortableKey = 'teacher' | 'leaveType' | 'startDate' | 'status';
type LeaveTab = 'requests' | 'calendar' | 'balances';

const Leave: React.FC<LeaveProps> = (props) => {
    // FIX: Destructure classGroups from props
    const { teachers, setTeachers, leaveRequests, setLeaveRequests, permissions, logAction, sendNotification, leavePolicies, allocations, timetableHistory, timeGrids, academicStructure, workloads, classGroups, currentTenantId } = props;
    const [activeTab, setActiveTab] = useState<LeaveTab>('requests');
    const [filters, setFilters] = useState({ status: 'all', teacherName: '', leaveType: 'all', reason: '' });
    const [sortConfig, setSortConfig] = useState<{key: SortableKey, direction: 'ascending' | 'descending'}>({key: 'startDate', direction: 'descending'});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [conflictModalData, setConflictModalData] = useState<{ request: LeaveRequest; conflicts: any[] } | null>(null);

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

    const getLeaveDurationInWorkDays = (start: string, end: string) => {
        let count = 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        let current = startDate;
        while (current <= endDate) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) { // Exclude Sunday and Saturday
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    };
    
    const handleStatusChange = (req: LeaveRequest, newStatus: RequestStatus) => {
        const updatedReq = { ...req, status: newStatus };
        
        if (newStatus === RequestStatus.Approved) {
            const duration = getLeaveDurationInWorkDays(req.startDate, req.endDate);
            setTeachers(prev => prev.map(t => {
                if (t.id === req.teacherId) {
                    const newBalances = { ...t.leaveBalances };
                    if (newBalances[req.leaveType] !== undefined) {
                        newBalances[req.leaveType] = Math.max(0, (newBalances[req.leaveType] ?? 0) - duration);
                    }
                    return { ...t, leaveBalances: newBalances };
                }
                return t;
            }));
        }

        setLeaveRequests(prev => prev.map(r => r.id === req.id ? updatedReq : r));
        sendNotification(updatedReq.teacherId, 'leaveStatus', { startDate: updatedReq.startDate, endDate: updatedReq.endDate, status: newStatus });
        logAction('update:leave_status', `Leave request for ${teacherMap.get(req.teacherId)?.fullName} set to ${newStatus}`);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const sortedAndFilteredRequests = useMemo(() => {
        let filtered = leaveRequests.filter(req => {
            const teacher = teacherMap.get(req.teacherId);
            return (
                (filters.status === 'all' || req.status === filters.status) &&
                (teacher?.fullName.toLowerCase().includes(filters.teacherName.toLowerCase()) || false) &&
                (filters.leaveType === 'all' || req.leaveType === filters.leaveType) &&
                req.reason.toLowerCase().includes(filters.reason.toLowerCase())
            );
        });
        
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if (sortConfig.key === 'teacher') {
                    aValue = teacherMap.get(a.teacherId)?.fullName || '';
                    bValue = teacherMap.get(b.teacherId)?.fullName || '';
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        
        return filtered;
    }, [leaveRequests, filters, sortConfig, teacherMap]);
    
    const requestSort = (key: SortableKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKey) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
    };
    
    const getConflicts = useCallback((request: LeaveRequest) => {
        const conflicts: any[] = [];
        const activeTimetable = timetableHistory[0]?.timetable;
        if (!activeTimetable) return conflicts;
        
        const teacherAllocations = allocations.filter(a => a.teacherId === request.teacherId);
        if (teacherAllocations.length === 0) return conflicts;
        
        const groupIds = new Set(teacherAllocations.map(a => a.classGroupId));
        const relevantGrids = new Set<TimeGrid>();
        timeGrids.forEach(grid => {
            // FIX: Use destructured classGroups instead of props.classGroups
            const group = Array.from(groupIds).find(gid => classGroups.find(cg => cg.id === gid)?.timeGridId === grid.id);
            if(group) relevantGrids.add(grid);
        });

        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.toLocaleString('en-US', { weekday: 'long' });
            
            relevantGrids.forEach(grid => {
                if(grid.days.includes(dayOfWeek)) {
                    grid.periods.forEach(period => {
                        Object.values(activeTimetable).forEach(classSchedule => {
                            const slots = classSchedule[dayOfWeek]?.[period.id] || [];
                            if (slots.some(slot => slot.teacherId === request.teacherId)) {
                                // FIX: Use destructured classGroups and academicStructure instead of props
                                conflicts.push({ date: d.toISOString().split('T')[0], period: period.name, classGroup: classGroups.find(cg => cg.id === slots[0].classGroupId)?.name, subject: academicStructure.subjects.find(s => s.id === slots[0].subjectId)?.name });
                            }
                        });
                    });
                }
            });
        }

        return conflicts;
    // FIX: Add classGroups to dependency array
    }, [timetableHistory, allocations, timeGrids, classGroups, academicStructure.subjects]);

    const renderRequestList = () => (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-4 sm:mb-0">Leave Requests</h3>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Request</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                         <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('teacher')}>Teacher {getSortIcon('teacher')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('leaveType')}>Leave Type {getSortIcon('leaveType')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('startDate')}>Dates {getSortIcon('startDate')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conflicts</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                        <tr>
                            <th className="px-4 py-2"><TableFilterInput type="text" name="teacherName" placeholder="Filter..." value={filters.teacherName} onChange={handleFilterChange} /></th>
                            <th className="px-4 py-2"><TableFilterSelect name="leaveType" value={filters.leaveType} onChange={handleFilterChange}><option value="all">All</option>{Object.values(LeaveType).map(lt => <option key={lt} value={lt}>{lt}</option>)}</TableFilterSelect></th>
                            <th className="px-4 py-2"></th>
                            <th className="px-4 py-2"><TableFilterInput type="text" name="reason" placeholder="Filter..." value={filters.reason} onChange={handleFilterChange} /></th>
                            <th className="px-4 py-2"></th>
                            <th className="px-4 py-2"><TableFilterSelect name="status" value={filters.status} onChange={handleFilterChange}><option value="all">All</option>{Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}</TableFilterSelect></th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                        {sortedAndFilteredRequests.map((req) => {
                            const teacher = teacherMap.get(req.teacherId);
                            const conflicts = getConflicts(req);
                            return (
                                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-gray-200">{teacher?.fullName || 'Unknown'}</div><div className="text-sm text-gray-500 dark:text-gray-400">{teacher?.email}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{req.leaveType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{req.startDate} to {req.endDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {conflicts.length > 0 ? (
                                            <button onClick={() => setConflictModalData({ request: req, conflicts })} className="text-amber-500 hover:text-amber-700">
                                                <ExclamationTriangleIcon className="w-6 h-6" />
                                            </button>
                                        ) : <span className="text-green-500">&ndash;</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusTag status={req.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {req.status === RequestStatus.Pending ? (
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleStatusChange(req, RequestStatus.Approved)} className="p-1.5 text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-900" title="Approve"><CheckIcon className="h-4 w-4" /></button>
                                                <button onClick={() => handleStatusChange(req, RequestStatus.Denied)} className="p-1.5 text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900" title="Deny"><HandThumbDownIcon className="h-4 w-4" /></button>
                                            </div>
                                        ) : (<span className="text-gray-400 text-xs">No actions</span>)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {sortedAndFilteredRequests.length === 0 && (<div className="text-center py-10 text-gray-500 dark:text-gray-400">No leave requests match the current filters.</div>)}
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch(activeTab) {
            case 'requests': return renderRequestList();
            case 'calendar': return <LeaveCalendarView leaveRequests={leaveRequests} />;
            case 'balances': return <LeaveBalances teachers={teachers} leavePolicies={leavePolicies} />;
        }
    }

    return (
         <div className="space-y-6">
            <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                <TabButton tabId="requests" label="Request List" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="calendar" label="Calendar View" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="balances" label="Balances & Policies" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            </div>

            {renderContent()}
            
            {isModalOpen && (
                <AddEditLeaveRequestModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    setLeaveRequests={setLeaveRequests}
                    teachers={teachers}
                    currentAcademicYear={props.currentAcademicYear}
                    // FIX: Pass currentTenantId to the modal
                    currentTenantId={currentTenantId}
                />
            )}
            {conflictModalData && (
                <LeaveConflictModal
                    isOpen={!!conflictModalData}
                    onClose={() => setConflictModalData(null)}
                    onApprove={handleStatusChange}
                    {...conflictModalData}
                    {...props}
                />
            )}
        </div>
    );
};

export default Leave;
