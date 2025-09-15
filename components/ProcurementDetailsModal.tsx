import React, { useMemo } from 'react';
import Modal from './Modal';
// FIX: Import AcademicStructure type to be added to props.
import type { ProcurementRequest, Vendor, Budget, Teacher, ApprovalStep, AcademicStructure } from '../types';
import { RequestStatus } from '../types';
import { PrimaryButton } from './FormControls';
import { getApprovalChain } from '../utils/approval';

interface ProcurementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest;
  setProcurementRequests: React.Dispatch<React.SetStateAction<ProcurementRequest[]>>;
  currentUser: Teacher;
  vendors: Vendor[];
  budgets: Budget[];
  teachers: Teacher[];
  // FIX: Add academicStructure to props to resolve usage error.
  academicStructure: AcademicStructure;
}

const ProcurementDetailsModal: React.FC<ProcurementDetailsModalProps> = (props) => {
    const { isOpen, onClose, request, setProcurementRequests, currentUser, vendors, budgets, teachers, academicStructure } = props;

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    
    const vendor = vendors.find(v => v.id === request.vendorId);
    const budget = budgets.find(b => b.id === request.budgetId);
    const requester = teacherMap.get(request.requesterId);
    
    const canApprove = useMemo(() => {
        return currentUser.id === request.currentApproverId;
    }, [request.currentApproverId, currentUser.id]);

    const handleApproval = (status: 'Approved' | 'Denied') => {
        const approvalChain = getApprovalChain(request.requesterId, teachers);
        const currentApproverIndex = approvalChain.indexOf(currentUser.id);

        let nextApproverId: string | null = null;
        let finalStatus = request.status;
        
        if (status === 'Denied') {
            finalStatus = RequestStatus.Denied;
            nextApproverId = null;
        } else {
             if (currentApproverIndex === -1 || currentApproverIndex === approvalChain.length - 1) {
                // This is the final approver or something went wrong
                finalStatus = RequestStatus.Approved;
                nextApproverId = null;
            } else {
                nextApproverId = approvalChain[currentApproverIndex + 1];
            }
        }

        const newHistoryStep: ApprovalStep = {
            stage: `Approval by ${teacherMap.get(currentUser.id)?.fullName}`,
            approverId: currentUser.id,
            status,
            timestamp: new Date().toISOString(),
        };

        const updatedRequest: ProcurementRequest = {
            ...request,
            status: finalStatus,
            currentApproverId: nextApproverId,
            approvalHistory: [...request.approvalHistory, newHistoryStep]
        };
        
        setProcurementRequests(prev => prev.map(r => r.id === request.id ? updatedRequest : r));
        onClose();
    };

    const currentApproverName = request.currentApproverId ? teacherMap.get(request.currentApproverId)?.fullName : 'N/A';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Request: ${request.itemDescription}`} size="lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <h4 className="font-semibold">Request Details</h4>
                    <p><strong>Requester:</strong> {requester?.fullName}</p>
                    <p><strong>Category:</strong> {request.category}</p>
                    <p><strong>Amount:</strong> R {request.amount.toFixed(2)}</p>
                    <p><strong>Vendor:</strong> {vendor?.name || 'N/A'}</p>
                    <p><strong>Budget:</strong> {budget?.name || 'N/A'}</p>
                    {request.attachments && request.attachments.length > 0 && (
                        <div>
                            <strong>Attachments:</strong>
                            <ul className="list-disc list-inside">
                                {request.attachments.map(a => <li key={a.fileName}><a href={a.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">{a.fileName}</a></li>)}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="md:col-span-1 space-y-2">
                     <h4 className="font-semibold">Approval Timeline</h4>
                     <ul className="space-y-3">
                         {request.approvalHistory.map(step => (
                             <li key={step.timestamp}>
                                <p className="font-medium text-sm">{step.stage} - <span className={step.status === 'Approved' ? 'text-green-600' : 'text-red-600'}>{step.status}</span></p>
                                <p className="text-xs text-gray-500">by {teacherMap.get(step.approverId)?.fullName} on {new Date(step.timestamp).toLocaleDateString()}</p>
                             </li>
                         ))}
                     </ul>
                </div>
            </div>
             <div className="mt-6 pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm font-semibold">
                    Status: {request.status}
                    {request.status === RequestStatus.Pending && <span> (Awaiting {currentApproverName})</span>}
                </span>
                {canApprove && (
                    <div className="flex gap-2">
                        <button onClick={() => handleApproval('Denied')} className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700">Deny</button>
                        <PrimaryButton onClick={() => handleApproval('Approved')}>Approve</PrimaryButton>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ProcurementDetailsModal;