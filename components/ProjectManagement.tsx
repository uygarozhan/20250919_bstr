

import React, { useState, useMemo } from 'react';
import type { Project, User } from '../types';
import { PencilIcon, PlusCircleIcon } from './icons/Icons';
import { ProjectEditModal } from './modals/ProjectEditModal';
import { ProjectAddModal } from './modals/ProjectAddModal';

interface ProjectManagementProps {
    currentUser: User;
    projects: Project[];
    //-fix: Changed onDataRefresh to specific handlers to match App.tsx's implementation.
    onUpdateProject: (project: Project) => void;
    onCreateProject: (project: Omit<Project, 'id'>) => void;
}

export const ProjectManagement: React.FC<ProjectManagementProps> = ({ currentUser, projects, onUpdateProject, onCreateProject }) => {
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
    
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);

    const tenantProjects = useMemo(() => projects.filter(p => p.tenant_id === currentUser.tenant_id), [projects, currentUser.tenant_id]);
    
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = useMemo(() => {
        return tenantProjects.filter(project =>
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tenantProjects, searchTerm]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSaveProject = (updatedProject: Project) => {
        onUpdateProject(updatedProject);
        setEditingProject(null);
    };

    const handleCreateProject = (newProject: Omit<Project, 'id'>) => {
        onCreateProject(newProject);
        setAddModalOpen(false);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Project Management</h2>
                    <button 
                        onClick={() => setAddModalOpen(true)}
                        className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-secondary transition duration-200"
                    >
                        <PlusCircleIcon />
                        <span className="ml-2">Add New Project</span>
                    </button>
                </div>

                {/* Filter Controls */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Projects</label>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search by project name or code..."
                        className="w-full md:w-1/3 text-sm p-2 border rounded-md"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Project</th>
                                <th scope="col" className="px-6 py-3">Country / Currency</th>
                                <th scope="col" className="px-6 py-3 text-center">Max MTF Level</th>
                                <th scope="col" className="px-6 py-3 text-center">Max STF Level</th>
                                <th scope="col" className="px-6 py-3 text-center">Max OTF Level</th>
                                <th scope="col" className="px-6 py-3 text-center">Max MRF Level</th>
                                <th scope="col" className="px-6 py-3 text-center">Max MDF Level</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => (
                                <tr key={project.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div>{project.name}</div>
                                        <div className="text-xs font-mono text-gray-500">{project.code}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{project.country}</div>
                                        <div className="text-xs font-semibold text-blue-600">{project.base_currency}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-semibold">{project.max_mtf_approval_level}</td>
                                    <td className="px-6 py-4 text-center font-semibold">{project.max_stf_approval_level}</td>
                                    <td className="px-6 py-4 text-center font-semibold">{project.max_otf_approval_level}</td>
                                    <td className="px-6 py-4 text-center font-semibold">{project.max_mrf_approval_level}</td>
                                    <td className="px-6 py-4 text-center font-semibold">{project.max_mdf_approval_level}</td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => setEditingProject(project)}
                                            className="text-gray-500 hover:text-blue-600 p-1" title="Edit Project">
                                            <PencilIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProjects.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No projects found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
            {editingProject && (
                <ProjectEditModal
                    isOpen={!!editingProject}
                    onClose={() => setEditingProject(null)}
                    onSave={handleSaveProject}
                    projectToEdit={editingProject}
                />
            )}
            {isAddModalOpen && (
                <ProjectAddModal
                    isOpen={isAddModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    onSave={handleCreateProject}
                    tenantId={currentUser.tenant_id!}
                />
            )}
        </>
    );
};
