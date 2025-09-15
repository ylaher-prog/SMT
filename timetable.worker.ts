
// FIX: Import missing types to resolve cascading type errors.
import type { TimeGrid, TimeConstraint, GeneratedTimetable, Teacher, ClassGroup, Subject, TimetableHistoryEntry, Conflict, LessonDefinition, LockedLesson, GeneratedSlot, TeacherAllocation, AcademicStructure } from './types';
import { SubjectCategory } from './types';

type Lesson = {
    classGroup: ClassGroup;
    subject: Subject;
    teacher: Teacher;
    duration: number;
    id: string; // Unique ID for this specific lesson instance
};

// --- UTILITY FUNCTIONS ---
const isTeacherBooked = (teacherId: string, day: string, periodId: string, timetable: GeneratedTimetable): boolean => {
    for (const classGroupId in timetable) {
        if (timetable[classGroupId]?.[day]?.[periodId]?.some(slot => slot.teacherId === teacherId)) {
            return true;
        }
    }
    return false;
};

const isClassGroupBooked = (classGroupId: string, day: string, periodId: string, timetable: GeneratedTimetable, lessonToPlace: Lesson, subjectMap: Map<string, Subject>): boolean => {
    const existingSlots = timetable[classGroupId]?.[day]?.[periodId];
    if (!existingSlots || existingSlots.length === 0) return false;

    if (lessonToPlace.subject.category === SubjectCategory.Core) return true;
    if (existingSlots.some(s => subjectMap.get(s.subjectId)?.category === SubjectCategory.Core)) return true;
    
    const lessonElectiveGroup = lessonToPlace.subject.electiveGroup;
    if (existingSlots.some(s => {
        const existingSubject = subjectMap.get(s.subjectId);
        return existingSubject?.category === SubjectCategory.Elective && existingSubject.electiveGroup !== lessonElectiveGroup;
    })) return true;

    return false;
};

const countSubjectPeriodsOnDay = (classGroupId: string, subjectId: string, day: string, timetable: GeneratedTimetable): number => {
    let count = 0;
    const daySchedule = timetable[classGroupId]?.[day];
    if (daySchedule) {
        for (const periodId in daySchedule) {
            if (daySchedule[periodId]?.some(s => s.subjectId === subjectId)) {
                count++;
            }
        }
    }
    return count;
};

// --- CORE SOLVER ---
let cancelGeneration = false;
let backtrackStats = new Map<string, number>();
let allLessons: Lesson[] = [];

const solve = (
    lessonsToSolve: Lesson[],
    timetable: GeneratedTimetable,
    placedCount: number,
    totalLessons: number,
    { timeGrids, timeConstraints, subjectMap }: { timeGrids: TimeGrid[], timeConstraints: TimeConstraint[], subjectMap: Map<string, Subject> }
): { success: boolean; timetable: GeneratedTimetable; unplacedLessons: Lesson[]; } => {
    if (cancelGeneration) throw new Error("Cancelled");
    if (lessonsToSolve.length === 0) return { success: true, timetable, unplacedLessons: [] };

    const currentLesson = lessonsToSolve[0];
    const remainingLessons = lessonsToSolve.slice(1);
    const grid = timeGrids.find(g => g.id === currentLesson.classGroup.timeGridId)!;
    
    self.postMessage({ type: 'progress', payload: { placed: placedCount, total: totalLessons, currentLessonText: `${currentLesson.subject.name} for ${currentLesson.classGroup.name}` } });

    const subjectRules = timeConstraints.filter(c => c.type === 'subject-rule') as Extract<TimeConstraint, { type: 'subject-rule' }>[];
    const teacherUnavailableConstraints = timeConstraints.filter(c => c.type === 'not-available' && c.targetType === 'teacher');
    
    const isPlacementValid = (day: string, startPeriodIndex: number): boolean => {
        // ... (Full validation logic)
        for (let j = 0; j < currentLesson.duration; j++) {
            const periodIndex = startPeriodIndex + j;
            if (periodIndex >= grid.periods.length) return false;
            const period = grid.periods[periodIndex];
            if (period.type !== 'Lesson') return false;
            if (isTeacherBooked(currentLesson.teacher.id, day, period.id, timetable)) return false;
            if (isClassGroupBooked(currentLesson.classGroup.id, day, period.id, timetable, currentLesson, subjectMap)) return false;
            if (teacherUnavailableConstraints.some(c => 'targetId' in c && c.targetId === currentLesson.teacher.id && c.day === day && c.periodId === period.id)) return false;
        }

        const rule = subjectRules.find(r => r.classGroupId === currentLesson.classGroup.id && r.subjectId === currentLesson.subject.id) || (currentLesson.subject.electiveGroup ? subjectRules.find(r => r.classGroupId === currentLesson.classGroup.id && subjectMap.get(r.subjectId)?.electiveGroup === currentLesson.subject.electiveGroup) : undefined);
            if (rule) {
                if (rule.rules.maxPeriodsPerDay) {
                    const periodsOnDay = countSubjectPeriodsOnDay(currentLesson.classGroup.id, currentLesson.subject.id, day, timetable);
                    if (periodsOnDay + currentLesson.duration > rule.rules.maxPeriodsPerDay) return false;
                }
            }
        
        return true;
    };

    for (const day of grid.days) {
        for (let i = 0; i <= grid.periods.length - currentLesson.duration; i++) {
            if (isPlacementValid(day, i)) {
                const newTimetable = JSON.parse(JSON.stringify(timetable));
                for (let j = 0; j < currentLesson.duration; j++) {
                    const period = grid.periods[i + j];
                    const newSlot: GeneratedSlot = { id: currentLesson.id, classGroupId: currentLesson.classGroup.id, subjectId: currentLesson.subject.id, teacherId: currentLesson.teacher.id };
                    if (!newTimetable[currentLesson.classGroup.id][day][period.id]) newTimetable[currentLesson.classGroup.id][day][period.id] = [];
                    newTimetable[currentLesson.classGroup.id][day][period.id]!.push(newSlot);
                }
                
                const result = solve(remainingLessons, newTimetable, placedCount + 1, totalLessons, { timeGrids, timeConstraints, subjectMap });
                if (result.success) return result;
            }
        }
    }
    
    // Backtrack
    const count = (backtrackStats.get(currentLesson.id) || 0) + 1;
    backtrackStats.set(currentLesson.id, count);
    
    let hardestLesson: Lesson | null = null;
    let maxBacktracks = -1;
    for(const [lessonId, count] of backtrackStats.entries()) {
        if(count > maxBacktracks) {
            maxBacktracks = count;
            hardestLesson = allLessons.find(l => l.id === lessonId) || null;
        }
    }

    self.postMessage({ type: 'progress', payload: { placed: placedCount, total: totalLessons, backtracks: (self as any).totalBacktracks + 1, mostDifficultLesson: hardestLesson } });
    (self as any).totalBacktracks++;

    return { success: false, timetable, unplacedLessons: [currentLesson, ...remainingLessons] };
};

// FIX: Define a type for the worker payload to ensure type safety.
interface WorkerPayload {
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    academicStructure: AcademicStructure;
    timeGrids: TimeGrid[];
    timeConstraints: TimeConstraint[];
    currentAcademicYear: string;
    lockedLessons: LockedLesson[];
    teachers: Teacher[];
}


self.onmessage = (e: MessageEvent<{ type: string; payload: WorkerPayload }>) => {
    const { type, payload } = e.data;
    if (type === 'CANCEL') {
        cancelGeneration = true;
        return;
    }
    if (type === 'START') {
        cancelGeneration = false;
        backtrackStats.clear();
        (self as any).totalBacktracks = 0;

        // FIX: Destructure teachers directly from payload.
        const { allocations, classGroups, academicStructure, timeGrids, timeConstraints, currentAcademicYear, lockedLessons, teachers } = payload;
        // FIX: Ensure all maps are correctly created with proper types.
        const subjectMap = new Map(academicStructure.subjects.map((s: Subject) => [s.id, s]));
        const teacherMap = new Map(teachers.map((t: Teacher) => [t.id, t]));
        const classGroupMap = new Map(classGroups.map((cg: ClassGroup) => [cg.id, cg]));
        
        const lessons: Lesson[] = [];
        const subjectRules = timeConstraints.filter((c: TimeConstraint) => c.type === 'subject-rule') as Extract<TimeConstraint, { type: 'subject-rule' }>[];
        
        allocations.forEach((alloc) => {
            const classGroup = classGroups.find((cg) => cg.id === alloc.classGroupId);
            const subject = subjectMap.get(alloc.subjectId);
            const teacher = teacherMap.get(alloc.teacherId);
            if (!classGroup || !subject || !teacher || !classGroup.addToTimetable) return;

            const rule = subjectRules.find((r) => r.classGroupId === classGroup.id && r.subjectId === subject.id);
            if(rule && rule.rules.lessonDefinitions.length > 0) {
                rule.rules.lessonDefinitions.forEach((def) => {
                    for(let i=0; i<def.count; i++) {
                        lessons.push({ classGroup, subject, teacher, duration: def.duration, id: `${classGroup.id}-${subject.id}-${def.duration}-${i}` });
                    }
                });
            }
        });
        allLessons = lessons;

        const initialTimetable: GeneratedTimetable = {};
        classGroups.forEach((cg: ClassGroup) => {
            if (cg.addToTimetable && cg.timeGridId) {
                initialTimetable[cg.id] = {};
                const grid = timeGrids.find((g: TimeGrid) => g.id === cg.timeGridId);
                if (grid) {
                    grid.days.forEach(day => {
                        initialTimetable[cg.id][day] = {};
                        grid.periods.forEach(p => initialTimetable[cg.id][day][p.id] = null);
                    });
                }
            }
        });
        
        // Pre-fill locked lessons
        let conflicts: Conflict[] = [];
        lockedLessons.forEach((lock: LockedLesson) => {
            const grid = timeGrids.find((g: TimeGrid) => g.id === classGroupMap.get(lock.classGroupId)?.timeGridId);
            const periodIndex = grid?.periods.findIndex(p => p.id === lock.periodId);
            
            if (grid && periodIndex !== -1) {
                for(let i=0; i < lock.duration; i++) {
                    const p = grid.periods[periodIndex+i];
                    if (!initialTimetable[lock.classGroupId][lock.day][p.id]) {
                         initialTimetable[lock.classGroupId][lock.day][p.id] = [];
                    }
                    // FIX: Create a valid GeneratedSlot from the LockedLesson to match the timetable's expected type.
                    const lockedSlot: GeneratedSlot = {
                        id: `lock-${lock.classGroupId}-${lock.subjectId}-${lock.day}-${lock.periodId}`,
                        classGroupId: lock.classGroupId,
                        subjectId: lock.subjectId,
                        teacherId: lock.teacherId,
                    };
                    initialTimetable[lock.classGroupId][lock.day][p.id]!.push(lockedSlot);
                }
            }
        });
        
        const lessonsToSolve = lessons.filter(l => !lockedLessons.some((lock: LockedLesson) => lock.subjectId === l.subject.id && lock.classGroupId === l.classGroup.id));

        const result = solve(lessonsToSolve, initialTimetable, lockedLessons.length, lessons.length, { timeGrids, timeConstraints, subjectMap });
        
        result.unplacedLessons.forEach(lesson => {
            conflicts.push({
                id: `conflict-place-${lesson.id}`, type: 'Placement Failure', 
                message: `Could not find a valid slot for ${lesson.subject.name} for class ${lesson.classGroup.name}.`, 
                details: { classGroupId: lesson.classGroup.id, subjectId: lesson.subject.id, teacherId: lesson.teacher.id }
            });
        });
        
        self.postMessage({ type: 'RESULT', payload: { timetable: result.timetable, conflicts }});
    }
};
