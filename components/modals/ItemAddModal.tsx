import React, { useState } from 'react';
import type { ItemLibrary } from '../../types';
import { CogIcon } from '../icons/Icons';

interface ItemAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<ItemLibrary, 'id'>) => void;
  tenantId: number;
}

const getInitialState = (tenantId: number): Omit<ItemLibrary, 'id'> => ({
    tenant_id: tenantId,
    material_code: '',
    material_name: '',
    material_description: '',
    unit: '',
    budget_unit_price: undefined,
});

export const ItemAddModal: React.FC<ItemAddModalProps> = ({ isOpen, onClose, onSave, tenantId }) => {
  const [newItem, setNewItem] = useState(getInitialState(tenantId));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ 
        ...prev, 
        [name]: name === 'budget_unit_price' ? (value === '' ? undefined : parseFloat(value)) : value 
    }));
  };

  const handleSave = () => {
    if (!newItem.material_code.trim() || !newItem.material_name.trim() || !newItem.unit.trim()) {
        alert("Material Code, Name, and Unit are required.");
        return;
    }
    const finalItem = { ...newItem };
    if (!finalItem.material_description?.trim()) {
        finalItem.material_description = finalItem.material_name;
    }
    onSave(finalItem);
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
                Add New Item
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Material Name*</label>
                    <input type="text" name="material_name" value={newItem.material_name} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Material Code*</label>
                    <input type="text" name="material_code" value={newItem.material_code} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="material_description" value={newItem.material_description ?? ''} onChange={handleChange} rows={3} className="mt-1 w-full text-sm p-2 border rounded-md" placeholder="Defaults to material name if left blank" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Unit*</label>
                    <input type="text" name="unit" value={newItem.unit} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Budget Unit Price</label>
                    <input type="number" name="budget_unit_price" value={newItem.budget_unit_price ?? ''} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
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
            Save Item
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