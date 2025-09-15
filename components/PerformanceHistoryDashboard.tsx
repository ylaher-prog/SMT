import React, { useState, useMemo } from 'react';
import type { Observation, Teacher, MonitoringTemplate } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceHistoryDashboardProps {
    observations: Observation[];
    teachers: Teacher[];
    monitoringTemplates: MonitoringTemplate[];
}

const PerformanceHistoryDashboard: React.FC<PerformanceHistoryDashboardProps> = ({ observations, teachers, monitoringTemplates }) => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || 'all');
    
    const templateMap = useMemo(() => new Map(monitoringTemplates.map(t => [t.id, t.name])), [monitoringTemplates]);

    const teacherObservations = useMemo(() => {
        if (selectedTeacherId === 'all') return [];
        return observations
            .filter(obs => obs.teacherId === selectedTeacherId && typeof obs.calculatedScore === 'number')
            .sort((a, b) => new Date(a.observationDate).getTime() - new Date(b.observationDate).getTime());
    }, [observations, selectedTeacherId]);

    const trendData = useMemo(() => {
        return teacherObservations.map(obs => ({
            date: new Date(obs.observationDate).toLocaleDateString('en-CA'),
            score: (obs.calculatedScore! * 100),
            type: templateMap.get(obs.observationType) || 'Observation'
        }));
    }, [teacherObservations, templateMap]);
    
    const avgByTypeData = useMemo(() => {
        const scoresByType: { [type: string]: number[] } = {};
        teacherObservations.forEach(obs => {
            const typeName = templateMap.get(obs.observationType) || obs.observationType;
            if (!scoresByType[typeName]) {
                scoresByType[typeName] = [];
            }
            scoresByType[typeName].push(obs.calculatedScore!);
        });
        
        return Object.entries(scoresByType).map(([typeName, scores]) => ({
            name: typeName,
            avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
        }));
    }, [teacherObservations, templateMap]);


    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <label htmlFor="teacher-select" className="font-semibold text-gray-700 dark:text-gray-300">Select Teacher:</label>
                    <select
                        id="teacher-select"
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full sm:w-72 p-2.5 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-base"
                    >
                        <option value="all" disabled={selectedTeacherId !== 'all'}>-- Please select a teacher --</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                    </select>
                </div>
            </div>

            {selectedTeacherId === 'all' || teacherObservations.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Performance Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedTeacherId === 'all' ? 'Please select a teacher to view their performance history.' : 'No scored observations found for this teacher.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Performance Trend</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[0, 100]} unit="%" />
                                <Tooltip formatter={(value, name) => [`${(value as number).toFixed(1)}%`, name]} />
                                <Legend />
                                <Line type="monotone" dataKey="score" stroke="#8D1D4B" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Average Score by Type</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={avgByTypeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} unit="%" />
                                <YAxis type="category" dataKey="name" width={150} />
                                <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
                                <Legend />
                                <Bar dataKey="avgScore" name="Average Score" fill="#0B2042" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceHistoryDashboard;
