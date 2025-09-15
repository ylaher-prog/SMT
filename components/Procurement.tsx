
import React, { useMemo, useState } from 'react';
// FIX: Import AcademicStructure type to be added to props.
import type { Teacher, ProcurementRequest, Permission, Vendor, Budget, AcademicStructure } from '../types';
import TabButton from './TabButton';
import { PlusIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import { TableFilterInput } from './FormControls';
import AddEditProcurementRequestModal from './AddEditProcurementRequestModal';
import ProcurementDetailsModal from './ProcurementDetailsModal';
import ProcurementSetup from './ProcurementSetup';

/*
-- SQL for Supabase Setup
-- Run these commands in the Supabase SQL Editor.

-- 1. Create vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT
);

-- 2. Create budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL
);

-- 3. Alter the main procurement_requests table
ALTER TABLE public.procurement_requests
ADD COLUMN current_stage TEXT NOT NULL DEFAULT 'Submitted',
ADD COLUMN budget_id UUID REFERENCES public.budgets(id),
ADD COLUMN vendor_id UUID REFERENCES public.vendors(id),
ADD COLUMN attachments JSONB; -- Store an array of file objects

-- 4. Create the approval history table
CREATE TABLE public.procurement_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  approver_id UUID REFERENCES public.teachers(id),
  status TEXT NOT NULL, -- 'Approved', 'Denied', 'Pending'
  "timestamp" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  comments TEXT
);

-- Note: The `approvalHistory` from the mock data would be stored in this new table.
-- The local state management mimics this relational structure.
*/


interface ProcurementProps {
    teachers: Teacher[];
    procurementRequests: ProcurementRequest[];
    setProcurementRequests: React.Dispatch<React.SetStateAction<ProcurementRequest[]>>;
    currentAcademicYear: string;
    permissions: Permission[];
    logAction: (action: string, details: string) => void;
    currentUser: Teacher;
    vendors: Vendor[];
    setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
    budgets: Budget[];
    setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
    // FIX: Add academicStructure to props to be passed down to child components.
    academicStructure: AcademicStructure;
    currentTenantId: string;
}

type SortableKey = 'requester' | 'item' | 'amount' | 'requestDate' | 'stage';
type ProcurementTab = 'list' | 'setup';

const Procurement: React.FC<ProcurementProps> = (props) => {
    const { teachers, procurementRequests, setProcurementRequests, currentTenantId } = props;
    const [activeTab, setActiveTab] = useState<ProcurementTab>('list');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [requestToReview, setRequestToReview] = useState<ProcurementRequest | null>(null);
    
    const [filters, setFilters] = useState({ stage: '', requester: '', item: '' });
    const [sortConfig, setSortConfig] = useState<{key: SortableKey, direction: 'ascending' | 'descending'}>({key: 'requestDate', direction: 'descending'});

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const sortedAndFilteredRequests = useMemo(() => {
        let filtered = procurementRequests.filter(req => {
            const teacherName = teacherMap.get(req.requesterId) || '';
            return (
                // FIX: Property 'currentStage' does not exist on type 'ProcurementRequest'. Replaced with 'status'.
                (filters.stage === '' || req.status.toLowerCase().includes(filters.stage.toLowerCase())) &&
                (teacherName.toLowerCase().includes(filters.requester.toLowerCase())) &&
                (req.itemDescription.toLowerCase().includes(filters.item.toLowerCase()))
            );
        });
        
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if (sortConfig.key === 'requester') { aValue = teacherMap.get(a.requesterId) || ''; bValue = teacherMap.get(b.requesterId) || ''; }
                else if (sortConfig.key === 'item') { aValue = a.itemDescription; bValue = b.itemDescription; }
                // FIX: Property 'currentStage' does not exist on type 'ProcurementRequest'. Replaced with 'status'.
                else if (sortConfig.key === 'stage') { aValue = a.status; bValue = b.status; }
                else { aValue = a[sortConfig.key]; bValue = b[sortConfig.key]; }
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [procurementRequests, filters, sortConfig, teacherMap]);
    
    const requestSort = (key: SortableKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKey) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
    };
    
    const renderList = () => (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-4 sm:mb-0">Procurement Requests</h3>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    <span>New Request</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('requester')}>Requester {getSortIcon('requester')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('item')}>Item {getSortIcon('item')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('amount')}>Amount {getSortIcon('amount')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('requestDate')}>Date {getSortIcon('requestDate')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('stage')}>Status {getSortIcon('stage')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                        <tr>
                            <th className="px-4 py-2"><TableFilterInput type="text" name="requester" placeholder="Filter..." value={filters.requester} onChange={handleFilterChange} /></th>
                            <th className="px-4 py-2"><TableFilterInput type="text" name="item" placeholder="Filter..." value={filters.item} onChange={handleFilterChange} /></th>
                            <th className="px-4 py-2"></th>
                            <th className="px-4 py-2"></th>
                            <th className="px-4 py-2"><TableFilterInput type="text" name="stage" placeholder="Filter..." value={filters.stage} onChange={handleFilterChange} /></th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                        {sortedAndFilteredRequests.map((req) => (
                            <tr key={req.id}>
                                <td className="px-6 py-4">{teacherMap.get(req.requesterId)}</td>
                                <td className="px-6 py-4">{req.itemDescription}</td>
                                <td className="px-6 py-4">R {req.amount.toFixed(2)}</td>
                                <td className="px-6 py-4">{new Date(req.requestDate).toLocaleDateString()}</td>
                                {/* FIX: Property 'currentStage' does not exist on type 'ProcurementRequest'. Replaced with 'status'. */}
                                <td className="px-6 py-4">{req.status}</td>
                                <td className="px-6 py-4"><button onClick={() => setRequestToReview(req)} className="font-semibold text-brand-primary">Review</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-6">
            <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                <TabButton tabId="list" label="Request List" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="setup" label="Budgets & Vendors" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            </div>
            {activeTab === 'list' ? renderList() : <ProcurementSetup {...props} />}

            {isAddModalOpen && <AddEditProcurementRequestModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} currentTenantId={currentTenantId} {...props} />}
            {requestToReview && <ProcurementDetailsModal isOpen={!!requestToReview} onClose={() => setRequestToReview(null)} request={requestToReview} {...props} />}
        </div>
    );
};

export default Procurement;
