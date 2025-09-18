

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, MTF_Header, MTF_Line, Discipline, Project, ItemLibrary } from '../../types';
import { DocumentTextIcon, PlusCircleIcon, TrashIcon, PaperClipIcon, XMarkIcon, EyeIcon } from '../icons/Icons';
import { WorkflowStatus } from '../../types';
import { FilePreviewModal } from './FilePreviewModal';

interface CreateMtfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (header: MTF_Header, lines: Omit<MTF_Line, 'id'>[]) => void;
  currentUser: User;
  allMtfHeaders: MTF_Header[];
  allMtfLines: MTF_Line[];
  allDisciplines: Discipline[];
  projects: Project[];
  allItems: ItemLibrary[];
}

interface MtfLineItem {
    itemId: number;
    quantity: string;
    description: string;
}

export const CreateMtfModal: React.FC<CreateMtfModalProps> = ({ isOpen, onClose, onCreate, currentUser, allMtfHeaders, allMtfLines, allDisciplines, projects, allItems }) => {
  const [projectId, setProjectId] = useState<string>('');
  const [disciplineId, setDisciplineId] = useState<string>('');
  const [lineItems, setLineItems] = useState<MtfLineItem[]>([]);
  const [attachment, setAttachment] = useState<{ fileName: string; fileType: string; fileContent: string; } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [currentQuantity, setCurrentQuantity] = useState<string>('1');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userProjects = useMemo(() => projects.filter(p => currentUser.project_ids.includes(p.id)), [currentUser, projects]);
  
  const userDisciplines = useMemo(() => {
    const userDisciplineIds = new Set(currentUser.discipline_ids);
    return allDisciplines.filter(d => d.tenant_id === currentUser.tenant_id && userDisciplineIds.has(d.id));
  }, [currentUser, allDisciplines]);

  const uniqueUserDisciplines = useMemo(() => {
    const unique = new Map<string, { id: number; name: string }>();
    userDisciplines.forEach(d => {
        const key = d.discipline_code;
        if (!unique.has(key)) {
            unique.set(key, {
                id: d.id, // Use the ID of the first discipline entry found for this code
                name: `${d.discipline_code} - ${d.discipline_name}`
            });
        }
    });
    return Array.from(unique.values());
  }, [userDisciplines]);

  const availableItems = useMemo(() => {
    const addedItemIds = new Set(lineItems.map(li => li.itemId));
    return allItems.filter(i => i.tenant_id === currentUser.tenant_id && !addedItemIds.has(i.id));
  }, [currentUser, lineItems, allItems]);

  const resetForm = () => {
    setProjectId('');
    setDisciplineId('');
    setLineItems([]);
    setSelectedItemId('');
    setCurrentQuantity('1');
    setAttachment(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
        resetForm();
    }
  }, [isOpen]);

  const handleAddItem = () => {
    const qty = parseInt(currentQuantity, 10);
    if (!selectedItemId || isNaN(qty) || qty <= 0) {
        alert('Please select an item and enter a valid quantity.');
        return;
    }
    const itemDetails = allItems.find(i => i.id === parseInt(selectedItemId, 10));
    if (!itemDetails) return;

    setLineItems(prev => [...prev, { 
        itemId: parseInt(selectedItemId, 10), 
        quantity: currentQuantity,
        description: itemDetails.material_description || itemDetails.material_name,
    }]);
    setSelectedItemId('');
    setCurrentQuantity('1');
  };

  const handleLineChange = (itemId: number, field: 'quantity' | 'description', value: string) => {
    setLineItems(prev => prev.map(item =>
      item.itemId === itemId ? { ...item, [field]: value } : item
    ));
  };


  const handleRemoveItem = (itemIdToRemove: number) => {
    setLineItems(prev => prev.filter(item => item.itemId !== itemIdToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
        setAttachment(null);
        return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload a PDF, JPG, or PNG.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            setAttachment({
                fileName: file.name,
                fileType: file.type,
                fileContent: event.target.result as string,
            });
        }
    };
    reader.onerror = (error) => {
        console.error("Error reading file:", error);
        alert("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const isFormValid = useMemo(() => {
    if (!projectId || !disciplineId || lineItems.length === 0) return false;
    return lineItems.every(item => {
        const qty = parseInt(item.quantity, 10);
        return !isNaN(qty) && qty > 0;
    });
  }, [projectId, disciplineId, lineItems]);

  const handleSubmit = () => {
    if (!isFormValid) return;

    // Generate new Header
    const maxHeaderId = Math.max(0, ...allMtfHeaders.map(h => h.id));
    const newHeaderId = maxHeaderId + 1;
    const lastMtfNumericId = Math.max(0, ...allMtfHeaders.map(h => parseInt(h.MTF_ID.split('-')[1], 10)));
    
    const newHeader: MTF_Header = {
        id: newHeaderId,
        MTF_ID: `MTF-${(lastMtfNumericId + 1).toString().padStart(4, '0')}`,
        project_id: parseInt(projectId, 10),
        discipline_id: parseInt(disciplineId, 10),
        date_created: new Date().toISOString().split('T')[0],
        created_by: currentUser.id,
        status: WorkflowStatus.PendingApproval,
        current_approval_level: 0,
        attachment: attachment ?? undefined,
    };

    const newLines: Omit<MTF_Line, 'id'>[] = lineItems.map(item => {
        const libraryItem = allItems.find(i => i.id === item.itemId)!;
        const unitPrice = libraryItem.budget_unit_price || 0;
        const quantity = parseInt(item.quantity, 10);
        return {
            mtf_header_id: newHeaderId,
            item_id: item.itemId,
            material_description: item.description,
            request_qty: quantity,
            est_unit_price: unitPrice,
            est_total_price: unitPrice * quantity,
            status: WorkflowStatus.PendingApproval,
            current_approval_level: 0,
        };
    });

    onCreate(newHeader, newLines);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex justify-center items-center"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 text-blue-600">
                <DocumentTextIcon />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Create New Material Transfer Form
                </h3>
                <div className="mt-4 space-y-6">

                  {/* Header Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                          <select id="project" value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full text-sm p-2 border rounded-md bg-white">
                              <option value="" disabled>Select a project...</option>
                              {userProjects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label htmlFor="discipline" className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                          <select id="discipline" value={disciplineId} onChange={e => setDisciplineId(e.target.value)} className="w-full text-sm p-2 border rounded-md bg-white">
                              <option value="" disabled>Select a discipline...</option>
                              {uniqueUserDisciplines.map(d => (
                                  <option key={d.id} value={d.id}>
                                      {d.name}
                                  </option>
                              ))}
                          </select>
                      </div>
                      <div className="md:col-span-2">
                          <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">Attachment (Optional)</label>
                          <input 
                              type="file" 
                              id="attachment" 
                              ref={fileInputRef}
                              onChange={handleFileChange} 
                              className="w-full text-sm p-2 border rounded-md bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              accept=".pdf,.jpeg,.jpg,.png"
                          />
                          {attachment && (
                              <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                  <div className="flex items-center text-sm text-gray-700 overflow-hidden">
                                      <PaperClipIcon />
                                      <span className="ml-2 font-medium truncate" title={attachment.fileName}>{attachment.fileName}</span>
                                  </div>
                                  <div className="flex items-center">
                                      <button
                                          onClick={() => setIsPreviewOpen(true)}
                                          className="text-blue-500 hover:text-blue-700 p-1 flex-shrink-0"
                                          title="Preview Attachment"
                                      >
                                          <EyeIcon />
                                      </button>
                                      <button
                                          onClick={removeAttachment}
                                          className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                                          title="Remove Attachment"
                                      >
                                          <XMarkIcon />
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Line Items */}
                  <div>
                      <h4 className="font-semibold text-gray-700">Line Items</h4>
                      
                      {/* Item Add Form */}
                      <div className="mt-2 flex items-end gap-2 p-3 bg-gray-50 rounded-t-lg">
                          <div className="flex-grow">
                              <label htmlFor="item" className="block text-xs font-medium text-gray-600">Material</label>
                              <select id="item" value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="w-full text-sm p-2 border rounded-md bg-white">
                                  <option value="" disabled>Select a material...</option>
                                  {availableItems.map(i => <option key={i.id} value={i.id}>{i.material_code} - {i.material_name}</option>)}
                              </select>
                          </div>
                          <div className="w-32">
                              <label htmlFor="quantity" className="block text-xs font-medium text-gray-600">Quantity</label>
                              <input type="number" id="quantity" value={currentQuantity} onChange={e => setCurrentQuantity(e.target.value)} placeholder="Qty" min="1" className="w-full text-sm p-2 border rounded-md"/>
                          </div>
                          <button onClick={handleAddItem} className="flex items-center bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 text-sm">
                              <PlusCircleIcon />
                              <span className="ml-2">Add Item</span>
                          </button>
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto border-x border-b rounded-b-lg max-h-60">
                          <table className="w-full text-sm text-left text-gray-500">
                              <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                  <tr>
                                      <th scope="col" className="px-6 py-3 w-1/4">Material</th>
                                      <th scope="col" className="px-6 py-3 w-1/2">Description</th>
                                      <th scope="col" className="px-6 py-3">Quantity</th>
                                      <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {lineItems.length === 0 ? (
                                      <tr>
                                          {/*-fix: Changed invalid `col` attribute to `colSpan` to correctly span table columns.*/}
                                          <td colSpan={4}>
                                              <p className="text-center text-gray-500 py-4">No items added yet.</p>
                                          </td>
                                      </tr>
                                  ) : (
                                      lineItems.map(line => {
                                          const itemDetails = allItems.find(i => i.id === line.itemId);
                                          return (
                                              <tr key={line.itemId} className="bg-white border-b hover:bg-gray-50">
                                                  <td className="px-6 py-4 align-top">
                                                      <div className="font-medium text-gray-800">{itemDetails?.material_name}</div>
                                                      <div className="text-xs text-gray-500">{itemDetails?.material_code}</div>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <textarea 
                                                          value={line.description} 
                                                          onChange={(e) => handleLineChange(line.itemId, 'description', e.target.value)}
                                                          rows={3}
                                                          className="w-full text-sm p-2 border rounded-md"
                                                      />
                                                  </td>
                                                  <td className="px-6 py-4 align-top">
                                                    <div className="flex items-center">
                                                      <input 
                                                          type="number" 
                                                          value={line.quantity}
                                                          min="1"
                                                          onChange={(e) => handleLineChange(line.itemId, 'quantity', e.target.value)}
                                                          className="w-24 text-sm p-2 border rounded-md"
                                                      />
                                                      <span className="ml-2 text-gray-600">{itemDetails?.unit}</span>
                                                    </div>
                                                  </td>
                                                  <td className="px-6 py-4 text-center align-top">
                                                      <button onClick={() => handleRemoveItem(line.itemId)} className="text-red-500 hover:text-red-700 p-1" title="Remove Item">
                                                          <TrashIcon />
                                                      </button>
                                                  </td>
                                              </tr>
                                          )
                                      })
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Submit MTF
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
      {attachment && isPreviewOpen && (
          <FilePreviewModal
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              attachment={attachment}
          />
      )}
    </>
  );
};