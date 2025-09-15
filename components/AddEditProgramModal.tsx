import React, { useState, useEffect, useMemo } from 'react';
import type { Program, AcademicStructure } from '../types';
import Modal from './Modal';
import { FormLabel, FormSelect, PrimaryButton, ModalFooter } from './FormControls';

interface AddEditProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (program: Program) => void;
    existingProgram?: Program | null;
    academicStructure: AcademicStructure;
    currentTenantId: string;
}

const AddEditProgramModal: React.FC<AddEditProgramModalProps> = ({ isOpen, onClose, onSave, existingProgram, academicStructure, currentTenantId }) => {
    const [formData, setFormData] = useState({
        academicYear: academicStructure.academicYears[0] || '',
        curriculumId: academicStructure.curricula[0]?.id || '',
        grade: academicStructure.grades[0] || '',
    });

    const curriculumMap = useMemo(() => new Map(academicStructure.curricula.map(c => [c.id, c])), [academicStructure.curricula]);

    useEffect(() => {
        if (existingProgram) {
            setFormData({
                academicYear: existingProgram.academicYear,
                curriculumId: existingProgram.curriculumId,
                grade: existingProgram.grade,
            });
        } else {
            setFormData({
                academicYear: academicStructure.academicYears[0] || '',
                curriculumId: academicStructure.curricula[0]?.id || '',
                grade: academicStructure.grades[0] || '',
            });
        }
    }, [existingProgram, isOpen, academicStructure]);
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedCurriculum = curriculumMap.get(formData.curriculumId);
        if (!selectedCurriculum) {
            alert('Please select a valid curriculum.');
            return;
        }

        const programName = `${selectedCurriculum.name} - ${formData.academicYear} - Grade ${formData.grade}`;

        const programData: Program = {
            id: existingProgram?.id || `prog-${Date.now()}`,
            name: programName,
            tenantId: existingProgram?.tenantId || currentTenantId,
            ...formData,
        };
        onSave(programData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={existingProgram ? 'Edit Program' : 'Add New Program'}
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>{existingProgram ? 'Save Changes' : 'Add Program'}</PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <FormLabel>Academic Year</FormLabel>
                    <FormSelect name="academicYear" value={formData.academicYear} onChange={handleChange}>
                        {academicStructure.academicYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </FormSelect>
                </div>
                <div>
                    <FormLabel>Curriculum</FormLabel>
                    <FormSelect name="curriculumId" value={formData.curriculumId} onChange={handleChange}>
                        {academicStructure.curricula.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </FormSelect>
                </div>
                <div>
                    <FormLabel>Grade</FormLabel>
                    <FormSelect name="grade" value={formData.grade} onChange={handleChange}>
                        {academicStructure.grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </FormSelect>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditProgramModal;