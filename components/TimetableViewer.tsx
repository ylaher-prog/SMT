
import React, { useMemo } from 'react';
import type { TimetableHistoryEntry, TimeGrid, Teacher, ClassGroup, Subject, Permission, LockedLesson, GeneratedSlot } from '../types';
import { LockClosedIcon, LockOpenIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from './Icons';
import { generateICSForClassGroup, generateICSForTeacher } from '../utils/export';

interface TimetableViewerProps {
    activeTimetableData: TimetableHistoryEntry | null;
    displayGrid: TimeGrid | null;
    viewMode: 'class' | 'teacher';
    selectedTargetId: string | null;
    targetList: (ClassGroup | Teacher)[];
    subjectMap: Map<string, Subject>;
    teacherMap: Map<string, Teacher>;
    classGroupMap: Map<string, ClassGroup>;
    lockedLessons: LockedLesson[];
    onToggleLock: (lesson: GeneratedSlot, day: string, period: any, duration: number) => void;
    allocations: any;
}

const TimetableViewer: React.FC<TimetableViewerProps> = (props) => {
    const { activeTimetableData, displayGrid, viewMode, selectedTargetId, targetList, subjectMap, teacherMap, classGroupMap, lockedLessons, onToggleLock, allocations } = props;

    const subjectColorMap = useMemo(() => {
        const map = new Map<string, string>();
        Array.from(subjectMap.values()).forEach((subject, index) => {
            const colors = [
                'bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-200',
                'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200',
                'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200',
                'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-200',
                'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-200',
                'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-200',
            ];
            map.set(subject.id, colors[index % colors.length]);
        });
        return map;
    }, [subjectMap]);

    const renderedCells = useMemo(() => {
        if (!displayGrid || !activeTimetableData) return {};
        const cells: { [key: string]: { slot: GeneratedSlot, duration: number }[] } = {};
        const processedSlots = new Set<string>();

        displayGrid.days.forEach(day => {
            displayGrid.periods.forEach((period, periodIndex) => {
                const cellKey = `${day}-${period.id}`;
                if (processedSlots.has(cellKey)) return;

                let slots: GeneratedSlot[] = [];
                if (viewMode === 'class' && selectedTargetId) {
                    slots = activeTimetableData.timetable[selectedTargetId]?.[day]?.[period.id] || [];
                } else if (viewMode === 'teacher' && selectedTargetId) {
                    for (const classId in activeTimetableData.timetable) {
                        const periodSlots = activeTimetableData.timetable[classId]?.[day]?.[period.id] || [];
                        slots.push(...periodSlots.filter(s => s.teacherId === selectedTargetId));
                    }
                }
                
                if (slots.length > 0) {
                    // This simple version takes the first slot. A more complex UI could show multiple.
                    const slot = slots[0];
                    let duration = 1;
                    for (let i = periodIndex + 1; i < displayGrid.periods.length; i++) {
                        const nextPeriod = displayGrid.periods[i];
                        const nextSlots = activeTimetableData.timetable[slot.classGroupId]?.[day]?.[nextPeriod.id] || [];
                        if (nextSlots.some(s => s.id === slot.id)) {
                            duration++;
                            processedSlots.add(`${day}-${nextPeriod.id}`);
                        } else {
                            break;
                        }
                    }
                    cells[cellKey] = [{ slot, duration }];
                }
            });
        });

        return cells;
    }, [activeTimetableData, displayGrid, viewMode, selectedTargetId]);

    const handleExport = () => {
        if (!activeTimetableData || !selectedTargetId || !displayGrid) return;
        
        if (viewMode === 'class') {
            const classGroup = classGroupMap.get(selectedTargetId);
            if (classGroup) generateICSForClassGroup(classGroup, activeTimetableData.timetable, displayGrid, subjectMap, teacherMap);
        } else {
            const teacher = teacherMap.get(selectedTargetId);
            if (teacher) generateICSForTeacher(teacher, activeTimetableData.timetable, displayGrid, subjectMap, classGroupMap, allocations);
        }
    };

    if (!activeTimetableData || !displayGrid) {
        return (
            <div className="text-center p-10 text-gray-500 dark:text-gray-400">
                {activeTimetableData ? "Select a class or teacher to view their timetable." : "Generate a timetable to get started."}
            </div>
        );
    }
    
    return (
        <div>
             <div className="flex justify-end mb-4">
                <button onClick={handleExport} className="flex items-center gap-2 text-sm bg-brand-navy text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-700">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export to .ics
                </button>
            </div>
            <div className="overflow-x-auto border dark:border-slate-700 rounded-lg">
                <table className="min-w-full border-collapse text-xs text-center">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-700/50">
                            <th className="p-1 border dark:border-slate-700 w-28">Period</th>
                            {displayGrid.days.map(day => <th key={day} className="p-2 border dark:border-slate-700">{day}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {displayGrid.periods.map((period, periodIndex) => (
                            <tr key={period.id}>
                                <td className="p-1 border dark:border-slate-700 align-top">
                                    <b>{period.name}</b><br/>
                                    <span className="text-gray-500 dark:text-gray-400">{period.startTime}-{period.endTime}</span>
                                </td>
                                {displayGrid.days.map(day => {
                                    if (period.type === 'Break') return <td key={day} className="p-1 border dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-xs text-gray-400 rotate-180" style={{writingMode: 'vertical-rl'}}>{period.name}</td>;
                                    
                                    const cellKey = `${day}-${period.id}`;
                                    const cellData = renderedCells[cellKey];

                                    if (cellData) {
                                        const { slot, duration } = cellData[0];
                                        const subject = subjectMap.get(slot.subjectId);
                                        const colorClasses = subject ? subjectColorMap.get(slot.subjectId) : 'bg-gray-100 border-gray-300 text-gray-800';
                                        
                                        const isLocked = lockedLessons.some(l => l.day === day && l.periodId === period.id && l.subjectId === slot.subjectId && l.classGroupId === slot.classGroupId);
                                        
                                        const conflict = activeTimetableData.conflicts.find(c =>
                                            (c.details.classGroupId === slot.classGroupId && c.details.subjectId === slot.subjectId && c.details.day === day && c.details.periodId === period.id) ||
                                            (c.details.teacherId === slot.teacherId && c.details.day === day && c.details.periodId === period.id)
                                        );

                                        return (
                                            <td key={day} rowSpan={duration} className="p-0.5 border dark:border-slate-700 align-top relative">
                                                <div className={`group h-full w-full rounded p-1 border-l-4 text-left relative ${colorClasses} ${conflict ? 'border-2 !border-red-500' : ''}`}>
                                                    <p className="font-bold">{subject?.name || '?'}</p>
                                                    <p className="text-[10px]">
                                                        {viewMode === 'class'
                                                            ? teacherMap.get(slot.teacherId)?.fullName || '?'
                                                            : classGroupMap.get(slot.classGroupId)?.name || '?'
                                                        }
                                                    </p>
                                                     <button onClick={() => onToggleLock(slot, day, period, duration)} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/10 dark:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                                        {isLocked ? <LockClosedIcon className="w-4 h-4 text-amber-500" /> : <LockOpenIcon className="w-4 h-4 text-gray-500" />}
                                                    </button>
                                                    {conflict && <div className="absolute bottom-1 right-1" title={conflict.message}><ExclamationTriangleIcon className="w-4 h-4 text-red-500"/></div>}
                                                </div>
                                            </td>
                                        );
                                    }
                                    return <td key={day} className="p-1 border dark:border-slate-700"></td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TimetableViewer;
