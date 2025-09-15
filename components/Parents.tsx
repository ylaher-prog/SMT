
import React, { useState, useMemo } from 'react';
import type { Teacher, ParentQuery, Permission, ParentQuerySlaSetting } from '../types';
import { MonitoringStatus, ParentQueryCategory } from '../types';
import StatusTag from './StatusTag';
import { PlusIcon, PencilIcon, TrashIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import AddEditParentQueryModal from './AddEditParentQueryModal';
import ConfirmationModal from './ConfirmationModal';
import { TableFilterInput, TableFilterSelect } from './FormControls';
import TabButton from './TabButton';
import SlaTimer from './SlaTimer';
import ParentQueriesAnalytics from './ParentQueriesAnalytics';

/*
-- SQL for Supabase Setup
-- Run these commands in the Supabase SQL Editor.

-- 1. Create a table for SLA settings
CREATE TABLE public.parent_query_sla_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT UNIQUE NOT NULL, -- e.g., 'Academic', 'Technical'
  hours INT NOT NULL
);

-- Example: Insert default settings
INSERT INTO public.parent_query_sla_settings (category, hours)
VALUES
  ('Academic', 24),
  ('Behavioral', 24),
  ('Administrative', 48),
  ('Technical', 72),
  ('Other', 48);

-- 2. Create a table for the communication log
CREATE TABLE public.parent_query_comms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES public.parent_queries(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.teachers(id),
  user_name TEXT,
  entry TEXT NOT NULL
);


-- 3. Alter the main parent_queries table
ALTER TABLE public.parent_queries
ADD COLUMN current_assignee_id UUID REFERENCES public.teachers(id),
ADD COLUMN sla_deadline TIMESTAMPTZ;

-- Note: You would remove communicationLog from the parent_queries table if it exists as a JSONB column
-- and instead join with the new comms_log table. For this mock setup, we'll keep it in the main object.
*/


interface ParentsProps {
    teachers: Teacher[];
    queries: ParentQuery[];
    setQueries: React.Dispatch<React.SetStateAction<ParentQuery[]>>;
    currentAcademicYear: string;
    permissions: Permission[];
    logAction: (action: string, details: string) => void;
    sendNotification: (userId: string, type: 'newParentQuery' | 'parentQueryUpdate' | 'parentQueryStatusUpdateToParent', data: any) => void;
    slaSettings: ParentQuerySlaSetting[];
    currentUser: Teacher;
    currentTenantId: string;
}

type SortableKey = 'parent' | 'teacher' | 'date' | 'category' | 'status' | 'sla';
type ParentsTab = 'list' | 'analytics';

const Parents: React.FC<ParentsProps> = (props) => {
    const { teachers, queries, setQueries, currentAcademicYear, permissions, logAction, sendNotification, slaSettings, currentUser, currentTenantId } = props;
    const [activeTab, setActiveTab] = useState<ParentsTab>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [queryToEdit, setQueryToEdit] = useState<ParentQuery | null>(null);
    const [queryToDelete, setQueryToDelete] = useState<ParentQuery | null>(null);
    
    const [filters, setFilters] = useState({ status: 'all', category: 'all', parentStudent: '', teacher: '', querySnippet: '' });
    const [sortConfig, setSortConfig] = useState<{key: SortableKey, direction: 'ascending' | 'descending'}>({key: 'date', direction: 'descending'});

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const sortedAndFilteredQueries = useMemo(() => {
        let filtered = queries.filter(q => {
            const assigneeName = teacherMap.get(q.currentAssigneeId) || '';
            return (
                (filters.status === 'all' || q.status === filters.status) &&
                (filters.category === 'all' || q.category === filters.category) &&
                (`${q.parentName} ${q.studentName}`.toLowerCase().includes(filters.parentStudent.toLowerCase())) &&
                (assigneeName.toLowerCase().includes(filters.teacher.toLowerCase())) &&
                (q.queryDetails.toLowerCase().includes(filters.querySnippet.toLowerCase()))
            )
        });
        
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if (sortConfig.key === 'parent') { aValue = a.parentName; bValue = b.parentName; }
                else if (sortConfig.key === 'teacher') { aValue = teacherMap.get(a.currentAssigneeId) || ''; bValue = teacherMap.get(b.currentAssigneeId) || ''; }
                else if (sortConfig.key === 'date') { aValue = a.creationDate; bValue = b.creationDate; }
                else if (sortConfig.key === 'sla') { aValue = new Date(a.slaDeadline).getTime(); bValue = new Date(b.slaDeadline).getTime(); }
                else { aValue = a[sortConfig.key]; bValue = b[sortConfig.key]; }
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [queries, filters, sortConfig, teacherMap]);

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

    const handleAdd = () => {
        setQueryToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (query: ParentQuery) => {
        setQueryToEdit(query);
        setIsModalOpen(true);
    };

    const handleDelete = () => {
        if (queryToDelete) {
            setQueries(prev => prev.filter(q => q.id !== queryToDelete.id));
            setQueryToDelete(null);
        }
    };
    
    return (
        <>
            <div className="space-y-6">
                 <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                    <TabButton tabId="list" label="Query List" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="analytics" label="Analytics" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                </div>
                
                {activeTab === 'list' && (
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-4 sm:mb-0">Parent Queries</h3>
                            <button onClick={handleAdd} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors">
                                <PlusIcon className="w-4 h-4" />
                                <span>Log Query</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('parent')}>Parent / Student {getSortIcon('parent')}</div></th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('teacher')}>Assignee {getSortIcon('teacher')}</div></th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('sla')}>SLA Timer {getSortIcon('sla')}</div></th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('category')}>Category {getSortIcon('category')}</div></th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Query</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</div></th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                    <tr>
                                        <th className="px-4 py-2"><TableFilterInput type="text" name="parentStudent" placeholder="Filter..." value={filters.parentStudent} onChange={handleFilterChange} /></th>
                                        <th className="px-4 py-2"><TableFilterInput type="text" name="teacher" placeholder="Filter..." value={filters.teacher} onChange={handleFilterChange} /></th>
                                        <th className="px-4 py-2"></th>
                                        <th className="px-4 py-2"><TableFilterSelect name="category" value={filters.category} onChange={handleFilterChange}><option value="all">All</option>{Object.values(ParentQueryCategory).map(c => <option key={c} value={c}>{c}</option>)}</TableFilterSelect></th>
                                        <th className="px-4 py-2"><TableFilterInput type="text" name="querySnippet" placeholder="Filter..." value={filters.querySnippet} onChange={handleFilterChange} /></th>
                                        <th className="px-4 py-2"><TableFilterSelect name="status" value={filters.status} onChange={handleFilterChange}><option value="all">All</option>{Object.values(MonitoringStatus).map(s => <option key={s} value={s}>{s}</option>)}</TableFilterSelect></th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                                    {sortedAndFilteredQueries.map((q) => (
                                        <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-gray-200">{q.parentName}</div><div className="text-sm text-gray-500 dark:text-gray-400">{q.studentName}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{teacherMap.get(q.currentAssigneeId)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><SlaTimer deadline={q.slaDeadline} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{q.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={q.queryDetails}>{q.queryDetails}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><StatusTag status={q.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center space-x-3"><button onClick={() => handleEdit(q)} className="text-brand-accent hover:text-amber-700"><PencilIcon className="h-5 w-5"/></button><button onClick={() => setQueryToDelete(q)} className="text-red-600 hover:text-red-800"><TrashIcon className="h-5 w-5"/></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {sortedAndFilteredQueries.length === 0 && (<div className="text-center py-10 text-gray-500 dark:text-gray-400">No parent queries match the current filters.</div>)}
                        </div>
                    </div>
                )}
                {activeTab === 'analytics' && (
                    <ParentQueriesAnalytics queries={queries} teachers={teachers} />
                )}
            </div>
            
            {isModalOpen && (
                <AddEditParentQueryModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    setQueries={setQueries}
                    existingQuery={queryToEdit}
                    teachers={teachers}
                    currentAcademicYear={currentAcademicYear}
                    sendNotification={sendNotification}
                    logAction={logAction}
                    slaSettings={slaSettings}
                    currentUser={currentUser}
                    currentTenantId={currentTenantId}
                />
            )}
            {queryToDelete && (
                <ConfirmationModal 
                    isOpen={!!queryToDelete}
                    onClose={() => setQueryToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Query"
                    message={`Are you sure you want to delete the query from ${queryToDelete.parentName}?`}
                />
            )}
        </>
    );
};

export default Parents;
