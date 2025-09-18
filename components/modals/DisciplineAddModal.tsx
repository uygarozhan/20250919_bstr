
import React, { useState } from 'react';
import type { Discipline } from '../../types';
import { TagIcon } from '../icons/Icons';

interface DisciplineAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (discipline: Omit<Discipline, 'id'>) => void;
  tenantId: number;
}

const getInitialState = (tenantId: number): Omit<Discipline, 'id'> => ({
    tenant_id: tenantId,
    discipline_code: '',
    discipline_name: '',
    budget_code: '',
    budget_name: '',
});

export const DisciplineAddModal: React.FC<DisciplineAddModalProps> = ({ isOpen, onClose, onSave, tenantId }) => {
  const [newDiscipline, setNewDiscipline] = useState(getInitialState(tenantId));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDiscipline(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!newDiscipline.discipline_code.trim() || !newDiscipline.discipline_name.trim() || !newDiscipline.budget_code.trim() || !newDiscipline.budget_name.trim()) {
        alert("All fields are required.");
        return;
    }
    onSave(newDiscipline);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-xl sm:w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
             <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 text-blue-600">
              <TagIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Add New Discipline
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Discipline Name*</label>
                    <input type="text" name="discipline_name" value={newDiscipline.discipline_name} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Discipline Code*</label>
                    <input type="text" name="discipline_code" value={newDiscipline.discipline_code} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Budget Name*</label>
                    <input type="text" name="budget_name" value={newDiscipline.budget_name} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Budget Code*</label>
                    <input type="text" name="budget_code" value={newDiscipline.budget_code} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary sm:ml-3 sm:w-auto sm:text-sm"
            onClick={handleSave}
          >
            Save Discipline
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
