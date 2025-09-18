import React, { useState, useEffect } from 'react';
import type { Tenant, User } from '../../types';
import { RoleName } from '../../types';
import { BuildingOfficeIcon } from '../icons/Icons';

interface TenantEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  tenantToEdit?: Tenant | null;
  users?: User[];
}

export const TenantEditModal: React.FC<TenantEditModalProps> = ({ isOpen, onClose, onSave, tenantToEdit, users }) => {
  const [name, setName] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPositionName, setAdminPositionName] = useState('Administrator');
  const [adminUserId, setAdminUserId] = useState<number | null>(null);

  const isAddMode = !tenantToEdit;

  useEffect(() => {
    if (isOpen) {
        if (tenantToEdit) {
            setName(tenantToEdit.name);
            const adminUser = users?.find(u => u.tenant_id === tenantToEdit.id && u.roles.some(r => r.name === RoleName.Administrator));
            if (adminUser) {
                setAdminFirstName(adminUser.firstName);
                setAdminLastName(adminUser.lastName);
                setAdminEmail(adminUser.email);
                setAdminPhone(adminUser.phone);
                setAdminPositionName(adminUser.position.name);
                setAdminUserId(adminUser.id);
            } else {
                 setAdminFirstName('');
                 setAdminLastName('');
                 setAdminEmail('');
                 setAdminPhone('');
                 setAdminPositionName('');
                 setAdminUserId(null);
            }
        } else {
            // Reset for 'add' mode
            setName('');
            setAdminFirstName('');
            setAdminLastName('');
            setAdminEmail('');
            setAdminPhone('');
            setAdminPositionName('Administrator');
            setAdminUserId(null);
        }
    }
  }, [tenantToEdit, isOpen, users]);

  const handleSave = () => {
     if (isAddMode) {
        if (!name.trim() || !adminFirstName.trim() || !adminLastName.trim() || !adminEmail.trim()) {
            alert('Please fill out all required fields for the tenant and the administrator.');
            return;
        }
        onSave({
            tenantName: name,
            adminUser: {
                firstName: adminFirstName,
                lastName: adminLastName,
                email: adminEmail,
                phone: adminPhone,
            },
            adminPositionName: adminPositionName,
        });
    } else {
        if (!adminUserId) {
            alert('Could not find an administrator for this tenant to update.');
            return;
        }
        if (name.trim() === '' || !adminFirstName.trim() || !adminLastName.trim() || !adminEmail.trim()) {
            alert('Please fill out all required fields for the tenant and the administrator.');
            return;
        }
        onSave({
            tenant: { ...tenantToEdit, name },
            adminUser: {
                id: adminUserId,
                firstName: adminFirstName,
                lastName: adminLastName,
                email: adminEmail,
                phone: adminPhone,
            }
        });
    }
  };

  if (!isOpen) return null;
  
  const modalTitle = tenantToEdit ? 'Edit Tenant' : 'Add New Tenant';

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
              <div className="mt-4 space-y-4">
                 <div>
                    <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">Tenant Name*</label>
                    <input
                    type="text"
                    id="tenantName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full text-sm p-2 border rounded-md"
                    placeholder="e.g., Global Construction Inc."
                    />
                 </div>

                 <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="text-md font-medium text-gray-800 mb-2">
                        {isAddMode ? 'Initial Administrator Account' : 'Tenant Administrator'}
                    </h4>
                    {isAddMode && (
                        <p className="text-xs text-gray-500 mb-4">Every tenant needs an administrator. This user will be able to manage projects, users, and other settings for the new tenant.</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name*</label>
                            <input type="text" value={adminFirstName} onChange={e => setAdminFirstName(e.target.value)} className="mt-1 w-full text-sm p-2 border rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name*</label>
                            <input type="text" value={adminLastName} onChange={e => setAdminLastName(e.target.value)} className="mt-1 w-full text-sm p-2 border rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email*</label>
                            <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="mt-1 w-full text-sm p-2 border rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="tel" value={adminPhone} onChange={e => setAdminPhone(e.target.value)} className="mt-1 w-full text-sm p-2 border rounded-md"/>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Position Name</label>
                            {isAddMode ? (
                                <>
                                    <input type="text" value={adminPositionName} onChange={e => setAdminPositionName(e.target.value)} className="mt-1 w-full text-sm p-2 border rounded-md"/>
                                    <p className="text-xs text-gray-500 mt-1">A new position with this name will be created for this tenant.</p>
                                </>
                            ) : (
                                <input type="text" value={adminPositionName} readOnly className="mt-1 w-full text-sm p-2 border rounded-md bg-gray-100 cursor-not-allowed"/>
                            )}
                        </div>
                    </div>
                </div>
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