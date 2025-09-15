import React from 'react';
import type { Teacher, LeavePolicy } from '../types';
import { LeaveType } from '../types';

interface LeaveBalancesProps {
    teachers: Teacher[];
    leavePolicies: LeavePolicy[];
}

const LeaveBalances: React.FC<LeaveBalancesProps> = ({ teachers, leavePolicies }) => {
    
    const leaveTypesInOrder = [LeaveType.Annual, LeaveType.Sick, LeaveType.Maternity, LeaveType.Unpaid];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Staff Leave Balances</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teacher</th>
                                {leaveTypesInOrder.map(type => (
                                    <th key={type} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{type}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                            {teachers.map(teacher => (
                                <tr key={teacher.id}>
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{teacher.fullName}</td>
                                    {leaveTypesInOrder.map(type => (
                                        <td key={type} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {teacher.leaveBalances?.[type]?.toFixed(2) || '0.00'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
            <div className="lg:col-span-1 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Leave Policies</h3>
                <div className="space-y-4">
                    {leavePolicies.map(policy => (
                        <div key={policy.type} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{policy.type} Leave</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <p><strong>Accrual:</strong> {policy.accrualRate} days per {policy.accrualFrequency.replace('ly', '')}</p>
                                <p><strong>Max Balance:</strong> {policy.maxBalance} days</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LeaveBalances;
