import { z } from 'zod';
import { SubjectCategory } from '../types';

export const createSubjectCsvValidator = (
  existingSubjectNames: string[],
  availableCurriculumNames: string[],
  availableGradeNames: string[],
  availableModeNames: string[]
) => {
  return z.object({
    name: z.string().min(1, 'Subject name is required.'),
    grades: z.string().min(1, 'Grades are required.').transform((val, ctx) => {
        const grades = val.split(';').map(g => g.trim());
        grades.forEach(grade => {
            if (!availableGradeNames.includes(grade)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Invalid grade: ${grade}.`,
                });
            }
        });
        return grades;
    }),
    curricula: z.string().min(1, 'Curricula are required.').transform((val, ctx) => {
        const curricula = val.split(';').map(c => c.trim());
        curricula.forEach(curriculum => {
            if (!availableCurriculumNames.includes(curriculum)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Invalid curriculum: ${curriculum}.`,
                });
            }
        });
        return curricula;
    }),
    periodsByMode: z.string().optional().transform((val, ctx) => {
        if (!val) return [];
        const periods = val.split(';').map(p => {
            const [mode, periodStr] = p.split('=').map(s => s.trim());
            const periods = parseInt(periodStr, 10);
            if (!mode || !availableModeNames.includes(mode)) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid mode in periods: ${mode}`});
                 return null;
            }
            if (isNaN(periods) || periods < 0) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid period count for mode ${mode}`});
                 return null;
            }
            return { mode, periods };
        });
        return periods.filter(p => p !== null) as {mode: string, periods: number}[];
    }),
    category: z.nativeEnum(SubjectCategory).default(SubjectCategory.Core),
    electiveGroup: z.string().optional(),
  });
};