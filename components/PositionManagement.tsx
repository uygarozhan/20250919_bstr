import React, { useState, useMemo } from 'react';
import type { Position, User } from '../types';
import { PencilIcon, PlusCircleIcon, TrashIcon } from './icons/Icons';
import { PositionEditModal } from './modals/PositionEditModal';
import { ConfirmationModal } from './modals/ConfirmationModal';

interface PositionManagementProps {
    currentUser: User;
    positions: Position[];
    onUpdatePosition?: (updatedPosition: Position) => void;
    onCreatePosition?: (newPositionData: Omit<Position, 'id'>) => void;
}

export const PositionManagement: React.FC<PositionManagementProps> = ({ 
    currentUser, 
    positions, 
    onUpdatePosition,
    onCreatePosition
}) => {
    if (currentUser.is_super_admin) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-700">Access Denied</h1>
                    <p className="text-gray-500 mt-2">This page is for tenant-level administrators.</p>
                </div>
            </div>
        );
    }
    
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const tenantPositions = useMemo(() => positions.filter(p => p.tenant_id === currentUser.tenant_id), [positions, currentUser.tenant_id]);
    
    const filteredPositions = useMemo(() => {
        return tenantPositions.filter(pos => pos.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [tenantPositions, searchTerm]);

    const handleSavePosition = (positionData: Omit<Position, 'id'> | Position) => {
        if ('id' in positionData) { // Editing
            if (onUpdatePosition) {
                onUpdatePosition(positionData);
            }
        } else { // Adding
            if (onCreatePosition) {
                onCreatePosition(positionData);
            }
        }
        setEditingPosition(null);
        setAddModalOpen(false);
    };

    const handleDeletePosition = () => {
        // In a real app, you would make an API call to delete the position
        // For now, we'll just close the modal
        setDeletingPosition(null);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Position Management</h2>
                    <button onClick={() => setAddModalOpen(true)} className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-secondary transition duration-200">
                        <PlusCircleIcon />
                        <span className="ml-2">Add New Position</span>
                    </button>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Positions</label>
                    <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by position name..."
                        className="w-full md:w-1/3 text-sm p-2 border rounded-md"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Position Name</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPositions.map(pos => (
                                <tr key={pos.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{pos.name}</td>
                                    <td className="px-6 py-4 flex items-center space-x-2">
                                        <button onClick={() => setEditingPosition(pos)} className="text-gray-500 hover:text-blue-600 p-1" title="Edit Position"><PencilIcon /></button>
                                        <button onClick={() => setDeletingPosition(pos)} className="text-gray-500 hover:text-red-600 p-1" title="Delete Position"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPositions.length === 0 && (
                        <div className="text-center py-12 text-gray-500"><p>No positions found.</p></div>
                    )}
                </div>
            </div>
            
            {(isAddModalOpen || editingPosition) && (
                <PositionEditModal
                    isOpen={isAddModalOpen || !!editingPosition}
                    onClose={() => { setAddModalOpen(false); setEditingPosition(null); }}
                    onSave={handleSavePosition}
                    positionToEdit={editingPosition}
                    tenantId={currentUser.tenant_id!}
                />
            )}

            {deletingPosition && (
                <ConfirmationModal
                    isOpen={!!deletingPosition}
                    onClose={() => setDeletingPosition(null)}
                    onConfirm={handleDeletePosition}
                    title="Delete Position"
                >
                   <p>Are you sure you want to delete the position "{deletingPosition.name}"?</p>
                   <p className="mt-2 text-xs text-yellow-600">Note: Deleting a position that is assigned to users may cause issues. This action is irreversible in this demo.</p>
                </ConfirmationModal>
            )}
        </>
    );
};
