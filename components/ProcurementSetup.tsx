import React, { useMemo } from 'react';
import type { Vendor, Budget, ProcurementRequest } from '../types';
// FIX: Import RequestStatus to correctly handle the 'status' field.
import { RequestStatus } from '../types';
import { TrashIcon, PencilIcon, PlusIcon } from './Icons';

interface ProcurementSetupProps {
    vendors: Vendor[];
    setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
    budgets: Budget[];
    setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
    procurementRequests: ProcurementRequest[];
}

const ProcurementSetup: React.FC<ProcurementSetupProps> = ({ vendors, setVendors, budgets, setBudgets, procurementRequests }) => {

    const budgetUsage = useMemo(() => {
        const usageMap = new Map<string, number>();
        procurementRequests.forEach(req => {
            // FIX: Property 'currentStage' does not exist on type 'ProcurementRequest'. Replaced with 'status'.
            if (req.status !== RequestStatus.Denied) {
                const current = usageMap.get(req.budgetId) || 0;
                usageMap.set(req.budgetId, current + req.amount);
            }
        });
        return usageMap;
    }, [procurementRequests]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-4">Vendor Management</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                         <thead className="bg-gray-50 dark:bg-slate-700/50"><tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Contact</th><th className="px-4 py-2 text-left">Actions</th></tr></thead>
                         <tbody>
                            {vendors.map(v => (
                                <tr key={v.id} className="border-b dark:border-slate-700"><td className="px-4 py-2">{v.name}</td><td className="px-4 py-2">{v.contactPerson}<br/>{v.email}</td><td className="px-4 py-2"><div className="flex gap-2"><button><PencilIcon className="w-4 h-4 text-brand-accent"/></button><button><TrashIcon className="w-4 h-4 text-red-500"/></button></div></td></tr>
                            ))}
                         </tbody>
                    </table>
                </div>
                 <button className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-primary"><PlusIcon className="w-4 h-4"/> Add Vendor</button>
            </div>
             <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-4">Budget Management</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                         <thead className="bg-gray-50 dark:bg-slate-700/50"><tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Amount</th><th className="px-4 py-2 text-left">Spent</th><th className="px-4 py-2 text-left">Remaining</th><th className="px-4 py-2 text-left">Actions</th></tr></thead>
                         <tbody>
                            {budgets.map(b => {
                                const spent = budgetUsage.get(b.id) || 0;
                                const remaining = b.totalAmount - spent;
                                return (
                                <tr key={b.id} className="border-b dark:border-slate-700">
                                    <td className="px-4 py-2">{b.name}</td>
                                    <td className="px-4 py-2">R {b.totalAmount.toFixed(2)}</td>
                                    <td className="px-4 py-2">R {spent.toFixed(2)}</td>
                                    <td className="px-4 py-2 font-semibold">R {remaining.toFixed(2)}</td>
                                    <td className="px-4 py-2"><div className="flex gap-2"><button><PencilIcon className="w-4 h-4 text-brand-accent"/></button><button><TrashIcon className="w-4 h-4 text-red-500"/></button></div></td>
                                </tr>
                            )})}
                         </tbody>
                    </table>
                </div>
                <button className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-primary"><PlusIcon className="w-4 h-4"/> Add Budget</button>
            </div>
        </div>
    );
};

export default ProcurementSetup;