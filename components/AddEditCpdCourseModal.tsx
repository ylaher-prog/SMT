import React, { useState, useEffect } from 'react';
import type { CpdCourse } from '../types';
import { CpdCourseType } from '../types';
import Modal from './Modal';
import { FormLabel, FormInput, FormSelect, PrimaryButton, ModalFooter } from './FormControls';

interface AddEditCpdCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (course: CpdCourse) => void;
    existingCourse?: CpdCourse | null;
    currentTenantId: string;
}

const AddEditCpdCourseModal: React.FC<AddEditCpdCourseModalProps> = ({ isOpen, onClose, onSave, existingCourse, currentTenantId }) => {
    const [formData, setFormData] = useState({
        title: '',
        provider: '',
        points: 0,
        type: CpdCourseType.Course,
    });

    useEffect(() => {
        if (existingCourse) {
            setFormData({
                title: existingCourse.title,
                provider: existingCourse.provider,
                points: existingCourse.points,
                type: existingCourse.type,
            });
        } else {
            setFormData({
                title: '',
                provider: '',
                points: 0,
                type: CpdCourseType.Course,
            });
        }
    }, [existingCourse, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'points' ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const courseData: CpdCourse = {
            id: existingCourse?.id || `cpd-${Date.now()}`,
            tenantId: existingCourse?.tenantId || currentTenantId,
            ...formData,
        };
        onSave(courseData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={existingCourse ? 'Edit CPD Course' : 'Add CPD Course'}
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>{existingCourse ? 'Save Changes' : 'Add Course'}</PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><FormLabel>Title</FormLabel><FormInput name="title" value={formData.title} onChange={handleChange} required /></div>
                <div><FormLabel>Provider</FormLabel><FormInput name="provider" value={formData.provider} onChange={handleChange} required /></div>
                <div><FormLabel>Points</FormLabel><FormInput type="number" name="points" value={formData.points} onChange={handleChange} required /></div>
                <div><FormLabel>Type</FormLabel><FormSelect name="type" value={formData.type} onChange={handleChange}>{Object.values(CpdCourseType).map(t => <option key={t} value={t}>{t}</option>)}</FormSelect></div>
            </form>
        </Modal>
    );
};

export default AddEditCpdCourseModal;
