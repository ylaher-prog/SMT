import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from './Modal';
import type { Teacher, Observation, AcademicStructure, PhaseStructure, MonitoringTemplate, FormField, ClassGroup, TeacherAllocation, Subject, EvidenceFile } from '../types';
import { MonitoringStatus, ObservationPriority, FormFieldType } from '../types';
import { FormLabel, FormInput, FormSelect, FormTextarea, Checkbox, Fieldset, ModalFooter, PrimaryButton } from './FormControls';
import { ArrowUpTrayIcon, TrashIcon } from './Icons';

interface AddEditObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setObservations: React.Dispatch<React.SetStateAction<Observation[]>>;
  existingObservation?: Observation | null;
  teachers: Teacher[];
  academicStructure: AcademicStructure;
  phaseStructures: PhaseStructure[];
  monitoringTemplates: MonitoringTemplate[];
  currentAcademicYear: string;
  classGroups: ClassGroup[];
  allocations: TeacherAllocation[];
  currentUser: Teacher;
  currentTenantId: string;
}

const StarRating: React.FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => (
    <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => onChange(star)} className="focus:outline-none group">
                <svg className={`w-8 h-8 transition-colors duration-200 ${star <= value ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 group-hover:text-yellow-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.956a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.364 2.44a1 1 0 00-.364 1.118l1.287 3.956c.3.921-.755 1.688-1.539 1.118l-3.364-2.44a1 1 0 00-1.175 0l-3.364 2.44c-.784.57-1.838-.197-1.539-1.118l1.287-3.956a1 1 0 00-.364-1.118L2.073 9.383c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69L9.049 2.927z" />
                </svg>
            </button>
        ))}
    </div>
);

const WizardStepIndicator: React.FC<{ currentStep: number; steps: string[] }> = ({ currentStep, steps }) => (
    <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => (
                <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
                    {stepIdx < currentStep - 1 ? (
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-brand-primary" />
                            </div>
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary">
                                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </>
                    ) : stepIdx === currentStep - 1 ? (
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-gray-200 dark:bg-slate-700" />
                            </div>
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-primary bg-white dark:bg-slate-800">
                                <span className="h-2.5 w-2.5 rounded-full bg-brand-primary" aria-hidden="true" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-gray-200 dark:bg-slate-700" />
                            </div>
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        </>
                    )}
                    <span className="absolute top-10 w-max -translate-x-1/2 text-center text-xs text-gray-500 dark:text-gray-400">{step}</span>
                </li>
            ))}
        </ol>
    </nav>
);

const AddEditObservationModal: React.FC<AddEditObservationModalProps> = (props) => {
    const { isOpen, onClose, setObservations, existingObservation, teachers, academicStructure, phaseStructures, monitoringTemplates, currentAcademicYear, classGroups, allocations, currentUser, currentTenantId } = props;
    
    const [step, setStep] = useState(1);
    const wizardSteps = ["Details", "Evaluation", "Summary & Actions"];
    
    const [formData, setFormData] = useState({
        observationType: '',
        teacherId: teachers[0]?.id || '',
        grade: '',
        curriculum: '',
        classGroupId: '',
        subjectId: '',
        observationDate: new Date().toISOString().split('T')[0],
        status: MonitoringStatus.Open,
        priority: ObservationPriority.Medium,
        customFormData: {} as Record<string, any>,
        followUpDate: '',
        evidenceFiles: [] as EvidenceFile[],
    });

    const [derivedData, setDerivedData] = useState({
        phase: '',
        phaseId: '',
        phaseHeadId: '',
        phaseHeadName: 'N/A',
    });
    
    const subjectMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.id, s])), [academicStructure.subjects]);

    const teacherAllocatedGroups = useMemo(() => {
        const groupIds = new Set(allocations.filter(a => a.teacherId === formData.teacherId).map(a => a.classGroupId));
        return classGroups.filter(cg => groupIds.has(cg.id));
    }, [formData.teacherId, allocations, classGroups]);
    
    const groupAllocatedSubjects = useMemo(() => {
        const group = classGroups.find(cg => cg.id === formData.classGroupId);
        if (!group) return [];
        return group.subjectIds.map(id => subjectMap.get(id)).filter((s): s is Subject => !!s);
    }, [formData.classGroupId, classGroups, subjectMap]);

    const availableTemplates = useMemo(() => {
        return monitoringTemplates.filter(t => !t.phaseId || t.phaseId === derivedData.phaseId);
    }, [monitoringTemplates, derivedData.phaseId]);

    const activeTemplate = monitoringTemplates.find(t => t.id === formData.observationType);

    const calculatedScore = useMemo(() => {
        if (!activeTemplate) return undefined;
        let totalWeight = 0;
        let weightedSum = 0;
        
        activeTemplate.fields.forEach(field => {
            if (field.type === FormFieldType.Rating && field.weight) {
                const rating = Number(formData.customFormData[field.id]);
                if (rating > 0) {
                    totalWeight += field.weight;
                    weightedSum += rating * field.weight;
                }
            }
        });
        
        if (totalWeight === 0) return undefined;
        
        // Return score as a decimal (e.g., 4.5 / 5 = 0.9)
        return (weightedSum / (totalWeight * 5)); 

    }, [formData.customFormData, activeTemplate]);

    useEffect(() => {
        const initialCustomData: Record<string, any> = {};
        if (activeTemplate) {
            activeTemplate.fields.forEach(field => {
                initialCustomData[field.id] = field.type === FormFieldType.Checkbox ? false :
                                            field.type === FormFieldType.Rating ? 0 : '';
            });
        }
        
        if (existingObservation) {
            setFormData({
                observationType: existingObservation.observationType,
                teacherId: existingObservation.teacherId,
                grade: existingObservation.grade,
                curriculum: existingObservation.curriculum,
                classGroupId: existingObservation.classGroupId || '',
                subjectId: existingObservation.subjectId || '',
                observationDate: existingObservation.observationDate,
                status: existingObservation.status,
                priority: existingObservation.priority,
                customFormData: { ...initialCustomData, ...existingObservation.formData },
                followUpDate: existingObservation.followUpDate || '',
                evidenceFiles: existingObservation.evidenceFiles || [],
            });
        } else {
             setFormData(prev => ({
                ...prev,
                observationType: availableTemplates[0]?.id || '',
                teacherId: teachers[0]?.id || '',
                grade: '',
                curriculum: '',
                classGroupId: '',
                subjectId: '',
                observationDate: new Date().toISOString().split('T')[0],
                status: MonitoringStatus.Open,
                priority: ObservationPriority.Medium,
                customFormData: initialCustomData,
                followUpDate: '',
                evidenceFiles: [],
            }));
        }
        setStep(1);
    }, [existingObservation, isOpen, teachers, activeTemplate, monitoringTemplates, availableTemplates]);
    
    useEffect(() => {
        const { grade, curriculum } = formData;
        
        const foundPhaseInfo = phaseStructures.find(p => 
            p.grades.includes(grade) && 
            p.curriculumIds.includes(curriculum)
        );

        if (foundPhaseInfo) {
            const head = teachers.find(t => t.id === foundPhaseInfo.phaseHeadId);
            setDerivedData({ 
                phase: foundPhaseInfo.phase, 
                phaseId: foundPhaseInfo.id,
                phaseHeadId: foundPhaseInfo.phaseHeadId,
                phaseHeadName: head?.fullName || 'N/A' 
            });
        } else {
            setDerivedData({ phase: '', phaseId: '', phaseHeadId: '', phaseHeadName: 'N/A' });
        }
    }, [formData.grade, formData.curriculum, phaseStructures, teachers]);
    
    useEffect(() => {
        const group = classGroups.find(cg => cg.id === formData.classGroupId);
        if (group) {
            setFormData(prev => ({ ...prev, grade: group.grade, curriculum: group.curriculumId }));
            if (!group.subjectIds.includes(formData.subjectId)) {
                setFormData(prev => ({...prev, subjectId: ''}));
            }
        }
    }, [formData.classGroupId, classGroups]);
    
    useEffect(() => {
        if (availableTemplates.length > 0 && !availableTemplates.find(t => t.id === formData.observationType)) {
            setFormData(prev => ({ ...prev, observationType: availableTemplates[0].id }));
        }
    }, [availableTemplates, formData.observationType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomFormChange = (fieldId: string, value: any) => {
         setFormData(prev => ({
            ...prev,
            customFormData: {
                ...prev.customFormData,
                [fieldId]: value,
            }
        }));
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newEvidenceFiles: EvidenceFile[] = files.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file), // Mock URL for preview
                type: file.type,
                size: file.size,
            }));
            setFormData(prev => ({
                ...prev,
                evidenceFiles: [...prev.evidenceFiles, ...newEvidenceFiles]
            }));
        }
    };
    
    const handleRemoveFile = (fileName: string) => {
        setFormData(prev => ({
            ...prev,
            evidenceFiles: prev.evidenceFiles.filter(f => f.name !== fileName)
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // FIX: Add tenantId to new observation to satisfy the Observation type.
        const observationData: Omit<Observation, 'id'> = {
            observationType: formData.observationType,
            teacherId: formData.teacherId,
            grade: formData.grade,
            curriculum: formData.curriculum,
            classGroupId: formData.classGroupId || undefined,
            subjectId: formData.subjectId || undefined,
            observationDate: formData.observationDate,
            status: formData.status,
            priority: formData.priority,
            followUpDate: formData.followUpDate,
            formData: formData.customFormData,
            phase: derivedData.phase,
            phaseHeadId: derivedData.phaseHeadId,
            academicYear: existingObservation ? existingObservation.academicYear : currentAcademicYear,
            observerId: existingObservation ? existingObservation.observerId : currentUser.id,
            calculatedScore: calculatedScore,
            evidenceFiles: formData.evidenceFiles,
            tenantId: currentTenantId,
        };

        if (existingObservation) {
            setObservations(prev => prev.map(o => o.id === existingObservation.id ? { ...observationData, id: o.id } : o));
        } else {
            const newObservation: Observation = {
                id: `obs-${Date.now()}`,
                ...observationData,
            };
            setObservations(prev => [...prev, newObservation]);
        }
        onClose();
    };
    
    const renderField = (field: FormField) => {
        const value = formData.customFormData[field.id];
        switch(field.type) {
            case FormFieldType.Text:
                return <FormInput type="text" id={field.id} value={value || ''} onChange={(e) => handleCustomFormChange(field.id, e.target.value)} required={field.required} placeholder={field.placeholder}/>;
            case FormFieldType.Number:
                return <FormInput type="number" id={field.id} value={value || ''} onChange={(e) => handleCustomFormChange(field.id, e.target.value)} required={field.required} placeholder={field.placeholder} />;
            case FormFieldType.Date:
                return <FormInput type="date" id={field.id} value={value || ''} onChange={(e) => handleCustomFormChange(field.id, e.target.value)} required={field.required} />;
            case FormFieldType.Textarea:
                return <FormTextarea id={field.id} value={value || ''} onChange={(e) => handleCustomFormChange(field.id, e.target.value)} required={field.required} rows={4} placeholder={field.placeholder}/>;
            case FormFieldType.Select:
                return <FormSelect id={field.id} value={value || ''} onChange={(e) => handleCustomFormChange(field.id, e.target.value)} required={field.required}>
                    <option value="">-- Select --</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </FormSelect>;
            case FormFieldType.Checkbox:
                return <div className="mt-2"><Checkbox id={field.id} label={field.label} checked={!!value} onChange={(e) => handleCustomFormChange(field.id, e.target.checked)} /></div>;
            case FormFieldType.Rating:
                return <StarRating value={value || 0} onChange={(rating) => handleCustomFormChange(field.id, rating)} />;
            default: return null;
        }
    }
    
    const validateStep = (currentStep: number) => {
        if (currentStep === 1) {
            return formData.observationType && formData.teacherId && formData.grade && formData.curriculum;
        }
        if (currentStep === 2) {
            if (!activeTemplate) return true;
            for (const field of activeTemplate.fields) {
                if (field.required && !formData.customFormData[field.id]) {
                    alert(`Field "${field.label}" is required.`);
                    return false;
                }
            }
        }
        return true;
    }
    
    const handleNext = () => {
        if (validateStep(step)) {
            setStep(s => s + 1);
        }
    }
    const handleBack = () => setStep(s => s - 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingObservation ? "Edit Monitoring Entry" : "Add Monitoring Entry"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-10 mt-2">
            <WizardStepIndicator currentStep={step} steps={wizardSteps} />
        </div>

        {step === 1 && (
            <Fieldset legend="Step 1: Observation Context">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <FormLabel htmlFor="observationType">Type</FormLabel>
                        <FormSelect name="observationType" id="observationType" value={formData.observationType} onChange={handleChange}>
                            {availableTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                        </FormSelect>
                    </div>
                     <div>
                        <FormLabel htmlFor="teacherId">Educator / Staff</FormLabel>
                        <FormSelect name="teacherId" id="teacherId" value={formData.teacherId} onChange={handleChange}>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </FormSelect>
                    </div>
                    <div>
                        <FormLabel htmlFor="classGroupId">Class Group (Optional)</FormLabel>
                        <FormSelect name="classGroupId" id="classGroupId" value={formData.classGroupId} onChange={handleChange} disabled={teacherAllocatedGroups.length === 0}>
                            <option value="">-- Select Class Group --</option>
                            {teacherAllocatedGroups.map(cg => <option key={cg.id} value={cg.id}>{cg.name}</option>)}
                        </FormSelect>
                    </div>
                    <div>
                        <FormLabel htmlFor="subjectId">Subject (Optional)</FormLabel>
                        <FormSelect name="subjectId" id="subjectId" value={formData.subjectId} onChange={handleChange} disabled={groupAllocatedSubjects.length === 0}>
                            <option value="">-- Select Subject --</option>
                            {groupAllocatedSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </FormSelect>
                    </div>
                    <div>
                        <FormLabel htmlFor="grade">Grade</FormLabel>
                        <FormInput name="grade" id="grade" value={formData.grade} onChange={handleChange} readOnly className="bg-gray-100 dark:bg-slate-700/50" />
                    </div>
                    <div>
                        <FormLabel htmlFor="curriculum">Curriculum</FormLabel>
                        <FormInput name="curriculum" id="curriculum" value={formData.curriculum} onChange={handleChange} readOnly className="bg-gray-100 dark:bg-slate-700/50" />
                    </div>
                     <div className="md:col-span-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-md grid grid-cols-2 gap-4">
                        <div><FormLabel>Derived Phase</FormLabel><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{derivedData.phase || 'N/A'}</p></div>
                        <div><FormLabel>Derived Phase Head</FormLabel><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{derivedData.phaseHeadName}</p></div>
                     </div>
                </div>
            </Fieldset>
        )}
        
        {step === 2 && (
            <Fieldset legend={`Step 2: Evaluation (${activeTemplate?.name || ''})`}>
                 <div className="flex justify-end mb-2">
                    {calculatedScore !== undefined && (
                        <div className="px-3 py-1 bg-sky-100 dark:bg-sky-900/50 rounded-full text-sm font-bold text-sky-800 dark:text-sky-200">
                           Score: {(calculatedScore * 100).toFixed(1)}%
                        </div>
                    )}
                </div>
                {activeTemplate && activeTemplate.fields.length > 0 ? (
                     <div className="space-y-4">
                         {activeTemplate.fields.map(field => (
                            <div key={field.id}>
                                {field.type !== FormFieldType.Checkbox && (
                                    <FormLabel htmlFor={field.id}>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                                )}
                                {renderField(field)}
                            </div>
                        ))}
                     </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">This observation type has no specific evaluation fields.</p>
                )}
            </Fieldset>
        )}

        {step === 3 && (
             <Fieldset legend="Step 3: Summary & Actions">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><FormLabel htmlFor="observationDate">Date of Event</FormLabel><FormInput type="date" name="observationDate" id="observationDate" value={formData.observationDate} onChange={handleChange} /></div>
                    <div><FormLabel htmlFor="status">Status</FormLabel><FormSelect name="status" id="status" value={formData.status} onChange={handleChange}>{Object.values(MonitoringStatus).map(s => <option key={s} value={s}>{s}</option>)}</FormSelect></div>
                    <div><FormLabel htmlFor="priority">Priority</FormLabel><FormSelect name="priority" id="priority" value={formData.priority} onChange={handleChange}>{Object.values(ObservationPriority).map(p => <option key={p} value={p}>{p}</option>)}</FormSelect></div>
                </div>
                 <div>
                    <FormLabel htmlFor="followUpDate">Follow-up Date (Optional)</FormLabel>
                    <FormInput type="date" name="followUpDate" id="followUpDate" value={formData.followUpDate} onChange={handleChange} />
                </div>
                <div>
                    <FormLabel>Attach Evidence</FormLabel>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 dark:border-gray-500/50 px-6 py-10">
                        <div className="text-center">
                            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-500" />
                            <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white dark:bg-slate-800 font-semibold text-brand-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2 hover:text-brand-magenta">
                                <span>Upload files</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG, PDF, MP4 up to 10MB</p>
                        </div>
                    </div>
                     {formData.evidenceFiles.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold">Attached Files:</h4>
                            <ul className="mt-2 space-y-2">
                                {formData.evidenceFiles.map(file => (
                                    <li key={file.name} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md">
                                        <span>{file.name}</span>
                                        <button type="button" onClick={() => handleRemoveFile(file.name)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </Fieldset>
        )}
       
        <ModalFooter onCancel={onClose}>
            <div className="flex-1 flex justify-start">
                {step > 1 && <button type="button" onClick={handleBack} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-md">Back</button>}
            </div>
            {step < wizardSteps.length && <PrimaryButton type="button" onClick={handleNext}>Next</PrimaryButton>}
            {step === wizardSteps.length && <PrimaryButton type="submit">{existingObservation ? "Save Changes" : "Save Entry"}</PrimaryButton>}
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AddEditObservationModal;
