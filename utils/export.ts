
import type { GeneratedTimetable, TimeGrid, Teacher, ClassGroup, Subject, TeacherAllocation } from '../types';

const formatDateForICS = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const createICSContent = (events: any[]): string => {
    let icsString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SMT//Timetable Exporter//EN',
        'CALSCALE:GREGORIAN',
    ].join('\r\n');

    events.forEach(event => {
        icsString += '\r\nBEGIN:VEVENT';
        icsString += `\r\nUID:${event.uid}`;
        icsString += `\r\nDTSTAMP:${formatDateForICS(new Date())}`;
        icsString += `\r\nDTSTART:${event.dtstart}`;
        icsString += `\r\nDTEND:${event.dtend}`;
        icsString += `\r\nSUMMARY:${event.summary}`;
        icsString += `\r\nDESCRIPTION:${event.description}`;
        icsString += `\r\nRRULE:FREQ=WEEKLY`;
        icsString += '\r\nEND:VEVENT';
    });

    icsString += '\r\nEND:VCALENDAR';
    return icsString;
};

const triggerDownload = (icsContent: string, filename: string) => {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const getNextDayOfWeek = (dayOfWeek: number): Date => { // 0=Sun, 1=Mon, ...
    const now = new Date();
    now.setDate(now.getDate() + (dayOfWeek + 7 - now.getDay()) % 7);
    return now;
};
const DAY_MAP: { [key: string]: number } = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };


export const generateICSForClassGroup = (
    classGroup: ClassGroup,
    timetable: GeneratedTimetable,
    grid: TimeGrid,
    subjectMap: Map<string, Subject>,
    teacherMap: Map<string, Teacher>
) => {
    const events: any[] = [];
    const classSchedule = timetable[classGroup.id];
    if (!classSchedule) return;

    grid.days.forEach(day => {
        const dayIndex = DAY_MAP[day];
        if (dayIndex === undefined) return;

        grid.periods.forEach(period => {
            const slots = classSchedule[day]?.[period.id] || [];
            slots.forEach(slot => {
                const subject = subjectMap.get(slot.subjectId);
                const teacher = teacherMap.get(slot.teacherId);
                if (!subject || !teacher) return;
                
                const eventDate = getNextDayOfWeek(dayIndex);
                const [startHour, startMinute] = period.startTime.split(':').map(Number);
                const [endHour, endMinute] = period.endTime.split(':').map(Number);
                
                const startDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), startHour, startMinute);
                const endDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), endHour, endMinute);

                events.push({
                    uid: `${slot.id}@smt.timetable`,
                    dtstart: formatDateForICS(startDate),
                    dtend: formatDateForICS(endDate),
                    summary: `${subject.name} - ${classGroup.name}`,
                    description: `Teacher: ${teacher.fullName}`,
                });
            });
        });
    });

    const icsContent = createICSContent(events);
    triggerDownload(icsContent, `${classGroup.name}_timetable.ics`);
};


export const generateICSForTeacher = (
    teacher: Teacher,
    timetable: GeneratedTimetable,
    grid: TimeGrid, // Assuming a teacher might work across one primary grid for simplicity
    subjectMap: Map<string, Subject>,
    classGroupMap: Map<string, ClassGroup>,
    allocations: TeacherAllocation[]
) => {
     const events: any[] = [];

    grid.days.forEach(day => {
        const dayIndex = DAY_MAP[day];
        if (dayIndex === undefined) return;

        grid.periods.forEach(period => {
             for (const classId in timetable) {
                const slots = timetable[classId]?.[day]?.[period.id] || [];
                const teacherSlot = slots.find(s => s.teacherId === teacher.id);
                if (teacherSlot) {
                    const subject = subjectMap.get(teacherSlot.subjectId);
                    const classGroup = classGroupMap.get(teacherSlot.classGroupId);
                    if (!subject || !classGroup) continue;
                    
                    const eventDate = getNextDayOfWeek(dayIndex);
                    const [startHour, startMinute] = period.startTime.split(':').map(Number);
                    const [endHour, endMinute] = period.endTime.split(':').map(Number);
                    
                    const startDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), startHour, startMinute);
                    const endDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), endHour, endMinute);

                    events.push({
                        uid: `${teacherSlot.id}@smt.timetable`,
                        dtstart: formatDateForICS(startDate),
                        dtend: formatDateForICS(endDate),
                        summary: `${subject.name} - ${classGroup.name}`,
                        description: `Class: ${classGroup.name}`,
                    });
                }
             }
        });
    });

    const icsContent = createICSContent(events);
    triggerDownload(icsContent, `${teacher.fullName}_timetable.ics`);
};
