import React, { useState, useEffect } from 'react';
import type { Supplier } from '../../types';
import { BuildingOfficeIcon } from '../icons/Icons';

interface SupplierEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => void;
  supplierToEdit?: Supplier | null;
  tenantId: number;
}

export const SupplierEditModal: React.FC<SupplierEditModalProps> = ({ isOpen, onClose, onSave, supplierToEdit, tenantId }) => {
  
  const getInitialState = () => {
      // FIX: Explicitly type the new supplier object to ensure its `active` property is inferred as `boolean`, not the literal `true`.
      // This prevents type mismatch errors in state update handlers.
      const newSupplier: Omit<Supplier, 'id'> = {
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        active: true,
        tenant_id: tenantId,
      };
      return supplierToEdit || newSupplier;
  };

  const [supplier, setSupplier] = useState(getInitialState());

  useEffect(() => {
    setSupplier(getInitialState());
  }, [supplierToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSupplier(prev => {
        // Type guard to satisfy TypeScript when spreading a union type
        if ('id' in prev) {
            return { ...prev, [name]: value };
        }
        return { ...prev, [name]: value };
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupplier(prev => {
        const active = e.target.value === 'active';
        // Type guard to satisfy TypeScript when spreading a union type
        if ('id' in prev) {
            return { ...prev, active };
        }
        return { ...prev, active };
    });
  };

  const handleSave = () => {
    if (supplier.name.trim() === '') {
        alert('Supplier name cannot be empty.');
        return;
    }
    onSave(supplier);
  };

  if (!isOpen) return null;
  
  const modalTitle = supplierToEdit ? 'Edit Supplier' : 'Add New Supplier';

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex justify-center items-center"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-xl sm:w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
             <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 text-blue-600">
              <BuildingOfficeIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {modalTitle}
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Supplier Name*</label>
                    <input type="text" name="name" value={supplier.name} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <input type="text" name="contact_person" value={supplier.contact_person} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={supplier.email} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input type="tel" name="phone" value={supplier.phone} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input type="text" name="address" value={supplier.address} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center space-x-4 mt-2">
                        <label className="flex items-center">
                            <input type="radio" name="status" value="active" checked={supplier.active} onChange={handleStatusChange} className="form-radio text-primary" />
                            <span className="ml-2">Active</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="status" value="inactive" checked={!supplier.active} onChange={handleStatusChange} className="form-radio text-primary" />
                            <span className="ml-2">Inactive</span>
                        </label>
                    </div>
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
            Save
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
