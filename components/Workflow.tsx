

import React, { useState, useMemo } from 'react';
import type { Workflow, Teacher, TaskBoard, Permission } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from './Icons';
import { hasPermission } from '../permissions';
import ConfirmationModal from './ConfirmationModal';
import AddEditWorkflowModal from './AddEditWorkflowModal';

interface WorkflowProps {
    workflows: Workflow[];
    setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
    allTeachers: Teacher[];
    taskBoards: TaskBoard[];
    permissions: Permission[];
    currentTenantId: string;
}

const MODULE_DISPLAY_NAMES: { [key in Workflow['module']]: string } = {
    leave: 'Leave',
    parents: 'Parents',
    procurement: 'Procurement',
    observations: 'Monitoring',
};

const TRIGGER_DISPLAY_NAMES: { [key in Workflow['trigger']]: string } = {
    onCreate: 'On Record Creation',
    onUpdate: 'On Record Update',
};

const Workflow: React.FC<WorkflowProps> = (props) => {
    const { workflows, setWorkflows, permissions, currentTenantId } = props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [workflowToEdit, setWorkflowToEdit] = useState<Workflow | null>(null);
    const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
    const canManage = hasPermission(permissions, 'manage:workflow');

    const handleAdd = () => {
        setWorkflowToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (workflow: Workflow) => {
        setWorkflowToEdit(workflow);
        setIsModalOpen(true);
    };

    const handleDelete = () => {
        if (workflowToDelete) {
            setWorkflows(prev => prev.filter(w => w.id !== workflowToDelete.id));
            setWorkflowToDelete(null);
        }
    };
    
    const handleToggleEnabled = (workflow: Workflow) => {
        const updatedWorkflow = { ...workflow, isEnabled: !workflow.isEnabled };
        setWorkflows(prev => prev.map(w => w.id === workflow.id ? updatedWorkflow : w));
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">Workflow Automation</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create automated rules to streamline your processes.</p>
                    </div>
                    {canManage && (
                        <button onClick={handleAdd} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors mt-3 sm:mt-0">
                            <PlusIcon className="w-4 h-4" />
                            <span>New Workflow</span>
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Module</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trigger</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                {canManage && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                            {workflows.map(wf => (
                                <tr key={wf.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{wf.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{wf.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{MODULE_DISPLAY_NAMES[wf.module]}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{TRIGGER_DISPLAY_NAMES[wf.trigger]}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={wf.isEnabled} onChange={() => handleToggleEnabled(wf)} className="sr-only peer" disabled={!canManage}/>
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-brand-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary"></div>
                                        </label>
                                    </td>
                                    {canManage && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-3">
                                                <button onClick={() => handleEdit(wf)} className="text-brand-accent hover:text-amber-700"><PencilIcon className="h-5 w-5"/></button>
                                                <button onClick={() => setWorkflowToDelete(wf)} className="text-red-600 hover:text-red-800"><TrashIcon className="h-5 w-5"/></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && canManage && (
                <AddEditWorkflowModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(wf) => setWorkflows(prev => {
                        const exists = prev.some(w => w.id === wf.id);
                        return exists ? prev.map(w => w.id === wf.id ? wf : w) : [...prev, wf];
                    })}
                    existingWorkflow={workflowToEdit}
                    {...props}
                    currentTenantId={currentTenantId}
                />
            )}
            {workflowToDelete && canManage && (
                <ConfirmationModal 
                    isOpen={!!workflowToDelete}
                    onClose={() => setWorkflowToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Workflow"
                    message={`Are you sure you want to delete the workflow "${workflowToDelete.name}"? This action cannot be undone.`}
                />
            )}
        </>
    );
};

export default Workflow;
