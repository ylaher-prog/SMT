import React from 'react';
import type { AuditLog } from '../types';

interface TeacherProfileAuditProps {
    auditLog: AuditLog[];
}

const TeacherProfileAudit: React.FC<TeacherProfileAuditProps> = ({ auditLog }) => {
    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Audit Trail</h3>
            {auditLog.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                            {auditLog.map(log => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">{log.action}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate" title={log.details}>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No audit trail entries found for this teacher.</p>
            )}
        </div>
    );
};

export default TeacherProfileAudit;
