
import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import FileUpload from './FileUpload';
import type { AcademicStructure, Subject } from '../types';
import { SubjectCategory } from '../types';
import { ArrowDownTrayIcon } from './Icons';

interface BulkImportSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicStructure: AcademicStructure;
  onUpdateSubjects: (subjects: Subject[]) => void;
  currentTenantId: string;
}

type ParsedSubject = {
  name: string;
  grades: string[];
  modes: string[];
  // FIX: Rename curricula to curriculumIds for clarity
  curriculumIds: string[];
  periodsByMode: Array<{mode: string, periods: number}>;
  category: SubjectCategory;
  electiveGroup?: string;
  isUpdate?: boolean;
  existingSubjectId?: string;
  error?: string;
}

const BulkImportSubjectsModal: React.FC<BulkImportSubjectsModalProps> = ({ isOpen, onClose, academicStructure, onUpdateSubjects, currentTenantId }) => {
    const [csvData, setCsvData] = useState('');
    const [error, setError] = useState('');
    
    const { grades: availableGrades, modes: availableModes, curricula: availableCurricula, subjects: existingSubjects } = academicStructure;
    const existingSubjectMap = useMemo(() => new Map(existingSubjects.map(s => [s.name.toLowerCase(), s])), [existingSubjects]);
    // FIX: Add a map for curriculum names to IDs for validation and conversion
    const curriculumNameMap = useMemo(() => new Map(availableCurricula.map(c => [c.name.toLowerCase(), c.id])), [availableCurricula]);

    const parsedData: ParsedSubject[] = useMemo(() => {
        if (!csvData.trim()) return [];
        
        let content = csvData.trim();
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        const lines = content.split(/\r?\n/);
        if (lines.length < 2) return [{ error: "CSV must have a header and at least one data row." } as ParsedSubject];

        const headerRow = lines[0];
        const detectDelimiter = (header: string): string => {
            const delimiters = [',', ';', '\t'];
            return delimiters.reduce((best, current) => 
                header.split(current).length > header.split(best).length ? current : best
            );
        };
        const delimiter = detectDelimiter(headerRow);
        const splitRegex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);

        const headerCells = headerRow.split(splitRegex);
        const headerLine = headerCells.map(h => 
            h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/[\s\(\)-]+/g, '')
        );
        const dataLines = lines.slice(1);

        const h = {
            name: headerLine.indexOf('name'),
            grades: headerLine.indexOf('grades'),
            curricula: headerLine.indexOf('curricula'),
            periodsByMode: headerLine.indexOf('periodsbymode'),
            category: headerLine.indexOf('category'),
            electiveGroup: headerLine.indexOf('electivegroup'),
        };

        if (h.name === -1) {
            return [{ error: `CSV validation failed: Missing required header 'name'.` } as ParsedSubject];
        }

        return dataLines.map((line, index) => {
            const columns = line.split(splitRegex).map(s => s.trim().replace(/^"|"$/g, ''));
            const name = columns[h.name];
            const gradesStr = columns[h.grades] || '';
            const curriculaStr = columns[h.curricula] || '';
            const periodsByModeStr = columns[h.periodsByMode] || '';
            const categoryStr = columns[h.category] || '';
            const electiveGroup = columns[h.electiveGroup] || '';

            if (!name) {
                return { error: `Line ${index + 2}: Missing required field 'name'.` } as ParsedSubject;
            }

            const grades = gradesStr ? gradesStr.split(';').map(g => g.trim()) : [];
            for (const grade of grades) {
                if (grade && !availableGrades.includes(grade)) {
                    return { error: `Line ${index + 2}: Grade "${grade}" not found.` } as ParsedSubject;
                }
            }
            
            const curriculumNames = curriculaStr ? curriculaStr.split(';').map(c => c.trim()) : [];
            const curriculumIds: string[] = [];
            for (const curriculumName of curriculumNames) {
                if (curriculumName) {
                    // FIX: Validate curriculum by name and get its ID
                    const curriculumId = curriculumNameMap.get(curriculumName.toLowerCase());
                    if (!curriculumId) {
                        return { error: `Line ${index + 2}: Curriculum "${curriculumName}" not found.` } as ParsedSubject;
                    }
                    curriculumIds.push(curriculumId);
                }
            }

            const periodsByMode: { mode: string, periods: number }[] = [];
            if (periodsByModeStr) {
                const pairs = periodsByModeStr.split(';');
                for (const pair of pairs) {
                    const [mode, periodsVal] = pair.split('=');
                    if (mode && periodsVal) {
                        const periods = parseInt(periodsVal, 10);
                        if (!isNaN(periods) && periods >= 0) {
                            if (!availableModes.includes(mode.trim())) {
                                return { error: `Line ${index + 2}: Mode "${mode}" not found.` } as ParsedSubject;
                            }
                            periodsByMode.push({ mode: mode.trim(), periods });
                        } else {
                            return { error: `Line ${index + 2}: Invalid period value for mode "${mode}".` } as ParsedSubject;
                        }
                    }
                }
            }
            
            const modes = periodsByMode.map(p => p.mode);
            const category = (categoryStr.toLowerCase() === 'elective') ? SubjectCategory.Elective : SubjectCategory.Core;
            
            const existingSubject = existingSubjectMap.get(name.toLowerCase());

            return { 
                name, grades, modes, curriculumIds, periodsByMode, category, electiveGroup,
                isUpdate: !!existingSubject,
                existingSubjectId: existingSubject?.id,
            };
        });
    }, [csvData, availableGrades, availableModes, existingSubjectMap, curriculumNameMap]);
    
    const importStats = useMemo(() => {
        return {
            toCreate: parsedData.filter(d => !d.error && !d.isUpdate).length,
            toUpdate: parsedData.filter(d => !d.error && d.isUpdate).length,
            errors: parsedData.filter(d => d.error).length,
        };
    }, [parsedData]);
    
    const handleImport = () => {
        if (importStats.errors > 0) {
            setError('Cannot import. Please fix the errors in your CSV file.');
            return;
        }
        
        const toCreate = parsedData.filter(d => !d.error && !d.isUpdate);
        const toUpdate = parsedData.filter(d => !d.error && d.isUpdate);

        // FIX: Add tenantId to new subject objects to satisfy the Subject type.
        const newSubjects: Subject[] = toCreate.map(item => ({
            id: `subj-${Date.now()}-${Math.random()}`,
            name: item.name,
            grades: item.grades,
            modes: item.modes,
            curriculumIds: item.curriculumIds,
            periodsByMode: item.periodsByMode,
            category: item.category,
            electiveGroup: item.electiveGroup,
            tenantId: currentTenantId,
        }));

        const subjectUpdates = new Map<string, Partial<Subject>>();
        toUpdate.forEach(item => {
            const updateData: Partial<Subject> = {
                name: item.name,
                grades: item.grades,
                modes: item.modes,
                curriculumIds: item.curriculumIds,
                periodsByMode: item.periodsByMode,
                category: item.category,
                electiveGroup: item.electiveGroup,
            };
            subjectUpdates.set(item.existingSubjectId!, updateData);
        });

        const updatedOldSubjects = existingSubjects.map(s => 
            subjectUpdates.has(s.id) ? { ...s, ...subjectUpdates.get(s.id) } : s
        );

        onUpdateSubjects([...updatedOldSubjects, ...newSubjects]);
        alert(`${importStats.toCreate} subjects created, ${importStats.toUpdate} subjects updated.`);
        onClose();
    };

    const handleDownloadTemplate = () => {
        const headers = "name,grades,curricula,periodsByMode,category,electiveGroup";
        const example1 = "\"Mathematics\",\"Grade 10;Grade 11\",\"British;Cambridge\",\"Live=8;Flipped Afternoon=4\",Core,";
        const example2 = "\"Art History\",\"Grade 12\",\"British\",\"Self-Paced=2\",Elective,Arts";
        const example3 = "\"Afrikaans\",\"Grade 10\",\"British\",\"Live=4\",Elective,\"Language Choice\"";
        const csvContent = [headers, example1, example2, example3].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
        const link = document.createElement("a");
        if (link.href) URL.revokeObjectURL(link.href);
        link.href = URL.createObjectURL(blob);
        link.download = "subject_import_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Subjects" size="xl">
            <div className="space-y-4">
                <div>
                     <div className="flex justify-between items-center">
                         <h4 className="font-semibold text-gray-800 dark:text-gray-200">Instructions</h4>
                         <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-sm text-brand-primary font-medium hover:underline">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Download Template
                         </button>
                    </div>
                    <ul className="list-disc list-inside text-sm text-brand-text-light dark:text-gray-400 mt-2 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-md">
                        <li>This tool will **update** existing subjects if a matching `name` is found, otherwise it will **create** a new subject.</li>
                        <li>`grades` and `curricula` should be semicolon-separated lists of valid items (e.g., <code>Grade 10;Grade 11</code>). These fields are optional.</li>
                        <li>`periodsByMode` defines the modes and periods, e.g., <code>"Live=8;Flipped Morning=4"</code>. This field is optional.</li>
                        <li><code>category</code> must be either 'Core' or 'Elective'. Defaults to 'Core' if blank.</li>
                    </ul>
                </div>
                
                <FileUpload onFileRead={setCsvData} />

                {csvData.trim() && (
                    <div>
                         <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Preview ({importStats.toCreate} to create, {importStats.toUpdate} to update, {importStats.errors} errors)</h4>
                         <div className="max-h-60 overflow-y-auto border dark:border-slate-600 rounded-md">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600 text-sm">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Name</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Category</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-600">
                                   {parsedData.map((item, index) => (
                                       <tr key={index} className={item.error ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                           {item.error ? (
                                                <td colSpan={3} className="px-4 py-2 text-red-700 dark:text-red-400">{item.error}</td>
                                           ) : (
                                               <>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.name}</td>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.category}{item.electiveGroup ? ` (${item.electiveGroup})` : ''}</td>
                                                <td className="px-4 py-2 font-semibold">
                                                     {item.isUpdate 
                                                        ? <span className="text-amber-600 dark:text-amber-400">Update</span>
                                                        : <span className="text-green-600 dark:text-green-400">Create</span>
                                                    }
                                                </td>
                                               </>
                                           )}
                                       </tr>
                                   ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                )}
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button 
                        type="button" 
                        onClick={handleImport} 
                        disabled={importStats.errors > 0 || (importStats.toCreate === 0 && importStats.toUpdate === 0)}
                        className="bg-brand-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Import {importStats.toCreate + importStats.toUpdate} Subjects
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BulkImportSubjectsModal;
