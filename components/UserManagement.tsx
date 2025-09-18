
import React, { useState, useMemo } from 'react';
import type { User, Discipline, Project, Position, Role } from '../types';
import { RoleName } from '../types';
import { PencilIcon, UserPlusIcon } from './icons/Icons';
import { UserEditModal } from './modals/UserEditModal';
import { UserAddModal } from './modals/UserAddModal';

interface UserManagementProps {
    currentUser: User;
    users: User[];
    onUpdateUser: (user: User) => void;
    onCreateUser: (user: Omit<User, 'id'>) => void;
    disciplines: Discipline[];
    projects: Project[];
    positions: Position[];
    roles: Role[];
}

const getStatusBadge = (isActive: boolean) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full leading-tight';
  if (isActive) {
    return `${baseClasses} bg-green-100 text-green-700`;
  }
  return `${baseClasses} bg-gray-200 text-gray-700`;
};

const getRoleBadge = (roleName: RoleName) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full leading-tight';
    switch (roleName) {
        case RoleName.Administrator:
            return `${baseClasses} bg-red-100 text-red-800`;
        case RoleName.MTF_Approver:
            return `${baseClasses} bg-blue-100 text-blue-800`;
        case RoleName.STF_Approver:
            return `${baseClasses} bg-teal-100 text-teal-800`;
        case RoleName.Requester:
            return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case RoleName.Viewer:
            return `${baseClasses} bg-gray-100 text-gray-800`;
        default:
            return `${baseClasses} bg-gray-100 text-gray-800`;
    }
};


export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, users, onUpdateUser, onCreateUser, disciplines, projects, positions, roles }) => {
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
    
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    const tenantUsers = useMemo(() => users.filter(u => u.tenant_id === currentUser.tenant_id), [users, currentUser.tenant_id]);
    const tenantProjects = useMemo(() => projects.filter(p => p.tenant_id === currentUser.tenant_id), [projects, currentUser.tenant_id]);
    const tenantDisciplines = useMemo(() => disciplines.filter(d => d.tenant_id === currentUser.tenant_id), [disciplines, currentUser.tenant_id]);
    const tenantPositions = useMemo(() => positions.filter(p => p.tenant_id === currentUser.tenant_id), [positions, currentUser.tenant_id]);

    
    const initialFilters = {
        name: '',
        role: '',
        status: 'all', // 'all', 'active', 'inactive'
    };
    const [filters, setFilters] = useState(initialFilters);

    const filteredUsers = useMemo(() => {
        return tenantUsers.filter(user => {
            const nameMatch = filters.name ? 
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(filters.name.toLowerCase()) || 
                user.email.toLowerCase().includes(filters.name.toLowerCase()) : 
                true;
            
            const roleMatch = filters.role ? 
                user.roles.some(role => role.name === filters.role) : 
                true;

            const statusMatch = filters.status === 'all' ? true :
                filters.status === 'active' ? user.active :
                !user.active;
            
            return nameMatch && roleMatch && statusMatch;
        });
    }, [tenantUsers, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveUser = (updatedUser: User) => {
        onUpdateUser(updatedUser);
        setEditingUser(null);
    };

    const handleSaveNewUser = (newUser: Omit<User, 'id'>) => {
        onCreateUser(newUser);
        setIsAddUserModalOpen(false);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                    <button 
                        onClick={() => setIsAddUserModalOpen(true)}
                        className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-secondary transition duration-200"
                    >
                        <UserPlusIcon />
                        <span className="ml-2">Add User</span>
                    </button>
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name / Email</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={filters.name}
                            onChange={handleFilterChange}
                            placeholder="Search by name or email..."
                            className="w-full text-sm p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={filters.role}
                            onChange={handleFilterChange}
                            className="w-full text-sm p-2 border rounded-md bg-white"
                        >
                            <option value="">All Roles</option>
                            {Object.values(RoleName).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full text-sm p-2 border rounded-md bg-white"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3">Contact</th>
                                <th scope="col" className="px-6 py-3">Roles & Status</th>
                                <th scope="col" className="px-6 py-3">Assigned Projects</th>
                                <th scope="col" className="px-6 py-3">Assigned Disciplines</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => {
                                const uniqueAssignedDisciplines = Array.from(
                                    user.discipline_ids.reduce((map, id) => {
                                        const discipline = tenantDisciplines.find(d => d.id === id);
                                        if (discipline) {
                                            map.set(discipline.discipline_code, discipline.discipline_name);
                                        }
                                        return map;
                                    }, new Map<string, string>())
                                );

                                return (
                                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        <div className="font-semibold text-gray-800">{user.firstName} {user.lastName}</div>
                                        <div className="text-xs text-gray-500">{user.position.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{user.email}</div>
                                        <div className="text-xs text-gray-500">{user.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={getStatusBadge(user.active)}>
                                                {user.active ? 'Active' : 'Inactive'}
                                            </span>
                                            {user.roles.map(role => (
                                                <span key={role.id} className={getRoleBadge(role.name)}>{role.name}{role.level ? ` L${role.level}` : ''}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.project_ids.map(id => {
                                                const project = projects.find(p => p.id === id);
                                                return project ? (
                                                    <span key={id} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{project.code}</span>
                                                ) : null;
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {uniqueAssignedDisciplines.map(([code, name]) => (
                                                <span key={code} title={name} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{code}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => setEditingUser(user)}
                                            className="text-gray-500 hover:text-blue-600 p-1" 
                                            title="Edit User"
                                        >
                                            <PencilIcon />
                                        </button>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No users found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
            {editingUser && (
                <UserEditModal
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                    userToEdit={editingUser}
                    users={tenantUsers}
                    allRoles={roles}
                    allProjects={tenantProjects}
                    allDisciplines={tenantDisciplines}
                    allPositions={tenantPositions}
                />
            )}
            {isAddUserModalOpen && (
                <UserAddModal
                    isOpen={isAddUserModalOpen}
                    onClose={() => setIsAddUserModalOpen(false)}
                    onSave={handleSaveNewUser}
                    allRoles={roles}
                    allProjects={tenantProjects}
                    allDisciplines={tenantDisciplines}
                    allPositions={tenantPositions}
                    tenantId={currentUser.tenant_id!}
                />
            )}
        </>
    );
};
