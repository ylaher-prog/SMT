

import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { FormLabel, FormInput, FormSelect, FormTextarea, Fieldset, ModalFooter, PrimaryButton } from './FormControls';
import type { Workflow, Teacher, TaskBoard, WorkflowModule, WorkflowCondition, WorkflowAction } from '../types';
import { RequestStatus, LeaveType, MonitoringStatus, ParentQueryCategory, ObservationPriority } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface AddEditWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workflow: Workflow) => void;
    existingWorkflow: Workflow | null;
    allTeachers: Teacher[];
    taskBoards: TaskBoard[];
    currentTenantId: string;
}

const MODULE_CONFIG: Record<WorkflowModule, { fields: {id: string, label: string, type: 'select', options: any[]}[], placeholders: string[] }> = {
    leave: {
        fields: [
            { id: 'status', label: 'Status', type: 'select', options: Object.values(RequestStatus) },
            { id: 'leaveType', label: 'Leave Type', type: 'select', options: Object.values(LeaveType) },
        ],
        placeholders: ['{{record.teacherName}}', '{{record.startDate}}', '{{record.endDate}}', '{{record.status}}']
    },
    parents: {
        fields: [
            { id: 'status', label: 'Status', type: 'select', options: Object.values(MonitoringStatus) },
            { id: 'category', label: 'Category', type: 'select', options: Object.values(ParentQueryCategory) },
        ],
        placeholders: ['{{record.parentName}}', '{{record.studentName}}', '{{record.teacherName}}', '{{record.status}}']
    },
    procurement: {
        fields: [
            { id: 'status', label: 'Status', type: 'select', options: Object.values(RequestStatus) },
            { id: 'category', label: 'Category', type: 'select', options: [] }, // Dynamic categories can be added
        ],
        placeholders: ['{{record.requesterName}}', '{{record.itemDescription}}', '{{record.amount}}', '{{record.status}}']
    },
    observations: {
        fields: [
            { id: 'status', label: 'Status', type: 'select', options: Object.values(MonitoringStatus) },
            { id: 'priority', label: 'Priority', type: 'select', options: Object.values(ObservationPriority) },
        ],
        placeholders: ['{{record.teacherName}}', '{{record.phaseHeadName}}', '{{record.observationType}}', '{{record.status}}']
    },
};

const AddEditWorkflowModal: React.FC<AddEditWorkflowModalProps> = (props) => {
    const { isOpen, onClose, onSave, existingWorkflow, allTeachers, taskBoards, currentTenantId } = props;
    const [formData, setFormData] = useState<Omit<Workflow, 'id'>>({
        name: '',
        description: '',
        module: 'leave',
        trigger: 'onCreate',
        isEnabled: true,
        conditions: [],
        actions: [],
        tenantId: currentTenantId,
    });

    useEffect(() => {
        if (existingWorkflow) {
            setFormData(existingWorkflow);
        } else {
            // FIX: Initialize with tenantId to satisfy the Workflow type.
            setFormData({
                name: '',
                description: '',
                module: 'leave',
                trigger: 'onCreate',
                isEnabled: true,
                conditions: [],
                actions: [],
                tenantId: currentTenantId,
            });
        }
    }, [existingWorkflow, isOpen, currentTenantId]);

    const moduleConfig = useMemo(() => MODULE_CONFIG[formData.module], [formData.module]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if(name === 'module') {
            setFormData(prev => ({...prev, [name]: value as WorkflowModule, conditions: [], actions: []}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleConditionChange = (id: string, updates: Partial<WorkflowCondition>) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
    };
    
    const handleAddCondition = () => {
        const newCondition: WorkflowCondition = { id: `c-${Date.now()}`, field: moduleConfig.fields[0].id, operator: 'equals', value: '' };
        setFormData(prev => ({...prev, conditions: [...prev.conditions, newCondition]}));
    };

    const handleRemoveCondition = (id: string) => {
        setFormData(prev => ({ ...prev, conditions: prev.conditions.filter(c => c.id !== id) }));
    };

    const handleActionChange = (id: string, updates: Partial<WorkflowAction>) => {
        setFormData(prev => ({ ...prev, actions: prev.actions.map(a => a.id === id ? { ...a, ...updates } : a) }));
    };
    
    const handleActionParamChange = (id: string, paramKey: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            actions: prev.actions.map(a => a.id === id ? { ...a, params: { ...a.params, [paramKey]: value } } : a)
        }));
    };

    const handleAddAction = () => {
        const newAction: WorkflowAction = { id: `a-${Date.now()}`, type: 'send_notification', params: {} };
        setFormData(prev => ({...prev, actions: [...prev.actions, newAction]}));
    };
    
    const handleRemoveAction = (id: string) => {
        setFormData(prev => ({ ...prev, actions: prev.actions.filter(a => a.id !== id) }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: existingWorkflow?.id || `wf-${Date.now()}`, ...formData });
        onClose();
    };

    const renderActionParams = (action: WorkflowAction) => {
        switch (action.type) {
            case 'send_notification':
                return (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <FormSelect value={action.params.recipient} onChange={e => handleActionParamChange(action.id, 'recipient', e.target.value)}>
                            <option value="teacher">Assigned Teacher</option>
                            <option value="manager">Teacher's Manager</option>
                        </FormSelect>
                        <FormInput value={action.params.message} onChange={e => handleActionParamChange(action.id, 'message', e.target.value)} placeholder="Notification message..."/>
                    </div>
                );
            case 'create_task':
                return (
                    <div className="space-y-2 mt-2">
                         <FormSelect value={action.params.boardId} onChange={e => handleActionParamChange(action.id, 'boardId', e.target.value)}>
                            <option value="">Select a board</option>
                            {taskBoards.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                        </FormSelect>
                        <FormInput value={action.params.title} onChange={e => handleActionParamChange(action.id, 'title', e.target.value)} placeholder="Task title..."/>
                         <FormSelect value={action.params.assignedToId} onChange={e => handleActionParamChange(action.id, 'assignedToId', e.target.value)}>
                            <option value="">Unassigned</option>
                             {allTeachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </FormSelect>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingWorkflow ? "Edit Workflow" : "New Workflow"} size="xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Fieldset legend="1. General">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput name="name" value={formData.name} onChange={handleChange} placeholder="Workflow Name" required />
                        <FormSelect name="module" value={formData.module} onChange={handleChange}>
                            <option value="leave">Leave</option>
                            <option value="parents">Parents</option>
                            <option value="procurement">Procurement</option>
                            <option value="observations">Monitoring</option>
                        </FormSelect>
                    </div>
                    <FormTextarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Description (optional)" rows={2} />
                </Fieldset>

                 <Fieldset legend="2. Trigger">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">When a record in <b className="font-semibold">{formData.module}</b> is</span>
                        <FormSelect name="trigger" value={formData.trigger} onChange={handleChange} className="w-48">
                            <option value="onCreate">Created</option>
                            <option value="onUpdate">Updated</option>
                        </FormSelect>
                    </div>
                </Fieldset>

                <Fieldset legend="3. Conditions (Optional)">
                    {formData.conditions.map(cond => (
                        <div key={cond.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-md">
                           <FormSelect value={cond.field} onChange={e => handleConditionChange(cond.id, { field: e.target.value })}>
                                {moduleConfig.fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                           </FormSelect>
                            <FormSelect value={cond.operator} onChange={e => handleConditionChange(cond.id, { operator: e.target.value as any })}>
                               <option value="equals">equals</option>
                               <option value="not_equals">does not equal</option>
                            </FormSelect>
                            <FormInput value={cond.value} onChange={e => handleConditionChange(cond.id, { value: e.target.value })} placeholder="Value..."/>
                            <button type="button" onClick={() => handleRemoveCondition(cond.id)}><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddCondition} className="text-sm font-semibold text-brand-primary flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Condition</button>
                </Fieldset>
                
                <Fieldset legend="4. Actions">
                    {formData.actions.map(act => (
                        <div key={act.id} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-md border-l-4 border-brand-primary">
                            <div className="flex items-center gap-2">
                                <FormSelect value={act.type} onChange={e => handleActionChange(act.id, { type: e.target.value as any })}>
                                    <option value="send_notification">Send Notification</option>
                                    <option value="create_task">Create Task</option>
                                </FormSelect>
                                <button type="button" onClick={() => handleRemoveAction(act.id)}><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
                            </div>
                            {renderActionParams(act)}
                        </div>
                    ))}
                    <button type="button" onClick={handleAddAction} className="text-sm font-semibold text-brand-primary flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Action</button>
                </Fieldset>


                <ModalFooter onCancel={onClose}>
                    <PrimaryButton type="submit">{existingWorkflow ? "Save Changes" : "Create Workflow"}</PrimaryButton>
                </ModalFooter>
            </form>
        </Modal>
    );
}

export default AddEditWorkflowModal;
