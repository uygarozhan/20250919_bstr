import React, { useState, useMemo } from 'react';
import type { Tenant, User, Project } from '../types';
import { RoleName } from '../types';
import { PencilIcon, PlusCircleIcon, BriefcaseIcon, UsersIcon, ShieldCheckIcon } from './icons/Icons';
import { useCallback } from 'react';
import { TenantEditModal } from './modals/TenantEditModal';
import { TenantAdminManagementModal } from './modals/TenantAdminManagementModal';

interface TenantManagementProps {
    currentUser: User;
    tenants: Tenant[];
    onUpdateTenant: (tenant: Tenant, adminUser: Partial<User> & { id: number; }) => void;
    onCreateTenantAndAdmin: (data: {
        tenantName: string;
        adminUser: {
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
        };
        adminPositionName: string;
    }) => void;
    onResetPassword: (userId: number) => void;
    onReassignAdmin: (oldAdminId: number, newAdminId: number) => void;
    users: User[];
    projects: Project[];
}

const getStatusBadge = (isActive: boolean) => {
    return isActive 
        ? 'px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700'
        : 'px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700';
};

export const TenantManagement: React.FC<TenantManagementProps> = ({ 
    currentUser, tenants, onUpdateTenant, onCreateTenantAndAdmin, onResetPassword, onReassignAdmin, users, projects 
}) => {
    if (!currentUser.is_super_admin) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-700">Access Denied</h1>
                    <p className="text-gray-500 mt-2">Only Super Administrators can manage tenants.</p>
                </div>
            </div>
        );
    }
    
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [managingTenant, setManagingTenant] = useState<Tenant | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingTenantId, setDeletingTenantId] = useState<number | null>(null);
    const handleDeleteTenant = useCallback(async (tenantId: number) => {
        if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;
        setDeletingTenantId(tenantId);
        try {
            const res = await fetch(`/api/v1/tenant/${tenantId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_super_admin: true }) });
            if (res.ok) {
                window.location.reload(); // Or trigger a state update if tenants are managed in state
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete tenant.');
            }
        } catch (err) {
            alert('Failed to delete tenant.');
        } finally {
            setDeletingTenantId(null);
        }
    }, []);

    const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSaveTenant = (data: any) => {
        if (data.tenant) { // Editing existing tenant
            onUpdateTenant(data.tenant, data.adminUser);
        } else { // Adding new tenant with admin
            onCreateTenantAndAdmin(data);
        }
        setEditingTenant(null);
        setAddModalOpen(false);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Tenant Management</h2>
                    <button onClick={() => setAddModalOpen(true)} className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-secondary transition duration-200">
                        <PlusCircleIcon />
                        <span className="ml-2">Add New Tenant</span>
                    </button>
                </div>
                
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Tenants</label>
                    <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by tenant name..."
                        className="w-full md:w-1/3 text-sm p-2 border rounded-md"
                    />
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Tenant</th>
                                <th scope="col" className="px-6 py-3">Administrator</th>
                                <th scope="col" className="px-6 py-3 text-center">Projects</th>
                                <th scope="col" className="px-6 py-3 text-center">Users</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTenants.map(tenant => {
                                const projectCount = projects.filter(p => p.tenant_id === tenant.id).length;
                                const userCount = users.filter(u => u.tenant_id === tenant.id).length;
                                const adminUser = users.find(u => u.tenant_id === tenant.id && u.roles.some(r => r.name === RoleName.Administrator));
                                return (
                                <tr key={tenant.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{tenant.name}</div>
                                        <div className="text-xs font-mono text-gray-500">ID: {tenant.id}</div>
                                    </td>
                                     <td className="px-6 py-4">
                                        {adminUser ? (
                                            <>
                                                <div className="font-medium text-gray-800">{adminUser.firstName} {adminUser.lastName}</div>
                                                <div className="text-xs text-gray-500">{adminUser.email}</div>
                                            </>
                                        ) : (
                                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">No Admin Found</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2 text-gray-600">
                                            <BriefcaseIcon />
                                            <span className="font-semibold">{projectCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2 text-gray-600">
                                            <UsersIcon />
                                            <span className="font-semibold">{userCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={getStatusBadge(tenant.active)}>
                                            {tenant.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex items-center space-x-2">
                                        <button onClick={() => setEditingTenant(tenant)} className="text-gray-500 hover:text-blue-600 p-1" title="Edit Tenant Details"><PencilIcon /></button>
                                        <button onClick={() => setManagingTenant(tenant)} className="text-gray-500 hover:text-green-600 p-1" title="Manage Tenant Admin"><ShieldCheckIcon /></button>
                                        <button
                                            onClick={() => handleDeleteTenant(tenant.id)}
                                            className={`text-gray-500 hover:text-red-600 p-1 ${deletingTenantId === tenant.id ? 'opacity-50 pointer-events-none' : ''}`}
                                            title="Delete Tenant"
                                            disabled={deletingTenantId === tenant.id}
                                        >
                                            {deletingTenantId === tenant.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                     {filteredTenants.length === 0 && (
                        <div className="text-center py-12 text-gray-500"><p>No tenants found.</p></div>
                    )}
                </div>
            </div>
            
            {(isAddModalOpen || editingTenant) && (
                <TenantEditModal
                    isOpen={isAddModalOpen || !!editingTenant}
                    onClose={() => { setAddModalOpen(false); setEditingTenant(null); }}
                    onSave={handleSaveTenant}
                    tenantToEdit={editingTenant}
                    users={users}
                />
            )}
            
            {managingTenant && (
                <TenantAdminManagementModal
                    isOpen={!!managingTenant}
                    onClose={() => setManagingTenant(null)}
                    tenant={managingTenant}
                    users={users}
                    onResetPassword={onResetPassword}
                    onReassignAdmin={onReassignAdmin}
                />
            )}
        </>
    );
};