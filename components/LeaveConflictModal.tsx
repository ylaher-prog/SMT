

import React, { useMemo } from 'react';
import Modal from './Modal';
// FIX: Import RequestStatus as a value because it is used as one.
import { RequestStatus } from '../types';
import type { Teacher, LeaveRequest, TeacherWorkload, Subject } from '../types';

interface LeaveConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequest;
  conflicts: any[];
  teachers: Teacher[];
  workloads: Map<string, TeacherWorkload>;
  onApprove: (request: LeaveRequest, newStatus: RequestStatus) => void;
}

const LeaveConflictModal: React.FC<LeaveConflictModalProps> = ({ isOpen, onClose, request, conflicts, teachers, workloads, onApprove }) => {
    
    const conflictingSubjects = useMemo(() => {
        return [...new Set(conflicts.map(c => c.subject))];
    }, [conflicts]);
    
    const suggestedRelief = useMemo(() => {
        const teacherOnLeaveId = request.teacherId;

        const qualified = teachers.filter(t => 
            t.id !== teacherOnLeaveId && 
            conflictingSubjects.some(spec => t.specialties.includes(spec))
        );

        return qualified
            .map(t => ({
                teacher: t,
                workload: workloads.get(t.id),
            }))
            .sort((a, b) => {
                const workloadA = a.workload?.totalPeriods || 0;
                const workloadB = b.workload?.totalPeriods || 0;
                return workloadA - workloadB; // Sort by lowest period load
            })
            .slice(0, 5); // Get top 5

    }, [request.teacherId, conflictingSubjects, teachers, workloads]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Timetable Conflict Detected" size="lg">
            <div className="space-y-6">
                <p className="text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg">
                    This leave request for <strong>{teachers.find(t => t.id === request.teacherId)?.fullName}</strong> clashes with <strong>{conflicts.length}</strong> scheduled lessons.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">Conflicting Lessons</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {conflicts.map((c, i) => (
                                <div key={i} className="text-sm p-2 bg-gray-50 dark:bg-slate-700/50 rounded-md">
                                    <p className="font-medium">{c.date}: {c.period}</p>
                                    <p className="text-gray-600 dark:text-gray-400">{c.subject} for {c.classGroup}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Suggested Relief Teachers</h4>
                         <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {suggestedRelief.map(({ teacher, workload }) => (
                                <div key={teacher.id} className="text-sm p-2 bg-gray-50 dark:bg-slate-700/50 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{teacher.fullName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{teacher.specialties.join(', ')}</p>
                                    </div>
                                    <div className="text-xs text-right font-mono">
                                        {workload?.totalPeriods}p / {workload?.totalLearners}L
                                    </div>
                                </div>
                            ))}
                             {suggestedRelief.length === 0 && <p className="text-sm text-gray-500">No qualified and available relief teachers found.</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500">Cancel</button>
                    <button onClick={() => { onApprove(request, RequestStatus.Approved); onClose(); }} className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-rose-900">Approve Anyway</button>
                </div>
            </div>
        </Modal>
    );
};

export default LeaveConflictModal;