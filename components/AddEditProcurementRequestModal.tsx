import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
// FIX: Import 'RequestStatus' to correctly handle the 'status' field and 'getApprovalChain' for workflow logic.
import type { ProcurementRequest, Vendor, Budget, Teacher } from '../types';
import { RequestStatus } from '../types';
import { FormLabel, FormInput, FormSelect, FormTextarea, Fieldset, ModalFooter, PrimaryButton } from './FormControls';
import { getApprovalChain } from '../utils/approval';

interface AddEditProcurementRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    setProcurementRequests: React.Dispatch<React.SetStateAction<ProcurementRequest[]>>;
    existingRequest?: ProcurementRequest | null;
    currentUser: Teacher;
    vendors: Vendor[];
    budgets: Budget[];
    procurementRequests: ProcurementRequest[];
    // FIX: Add 'teachers' to props to enable approval chain calculation.
    teachers: Teacher[];
    currentTenantId: string;
    currentAcademicYear: string;
}

const AddEditProcurementRequestModal: React.FC<AddEditProcurementRequestModalProps> = (props) => {
    const { isOpen, onClose, setProcurementRequests, existingRequest, currentUser, vendors, budgets, procurementRequests, teachers, currentTenantId, currentAcademicYear } = props;

    const [formData, setFormData] = useState({
        itemDescription: '',
        category: 'Stationery',
        amount: '',
        vendorId: vendors[0]?.id || '',
        budgetId: budgets[0]?.id || '',
    });
    const [attachments, setAttachments] = useState<File[]>([]);

    useEffect(() => {
        if (existingRequest) {
            // Editing is complex with workflows, so we'll focus on adding for this demo.
        } else {
            setFormData({
                itemDescription: '',
                category: 'Stationery',
                amount: '',
                vendorId: vendors[0]?.id || '',
                budgetId: budgets[0]?.id || '',
            });
            setAttachments([]);
        }
    }, [existingRequest, isOpen, vendors, budgets]);

    const budgetInfo = useMemo(() => {
        if (!formData.budgetId) return null;
        const budget = budgets.find(b => b.id === formData.budgetId);
        if (!budget) return null;
        
        const spentAmount = procurementRequests
            // FIX: Property 'currentStage' does not exist on type 'ProcurementRequest'. Replaced with 'status' and used the RequestStatus enum for type safety.
            .filter(r => r.budgetId === formData.budgetId && r.status !== RequestStatus.Denied)
            .reduce((sum, r) => sum + r.amount, 0);
            
        return { ...budget, spentAmount, remaining: budget.totalAmount - spentAmount };
    }, [formData.budgetId, budgets, procurementRequests]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const approvalChain = getApprovalChain(currentUser.id, teachers);
        const firstApproverId = approvalChain.length > 0 ? approvalChain[0] : null;

        // FIX: Add tenantId to new procurement request to satisfy the ProcurementRequest type.
        const newRequest: ProcurementRequest = {
            id: `pr-${Date.now()}`,
            requesterId: currentUser.id,
            itemDescription: formData.itemDescription,
            category: formData.category,
            amount,
            vendorId: formData.vendorId,
            budgetId: formData.budgetId,
            requestDate: new Date().toISOString(),
            academicYear: currentAcademicYear,
            // FIX: Replaced 'currentStage' with 'status' and 'currentApproverId' to match the updated type and workflow logic.
            status: RequestStatus.Pending,
            currentApproverId: firstApproverId,
            approvalHistory: [
                { stage: 'Submission', approverId: currentUser.id, status: 'Approved', timestamp: new Date().toISOString() }
            ],
            attachments: attachments.map(f => ({ fileName: f.name, url: URL.createObjectURL(f) })),
            tenantId: currentTenantId,
        };
        
        setProcurementRequests(prev => [newRequest, ...prev]);
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="New Procurement Request"
            size="lg"
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>Submit Request</PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <Fieldset legend="Request Details">
                    <FormLabel>Item/Service Description</FormLabel>
                    <FormTextarea name="itemDescription" value={formData.itemDescription} onChange={handleChange} required />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div><FormLabel>Category</FormLabel><FormInput name="category" value={formData.category} onChange={handleChange} /></div>
                        <div><FormLabel>Amount (R)</FormLabel><FormInput type="number" name="amount" value={formData.amount} onChange={handleChange} required /></div>
                    </div>
                </Fieldset>
                <Fieldset legend="Vendor & Budget">
                    <div>
                        <FormLabel>Vendor</FormLabel>
                        <FormSelect name="vendorId" value={formData.vendorId} onChange={handleChange}>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </FormSelect>
                    </div>
                     <div className="mt-4">
                        <FormLabel>Budget</FormLabel>
                        <FormSelect name="budgetId" value={formData.budgetId} onChange={handleChange}>
                           {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </FormSelect>
                        {budgetInfo && (
                            <div className={`mt-2 p-2 rounded-md text-sm ${parseFloat(formData.amount) > budgetInfo.remaining ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                R {budgetInfo.remaining.toFixed(2)} of R {budgetInfo.totalAmount.toFixed(2)} remaining.
                            </div>
                        )}
                    </div>
                </Fieldset>
                 <Fieldset legend="Attachments">
                    <FormLabel>Upload Quotation/Invoice</FormLabel>
                    <FormInput type="file" onChange={handleFileChange} multiple />
                    {attachments.length > 0 && (
                        <ul className="mt-2 text-sm">
                            {attachments.map((file, i) => <li key={i}>{file.name}</li>)}
                        </ul>
                    )}
                </Fieldset>
            </form>
        </Modal>
    );
};

export default AddEditProcurementRequestModal;