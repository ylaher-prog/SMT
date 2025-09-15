import React, { useState, useMemo, useEffect } from 'react';
import type { TaskBoard, Teacher, Permission, TaskCard, TaskColumn, WorkflowTemplate, ParentQuery, ProcurementRequest, Observation } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './Icons';
import AddEditBoardModal from './AddEditBoardModal';
import AddEditTaskModal from './AddEditTaskModal';
import { hasPermission } from '../permissions';
import ConfirmationModal from './ConfirmationModal';
import { PrimaryButton } from './FormControls';
import TabButton from './TabButton';
import TaskCardDisplay from './TaskCardDisplay';
import WorkflowTemplates from './WorkflowTemplates';

/*
-- SQL for Supabase Setup
-- Run these commands in the Supabase SQL Editor.

-- 1. Alter the 'tasks' table to add new fields
-- Assuming you have a table named 'tasks' (or similar).
-- We'll use JSONB for flexible fields like recurrence and linked records.
ALTER TABLE public.tasks
ADD COLUMN priority TEXT,
ADD COLUMN start_date TIMESTAMPTZ,
ADD COLUMN due_date TIMESTAMPTZ,
ADD COLUMN recurrence JSONB,
ADD COLUMN dependency_ids UUID[],
ADD COLUMN linked_record JSONB;

-- 2. Create the 'workflow_templates' table
CREATE TABLE public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tasks JSONB NOT NULL -- Array of TemplateTask objects
);
*/

interface TasksProps {
    boards: TaskBoard[];
    setBoards: React.Dispatch<React.SetStateAction<TaskBoard[]>>;
    allTeachers: Teacher[];
    currentUser: Teacher;
    permissions: Permission[];
    workflowTemplates: WorkflowTemplate[];
    setWorkflowTemplates: React.Dispatch<React.SetStateAction<WorkflowTemplate[]>>;
    parentQueries: ParentQuery[];
    procurementRequests: ProcurementRequest[];
    observations: Observation[];
    currentTenantId: string;
}

const TaskColumnDisplay: React.FC<{ 
    column: TaskColumn; 
    tasks: TaskCard[];
    onAddTask: (columnId: string) => void;
    onEditTask: (task: TaskCard, columnId: string) => void;
    onDeleteTask: (task: TaskCard, columnId: string) => void;
    onRenameColumn: (columnId: string, newTitle: string) => void;
    onDeleteColumn: (columnId: string) => void;
    onDragStart: (e: React.DragEvent, taskId: string, sourceColumnId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, targetColumnId: string) => void;
    allTeachers: Teacher[];
    permissions: Permission[];
}> = (props) => {
    const { column, tasks, onAddTask, onEditTask, onDeleteTask, onRenameColumn, onDeleteColumn, onDragStart, onDragOver, onDrop, allTeachers, permissions } = props;
    const [isRenaming, setIsRenaming] = useState(false);
    const [title, setTitle] = useState(column.title);

    const handleRename = () => {
        if (title.trim()) {
            onRenameColumn(column.id, title.trim());
        }
        setIsRenaming(false);
    };

    return (
        <div 
            className="w-80 bg-gray-100 dark:bg-slate-800/60 rounded-lg p-3 flex-shrink-0 flex flex-col"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
        >
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
                {isRenaming ? (
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        autoFocus
                        className="font-semibold text-gray-700 dark:text-gray-200 bg-transparent border-b-2 border-brand-primary w-full"
                    />
                ) : (
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">{column.title} ({tasks.length})</h3>
                )}
                {hasPermission(permissions, 'manage:task-columns') && (
                     <div className="flex items-center gap-2">
                        <button onClick={() => setIsRenaming(true)} className="text-gray-400 hover:text-gray-600"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => onDeleteColumn(column.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                )}
            </div>
            <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                {tasks.map(task => (
                    <div key={task.id} draggable={hasPermission(permissions, 'manage:task-cards')} onDragStart={(e) => hasPermission(permissions, 'manage:task-cards') && onDragStart(e, task.id, column.id)}>
                        <TaskCardDisplay 
                            card={task} 
                            onEdit={() => onEditTask(task, column.id)} 
                            onDelete={() => onDeleteTask(task, column.id)}
                            allTeachers={allTeachers}
                            permissions={permissions}
                        />
                    </div>
                ))}
            </div>
            {hasPermission(permissions, 'manage:task-cards') && (
                <button onClick={() => onAddTask(column.id)} className="w-full text-left mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 flex-shrink-0">
                    + Add a card
                </button>
            )}
        </div>
    );
};

const Tasks: React.FC<TasksProps> = (props) => {
    const { boards, setBoards, allTeachers, currentUser, permissions, workflowTemplates, currentTenantId } = props;
    
    const [activeTab, setActiveTab] = useState<'boards' | 'templates'>('boards');

    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [boardToEdit, setBoardToEdit] = useState<TaskBoard | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<{ task: TaskCard, columnId: string } | null>(null);
    const [columnForNewTask, setColumnForNewTask] = useState<string | null>(null);
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<{ task: TaskCard, columnId: string } | null>(null);

    const visibleBoards = useMemo(() => {
        if (hasPermission(permissions, 'manage:task-boards')) return boards;
        return boards.filter(b => b.memberIds.includes(currentUser.id));
    }, [boards, currentUser.id, permissions]);

    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(visibleBoards[0]?.id || null);

    useEffect(() => {
        if (!selectedBoardId && visibleBoards.length > 0) {
            setSelectedBoardId(visibleBoards[0].id);
        } else if (selectedBoardId && !visibleBoards.find(b => b.id === selectedBoardId)) {
            setSelectedBoardId(visibleBoards[0]?.id || null);
        }
    }, [visibleBoards, selectedBoardId]);

    const activeBoard = useMemo(() => boards.find(b => b.id === selectedBoardId), [boards, selectedBoardId]);
    
    const handleSaveBoard = (board: TaskBoard) => {
        setBoards(prev => {
            const exists = prev.some(b => b.id === board.id);
            return exists ? prev.map(b => b.id === board.id ? board : b) : [...prev, board];
        });
        setIsBoardModalOpen(false);
        setBoardToEdit(null);
    };

    const handleAddColumn = () => {
        if (!activeBoard) return;
        const newColumn: TaskColumn = {
            id: `col-${Date.now()}`,
            title: "New Column",
            cardIds: [],
        };
        const updatedBoard = { ...activeBoard, columns: [...activeBoard.columns, newColumn] };
        handleSaveBoard(updatedBoard);
    };

    const handleRenameColumn = (columnId: string, newTitle: string) => {
        if (!activeBoard) return;
        const updatedColumns = activeBoard.columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c);
        handleSaveBoard({ ...activeBoard, columns: updatedColumns });
    };

    const handleDeleteColumn = () => {
        if (!activeBoard || !columnToDelete) return;
        const column = activeBoard.columns.find(c => c.id === columnToDelete);
        if (!column) return;
        
        const taskIdsToDelete = new Set(column.cardIds);
        const updatedTasks = activeBoard.tasks.filter(t => !taskIdsToDelete.has(t.id));
        const updatedColumns = activeBoard.columns.filter(c => c.id !== columnToDelete);

        handleSaveBoard({ ...activeBoard, tasks: updatedTasks, columns: updatedColumns });
        setColumnToDelete(null);
    };

    const handleSaveTask = (task: TaskCard) => {
        if (!activeBoard) return;
        let updatedBoard: TaskBoard;
        if (taskToEdit) {
            updatedBoard = { ...activeBoard, tasks: activeBoard.tasks.map(t => t.id === task.id ? task : t) };
        } else {
            const newCard = { ...task, id: `task-${Date.now()}` };
            updatedBoard = {
                ...activeBoard,
                tasks: [...activeBoard.tasks, newCard],
                columns: activeBoard.columns.map(c => c.id === columnForNewTask ? { ...c, cardIds: [...c.cardIds, newCard.id] } : c)
            };
        }
        handleSaveBoard(updatedBoard);
        setIsTaskModalOpen(false);
        setTaskToEdit(null);
        setColumnForNewTask(null);
    };

    const handleDeleteTask = () => {
        if (!activeBoard || !taskToDelete) return;
        const { task, columnId } = taskToDelete;
        const updatedTasks = activeBoard.tasks.filter(t => t.id !== task.id);
        const updatedColumns = activeBoard.columns.map(c => 
            c.id === columnId 
            ? { ...c, cardIds: c.cardIds.filter(id => id !== task.id) } 
            : c
        );
        handleSaveBoard({ ...activeBoard, tasks: updatedTasks, columns: updatedColumns });
        setTaskToDelete(null);
    };
    
    const handleDragStart = (e: React.DragEvent, taskId: string, sourceColumnId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.setData('sourceColumnId', sourceColumnId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        if (!activeBoard) return;
        const taskId = e.dataTransfer.getData('taskId');
        const sourceColumnId = e.dataTransfer.getData('sourceColumnId');

        if (taskId && sourceColumnId !== targetColumnId) {
            const updatedColumns = activeBoard.columns.map(col => {
                if (col.id === sourceColumnId) {
                    return { ...col, cardIds: col.cardIds.filter(id => id !== taskId) };
                }
                if (col.id === targetColumnId) {
                    return { ...col, cardIds: [...col.cardIds, taskId] };
                }
                return col;
            });
            handleSaveBoard({ ...activeBoard, columns: updatedColumns });
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                <TabButton tabId="boards" label="Boards" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="templates" label="Templates" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            </div>

            {activeTab === 'boards' && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <div className="flex items-center gap-2">
                            <select value={selectedBoardId || ''} onChange={(e) => setSelectedBoardId(e.target.value)} className="w-full sm:w-auto p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                                {visibleBoards.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                            </select>
                            {activeBoard && hasPermission(permissions, 'manage:task-boards') && (
                                <button onClick={() => setBoardToEdit(activeBoard)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><PencilIcon className="w-5 h-5" /></button>
                            )}
                        </div>
                        {hasPermission(permissions, 'manage:task-boards') && (
                            <PrimaryButton onClick={() => { setBoardToEdit(null); setIsBoardModalOpen(true); }}>
                                <PlusIcon className="w-4 h-4 mr-1"/> Create Board
                            </PrimaryButton>
                        )}
                    </div>
                    
                    {activeBoard ? (
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {activeBoard.columns.map(col => (
                                <TaskColumnDisplay 
                                    key={col.id}
                                    column={col}
                                    tasks={col.cardIds.map(id => activeBoard.tasks.find(t => t.id === id)).filter((t): t is TaskCard => !!t)}
                                    onAddTask={(columnId) => { setTaskToEdit(null); setColumnForNewTask(columnId); setIsTaskModalOpen(true); }}
                                    onEditTask={(task, columnId) => { setTaskToEdit({ task, columnId }); setIsTaskModalOpen(true); }}
                                    onDeleteTask={(task, columnId) => setTaskToDelete({ task, columnId })}
                                    onRenameColumn={handleRenameColumn}
                                    onDeleteColumn={(columnId) => setColumnToDelete(columnId)}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    allTeachers={allTeachers.filter(t => activeBoard.memberIds.includes(t.id))}
                                    permissions={permissions}
                                />
                            ))}
                            {hasPermission(permissions, 'manage:task-columns') && (
                                <button onClick={handleAddColumn} className="w-80 bg-gray-200/50 dark:bg-slate-800/40 rounded-lg p-3 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-800 flex-shrink-0">
                                    + Add another column
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            <p>No task boards available.</p>
                            {hasPermission(permissions, 'manage:task-boards') && <p>Click 'Create Board' to get started.</p>}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'templates' && (
                <WorkflowTemplates templates={workflowTemplates} setBoards={setBoards} allTeachers={allTeachers} currentUser={currentUser} currentTenantId={currentTenantId} />
            )}
            
            {isBoardModalOpen && <AddEditBoardModal isOpen={isBoardModalOpen} onClose={() => setIsBoardModalOpen(false)} onSave={handleSaveBoard} existingBoard={boardToEdit} allTeachers={allTeachers} currentTenantId={currentTenantId} />}
            {isTaskModalOpen && activeBoard && <AddEditTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSave={handleSaveTask} existingTask={taskToEdit?.task} boardMembers={allTeachers.filter(t => activeBoard.memberIds.includes(t.id))} boardTasks={activeBoard.tasks} parentQueries={props.parentQueries} procurementRequests={props.procurementRequests} observations={props.observations} />}
            {columnToDelete && <ConfirmationModal isOpen={!!columnToDelete} onClose={() => setColumnToDelete(null)} onConfirm={handleDeleteColumn} title="Delete Column" message="Are you sure you want to delete this column? All tasks within it will also be permanently deleted." />}
            {taskToDelete && <ConfirmationModal isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} onConfirm={handleDeleteTask} title="Delete Task" message={`Are you sure you want to delete the task "${taskToDelete.task.title}"?`} />}
        </div>
    );
};

export default Tasks;
