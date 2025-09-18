import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, MTF_Header, MTF_Line, ItemLibrary, Attachment } from '../../types';
import { DocumentTextIcon, PaperClipIcon, XMarkIcon, PlusCircleIcon, TrashIcon, EyeIcon } from '../icons/Icons';
import { FilePreviewModal } from './FilePreviewModal';

interface ReviseMtfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResubmit: (mtfData: {
    lines: { itemId: number; quantity: number, description: string }[];
    attachment: Attachment | null;
  }) => void;
  currentUser: User;
  mtfToRevise: MTF_Header;
  mtfLines: MTF_Line[];
  allItems: ItemLibrary[];
}

interface EditableLine {
    itemId: number;
    materialName: string;
    materialCode: string;
    unit: string;
    quantity: string;
    description: string;
}

export const ReviseMtfModal: React.FC<ReviseMtfModalProps> = ({ isOpen, onClose, onResubmit, currentUser, mtfToRevise, mtfLines, allItems }) => {
  
  const [editableLines, setEditableLines] = useState<EditableLine[]>([]);
  const [attachment, setAttachment] = useState(mtfToRevise.attachment || null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tenantItems = useMemo(() => {
    return allItems.filter(i => i.tenant_id === currentUser.tenant_id);
  }, [allItems, currentUser.tenant_id]);

  useEffect(() => {
    if (isOpen) {
        const initialLines: EditableLine[] = mtfLines
            .filter(line => line.mtf_header_id === mtfToRevise.id)
            .map(mtfLine => {
                const item = tenantItems.find(i => i.id === mtfLine.item_id);
                return {
                    itemId: mtfLine.item_id,
                    materialName: item?.material_name ?? 'Unknown',
                    materialCode: item?.material_code ?? 'N/A',
                    unit: item?.unit ?? '',
                    quantity: String(mtfLine.request_qty),
                    description: mtfLine.material_description,
                };
            });
        
        setEditableLines(initialLines);
        setAttachment(mtfToRevise.attachment || null);
        setItemToAdd('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [isOpen, mtfToRevise, mtfLines, tenantItems]);
  
  const availableItemsToAdd = useMemo(() => {
    const currentItemIds = new Set(editableLines.map(l => l.itemId));
    return tenantItems.filter(item => !currentItemIds.has(item.id));
  }, [tenantItems, editableLines]);

  const handleLineChange = (itemId: number, field: 'quantity' | 'description', value: string) => {
    setEditableLines(prev => prev.map(line => 
        line.itemId === itemId ? { ...line, [field]: value } : line
    ));
  };
  
  const handleRemoveLine = (itemId: number) => {
    setEditableLines(prev => prev.filter(line => line.itemId !== itemId));
  };
  
  const handleAddItem = () => {
    if (!itemToAdd) return;
    const itemId = parseInt(itemToAdd, 10);
    const item = tenantItems.find(i => i.id === itemId);
    if (!item) return;

    setEditableLines(prev => [...prev, {
        itemId: item.id,
        materialName: item.material_name,
        materialCode: item.material_code,
        unit: item.unit,
        quantity: '1',
        description: item.material_description || item.material_name,
    }]);
    setItemToAdd('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFormValid = useMemo(() => {
    if (editableLines.length === 0) return false;
    return editableLines.every(line => {
        const quantity = parseInt(line.quantity, 10);
        return !isNaN(quantity) && quantity > 0;
    });
  }, [editableLines]);

  const handleSubmit = () => {
    if (!isFormValid) return;
    
    const finalLines = editableLines.map(line => ({
        itemId: line.itemId,
        quantity: parseInt(line.quantity, 10),
        description: line.description,
    }));

    onResubmit({
        lines: finalLines,
        attachment,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex justify-center items-center"
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
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Revise Material Transfer Form ({mtfToRevise.MTF_ID})
                </h3>
                
                <div className="mt-6 space-y-6">
                  {/* Items Table */}
                  <div className="overflow-y-auto border rounded-lg max-h-80">
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
                              {editableLines.map(line => {
                                  const quantity = parseInt(line.quantity, 10);
                                  const isInvalidQty = isNaN(quantity) || quantity <= 0;

                                  return (
                                  <tr key={line.itemId} className="bg-white border-b hover:bg-gray-50">
                                      <td className="px-4 py-3 align-top">
                                          <div className="font-medium text-gray-800">{line.materialName}</div>
                                          <div className="text-xs text-gray-500">{line.materialCode}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <textarea 
                                              value={line.description} 
                                              onChange={(e) => handleLineChange(line.itemId, 'description', e.target.value)}
                                              rows={3}
                                              className="w-full text-sm p-2 border rounded-md"
                                          />
                                      </td>
                                      <td className="px-4 py-3 align-top">
                                        <div className="flex items-center">
                                          <input 
                                              type="number" 
                                              value={line.quantity}
                                              min="1"
                                              onChange={(e) => handleLineChange(line.itemId, 'quantity', e.target.value)}
                                              className={`w-24 text-sm p-2 border rounded-md ${isInvalidQty ? 'border-red-500' : ''}`}
                                          />
                                          <span className="ml-2 text-gray-600">{line.unit}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center align-top">
                                          <button onClick={() => handleRemoveLine(line.itemId)} className="text-red-500 hover:text-red-700 p-1" title="Remove Item">
                                              <TrashIcon />
                                          </button>
                                      </td>
                                  </tr>
                              )})}
                          </tbody>
                      </table>
                  </div>
                  {/* Add Item */}
                  <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-grow">
                          <label className="block text-xs font-medium text-gray-600">Add Item</label>
                          <select value={itemToAdd} onChange={e => setItemToAdd(e.target.value)} className="w-full text-sm p-2 border rounded-md bg-white">
                              <option value="" disabled>Select a material to add...</option>
                              {availableItemsToAdd.map(i => <option key={i.id} value={i.id}>{i.material_code} - {i.material_name}</option>)}
                          </select>
                      </div>
                      <button onClick={handleAddItem} className="flex items-center bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 text-sm">
                          <PlusCircleIcon />
                          <span className="ml-2">Add</span>
                      </button>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="w-full text-sm p-2 border rounded-md bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      {attachment && (
                          <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded-md">
                              <div className="flex items-center text-sm text-gray-700 overflow-hidden">
                                  <PaperClipIcon />
                                  <span className="ml-2 font-medium truncate" title={attachment.fileName}>{attachment.fileName}</span>
                              </div>
                              <div className="flex items-center">
                                  <button
                                      onClick={() => setIsPreviewOpen(true)}
                                      className="text-blue-500 hover:text-blue-700 p-1"
                                      title="Preview Attachment"
                                  >
                                      <EyeIcon />
                                  </button>
                                  <button onClick={removeAttachment} className="text-red-500 hover:text-red-700 p-1" title="Remove Attachment"><XMarkIcon /></button>
                              </div>
                          </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Revise & Resubmit
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