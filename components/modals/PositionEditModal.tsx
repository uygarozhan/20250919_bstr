import React, { useState, useEffect } from 'react';
import type { Position } from '../../types';
import { BookmarkSquareIcon } from '../icons/Icons';

interface PositionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (position: Omit<Position, 'id'> | Position) => void;
  positionToEdit?: Position | null;
  tenantId: number;
}

export const PositionEditModal: React.FC<PositionEditModalProps> = ({ isOpen, onClose, onSave, positionToEdit, tenantId }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(positionToEdit ? positionToEdit.name : '');
  }, [positionToEdit, isOpen]);

  const handleSave = () => {
    if (name.trim() === '') {
        alert('Position name cannot be empty.');
        return;
    }
    if (positionToEdit) {
      onSave({ ...positionToEdit, name });
    } else {
      onSave({ name, tenant_id: tenantId });
    }
  };

  if (!isOpen) return null;
  
  const modalTitle = positionToEdit ? 'Edit Position' : 'Add New Position';

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex justify-center items-center"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md sm:w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
             <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 text-blue-600">
              <BookmarkSquareIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {modalTitle}
              </h3>
              <div className="mt-4">
                 <label htmlFor="positionName" className="block text-sm font-medium text-gray-700">Position Name</label>
                <input
                  type="text"
                  id="positionName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full text-sm p-2 border rounded-md"
                  placeholder="e.g., Senior Engineer"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};