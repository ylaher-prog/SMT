

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Vacancy, Budget, AcademicStructure } from '../types';
import { FormLabel, FormInput, FormSelect, PrimaryButton, ModalFooter } from './FormControls';

interface AddEditVacancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vacancy: Vacancy) => void;
  existingVacancy?: Vacancy | null;
  budgets: Budget[];
  academicStructure: AcademicStructure;
  currentTenantId: string;
  currentAcademicYear: string;
}

const AddEditVacancyModal: React.FC<AddEditVacancyModalProps> = ({ isOpen, onClose, onSave, existingVacancy, budgets, academicStructure, currentTenantId, currentAcademicYear }) => {
    
    const [formData, setFormData] = useState({
        positionId: academicStructure.positions[0]?.id || '',
        budgetId: budgets[0]?.id || '',
        proposedSalary: '',
        status: 'Open' as Vacancy['status'],
        description: '',
    });

    useEffect(() => {
        if (existingVacancy) {
            setFormData({
                positionId: existingVacancy.positionId,
                budgetId: existingVacancy.budgetId,
                proposedSalary: String(existingVacancy.proposedSalary),
                status: existingVacancy.status,
                description: existingVacancy.description || '',
            });
        } else {
            setFormData({
                positionId: academicStructure.positions[0]?.id || '',
                budgetId: budgets[0]?.id || '',
                proposedSalary: '',
                status: 'Open' as Vacancy['status'],
                description: '',
            });
        }
    }, [existingVacancy, isOpen, academicStructure, budgets]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const salary = parseFloat(formData.proposedSalary);
        if (isNaN(salary) || salary <= 0) {
            alert('Please enter a valid salary.');
            return;
        }

        const vacancyData: Vacancy = {
            id: existingVacancy?.id || `vac-${Date.now()}`,
            positionId: formData.positionId,
            budgetId: formData.budgetId,
            proposedSalary: salary,
            status: formData.status,
            description: formData.description,
            academicYear: existingVacancy?.academicYear || currentAcademicYear,
            tenantId: existingVacancy?.tenantId || currentTenantId,
        };
        onSave(vacancyData);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={existingVacancy ? 'Edit Vacancy' : 'Add Vacancy'}
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>
                        {existingVacancy ? 'Save Changes' : 'Add Vacancy'}
                    </PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <FormLabel>Position</FormLabel>
                    <FormSelect name="positionId" value={formData.positionId} onChange={handleChange}>
                        {academicStructure.positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </FormSelect>
                </div>
                 <div>
                    <FormLabel>Budget</FormLabel>
                    <FormSelect name="budgetId" value={formData.budgetId} onChange={handleChange}>
                        {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </FormSelect>
                </div>
                 <div>
                    <FormLabel>Proposed Salary (Annual)</FormLabel>
                    <FormInput type="number" name="proposedSalary" value={formData.proposedSalary} onChange={handleChange} />
                </div>
                 <div>
                    <FormLabel>Status</FormLabel>
                    <FormSelect name="status" value={formData.status} onChange={handleChange}>
                        <option>Draft</option>
                        <option>Open</option>
                        <option>Interviewing</option>
                        <option>Closed</option>
                    </FormSelect>
                </div>
                 <div>
                    <FormLabel>Description</FormLabel>
                    <FormInput type="text" name="description" value={formData.description} onChange={handleChange} />
                </div>
            </form>
        </Modal>
    );
};

export default AddEditVacancyModal;