import React, { useState, useMemo } from 'react';
import type { Teacher, Observation, AcademicStructure, PhaseStructure, MonitoringTemplate, ClassGroup } from '../types';
import { SparklesIcon } from './Icons';
import { PrimaryButton } from './FormControls';

interface AIReportGeneratorProps {
    observations: Observation[];
    teachers: Teacher[];
    phaseStructures: PhaseStructure[];
    academicStructure: AcademicStructure;
    monitoringTemplates: MonitoringTemplate[];
    classGroups: ClassGroup[];
}

const AIReportGenerator: React.FC<AIReportGeneratorProps> = ({ observations, teachers, phaseStructures, academicStructure, monitoringTemplates, classGroups }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState('');
    const [error, setError] = useState('');
    
    const [selectedPhase, setSelectedPhase] = useState('all');
    const [selectedTeacher, setSelectedTeacher] = useState('all');
    
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);
    const templateMap = useMemo(() => new Map(monitoringTemplates.map(t => [t.id, t.name])), [monitoringTemplates]);
    const subjectMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.id, s.name])), [academicStructure.subjects]);
    const classGroupMap = useMemo(() => new Map(classGroups.map(cg => [cg.id, cg.name])), [classGroups]);
    const phaseNameMap = useMemo(() => new Map(phaseStructures.map(p => [p.id, p.phase])), [phaseStructures]);


    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError('');
        setReport('');

        try {
            const filteredObservations = observations.filter(obs => {
                const phaseForObs = phaseStructures.find(p => p.grades.includes(obs.grade) && p.curriculumIds.includes(obs.curriculum));
                const phaseMatch = selectedPhase === 'all' || (phaseForObs && phaseForObs.id === selectedPhase);
                const teacherMatch = selectedTeacher === 'all' || obs.teacherId === selectedTeacher;
                return phaseMatch && teacherMatch;
            });

            if (filteredObservations.length === 0) {
                setError("No data found for the selected criteria. Please broaden your filters.");
                setIsLoading(false);
                return;
            }
            
            const selectedPhaseName = selectedPhase === 'all' ? 'All Phases' : phaseNameMap.get(selectedPhase);
            const selectedTeacherName = selectedTeacher === 'all' ? 'All Teachers' : teacherMap.get(selectedTeacher);

            const response = await fetch('/api/generate-monitoring-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    observations: filteredObservations,
                    context: {
                        selectedPhaseName,
                        selectedTeacherName,
                        // Pass maps for server-side reconstruction
                        teacherMap: Object.fromEntries(teacherMap),
                        templateMap: Object.fromEntries(templateMap),
                        subjectMap: Object.fromEntries(subjectMap),
                        classGroupMap: Object.fromEntries(classGroupMap),
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Failed to get response reader.");
            }

            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                setReport(prev => prev + decoder.decode(value, { stream: true }));
            }

        } catch (e) {
            console.error(e);
            setError(`An error occurred while generating the report: ${(e as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                 <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">AI-Powered Insights Generator</h3>
                 <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">Select criteria to generate a qualitative and quantitative analysis of monitoring data. This feature uses a secure server-side function to protect API keys.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 dark:border-slate-700">
                     <div>
                        <label className="text-sm font-medium">Phase</label>
                        <select value={selectedPhase} onChange={e => setSelectedPhase(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                           <option value="all">All Phases</option>
                           {phaseStructures.map(p => <option key={p.id} value={p.id}>{p.phase}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Teacher</label>
                         <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                           <option value="all">All Teachers</option>
                           {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                         <PrimaryButton onClick={handleGenerateReport} disabled={isLoading} className="w-full !py-2.5">
                             <SparklesIcon className="w-5 h-5 mr-2" />
                             {isLoading ? 'Generating...' : 'Generate Report'}
                         </PrimaryButton>
                    </div>
                </div>
            </div>
            {isLoading && <div className="text-center p-8">Generating report, this may take a moment...</div>}
            {error && <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}
            {report && (
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                     <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Generated Report</h3>
                     <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
                         {report}
                     </div>
                </div>
            )}
        </div>
    );
}

export default AIReportGenerator;