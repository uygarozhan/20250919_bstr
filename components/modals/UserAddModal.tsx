
import React, { useState, useEffect, useMemo } from 'react';
import type { User, Role, Project, Discipline, GroupedDiscipline, Position } from '../../types';
import { RoleName } from '../../types';
import { UserPlusIcon } from '../icons/Icons';

interface UserAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id'>) => void;
  allRoles: Role[];
  allProjects: Project[];
  allDisciplines: Discipline[];
  allPositions: Position[];
  tenantId: number;
}
// FIX: Added missing properties (projects, disciplines, position_id) to the initial state to match the User type.
const getInitialState = (tenantId: number, defaultPosition: Position | undefined): Omit<User, 'id'> => ({
    tenant_id: tenantId,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: defaultPosition || { id: -1, tenant_id: tenantId, name: 'Default' },
    position_id: defaultPosition?.id || -1,
    roles: [],
    active: true,
    projects: [],
    disciplines: [],
    project_ids: [],
    discipline_ids: [],
});


export const UserAddModal: React.FC<UserAddModalProps> = ({ isOpen, onClose, onSave, allRoles, allProjects, allDisciplines, allPositions, tenantId }) => {
  const [newUser, setNewUser] = useState(getInitialState(tenantId, allPositions[0]));
  
  const isFormValid = useMemo(() => {
    return newUser.firstName.trim() !== '' && newUser.lastName.trim() !== '' && newUser.email.trim() !== '';
  }, [newUser]);
  
  useEffect(() => {
    if (isOpen) {
        setNewUser(getInitialState(tenantId, allPositions[0]));
    }
  }, [isOpen, tenantId, allPositions]);

  // When project assignments change, automatically remove assigned roles that are no longer valid.
  useEffect(() => {
    const userAssignedProjects = allProjects.filter(p => newUser.project_ids.includes(p.id));
    const maxMtfForUser = userAssignedProjects.length > 0 ? Math.max(0, ...userAssignedProjects.map(p => p.max_mtf_approval_level)) : 0;
    const maxStfForUser = userAssignedProjects.length > 0 ? Math.max(0, ...userAssignedProjects.map(p => p.max_stf_approval_level)) : 0;
    const maxOtfForUser = userAssignedProjects.length > 0 ? Math.max(0, ...userAssignedProjects.map(p => p.max_otf_approval_level)) : 0;

    const cleanedRoles = newUser.roles.filter(role => {
      if (role.name === RoleName.MTF_Approver) {
        return (role.level || 0) <= maxMtfForUser;
      }
      if (role.name === RoleName.STF_Approver) {
        return (role.level || 0) <= maxStfForUser;
      }
      if (role.name === RoleName.OTF_Approver) {
        return (role.level || 0) <= maxOtfForUser;
      }
      return true; // Keep all other roles
    });
    
    // Only update state if the roles have actually changed to prevent infinite loops
    if (JSON.stringify(cleanedRoles) !== JSON.stringify(newUser.roles)) {
        setNewUser(prev => ({ ...prev, roles: cleanedRoles }));
    }
  }, [newUser.project_ids, allProjects, newUser.roles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'position') {
        const selectedPosition = allPositions.find(p => p.id === parseInt(value, 10));
        if (selectedPosition) {
            setNewUser(prev => ({ ...prev, position: selectedPosition, position_id: selectedPosition.id }));
        }
    } else {
        setNewUser(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser(prev => ({ ...prev, active: e.target.value === 'active' }));
  };

  const handleRoleChange = (roleId: number, isChecked: boolean) => {
    setNewUser(prev => {
        const newRoles = isChecked
            ? [...prev.roles, allRoles.find(r => r.id === roleId)!]
            : prev.roles.filter(r => r.id !== roleId);
        return { ...prev, roles: newRoles };
    });
  };

  const handleProjectChange = (projectId: number, isChecked: boolean) => {
      setNewUser(prev => {
          const newProjectIds = isChecked
            ? [...prev.project_ids, projectId]
            : prev.project_ids.filter(id => id !== projectId);
          return { ...prev, project_ids: newProjectIds };
      });
  };
  
  const handleDisciplineGroupChange = (group: GroupedDiscipline, isChecked: boolean) => {
    const allIdsForGroup = group.budgets.map(b => b.id);
    setNewUser(prev => {
        const currentIds = new Set(prev.discipline_ids);
        if (isChecked) {
            allIdsForGroup.forEach(id => currentIds.add(id));
        } else {
            allIdsForGroup.forEach(id => currentIds.delete(id));
        }
        return { ...prev, discipline_ids: Array.from(currentIds) };
    });
  };

  const handleSaveChanges = () => {
    if (!isFormValid) return;
    onSave(newUser);
  };

  const generalRoles = useMemo(() => allRoles.filter(r => r.name !== RoleName.MTF_Approver && r.name !== RoleName.STF_Approver && r.name !== RoleName.OTF_Approver), [allRoles]);

  // Determine which approval roles are AVAILABLE to be assigned based on selected projects.
  const { availableMtfRoles, availableStfRoles, availableOtfRoles } = useMemo(() => {
    const userAssignedProjects = allProjects.filter(p => newUser.project_ids.includes(p.id));
    const maxMtfForUser = userAssignedProjects.length > 0 ? Math.max(0, ...userAssignedProjects.map(p => p.max_mtf_approval_level)) : 0;
    const maxStfForUser = userAssignedProjects.length > 0 ? Math.max(0, ...userAssignedProjects.map(p => p.max_stf_approval_level)) : 0;
    const maxOtfForUser = userAssignedProjects.length > 0 ? Math.max(0, ...userAssignedProjects.map(p => p.max_otf_approval_level)) : 0;
    
    return {
      availableMtfRoles: allRoles
        .filter(r => r.name === RoleName.MTF_Approver && (r.level || 0) <= maxMtfForUser)
        .sort((a,b) => (a.level || 0) - (b.level || 0)),
      availableStfRoles: allRoles
        .filter(r => r.name === RoleName.STF_Approver && (r.level || 0) <= maxStfForUser)
        .sort((a,b) => (a.level || 0) - (b.level || 0)),
      availableOtfRoles: allRoles
        .filter(r => r.name === RoleName.OTF_Approver && (r.level || 0) <= maxOtfForUser)
        .sort((a,b) => (a.level || 0) - (b.level || 0)),
    };
  }, [newUser.project_ids, allProjects, allRoles]);

  const groupedDisciplines = useMemo(() => {
    return allDisciplines.reduce((acc, discipline) => {
        const { discipline_code, discipline_name, id, budget_code, budget_name } = discipline;
        if (!acc[discipline_code]) {
            acc[discipline_code] = {
                discipline_code,
                discipline_name,
                budgets: [],
            };
        }
        acc[discipline_code].budgets.push({ id, budget_code, budget_name });
        return acc;
    }, {} as Record<string, GroupedDiscipline>);
  }, [allDisciplines]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-3xl sm:w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 text-blue-600">
              <UserPlusIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Add New User
              </h3>
              <div className="mt-4 space-y-6">
                
                {/* User Details */}
                <div className="p-3 bg-gray-50 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name*</label>
                        <input type="text" name="firstName" value={newUser.firstName} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name*</label>
                        <input type="text" name="lastName" value={newUser.lastName} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email*</label>
                        <input type="email" name="email" value={newUser.email} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input type="tel" name="phone" value={newUser.phone} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Position</label>
                         <select name="position" value={newUser.position.id} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md bg-white">
                            {allPositions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Status */}
                <div>
                  <h4 className="font-semibold text-gray-700">Status</h4>
                   <div className="flex items-center space-x-4 mt-2">
                        <label className="flex items-center">
                            <input type="radio" name="status" value="active" checked={newUser.active} onChange={handleActiveChange} className="form-radio text-primary" />
                            <span className="ml-2">Active</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="status" value="inactive" checked={!newUser.active} onChange={handleActiveChange} className="form-radio text-primary" />
                            <span className="ml-2">Inactive</span>
                        </label>
                    </div>
                </div>

                {/* Roles */}
                <div>
                    <h4 className="font-semibold text-gray-700">Roles</h4>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <h5 className="text-sm font-medium text-gray-600 mb-2">General Roles</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {generalRoles.map(role => (
                            <label key={role.id} className="flex items-center">
                                <input type="checkbox" checked={newUser.roles.some(r => r.id === role.id)} onChange={e => handleRoleChange(role.id, e.target.checked)} className="form-checkbox text-primary rounded" />
                                <span className="ml-2 text-sm">{role.name}</span>
                            </label>
                        ))}
                        </div>
                        <hr className="my-3"/>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">MTF Approval Levels</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableMtfRoles.length > 0 ? availableMtfRoles.map(role => (
                            <label key={role.id} className="flex items-center">
                                <input type="checkbox" checked={newUser.roles.some(r => r.id === role.id)} onChange={e => handleRoleChange(role.id, e.target.checked)} className="form-checkbox text-primary rounded" />
                                <span className="ml-2 text-sm">{`Level ${role.level}`}</span>
                            </label>
                        )) : <p className="text-xs text-gray-500 col-span-full">Assign projects to enable MTF approval roles.</p>}
                        </div>
                         <hr className="my-3"/>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">STF Approval Levels</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableStfRoles.length > 0 ? availableStfRoles.map(role => (
                            <label key={role.id} className="flex items-center">
                                <input type="checkbox" checked={newUser.roles.some(r => r.id === role.id)} onChange={e => handleRoleChange(role.id, e.target.checked)} className="form-checkbox text-primary rounded" />
                                <span className="ml-2 text-sm">{`Level ${role.level}`}</span>
                            </label>
                        )) : <p className="text-xs text-gray-500 col-span-full">Assign projects to enable STF approval roles.</p>}
                        </div>
                        <hr className="my-3"/>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">OTF Approval Levels</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableOtfRoles.length > 0 ? availableOtfRoles.map(role => (
                            <label key={role.id} className="flex items-center">
                                <input type="checkbox" checked={newUser.roles.some(r => r.id === role.id)} onChange={e => handleRoleChange(role.id, e.target.checked)} className="form-checkbox text-primary rounded" />
                                <span className="ml-2 text-sm">{`Level ${role.level}`}</span>
                            </label>
                        )) : <p className="text-xs text-gray-500 col-span-full">Assign projects to enable OTF approval roles.</p>}
                        </div>
                    </div>
                </div>
                
                {/* Assignments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Project Assignments</h4>
                        <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-1 bg-gray-50">
                            {allProjects.map(project => (
                                <label key={project.id} className="flex items-center">
                                    <input type="checkbox" checked={newUser.project_ids.includes(project.id)} onChange={e => handleProjectChange(project.id, e.target.checked)} className="form-checkbox text-primary rounded" />
                                    <span className="ml-2 text-sm">{project.code} - {project.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Discipline Assignments</h4>
                        <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-1 bg-gray-50">
                            {Object.values(groupedDisciplines).map((group: GroupedDiscipline) => {
                                const allIdsForGroup = group.budgets.map(b => b.id);
                                const isChecked = allIdsForGroup.length > 0 && allIdsForGroup.every(id => newUser.discipline_ids.includes(id));
                                
                                return (
                                    <label key={group.discipline_code} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={e => handleDisciplineGroupChange(group, e.target.checked)}
                                            className="form-checkbox text-primary rounded"
                                        />
                                        <span className="ml-2 text-sm">{group.discipline_name} ({group.discipline_code})</span>
                                    </label>
                                );
                            })}
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
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSaveChanges}
            disabled={!isFormValid}
          >
            Save User
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
