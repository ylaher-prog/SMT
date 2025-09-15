import React, { useState, useEffect } from 'react';
import type { TeacherCpdRecord, CpdCourse } from '../types';
import Modal from './Modal';
import { FormLabel, FormInput, FormSelect, PrimaryButton, ModalFooter } from './FormControls';

interface AddEditTeacherCpdRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: TeacherCpdRecord) => void;
    existingRecord?: TeacherCpdRecord | null;
    teacherId: string;
    cpdCourses: CpdCourse[];
    currentTenantId: string;
}

const AddEditTeacherCpdRecordModal: React.FC<AddEditTeacherCpdRecordModalProps> = (props) => {
    const { isOpen, onClose, onSave, existingRecord, teacherId, cpdCourses, currentTenantId } = props;
    
    const [formData, setFormData] = useState({
        courseId: cpdCourses[0]?.id || '',
        completionDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
    });

    useEffect(() => {
        if (existingRecord) {
            setFormData({
                courseId: existingRecord.courseId,
                completionDate: existingRecord.completionDate,
                expiryDate: existingRecord.expiryDate || '',
            });
        } else {
            setFormData({
                courseId: cpdCourses[0]?.id || '',
                completionDate: new Date().toISOString().split('T')[0],
                expiryDate: '',
            });
        }
    }, [existingRecord, isOpen, cpdCourses]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const recordData: TeacherCpdRecord = {
            id: existingRecord?.id || `tcpd-${Date.now()}`,
            teacherId,
            tenantId: existingRecord?.tenantId || currentTenantId,
            ...formData,
        };
        onSave(recordData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={existingRecord ? 'Edit CPD Record' : 'Add CPD Record'}
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>{existingRecord ? 'Save Changes' : 'Add Record'}</PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><FormLabel>Course</FormLabel><FormSelect name="courseId" value={formData.courseId} onChange={handleChange}>{cpdCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</FormSelect></div>
                <div><FormLabel>Completion Date</FormLabel><FormInput type="date" name="completionDate" value={formData.completionDate} onChange={handleChange} required /></div>
                <div><FormLabel>Expiry Date (Optional)</FormLabel><FormInput type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} /></div>
            </form>
        </Modal>
    );
};

export default AddEditTeacherCpdRecordModal;
