import React, { useState, useMemo } from 'react';
import type { Asset, AssetAssignment, Teacher, Permission } from '../types';
import { AssetStatus, AssetType } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import { TableFilterInput, TableFilterSelect } from './FormControls';
import AddEditAssetModal from './AddEditAssetModal';
import AssignAssetModal from './AssignAssetModal';
import ConfirmationModal from './ConfirmationModal';
import { hasPermission } from '../permissions';

interface AssetsProps {
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    assetAssignments: AssetAssignment[];
    setAssetAssignments: React.Dispatch<React.SetStateAction<AssetAssignment[]>>;
    teachers: Teacher[];
    permissions: Permission[];
    logAction: (action: string, details: string) => void;
    currentUser: Teacher;
    currentTenantId: string;
}

type SortableKey = 'name' | 'assetTag' | 'type' | 'status' | 'purchaseDate' | 'assignedTo';

const getStatusColor = (status: AssetStatus) => {
  switch (status) {
    case AssetStatus.Available: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case AssetStatus.Assigned: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case AssetStatus.InRepair: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case AssetStatus.Retired: return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const Assets: React.FC<AssetsProps> = (props) => {
    const { assets, setAssets, assetAssignments, setAssetAssignments, teachers, permissions, currentTenantId } = props;
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
    const [assetToAssign, setAssetToAssign] = useState<Asset | null>(null);
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

    const [filters, setFilters] = useState({ name: '', assetTag: '', type: 'all', status: 'all' });
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey, direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);

    const assetWithAssignment = useMemo(() => {
        const assignmentMap = new Map<string, AssetAssignment>();
        assetAssignments.filter(a => !a.returnedDate).forEach(a => assignmentMap.set(a.assetId, a));
        
        return assets.map(asset => {
            const assignment = assignmentMap.get(asset.id);
            return {
                ...asset,
                assignedToId: assignment?.teacherId,
                assignedToName: assignment ? teacherMap.get(assignment.teacherId) : undefined,
            };
        });
    }, [assets, assetAssignments, teacherMap]);

    const sortedAndFilteredAssets = useMemo(() => {
        let filtered = assetWithAssignment.filter(asset => 
            (asset.name.toLowerCase().includes(filters.name.toLowerCase())) &&
            (asset.assetTag.toLowerCase().includes(filters.assetTag.toLowerCase())) &&
            (filters.type === 'all' || asset.type === filters.type) &&
            (filters.status === 'all' || asset.status === filters.status)
        );

        if (sortConfig) {
            filtered.sort((a, b) => {
                const aValue = (sortConfig.key === 'assignedTo') ? (a.assignedToName || '') : a[sortConfig.key];
                const bValue = (sortConfig.key === 'assignedTo') ? (b.assignedToName || '') : b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [assetWithAssignment, filters, sortConfig]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

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

    const handleSaveAsset = (asset: Asset) => {
        if (assetToEdit) {
            setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
        } else {
            setAssets(prev => [...prev, asset]);
        }
        setIsAddEditModalOpen(false);
        setAssetToEdit(null);
    };

    const handleDeleteAsset = () => {
        if (assetToDelete) {
            setAssets(prev => prev.filter(a => a.id !== assetToDelete.id));
            setAssetToDelete(null);
        }
    };
    
    const canManage = hasPermission(permissions, 'manage:assets');

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Asset Inventory</h3>
                    {canManage && (
                        <button onClick={() => { setAssetToEdit(null); setIsAddEditModalOpen(true); }} className="bg-brand-primary text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium">
                            <PlusIcon className="w-4 h-4" /> Add Asset
                        </button>
                    )}
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th onClick={() => requestSort('name')} className="px-4 py-2 cursor-pointer">Name {getSortIcon('name')}</th>
                                <th onClick={() => requestSort('assetTag')} className="px-4 py-2 cursor-pointer">Tag {getSortIcon('assetTag')}</th>
                                <th onClick={() => requestSort('type')} className="px-4 py-2 cursor-pointer">Type {getSortIcon('type')}</th>
                                <th onClick={() => requestSort('status')} className="px-4 py-2 cursor-pointer">Status {getSortIcon('status')}</th>
                                <th onClick={() => requestSort('purchaseDate')} className="px-4 py-2 cursor-pointer">Purchase Date {getSortIcon('purchaseDate')}</th>
                                <th onClick={() => requestSort('assignedTo')} className="px-4 py-2 cursor-pointer">Assigned To {getSortIcon('assignedTo')}</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                             <tr>
                                <th className="px-2 py-1"><TableFilterInput name="name" value={filters.name} onChange={handleFilterChange} /></th>
                                <th className="px-2 py-1"><TableFilterInput name="assetTag" value={filters.assetTag} onChange={handleFilterChange} /></th>
                                <th className="px-2 py-1"><TableFilterSelect name="type" value={filters.type} onChange={handleFilterChange}><option value="all">All</option>{Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}</TableFilterSelect></th>
                                <th className="px-2 py-1"><TableFilterSelect name="status" value={filters.status} onChange={handleFilterChange}><option value="all">All</option>{Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}</TableFilterSelect></th>
                                <th className="px-2 py-1"></th>
                                <th className="px-2 py-1"></th>
                                <th className="px-2 py-1"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {sortedAndFilteredAssets.map(asset => (
                                <tr key={asset.id}>
                                    <td className="px-4 py-2 font-medium">{asset.name}</td>
                                    <td className="px-4 py-2 font-mono">{asset.assetTag}</td>
                                    <td className="px-4 py-2">{asset.type}</td>
                                    <td className="px-4 py-2"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(asset.status)}`}>{asset.status}</span></td>
                                    <td className="px-4 py-2">{asset.purchaseDate}</td>
                                    <td className="px-4 py-2">{asset.assignedToName || '-'}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            {canManage && asset.status === AssetStatus.Available && (
                                                <button onClick={() => { setAssetToAssign(asset); setIsAssignModalOpen(true); }} className="text-sm font-semibold text-brand-primary">Assign</button>
                                            )}
                                            {canManage && (<>
                                                <button onClick={() => { setAssetToEdit(asset); setIsAddEditModalOpen(true); }}><PencilIcon className="w-4 h-4 text-brand-accent"/></button>
                                                <button onClick={() => setAssetToDelete(asset)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                                            </>)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddEditModalOpen && canManage && (
                <AddEditAssetModal 
                    isOpen={isAddEditModalOpen}
                    onClose={() => setIsAddEditModalOpen(false)}
                    onSave={handleSaveAsset}
                    existingAsset={assetToEdit}
                    currentTenantId={currentTenantId}
                />
            )}
            {isAssignModalOpen && canManage && assetToAssign && (
                <AssignAssetModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    asset={assetToAssign}
                    teachers={teachers}
                    setAssets={setAssets}
                    setAssetAssignments={setAssetAssignments}
                    currentTenantId={currentTenantId}
                />
            )}
             {assetToDelete && canManage && (
                <ConfirmationModal 
                    isOpen={!!assetToDelete}
                    onClose={() => setAssetToDelete(null)}
                    onConfirm={handleDeleteAsset}
                    title="Delete Asset"
                    message={`Are you sure you want to delete "${assetToDelete.name}"? This action cannot be undone.`}
                />
            )}
        </>
    );
};

export default Assets;
