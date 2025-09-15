import React, { useState } from 'react';
import type { Teacher, TeacherDocument } from '../types';
import { supabase } from '../lib/supabase';
import { ArrowUpTrayIcon, ArrowDownTrayIcon, TrashIcon } from './Icons';
import FileUpload from './FileUpload'; // Re-using the component from bulk import

interface TeacherProfileDocumentsProps {
    teacher: Teacher;
    teacherDocs: TeacherDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<TeacherDocument[]>>;
    currentTenantId: string;
}

const TeacherProfileDocuments: React.FC<TeacherProfileDocumentsProps> = ({ teacher, teacherDocs, setDocuments, currentTenantId }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        setError('');

        // In a real app, the path would be more secure and possibly non-public.
        const filePath = `public/teacher_documents/${teacher.id}/${file.name}`;
        
        /*
        // --- REAL SUPABASE LOGIC ---
        const { error: uploadError } = await supabase.storage
            .from('teacher_documents')
            .upload(filePath, file);

        if (uploadError) {
            setError(`Upload failed: ${uploadError.message}`);
            setIsUploading(false);
            return;
        }

        const { data: publicURLData } = supabase.storage.from('teacher_documents').getPublicUrl(filePath);

        const newDocument: TeacherDocument = {
            id: `doc-${Date.now()}`,
            teacherId: teacher.id,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            storagePath: filePath,
            uploadDate: new Date().toISOString(),
            tenantId: currentTenantId,
        };
        
        // In a real app, this would insert into a database table
        setDocuments(prev => [...prev, newDocument]);
        */
        
        // --- MOCK LOGIC ---
        const newDocument: TeacherDocument = {
            id: `doc-${Date.now()}`,
            teacherId: teacher.id,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            storagePath: filePath,
            uploadDate: new Date().toISOString(),
            tenantId: currentTenantId,
        };
        setDocuments(prev => [...prev, newDocument]);
        
        setIsUploading(false);
    };

    const handleDelete = (docId: string) => {
        if(window.confirm("Are you sure you want to delete this document?")) {
            // Real logic would also delete from Supabase storage
            setDocuments(prev => prev.filter(d => d.id !== docId));
        }
    };

    // FIX: Add a return statement to render JSX.
    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Document Management</h3>
            <div className="mb-6">
                <FileUpload onFileRead={(content) => {
                    // This component handles Files, not string content, so create a mock file
                    const blob = new Blob([content], { type: 'text/plain' });
                    const file = new File([blob], "uploaded_file.txt", { type: "text/plain" });
                    handleFileUpload(file);
                }} />
                {isUploading && <p className="text-sm mt-2">Uploading...</p>}
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {teacherDocs.map(doc => (
                            <tr key={doc.id}>
                                <td className="px-4 py-3 font-medium">{doc.fileName}</td>
                                <td className="px-4 py-3 text-sm">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                                <td className="px-4 py-3 text-sm">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <a href="#" className="text-brand-primary" title="Download"><ArrowDownTrayIcon className="w-5 h-5"/></a>
                                        <button onClick={() => handleDelete(doc.id)} className="text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {teacherDocs.length === 0 && <p className="text-center text-gray-500 py-8">No documents uploaded.</p>}
            </div>
        </div>
    );
};

export default TeacherProfileDocuments;
