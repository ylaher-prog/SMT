import React, { useMemo } from 'react';
import type { Observation, Teacher } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CalibrationDashboardProps {
    observations: Observation[];
    teachers: Teacher[];
}

const CalibrationDashboard: React.FC<CalibrationDashboardProps> = ({ observations, teachers }) => {

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);

    const calibrationData = useMemo(() => {
        const observerStats: { [observerId: string]: { scores: number[], count: number } } = {};

        observations.forEach(obs => {
            if (obs.observerId && typeof obs.calculatedScore === 'number') {
                if (!observerStats[obs.observerId]) {
                    observerStats[obs.observerId] = { scores: [], count: 0 };
                }
                observerStats[obs.observerId].scores.push(obs.calculatedScore);
                observerStats[obs.observerId].count++;
            }
        });

        return Object.entries(observerStats).map(([observerId, data]) => {
            const sum = data.scores.reduce((acc, score) => acc + score, 0);
            const avg = data.count > 0 ? sum / data.count : 0;
            
            const stdDev = data.count > 0 ? Math.sqrt(
                data.scores.map(score => Math.pow(score - avg, 2)).reduce((acc, val) => acc + val, 0) / data.count
            ) : 0;

            return {
                name: teacherMap.get(observerId) || 'Unknown Observer',
                avgScore: avg * 100, // as percentage
                stdDev: stdDev * 100,
                count: data.count,
            };
        }).sort((a,b) => b.avgScore - a.avgScore);

    }, [observations, teacherMap]);
    
    if (calibrationData.length === 0) {
        return (
            <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Not Enough Data for Calibration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    At least two observers need to have logged scored observations to generate this report.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Inter-Rater Reliability</h3>
            <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1 mb-4">
                This chart shows the average score given by each observer. A wide variation may indicate a need for scoring calibration.
            </p>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={calibrationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} className="dark:text-gray-400" />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} className="dark:text-gray-400" />
                    <Tooltip
                        formatter={(value) => `${Number(value).toFixed(1)}%`}
                        labelFormatter={(label) => `Observer: ${label}`}
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                        }}
                        wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600"
                    />
                    <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                    <Bar dataKey="avgScore" name="Average Score" fill="#8D1D4B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="count" name="No. of Observations" fill="#AD9040" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CalibrationDashboard;
