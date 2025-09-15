import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KpiCard from './KpiCard';
import type { Teacher, TeacherWorkload, PhaseStructure, Permission, ClassGroup, TeacherAllocation, Page, AcademicStructure, CpdCourse, TeacherCpdRecord } from '../types';
import { EmploymentStatus } from '../types';
import { UserGroupIcon, ClockIcon, ExclamationTriangleIcon, ShieldCheckIcon } from './Icons';
import { supabase } from '../lib/supabase';
import CpdExpiryWidget from './CpdExpiryWidget';

/*
-- In Supabase SQL Editor, create these functions:

CREATE OR REPLACE FUNCTION get_kpi_summary(p_phase_id TEXT DEFAULT NULL, p_curriculum TEXT DEFAULT NULL, p_mode TEXT DEFAULT NULL)
RETURNS TABLE(active_teachers_count BIGINT, total_learners_count BIGINT, overloaded_staff_count BIGINT) AS $$
BEGIN
    -- NOTE: This is a simplified query for demonstration.
    -- A real implementation would require more complex logic to filter teachers by phase/curriculum/mode
    -- and to accurately calculate workload based on the application's logic.
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM teachers WHERE employment_status != 'On Leave') AS active_teachers_count,
        (SELECT COALESCE(SUM(learner_count), 0) FROM class_groups) AS total_learners_count,
        -- Overloaded count is a complex calculation, here's a placeholder returning a random number.
        (SELECT COUNT(*) FROM teachers WHERE employment_status = 'Permanent' AND random() < 0.2) AS overloaded_staff_count;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_kpi_trends(p_metric_name TEXT)
RETURNS TABLE(metric_date DATE, metric_value NUMERIC) AS $$
BEGIN
    -- This function assumes a 'daily_metrics' table exists with historical data.
    -- For demonstration, it returns dummy trend data.
    RETURN QUERY
    SELECT g.day::date as metric_date,
           CASE
               WHEN p_metric_name = 'active_teachers' THEN (random() * 2 + 48)::numeric
               WHEN p_metric_name = 'total_learners' THEN (random() * 50 + 1200)::numeric
               WHEN p_metric_name = 'overloaded_staff' THEN (random() * 3 + 2)::numeric
               ELSE 0::numeric
           END as metric_value
    FROM generate_series(NOW() - interval '29 day', NOW(), '1 day') as g(day);
END;
$$ LANGUAGE plpgsql;

*/

interface DashboardProps {
    teachers: Teacher[];
    workloads: Map<string, TeacherWorkload>;
    phaseStructures: PhaseStructure[];
    permissions: Permission[];
    sendNotification: (userId: string, type: 'slaBreach', data: any) => void;
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    onKpiClick: (page: Page, filters: Record<string, any>) => void;
    selectedPhaseId: string;
    selectedCurriculum: string;
    selectedMode: string;
    academicStructure: AcademicStructure;
    cpdCourses: CpdCourse[];
    teacherCpdRecords: TeacherCpdRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ teachers, workloads, sendNotification, onKpiClick, selectedPhaseId, selectedCurriculum, selectedMode, academicStructure, cpdCourses, teacherCpdRecords }) => {
    
    const curriculumName = useMemo(() => {
        if (selectedCurriculum === 'all') return null;
        const curriculum = academicStructure.curricula.find(c => c.id === selectedCurriculum);
        return curriculum ? curriculum.name : null;
    }, [selectedCurriculum, academicStructure.curricula]);
    
    const filters = useMemo(() => ({
        p_phase_id: selectedPhaseId === 'all' ? null : selectedPhaseId,
        p_curriculum: curriculumName,
        p_mode: selectedMode === 'all' ? null : selectedMode
    }), [selectedPhaseId, curriculumName, selectedMode]);

    const { data: kpiData, isLoading: kpiLoading } = useQuery({
        queryKey: ['kpiSummary', filters],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_kpi_summary', filters);
            if (error) throw new Error(error.message);
            if (!data || data.length === 0) {
                return { active_teachers_count: 0, total_learners_count: 0, overloaded_staff_count: 0 };
            }
            return data[0];
        },
        initialData: { active_teachers_count: 0, total_learners_count: 0, overloaded_staff_count: 0 },
    });
    
    const { data: teacherTrend } = useQuery({
        queryKey: ['kpiTrend', 'active_teachers', filters],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_kpi_trends', { p_metric_name: 'active_teachers' });
            if (error) throw new Error(error.message);
            if (!data) return [];
            return data.map(d => ({ date: d.metric_date, value: Number(d.metric_value) }));
        },
        initialData: [],
    });

    const { data: learnerTrend } = useQuery({
        queryKey: ['kpiTrend', 'total_learners', filters],
        queryFn: async () => {
             const { data, error } = await supabase.rpc('get_kpi_trends', { p_metric_name: 'total_learners' });
            if (error) throw new Error(error.message);
            if (!data) return [];
            return data.map(d => ({ date: d.metric_date, value: Number(d.metric_value) }));
        },
        initialData: [],
    });

    const { data: overloadedTrend } = useQuery({
        queryKey: ['kpiTrend', 'overloaded_staff', filters],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_kpi_trends', { p_metric_name: 'overloaded_staff' });
            if (error) throw new Error(error.message);
            if (!data) return [];
            return data.map(d => ({ date: d.metric_date, value: Number(d.metric_value) }));
        },
        initialData: [],
    });


    const workloadData = useMemo(() => teachers
        .filter(t => t.employmentStatus !== EmploymentStatus.OnLeave)
        .map(t => {
            const workload = workloads.get(t.id);
            return {
                name: t.fullName.split(' ')[0],
                'Periods': workload?.totalPeriods || 0,
                'Learners': workload?.totalLearners || 0,
            }
        })
    , [teachers, workloads]);
    
    const statusData = useMemo(() => {
        const counts = teachers.reduce((acc, teacher) => {
            acc[teacher.employmentStatus] = (acc[teacher.employmentStatus] || 0) + 1;
            return acc;
        }, {} as Record<EmploymentStatus, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [teachers]);
    
    const handleCheckSLA = () => {
        let alertsSent = 0;
        teachers.forEach(teacher => {
            const breaches: string[] = [];
            if (teacher.slas.messageResponse > 24) breaches.push(`Message Response Time (${teacher.slas.messageResponse}h)`);
            if (teacher.slas.markingTurnaround > 72) breaches.push(`Marking Turnaround (${teacher.slas.markingTurnaround}h)`);
            
            if (breaches.length > 0) {
                sendNotification(teacher.id, 'slaBreach', { teacherName: teacher.fullName, breaches });
                alertsSent++;
            }
        });
        alert(`${alertsSent} SLA breach notifications sent.`);
    };

    const COLORS = ['#8D1D4B', '#AD9040', '#0B2042', '#4B5563', '#F97316'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Active Teachers" value={kpiData.active_teachers_count} icon={<UserGroupIcon />} iconBgColor="bg-sky-100 dark:bg-sky-900/50" iconTextColor="text-sky-500 dark:text-sky-400" isLoading={kpiLoading} sparklineData={teacherTrend} onClick={() => onKpiClick('academic-team', { status: EmploymentStatus.Permanent })}/>
                <KpiCard title="Total Learners" value={kpiData.total_learners_count.toLocaleString()} icon={<ClockIcon />} iconBgColor="bg-indigo-100 dark:bg-indigo-900/50" iconTextColor="text-indigo-500 dark:text-indigo-400" isLoading={kpiLoading} sparklineData={learnerTrend} />
                <KpiCard title="Overloaded Staff" value={kpiData.overloaded_staff_count} icon={<ExclamationTriangleIcon />} trend="bad" iconBgColor="bg-amber-100 dark:bg-amber-900/50" iconTextColor="text-amber-500 dark:text-amber-400" isLoading={kpiLoading} sparklineData={overloadedTrend} onClick={() => onKpiClick('academic-team', { workload: 'overloaded' })} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Teacher Workload Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={workloadData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-700" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} className="dark:text-gray-400" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8D1D4B" tick={{ fontSize: 12, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} className="dark:text-gray-400" />
                            <YAxis yAxisId="right" orientation="right" stroke="#AD9040" tick={{ fontSize: 12, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} className="dark:text-gray-400" />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                }} 
                                wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600"
                            />
                            <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                            <Bar yAxisId="left" dataKey="Periods" fill="#8D1D4B" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="Learners" fill="#AD9040" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-6">
                    <CpdExpiryWidget cpdCourses={cpdCourses} teacherCpdRecords={teacherCpdRecords} teachers={teachers} />
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Employment Status</h3>
                         <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                 <Tooltip formatter={(value, name) => [value, name]} wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600" />
                                 <Legend wrapperStyle={{fontSize: "12px"}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm text-center">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">System Health Check</h3>
                        <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">Check for performance issues and send alerts.</p>
                        <button onClick={handleCheckSLA} className="mt-4 bg-brand-navy text-white px-4 py-2 text-sm rounded-md flex items-center gap-2 font-medium hover:bg-slate-700 mx-auto">
                            <ShieldCheckIcon className="w-4 h-4" />
                            Check for SLA Breaches
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;