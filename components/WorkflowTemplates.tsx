import React, { useState } from 'react';
import type { WorkflowTemplate, Teacher, TaskBoard } from '../types';
import { PlusIcon } from './Icons';
import Modal from './Modal';
import { FormLabel, FormInput, PrimaryButton, ModalFooter } from './FormControls';

interface WorkflowTemplatesProps {
    templates: WorkflowTemplate[];
    setBoards: React.Dispatch<React.SetStateAction<TaskBoard[]>>;
    allTeachers: Teacher[];
    currentUser: Teacher;
    currentTenantId: string;
}

const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({ templates, setBoards, allTeachers, currentUser, currentTenantId }) => {
    const [templateToUse, setTemplateToUse] = useState<WorkflowTemplate | null>(null);
    const [newBoardTitle, setNewBoardTitle] = useState('');

    const handleInstantiate = () => {
        if (!templateToUse || !newBoardTitle.trim()) return;

        const now = new Date();
        const newTasks = templateToUse.tasks.map((templateTask, index) => {
            const startDate = new Date(now);
            startDate.setDate(now.getDate() + templateTask.startAfterDays);
            
            const dueDate = new Date(startDate);
            dueDate.setDate(startDate.getDate() + templateTask.durationDays);

            let dependencyIds: string[] = [];
            if (templateTask.dependencyOffset !== undefined) {
                const depIndex = index + templateTask.dependencyOffset;
                if (depIndex >= 0 && depIndex < index) {
                    // We need the ID of the task that will be created at that index.
                    // This creates a placeholder that we'll resolve in a second pass.
                    dependencyIds.push(`placeholder_dep_${depIndex}`);
                }
            }
            
            return {
                id: `task-${Date.now()}-${index}`,
                title: templateTask.title,
                description: templateTask.description,
                startDate: startDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                dependencyIds: dependencyIds
            };
        });

        // Second pass to resolve placeholder dependencies
        const idMap: Record<string, string> = {};
        newTasks.forEach((task, index) => {
            idMap[`placeholder_dep_${index}`] = task.id;
        });

        const finalTasks = newTasks.map(task => ({
            ...task,
            dependencyIds: (task.dependencyIds || []).map(depId => idMap[depId] || depId).filter(id => !id.startsWith('placeholder'))
        }));
        
        const newBoard: TaskBoard = {
            id: `board-${Date.now()}`,
            title: newBoardTitle.trim(),
            memberIds: [currentUser.id],
            tasks: finalTasks,
            columns: [
                { id: `col-${Date.now()}-1`, title: 'To Do', cardIds: finalTasks.map(t => t.id) },
                { id: `col-${Date.now()}-2`, title: 'In Progress', cardIds: [] },
                { id: `col-${Date.now()}-3`, title: 'Done', cardIds: [] },
            ],
            // FIX: Add tenantId to satisfy the TaskBoard type.
            tenantId: currentTenantId,
        };

        setBoards(prev => [...prev, newBoard]);
        setTemplateToUse(null);
        setNewBoardTitle('');
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold">Workflow Templates</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Use templates to quickly set up boards for recurring projects like exam moderation or new term setup.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                        <div key={template.id} className="p-4 border dark:border-slate-700 rounded-lg flex flex-col">
                            <h4 className="font-bold text-brand-primary dark:text-rose-400">{template.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex-grow">{template.description}</p>
                            <div className="mt-3 text-xs text-gray-500">
                                {template.tasks.length} tasks
                            </div>
                            <button
                                onClick={() => { setTemplateToUse(template); setNewBoardTitle(`${template.name} - ${new Date().toLocaleDateString()}`); }}
                                className="w-full mt-4 text-sm bg-brand-navy text-white font-semibold py-2 rounded-md hover:bg-slate-700"
                            >
                                Use Template
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {templateToUse && (
                <Modal 
                    isOpen={!!templateToUse}
                    onClose={() => setTemplateToUse(null)}
                    title={`Create Board from "${templateToUse.name}"`}
                    footer={
                        <ModalFooter onCancel={() => setTemplateToUse(null)}>
                            <PrimaryButton onClick={handleInstantiate}>
                                Create Board
                            </PrimaryButton>
                        </ModalFooter>
                    }
                >
                    <FormLabel htmlFor="new-board-title">New Board Title</FormLabel>
                    <FormInput
                        id="new-board-title"
                        type="text"
                        value={newBoardTitle}
                        onChange={(e) => setNewBoardTitle(e.target.value)}
                        required
                    />
                </Modal>
            )}
        </>
    );
};

export default WorkflowTemplates;
