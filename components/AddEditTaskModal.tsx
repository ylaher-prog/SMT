import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { FormLabel, FormInput, FormSelect, FormTextarea, Fieldset, ModalFooter, PrimaryButton } from './FormControls';
import type { TaskCard, Teacher, ParentQuery, ProcurementRequest, Observation, LinkedRecord } from '../types';
import { TaskPriority, TaskRecurrence } from '../types';

interface AddEditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: TaskCard) => void;
    existingTask?: TaskCard | null;
    boardMembers: Teacher[];
    boardTasks: TaskCard[];
    parentQueries: ParentQuery[];
    procurementRequests: ProcurementRequest[];
    observations: Observation[];
}

const AddEditTaskModal: React.FC<AddEditTaskModalProps> = (props) => {
    const { isOpen, onClose, onSave, existingTask, boardMembers, boardTasks, parentQueries, procurementRequests, observations } = props;

    const [formData, setFormData] = useState<Partial<TaskCard>>({});
    const [linkSearchTerm, setLinkSearchTerm] = useState('');

    useEffect(() => {
        setFormData(existingTask || { priority: TaskPriority.Medium, recurrence: TaskRecurrence.None });
    }, [existingTask, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (field: 'dependencyIds', value: string) => {
        setFormData(prev => {
            const currentValues = prev[field] || [];
            const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim()) {
            alert("Task title cannot be empty.");
            return;
        }
        onSave(formData as TaskCard);
    };

    const searchResults = useMemo((): LinkedRecord[] => {
        if (linkSearchTerm.length < 3) return [];
        const term = linkSearchTerm.toLowerCase();
        
        const queries = parentQueries
            .filter(q => `${q.parentName} ${q.studentName}`.toLowerCase().includes(term))
            .map(q => ({ type: 'ParentQuery', id: q.id, displayText: `Query: ${q.parentName} for ${q.studentName}` } as LinkedRecord));

        const procs = procurementRequests
            .filter(p => p.itemDescription.toLowerCase().includes(term))
            .map(p => ({ type: 'ProcurementRequest', id: p.id, displayText: `Procurement: ${p.itemDescription}` } as LinkedRecord));

        const obs = observations
            .filter(o => o.observationType.toLowerCase().includes(term))
            .map(o => ({ type: 'Observation', id: o.id, displayText: `Observation: ${o.observationType}` } as LinkedRecord));

        return [...queries, ...procs, ...obs].slice(0, 10);
    }, [linkSearchTerm, parentQueries, procurementRequests, observations]);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={existingTask ? "Edit Task" : "Create New Task"}
            size="lg"
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>
                        {existingTask ? "Save Changes" : "Add Task"}
                    </PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <Fieldset legend="Task Details">
                    <FormInput name="title" type="text" value={formData.title || ''} onChange={handleChange} placeholder="Task Title..." required />
                    <FormTextarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} placeholder="Description (optional)" />
                </Fieldset>
                 <Fieldset legend="Properties">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FormLabel>Assign to</FormLabel>
                            <FormSelect name="assignedToId" value={formData.assignedToId || ''} onChange={handleChange}>
                                <option value="">-- Unassigned --</option>
                                {boardMembers.map(member => (<option key={member.id} value={member.id}>{member.fullName}</option>))}
                            </FormSelect>
                        </div>
                         <div>
                            <FormLabel>Due Date</FormLabel>
                            <FormInput name="dueDate" type="date" value={formData.dueDate || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <FormLabel>Priority</FormLabel>
                            <FormSelect name="priority" value={formData.priority} onChange={handleChange}>
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </FormSelect>
                        </div>
                         <div>
                            <FormLabel>Recurrence</FormLabel>
                            <FormSelect name="recurrence" value={formData.recurrence} onChange={handleChange}>
                                {Object.values(TaskRecurrence).map(r => <option key={r} value={r}>{r}</option>)}
                            </FormSelect>
                        </div>
                    </div>
                     <div className="mt-4">
                        <FormLabel>Dependencies (this task can't start until these are done)</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1 border p-2 rounded-md max-h-32 overflow-y-auto">
                            {boardTasks.filter(t => t.id !== existingTask?.id).map(task => (
                                <label key={task.id} className="flex items-center space-x-2 text-sm">
                                    <input type="checkbox" checked={(formData.dependencyIds || []).includes(task.id)} onChange={() => handleMultiSelectChange('dependencyIds', task.id)} />
                                    <span>{task.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </Fieldset>
                <Fieldset legend="Link to Record (Optional)">
                    {formData.linkedRecord ? (
                        <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-md flex justify-between items-center">
                            <span>{formData.linkedRecord.type}: {formData.linkedRecord.displayText}</span>
                            <button type="button" onClick={() => setFormData(prev => ({...prev, linkedRecord: undefined}))} className="text-red-500 text-sm">Remove</button>
                        </div>
                    ) : (
                        <div>
                            <FormInput type="text" value={linkSearchTerm} onChange={e => setLinkSearchTerm(e.target.value)} placeholder="Search queries, requests, etc..." />
                            {searchResults.length > 0 && (
                                <ul className="mt-2 border rounded-md max-h-32 overflow-y-auto">
                                    {searchResults.map(res => (
                                        <li key={`${res.type}-${res.id}`} onClick={() => { setFormData(prev => ({...prev, linkedRecord: res})); setLinkSearchTerm(''); }} className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700">{res.displayText}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </Fieldset>
            </form>
        </Modal>
    );
};

export default AddEditTaskModal;
