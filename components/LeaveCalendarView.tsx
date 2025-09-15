import React, { useMemo } from 'react';
import type { LeaveRequest } from '../types';

interface LeaveCalendarViewProps {
  leaveRequests: LeaveRequest[];
}

const LeaveCalendarView: React.FC<LeaveCalendarViewProps> = ({ leaveRequests }) => {
    
    const year = new Date().getFullYear();

    const leaveDataByDay = useMemo(() => {
        const map = new Map<string, number>();
        leaveRequests.forEach(req => {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                const dateString = d.toISOString().split('T')[0];
                map.set(dateString, (map.get(dateString) || 0) + 1);
            }
        });
        return map;
    }, [leaveRequests]);
    
    const renderMonth = (monthIndex: number) => {
        const monthName = new Date(year, monthIndex).toLocaleString('default', { month: 'long' });
        const firstDay = new Date(year, monthIndex, 1).getDay(); // 0=Sun, 1=Mon
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div key={monthIndex} className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-center mb-2">{monthName}</h4>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
                    {weekDays.map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-1">
                    {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                    {days.map(day => {
                        const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const leaveCount = leaveDataByDay.get(dateString) || 0;
                        
                        let colorClass = 'bg-gray-100 dark:bg-slate-700/50';
                        if (leaveCount > 0) colorClass = 'bg-yellow-200 dark:bg-yellow-800/60';
                        if (leaveCount >= 2) colorClass = 'bg-orange-300 dark:bg-orange-800/60';
                        if (leaveCount >= 4) colorClass = 'bg-red-400 dark:bg-red-800/60 text-white';

                        return (
                             <div 
                                key={day} 
                                className={`w-full aspect-square flex items-center justify-center rounded text-xs ${colorClass}`}
                                title={`${leaveCount} staff on leave`}
                            >
                                {day}
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => i).map(renderMonth)}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-yellow-200"></div><span>1 Staff</span></div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-orange-300"></div><span>2-3 Staff</span></div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-red-400"></div><span>4+ Staff</span></div>
            </div>
        </div>
    );
};

export default LeaveCalendarView;
