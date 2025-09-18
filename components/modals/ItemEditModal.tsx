import React, { useState, useEffect } from 'react';
import type { ItemLibrary } from '../../types';
import { CogIcon } from '../icons/Icons';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ItemLibrary) => void;
  itemToEdit: ItemLibrary;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({ isOpen, onClose, onSave, itemToEdit }) => {
  const [editedItem, setEditedItem] = useState<ItemLibrary>(itemToEdit);

  useEffect(() => {
    setEditedItem(itemToEdit);
  }, [itemToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedItem(prev => ({ 
        ...prev, 
        [name]: name === 'budget_unit_price' ? (value === '' ? undefined : parseFloat(value)) : value 
    }));
  };

  const handleSave = () => {
    if (!editedItem.material_code.trim() || !editedItem.material_name.trim() || !editedItem.unit.trim()) {
        alert("Material Code, Name, and Unit are required.");
        return;
    }
    onSave(editedItem);
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
              <CogIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Edit Item
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Material Name*</label>
                    <input type="text" name="material_name" value={editedItem.material_name} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Material Code*</label>
                    <input type="text" name="material_code" value={editedItem.material_code} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="material_description" value={editedItem.material_description ?? ''} onChange={handleChange} rows={3} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Unit*</label>
                    <input type="text" name="unit" value={editedItem.unit} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Budget Unit Price</label>
                    <input type="number" name="budget_unit_price" value={editedItem.budget_unit_price ?? ''} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
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
            Save Changes
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