import React from 'react';
import type { TaskCard, Teacher, Permission } from '../types';
import { TaskPriority } from '../types';
import { PencilIcon, TrashIcon, FlagIcon, ArrowPathIcon, LinkIcon, DocumentMagnifyingGlassIcon } from './Icons';
import { hasPermission } from '../permissions';

interface TaskCardDisplayProps {
    card: TaskCard;
    onEdit: () => void;
    onDelete: () => void;
    allTeachers: Teacher[];
    permissions: Permission[];
}

const getPriorityClasses = (priority?: TaskPriority) => {
    switch(priority) {
        case TaskPriority.High: return 'border-red-500';
        case TaskPriority.Medium: return 'border-amber-500';
        case TaskPriority.Low: return 'border-sky-500';
        default: return 'border-transparent';
    }
}

const TaskCardDisplay: React.FC<TaskCardDisplayProps> = ({ card, onEdit, onDelete, allTeachers, permissions }) => {
    const assignedUser = allTeachers.find(t => t.id === card.assignedToId);
    
    const dueDate = card.dueDate ? new Date(card.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date();

    return (
        <div className={`bg-white dark:bg-slate-900/70 p-3 rounded-md shadow-sm border-l-4 ${getPriorityClasses(card.priority)}`}>
            <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{card.title}</p>
                {hasPermission(permissions, 'manage:task-cards') && (
                    <div className="flex-shrink-0 flex items-center gap-1">
                         <button onClick={onEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"><PencilIcon className="w-3.5 h-3.5" /></button>
                         <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1"><TrashIcon className="w-3.5 h-3.5" /></button>
                    </div>
                )}
            </div>
            
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                    {dueDate && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                            {dueDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                    {/* FIX: Wrap icons in a span with a title attribute to resolve TS error. */}
                    {card.priority && (
                        <span title={`Priority: ${card.priority}`}>
                            <FlagIcon className={`w-4 h-4 ${
                                card.priority === TaskPriority.High ? 'text-red-500' :
                                card.priority === TaskPriority.Medium ? 'text-amber-500' :
                                'text-sky-500'
                            }`} />
                        </span>
                    )}
                    {card.recurrence && card.recurrence !== 'None' && 
                        <span title={`Repeats ${card.recurrence}`}>
                            <ArrowPathIcon className="w-4 h-4 text-gray-500" />
                        </span>
                    }
                    {card.dependencyIds && card.dependencyIds.length > 0 && 
                        <span title={`${card.dependencyIds.length} dependencies`}>
                            <LinkIcon className="w-4 h-4 text-gray-500" />
                        </span>
                    }
                    {card.linkedRecord && 
                        <span title={`Linked to ${card.linkedRecord.type}: ${card.linkedRecord.displayText}`}>
                            <DocumentMagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
                        </span>
                    }
                </div>
                {assignedUser && (
                    <img src={assignedUser.avatarUrl} alt={assignedUser.fullName} className="w-6 h-6 rounded-full" title={`Assigned to ${assignedUser.fullName}`} />
                )}
            </div>
        </div>
    );
};

export default TaskCardDisplay;