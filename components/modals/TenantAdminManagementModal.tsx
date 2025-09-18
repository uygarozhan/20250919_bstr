import React, { useState, useMemo } from 'react';
import type { Tenant, User } from '../../types';
import { RoleName } from '../../types';
import { ShieldCheckIcon, KeyIcon, UsersIcon } from '../icons/Icons';
import { ConfirmationModal } from './ConfirmationModal';

interface TenantAdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  users: User[];
  onResetPassword: (userId: number) => void;
  onReassignAdmin: (oldAdminId: number, newAdminId: number) => void;
}

export const TenantAdminManagementModal: React.FC<TenantAdminManagementModalProps> = ({ 
    isOpen, onClose, tenant, users, onResetPassword, onReassignAdmin 
}) => {
  
  const [selectedNewAdminId, setSelectedNewAdminId] = useState<string>('');
  const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isReassignConfirmOpen, setReassignConfirmOpen] = useState(false);

  const tenantUsers = useMemo(() => {
    return users.filter(u => u.tenant_id === tenant.id);
  }, [users, tenant.id]);

  const currentAdmin = useMemo(() => {
    return tenantUsers.find(u => u.roles.some(r => r.name === RoleName.Administrator));
  }, [tenantUsers]);

  const otherUsers = useMemo(() => {
    return tenantUsers.filter(u => u.id !== currentAdmin?.id);
  }, [tenantUsers, currentAdmin]);

  const newAdminSelection = useMemo(() => {
    return users.find(u => u.id === parseInt(selectedNewAdminId, 10));
  }, [users, selectedNewAdminId]);


  const handleConfirmResetPassword = () => {
    if (currentAdmin) {
        onResetPassword(currentAdmin.id);
    }
    setResetConfirmOpen(false);
  };
  
  const handleConfirmReassignAdmin = () => {
    if (currentAdmin && selectedNewAdminId) {
        onReassignAdmin(currentAdmin.id, parseInt(selectedNewAdminId, 10));
    }
    setReassignConfirmOpen(false);
    setSelectedNewAdminId('');
  };


  if (!isOpen) return null;

  return (
    <>
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
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10 text-green-600">
                <ShieldCheckIcon />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Manage Administrator for {tenant.name}
                </h3>
                <div className="mt-4 space-y-6">
                  
                  {currentAdmin ? (
                    <>
                    {/* Current Admin Section */}
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <h4 className="text-md font-medium text-gray-800 mb-2">Current Administrator</h4>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{currentAdmin.firstName} {currentAdmin.lastName}</p>
                                <p className="text-sm text-gray-500">{currentAdmin.email}</p>
                            </div>
                            <button 
                                onClick={() => setResetConfirmOpen(true)}
                                className="flex items-center text-sm bg-yellow-100 text-yellow-800 font-semibold px-3 py-2 rounded-lg hover:bg-yellow-200 transition duration-200"
                            >
                                <KeyIcon />
                                <span className="ml-2">Reset Password</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Re-assign Section */}
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <h4 className="text-md font-medium text-gray-800 mb-2">Re-assign Administrator Role</h4>
                         <div className="flex items-end gap-4">
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-700">Select New Administrator</label>
                                <select 
                                    value={selectedNewAdminId} 
                                    onChange={e => setSelectedNewAdminId(e.target.value)}
                                    className="mt-1 w-full text-sm p-2 border rounded-md bg-white"
                                >
                                    <option value="" disabled>Select a user...</option>
                                    {otherUsers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.firstName} {u.lastName} ({u.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={() => setReassignConfirmOpen(true)}
                                className="flex items-center text-sm bg-blue-600 text-white font-semibold px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                                disabled={!selectedNewAdminId}
                            >
                                <UsersIcon />
                                <span className="ml-2">Re-assign Role</span>
                            </button>
                         </div>
                    </div>
                    </>
                  ) : (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                        <h4 className="font-semibold">No Administrator Found</h4>
                        <p className="text-sm">This tenant does not have a user with the Administrator role. Please assign one.</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modals */}
      {currentAdmin && (
          <ConfirmationModal
            isOpen={isResetConfirmOpen}
            onClose={() => setResetConfirmOpen(false)}
            onConfirm={handleConfirmResetPassword}
            title="Reset Password Confirmation"
          >
            <p>Are you sure you want to reset the password for <span className="font-semibold">{currentAdmin.firstName} {currentAdmin.lastName}</span>?</p>
            <p className="mt-2 text-sm text-gray-500">Their password will be set to the default: <span className="font-mono bg-gray-100 p-1 rounded">password</span>.</p>
          </ConfirmationModal>
      )}

      {currentAdmin && newAdminSelection && (
          <ConfirmationModal
            isOpen={isReassignConfirmOpen}
            onClose={() => setReassignConfirmOpen(false)}
            onConfirm={handleConfirmReassignAdmin}
            title="Re-assign Administrator Role"
          >
            <p>Are you sure you want to transfer the Administrator role?</p>
            <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                <li>From: <span className="font-semibold">{currentAdmin.firstName} {currentAdmin.lastName}</span></li>
                <li>To: <span className="font-semibold">{newAdminSelection.firstName} {newAdminSelection.lastName}</span></li>
            </ul>
            <p className="mt-2 font-semibold text-yellow-700">This action is immediate.</p>
          </ConfirmationModal>
      )}

    </>
  );
};