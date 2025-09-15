import React, { useState, useMemo } from 'react';
import type { Curriculum, AcademicStructure, ClassGroup } from '../types';
import { PlusIcon, CheckIcon, XMarkIcon, PencilIcon, TrashIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { FormInput } from './FormControls';

interface CurriculumManagerProps {
  academicStructure: AcademicStructure;
  onUpdateCurricula: (newCurricula: Curriculum[]) => void;
  classGroups: ClassGroup[];
  currentTenantId: string;
}

const CurriculumManager: React.FC<CurriculumManagerProps> = ({ academicStructure, onUpdateCurricula, classGroups, currentTenantId }) => {
  const { curricula, subjects } = academicStructure;

  const [newRowName, setNewRowName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [curriculumToDelete, setCurriculumToDelete] = useState<Curriculum | null>(null);

  const isCurriculumInUse = useMemo(() => {
    const inUseMap = new Map<string, boolean>();
    curricula.forEach(c => {
      const usedInSubjects = subjects.some(s => s.curriculumIds.includes(c.id));
      const usedInClassGroups = classGroups.some(cg => cg.curriculumId === c.id);
      inUseMap.set(c.id, usedInSubjects || usedInClassGroups);
    });
    return inUseMap;
  }, [curricula, subjects, classGroups]);

  const handleStartEdit = (curriculum: Curriculum) => {
    setEditingId(curriculum.id);
    setEditingName(curriculum.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim() !== '') {
      onUpdateCurricula(curricula.map(c => (c.id === editingId ? { ...c, name: editingName.trim() } : c)));
      handleCancelEdit();
    }
  };

  const handleAdd = () => {
    if (newRowName.trim()) {
      const newCurriculum: Curriculum = {
        id: `curr-${Date.now()}`,
        tenantId: currentTenantId,
        name: newRowName.trim(),
      };
      onUpdateCurricula([...curricula, newCurriculum]);
      setNewRowName('');
    }
  };

  const handleDelete = () => {
    if (curriculumToDelete) {
      onUpdateCurricula(curricula.filter(c => c.id !== curriculumToDelete.id));
      setCurriculumToDelete(null);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm flex flex-col h-full">
        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Curricula</h3>
        <div className="flex gap-2 mb-4">
          <FormInput
            type="text"
            value={newRowName}
            onChange={e => setNewRowName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add new curriculum..."
            className="flex-grow min-w-0 !mt-0"
          />
          <button
            onClick={handleAdd}
            className="bg-brand-primary text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm font-semibold hover:bg-rose-900 transition-colors disabled:bg-rose-300 disabled:cursor-not-allowed flex-shrink-0"
            disabled={!newRowName.trim()}
          >
            <PlusIcon className="w-4 h-4" />
            Add
          </button>
        </div>
        <div className="flex-grow flex items-center justify-center">
          {curricula.length === 0 ? (
            <p className="text-sm text-brand-text-light dark:text-gray-400 text-center py-4">No curricula added yet.</p>
          ) : (
            <div className="w-full space-y-2 pr-2 max-h-60 overflow-y-auto">
              {curricula.map((curriculum) => (
                <div key={curriculum.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  {editingId === curriculum.id ? (
                    <>
                      <FormInput
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        autoFocus
                        className="flex-grow !mt-0"
                      />
                      <div className="flex items-center ml-2">
                        <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-700"><CheckIcon className="w-5 h-5"/></button>
                        <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 ml-1"><XMarkIcon className="w-5 h-5"/></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-800 dark:text-gray-300">{curriculum.name}</span>
                      <div className="flex items-center">
                        <button onClick={() => handleStartEdit(curriculum)} className="text-brand-accent hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                          <PencilIcon className="w-4 h-4"/>
                        </button>
                        <button onClick={() => setCurriculumToDelete(curriculum)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-2">
                          <TrashIcon className="w-4 h-4"/>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {curriculumToDelete && (
        <ConfirmationModal
          isOpen={!!curriculumToDelete}
          onClose={() => setCurriculumToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Curriculum"
          message={`Are you sure you want to delete "${curriculumToDelete.name}"? ${isCurriculumInUse.get(curriculumToDelete.id) ? 'This curriculum is currently in use and deleting it may affect subjects and class groups.' : ''}`}
        />
      )}
    </>
  );
};

export default CurriculumManager;