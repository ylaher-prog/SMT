import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { FormLabel, FormInput, FormSelect, PrimaryButton, ModalFooter } from './FormControls';
import type { Asset } from '../types';
import { AssetType, AssetStatus } from '../types';

interface AddEditAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (asset: Asset) => void;
    existingAsset?: Asset | null;
    currentTenantId: string;
}

const AddEditAssetModal: React.FC<AddEditAssetModalProps> = ({ isOpen, onClose, onSave, existingAsset, currentTenantId }) => {
    const [formData, setFormData] = useState({
        name: '',
        assetTag: '',
        type: AssetType.Hardware,
        purchaseDate: new Date().toISOString().split('T')[0],
        status: AssetStatus.Available,
    });

    useEffect(() => {
        if (existingAsset) {
            setFormData({
                name: existingAsset.name,
                assetTag: existingAsset.assetTag,
                type: existingAsset.type,
                purchaseDate: existingAsset.purchaseDate,
                status: existingAsset.status,
            });
        } else {
            setFormData({
                name: '',
                assetTag: '',
                type: AssetType.Hardware,
                purchaseDate: new Date().toISOString().split('T')[0],
                status: AssetStatus.Available,
            });
        }
    }, [existingAsset, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const assetData: Asset = {
            id: existingAsset?.id || `asset-${Date.now()}`,
            tenantId: existingAsset?.tenantId || currentTenantId,
            ...formData,
        };
        onSave(assetData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={existingAsset ? 'Edit Asset' : 'Add New Asset'}
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>{existingAsset ? 'Save Changes' : 'Add Asset'}</PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><FormLabel>Asset Name</FormLabel><FormInput name="name" value={formData.name} onChange={handleChange} required /></div>
                <div><FormLabel>Asset Tag</FormLabel><FormInput name="assetTag" value={formData.assetTag} onChange={handleChange} required /></div>
                <div><FormLabel>Type</FormLabel><FormSelect name="type" value={formData.type} onChange={handleChange}>{Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}</FormSelect></div>
                <div><FormLabel>Purchase Date</FormLabel><FormInput type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} required /></div>
                {existingAsset && (
                    <div><FormLabel>Status</FormLabel><FormSelect name="status" value={formData.status} onChange={handleChange}>{Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}</FormSelect></div>
                )}
            </form>
        </Modal>
    );
};

export default AddEditAssetModal;
