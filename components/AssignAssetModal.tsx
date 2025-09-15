import React, { useState } from 'react';
import Modal from './Modal';
import { FormLabel, FormSelect, PrimaryButton, ModalFooter } from './FormControls';
import type { Asset, AssetAssignment, Teacher } from '../types';
import { AssetStatus } from '../types';

interface AssignAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset;
    teachers: Teacher[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    setAssetAssignments: React.Dispatch<React.SetStateAction<AssetAssignment[]>>;
    currentTenantId: string;
}

const AssignAssetModal: React.FC<AssignAssetModalProps> = ({ isOpen, onClose, asset, teachers, setAssets, setAssetAssignments, currentTenantId }) => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

    const handleSubmit = () => {
        if (!selectedTeacherId) {
            alert('Please select a teacher.');
            return;
        }

        // 1. Update the asset's status
        const updatedAsset = { ...asset, status: AssetStatus.Assigned };
        setAssets(prev => prev.map(a => a.id === asset.id ? updatedAsset : a));

        // 2. Create a new assignment record
        const newAssignment: AssetAssignment = {
            id: `assign-${Date.now()}`,
            assetId: asset.id,
            teacherId: selectedTeacherId,
            assignedDate: new Date().toISOString().split('T')[0],
            tenantId: currentTenantId,
        };
        setAssetAssignments(prev => [...prev, newAssignment]);

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Assign Asset: ${asset.name}`}
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>Assign Asset</PrimaryButton>
                </ModalFooter>
            }
        >
            <p className="mb-4">Select a teacher to assign this asset to.</p>
            <div>
                <FormLabel>Teacher</FormLabel>
                <FormSelect value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </FormSelect>
            </div>
        </Modal>
    );
};

export default AssignAssetModal;
