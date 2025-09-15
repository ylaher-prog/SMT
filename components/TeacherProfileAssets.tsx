import React, { useMemo } from 'react';
import type { Teacher, Asset, AssetAssignment } from '../types';
import { AssetStatus } from '../types';

interface TeacherProfileAssetsProps {
    teacher: Teacher;
    assets: Asset[];
    assetAssignments: AssetAssignment[];
    setAssetAssignments: React.Dispatch<React.SetStateAction<AssetAssignment[]>>;
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

const TeacherProfileAssets: React.FC<TeacherProfileAssetsProps> = ({ teacher, assets, assetAssignments, setAssetAssignments, setAssets }) => {
    
    const assetMap = useMemo(() => new Map(assets.map(a => [a.id, a])), [assets]);

    const assignedToTeacher = useMemo(() => {
        return assetAssignments
            .filter(assign => assign.teacherId === teacher.id && !assign.returnedDate)
            .map(assign => {
                const asset = assetMap.get(assign.assetId);
                return asset ? { ...assign, asset } : null;
            })
            .filter((item): item is (AssetAssignment & { asset: Asset }) => !!item)
            .sort((a, b) => a.assignedDate.localeCompare(b.assignedDate));
    }, [assetAssignments, teacher.id, assetMap]);

    const handleReturnAsset = (assignment: AssetAssignment & { asset: Asset }) => {
        if (window.confirm(`Are you sure you want to mark "${assignment.asset.name}" as returned?`)) {
            // Update the assignment with a returned date
            setAssetAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, returnedDate: new Date().toISOString().split('T')[0] } : a));
            // Update the asset's status to Available
            setAssets(prev => prev.map(a => a.id === assignment.assetId ? { ...a, status: AssetStatus.Available } : a));
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Assigned Assets</h3>
            {assignedToTeacher.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset Tag</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned On</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {assignedToTeacher.map(item => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 font-medium">{item.asset.name}</td>
                                    <td className="px-4 py-3 text-sm font-mono">{item.asset.assetTag}</td>
                                    <td className="px-4 py-3 text-sm">{item.asset.type}</td>
                                    <td className="px-4 py-3 text-sm">{item.assignedDate}</td>
                                    <td className="px-4 py-3">
                                        <button 
                                            onClick={() => handleReturnAsset(item)}
                                            className="text-sm font-semibold text-brand-primary hover:underline"
                                        >
                                            Mark as Returned
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">This teacher has no assets currently assigned.</p>
            )}
        </div>
    );
};

export default TeacherProfileAssets;
