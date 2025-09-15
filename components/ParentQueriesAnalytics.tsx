import React, { useMemo } from 'react';
import type { ParentQuery, Teacher } from '../types';
import { MonitoringStatus } from '../types';
import KpiCard from './KpiCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from './Icons';

interface ParentQueriesAnalyticsProps {
    queries: ParentQuery[];
    teachers: Teacher[];
}

const COLORS = ['#8D1D4B', '#AD9040', '#0B2042', '#4B5563', '#F97316'];

const ParentQueriesAnalytics: React.FC<ParentQueriesAnalyticsProps> = ({ queries, teachers }) => {
    
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);

    const analyticsData = useMemo(() => {
        let totalResolutionMillis = 0;
        let resolvedCount = 0;
        let slaBreaches = 0;
        
        queries.forEach(q => {
            if (q.status === MonitoringStatus.Resolved) {
                const resolutionEntry = q.communicationLog.find(log => log.entry.includes('Resolved'));
                if (resolutionEntry) {
                    const created = new Date(q.creationDate).getTime();
                    const resolved = new Date(resolutionEntry.timestamp).getTime();
                    totalResolutionMillis += (resolved - created);
                    resolvedCount++;
                }
            }
            if (q.status !== MonitoringStatus.Resolved && new Date(q.slaDeadline) < new Date()) {
                slaBreaches++;
            }
        });
        
        const avgResolutionHours = resolvedCount > 0 ? (totalResolutionMillis / resolvedCount) / (1000 * 60 * 60) : 0;
        const openQueries = queries.filter(q => q.status !== MonitoringStatus.Resolved).length;

        const byCategory = queries.reduce((acc, q) => {
            acc[q.category] = (acc[q.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const byTeacher = queries.reduce((acc, q) => {
            const name = teacherMap.get(q.currentAssigneeId) || 'Unassigned';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            avgResolutionHours,
            openQueries,
            slaBreaches,
            byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
            byTeacher: Object.entries(byTeacher).map(([name, queries]) => ({ name, queries })).sort((a, b) => b.queries - a.queries).slice(0, 10),
        };
    }, [queries, teacherMap]);
    
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Avg. Resolution Time" value={`${analyticsData.avgResolutionHours.toFixed(1)}h`} icon={<ClockIcon />} />
                <KpiCard title="Open Queries" value={analyticsData.openQueries} icon={<ExclamationTriangleIcon />} />
                <KpiCard title="SLA Breaches" value={analyticsData.slaBreaches} trend="bad" icon={<CheckCircleIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Query Load by Teacher (Top 10)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.byTeacher} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-700" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600" />
                            <Bar dataKey="queries" fill="#8D1D4B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Queries by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={analyticsData.byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                                {analyticsData.byCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{fontSize: "14px"}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ParentQueriesAnalytics;