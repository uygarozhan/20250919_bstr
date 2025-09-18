import React, { useState, useEffect } from 'react';
import type { Project } from '../../types';
import { Currency } from '../../types';
import { BriefcaseIcon } from '../icons/Icons';

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  projectToEdit: Project;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({ isOpen, onClose, onSave, projectToEdit }) => {
  const [editedProject, setEditedProject] = useState<Project>(projectToEdit);

  useEffect(() => {
    setEditedProject(projectToEdit);
  }, [projectToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedProject(prev => ({ ...prev, [name]: name.startsWith('max_') ? parseInt(value, 10) || 0 : value }));
  };

  const handleSaveChanges = () => {
    onSave(editedProject);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 text-blue-600">
              <BriefcaseIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Edit Project: {projectToEdit.name}
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input type="text" name="name" value={editedProject.name} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Project Code</label>
                    <input type="text" name="code" value={editedProject.code} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input type="text" name="country" value={editedProject.country} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Base Currency</label>
                    <select name="base_currency" value={editedProject.base_currency} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md bg-white">
                        {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-4 pt-2 border-t mt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">MTF Levels</label>
                        <input type="number" name="max_mtf_approval_level" value={editedProject.max_mtf_approval_level} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">STF Levels</label>
                        <input type="number" name="max_stf_approval_level" value={editedProject.max_stf_approval_level} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">OTF Levels</label>
                        <input type="number" name="max_otf_approval_level" value={editedProject.max_otf_approval_level} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">MRF Levels</label>
                        <input type="number" name="max_mrf_approval_level" value={editedProject.max_mrf_approval_level} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">MDF Levels</label>
                        <input type="number" name="max_mdf_approval_level" value={editedProject.max_mdf_approval_level} onChange={handleChange} className="mt-1 w-full text-sm p-2 border rounded-md" />
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
            onClick={handleSaveChanges}
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