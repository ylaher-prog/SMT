import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { FormLabel, FormInput, FormSelect, FormTextarea, ModalFooter, PrimaryButton } from './FormControls';
import type { Teacher, LeaveRequest } from '../types';
import { LeaveType, RequestStatus } from '../types';

interface AddEditLeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  existingRequest?: LeaveRequest | null;
  teachers: Teacher[];
  currentAcademicYear: string;
  currentTenantId: string;
}

const AddEditLeaveRequestModal: React.FC<AddEditLeaveRequestModalProps> = ({ isOpen, onClose, setLeaveRequests, existingRequest, teachers, currentAcademicYear, currentTenantId }) => {
    const [formData, setFormData] = useState({
        teacherId: teachers[0]?.id || '',
        leaveType: LeaveType.Annual,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
    });
    const [attachment, setAttachment] = useState<File | null>(null);

    useEffect(() => {
        if (existingRequest) {
            setFormData({
                teacherId: existingRequest.teacherId,
                leaveType: existingRequest.leaveType,
                startDate: existingRequest.startDate,
                endDate: existingRequest.endDate,
                reason: existingRequest.reason,
            });
        } else {
            setFormData({
                teacherId: teachers[0]?.id || '',
                leaveType: LeaveType.Annual,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                reason: '',
            });
        }
        setAttachment(null);
    }, [existingRequest, isOpen, teachers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // FIX: Add tenantId to new leave request object to satisfy the LeaveRequest type.
        const requestData: Omit<LeaveRequest, 'id' | 'status' | 'academicYear'> = {
            ...formData,
            attachment: attachment ? { fileName: attachment.name, url: URL.createObjectURL(attachment) } : undefined,
            tenantId: currentTenantId,
        };
        
        if (existingRequest) {
            setLeaveRequests(prev => prev.map(r => r.id === existingRequest.id ? { ...existingRequest, ...requestData } : r));
        } else {
            const newRequest: LeaveRequest = {
                id: `lr-${Date.now()}`,
                ...requestData,
                status: RequestStatus.Pending,
                academicYear: currentAcademicYear,
            };
            setLeaveRequests(prev => [newRequest, ...prev]);
        }
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={existingRequest ? 'Edit Leave Request' : 'Add Leave Request'}
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>
                        {existingRequest ? 'Save Changes' : 'Submit Request'}
                    </PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <FormLabel htmlFor="teacherId">Teacher</FormLabel>
                    <FormSelect id="teacherId" name="teacherId" value={formData.teacherId} onChange={handleChange}>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                    </FormSelect>
                </div>
                <div>
                    <FormLabel htmlFor="leaveType">Leave Type</FormLabel>
                    <FormSelect id="leaveType" name="leaveType" value={formData.leaveType} onChange={handleChange}>
                        {Object.values(LeaveType).map(type => <option key={type} value={type}>{type}</option>)}
                    </FormSelect>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><FormLabel htmlFor="startDate">Start Date</FormLabel><FormInput type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} /></div>
                    <div><FormLabel htmlFor="endDate">End Date</FormLabel><FormInput type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} /></div>
                </div>
                <div><FormLabel htmlFor="reason">Reason</FormLabel><FormTextarea id="reason" name="reason" value={formData.reason} onChange={handleChange} rows={3} required /></div>
                <div>
                    <FormLabel htmlFor="attachment">Attach Sick Note / Document</FormLabel>
                    <FormInput type="file" id="attachment" name="attachment" onChange={handleFileChange} />
                </div>
            </form>
        </Modal>
    );
};

export default AddEditLeaveRequestModal;
