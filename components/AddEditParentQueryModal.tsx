import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import type { Teacher, ParentQuery, ParentQuerySlaSetting, CommunicationLogEntry } from '../types';
import { MonitoringStatus, ParentQueryCategory } from '../types';
import { PrimaryButton, FormLabel, FormInput, FormSelect, FormTextarea } from './FormControls';

interface AddEditParentQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  setQueries: React.Dispatch<React.SetStateAction<ParentQuery[]>>;
  existingQuery?: ParentQuery | null;
  teachers: Teacher[];
  currentAcademicYear: string;
  sendNotification: (userId: string, type: 'newParentQuery' | 'parentQueryUpdate' | 'parentQueryStatusUpdateToParent', data: any) => void;
  logAction: (action: string, details: string) => void;
  slaSettings: ParentQuerySlaSetting[];
  currentUser: Teacher;
  currentTenantId: string;
}

const AddEditParentQueryModal: React.FC<AddEditParentQueryModalProps> = (props) => {
    const { isOpen, onClose, setQueries, existingQuery, teachers, currentAcademicYear, sendNotification, logAction, slaSettings, currentUser, currentTenantId } = props;
    
    const [formData, setFormData] = useState({
        parentName: '',
        parentEmail: '',
        studentName: '',
        teacherId: teachers[0]?.id || '',
        category: ParentQueryCategory.Academic,
        queryDetails: '',
        status: MonitoringStatus.Open,
    });
    const [newNote, setNewNote] = useState('');

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

    useEffect(() => {
        if (existingQuery) {
            setFormData({
                parentName: existingQuery.parentName,
                parentEmail: existingQuery.parentEmail,
                studentName: existingQuery.studentName,
                teacherId: existingQuery.teacherId,
                category: existingQuery.category,
                queryDetails: existingQuery.queryDetails,
                status: existingQuery.status,
            });
        } else {
             setFormData({
                parentName: '',
                parentEmail: '',
                studentName: '',
                teacherId: teachers[0]?.id || '',
                category: ParentQueryCategory.Academic,
                queryDetails: '',
                status: MonitoringStatus.Open,
            });
        }
        setNewNote('');
    }, [existingQuery, isOpen, teachers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleEscalate = () => {
        if (!existingQuery) return;
        
        const currentAssignee = teacherMap.get(existingQuery.currentAssigneeId);
        if (!currentAssignee || !currentAssignee.managerId) {
            alert("Cannot escalate: Current assignee has no manager defined.");
            return;
        }

        const manager = teacherMap.get(currentAssignee.managerId);
        if (!manager) {
            alert("Cannot escalate: Manager not found.");
            return;
        }

        const newLogEntry: CommunicationLogEntry = {
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.fullName,
            entry: `Escalated from ${currentAssignee.fullName} to ${manager.fullName}.`
        };

        const updatedQuery = {
            ...existingQuery,
            currentAssigneeId: manager.id,
            status: MonitoringStatus.Escalated,
            communicationLog: [...existingQuery.communicationLog, newLogEntry],
        };

        setQueries(prev => prev.map(q => q.id === existingQuery.id ? updatedQuery : q));
        logAction('escalate:parent-query', `Query for ${existingQuery.studentName} escalated to ${manager.fullName}`);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // FIX: Add tenantId to new query object to satisfy the ParentQuery type.
        const queryData: Omit<ParentQuery, 'id' | 'creationDate' | 'slaDeadline' | 'communicationLog'> = {
            parentName: formData.parentName,
            parentEmail: formData.parentEmail,
            studentName: formData.studentName,
            teacherId: formData.teacherId,
            currentAssigneeId: formData.teacherId,
            category: formData.category,
            queryDetails: formData.queryDetails,
            status: formData.status,
            academicYear: existingQuery ? existingQuery.academicYear : currentAcademicYear,
            tenantId: currentTenantId,
        };
        
        if (existingQuery) {
            let communicationLog = [...existingQuery.communicationLog];
            let statusChanged = existingQuery.status !== formData.status;

            if (newNote.trim()) {
                communicationLog.push({ timestamp: new Date().toISOString(), userId: currentUser.id, userName: currentUser.fullName, entry: `Note added: ${newNote.trim()}` });
            }
            if(statusChanged) {
                 communicationLog.push({ timestamp: new Date().toISOString(), userId: currentUser.id, userName: currentUser.fullName, entry: `Status changed to ${formData.status}.` });
            }

            const updatedQuery: ParentQuery = { ...existingQuery, ...formData, communicationLog };
            setQueries(prev => prev.map(q => q.id === existingQuery.id ? updatedQuery : q));
            logAction('update:parent-query', `Updated query for ${formData.studentName}`);
            
            if (statusChanged) {
                sendNotification(formData.teacherId, 'parentQueryUpdate', { parentName: formData.parentName, studentName: formData.studentName, status: formData.status });
                sendNotification(formData.teacherId, 'parentQueryStatusUpdateToParent', { parentName: formData.parentName, studentName: formData.studentName, status: formData.status });
            }

        } else {
            const slaHours = slaSettings.find(s => s.category === formData.category)?.hours || 24;
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + slaHours);

            const newQuery: ParentQuery = {
                id: `pq-${Date.now()}`,
                creationDate: new Date().toISOString(),
                slaDeadline: deadline.toISOString(),
                communicationLog: [{
                    timestamp: new Date().toISOString(),
                    userId: currentUser.id,
                    userName: currentUser.fullName,
                    entry: `Query logged and assigned to ${teacherMap.get(formData.teacherId) || 'N/A'}.`
                }],
                ...queryData,
            };
            setQueries(prev => [...prev, newQuery]);
            logAction('add:parent-query', `Logged new query for ${formData.studentName}`);
            sendNotification(formData.teacherId, 'newParentQuery', { parentName: formData.parentName, studentName: formData.studentName });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingQuery ? "Edit Parent Query" : "Log New Parent Query"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><FormLabel>Parent Full Name</FormLabel><FormInput type="text" name="parentName" value={formData.parentName} onChange={handleChange} required /></div><div><FormLabel>Parent Email</FormLabel><FormInput type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} /></div></div>
                <div><FormLabel>Student Name</FormLabel><FormInput type="text" name="studentName" value={formData.studentName} onChange={handleChange} required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><FormLabel>Associated Teacher</FormLabel><FormSelect name="teacherId" value={formData.teacherId} onChange={handleChange}>{teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}</FormSelect></div><div><FormLabel>Category</FormLabel><FormSelect name="category" value={formData.category} onChange={handleChange}>{Object.values(ParentQueryCategory).map(c => <option key={c} value={c}>{c}</option>)}</FormSelect></div></div>
                <div><FormLabel>Query Details</FormLabel><FormTextarea name="queryDetails" value={formData.queryDetails} onChange={handleChange} required rows={5} /></div>
                
                {existingQuery && (
                    <div className="border-t pt-4 dark:border-slate-700 space-y-4">
                        <h4 className="font-semibold">Communication Log</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-md">
                            {existingQuery.communicationLog.map(log => (
                                <div key={log.timestamp} className="text-sm">
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{log.entry}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">by {log.userName} on {new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><FormLabel>Status</FormLabel><FormSelect name="status" value={formData.status} onChange={handleChange}>{Object.values(MonitoringStatus).map(s => <option key={s} value={s}>{s}</option>)}</FormSelect></div>
                        </div>
                        <div>
                            <FormLabel>Add Note</FormLabel>
                            <FormTextarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} placeholder="Add a new note to the log..."/>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-between items-center gap-4 pt-4">
                    <div>
                        {existingQuery && (
                             <button type="button" onClick={handleEscalate} className="bg-amber-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-amber-600 text-sm">Escalate</button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                        <PrimaryButton type="submit">{existingQuery ? "Save Changes" : "Log Query"}</PrimaryButton>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditParentQueryModal;
