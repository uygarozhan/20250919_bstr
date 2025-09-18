

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, DashboardItem, Supplier, ItemLibrary } from '../../types';
import { ShoppingCartIcon, PaperClipIcon, XMarkIcon, EyeIcon } from '../icons/Icons';
import { FilePreviewModal } from './FilePreviewModal';

interface CreateStfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStf: (stfData: {
    lines: { mtfLineId: number; orderQty: number; unitPrice: number; material_description: string; }[];
    attachment: { fileName: string; fileType: string; fileContent: string; } | null;
    totalValue: number;
    supplierId: number;
  }) => void;
  currentUser: User;
  selectedItems: DashboardItem[];
  suppliers: Supplier[];
  items: ItemLibrary[];
}

interface LineData {
    quantity: string;
    unitPrice: string;
    description: string;
}

export const CreateStfModal: React.FC<CreateStfModalProps> = ({ isOpen, onClose, onCreateStf, selectedItems, currentUser, suppliers, items }) => {
  
  const [lineData, setLineData] = useState<Record<number, LineData>>({});
  const [supplierId, setSupplierId] = useState<string>('');
  const [attachment, setAttachment] = useState<{ fileName: string; fileType: string; fileContent: string; } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tenantSuppliers = useMemo(() => {
    return suppliers.filter(s => s.tenant_id === currentUser.tenant_id && s.active);
  }, [suppliers, currentUser]);


  useEffect(() => {
    if (isOpen) {
        // Initialize line data when modal opens
        const initialData: Record<number, LineData> = {};
        selectedItems.forEach(item => {
            const libraryItem = items.find(i => i.material_code === item.materialCode);
            initialData[item.mtfLineId] = {
                quantity: item.mtfBacklog.toString(),
                unitPrice: libraryItem?.budget_unit_price?.toString() ?? '0',
                description: item.materialDescription || '',
            };
        });
        setLineData(initialData);
        setSupplierId('');
        setAttachment(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [isOpen, selectedItems, items]);

  const handleLineDataChange = (mtfLineId: number, field: keyof LineData, value: string) => {
    if ((field === 'quantity' || field === 'unitPrice') && !/^\d*\.?\d*$/.test(value)) {
        return;
    }
    setLineData(prev => ({
        ...prev,
        [mtfLineId]: {
            ...prev[mtfLineId],
            [field]: value,
        }
    }));
  };

  const totalValue = useMemo(() => {
    return selectedItems.reduce((total, item) => {
        const data = lineData[item.mtfLineId];
        const quantity = parseFloat(data?.quantity) || 0;
        const unitPrice = parseFloat(data?.unitPrice) || 0;
        return total + (quantity * unitPrice);
    }, 0);
  }, [lineData, selectedItems]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
        setAttachment(null);
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
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const isFormValid = useMemo(() => {
    if (selectedItems.length === 0 || !supplierId) return false;
    return selectedItems.every(item => {
        const data = lineData[item.mtfLineId];
        const quantity = parseFloat(data?.quantity);
        const unitPrice = parseFloat(data?.unitPrice);
        const maxQty = item.mtfBacklog;
        
        return data && 
               !isNaN(quantity) && quantity > 0 && quantity <= maxQty &&
               !isNaN(unitPrice) && unitPrice >= 0;
    });
  }, [lineData, selectedItems, supplierId]);

  const handleSubmit = () => {
    if (!isFormValid) return;
    
    const finalLines = selectedItems.map(item => ({
        mtfLineId: item.mtfLineId,
        orderQty: parseFloat(lineData[item.mtfLineId].quantity),
        unitPrice: parseFloat(lineData[item.mtfLineId].unitPrice),
        material_description: lineData[item.mtfLineId].description,
    }));

    onCreateStf({
        lines: finalLines,
        attachment,
        totalValue,
        supplierId: parseInt(supplierId, 10),
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
                <ShoppingCartIcon />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New Stock Transfer Form
                </h3>
                <p className="text-sm text-gray-500">
                  Review items, set quantities and prices, and add an optional attachment.
                </p>
                
                <div className="mt-6 space-y-6">
                  {/* Supplier and Attachment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">Supplier*</label>
                        <select 
                            id="supplier" 
                            value={supplierId} 
                            onChange={e => setSupplierId(e.target.value)}
                            className="w-full text-sm p-2 border rounded-md bg-white"
                        >
                            <option value="" disabled>Select a supplier...</option>
                            {tenantSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">Attachment (Optional)</label>
                        <input 
                            type="file" 
                            id="attachment" 
                            ref={fileInputRef}
                            onChange={handleFileChange} 
                            className="w-full text-sm p-2 border rounded-md bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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

                  {/* Items Table */}
                  <div className="overflow-y-auto border rounded-lg max-h-80">
                      <table className="w-full text-sm text-left text-gray-500">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                              <tr>
                                  <th scope="col" className="px-4 py-3">Material & Description</th>
                                  <th scope="col" className="px-4 py-3 w-48">Order Qty</th>
                                  <th scope="col" className="px-4 py-3 w-32">Unit Price</th>
                                  <th scope="col" className="px-4 py-3 text-right w-40">Total Price</th>
                              </tr>
                          </thead>
                          <tbody>
                              {selectedItems.map(item => {
                                  const data = lineData[item.mtfLineId] || { quantity: '0', unitPrice: '0', description: '' };
                                  const quantity = parseFloat(data.quantity) || 0;
                                  const unitPrice = parseFloat(data.unitPrice) || 0;
                                  const isInvalidQty = quantity <= 0 || quantity > item.mtfBacklog;

                                  return (
                                  <tr key={item.mtfLineId} className="bg-white border-b hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-gray-800">{item.materialName}</div>
                                          <div className="text-xs text-gray-500 mb-2">{item.materialCode}</div>
                                          <textarea
                                            value={data.description}
                                            onChange={(e) => handleLineDataChange(item.mtfLineId, 'description', e.target.value)}
                                            className="w-full text-xs p-1 mt-1 border rounded-md"
                                            rows={2}
                                            placeholder="Enter material description for STF..."
                                          />
                                      </td>
                                      <td className="px-4 py-3">
                                          <input 
                                              type="text" 
                                              value={data.quantity}
                                              onChange={(e) => handleLineDataChange(item.mtfLineId, 'quantity', e.target.value)}
                                              className={`w-full text-sm p-2 border rounded-md ${isInvalidQty ? 'border-red-500' : 'border-gray-300'}`}
                                          />
                                          <div className={`text-xs mt-1 ${isInvalidQty ? 'text-red-600' : 'text-gray-500'}`}>
                                              Backlog: {item.mtfBacklog.toLocaleString()} {item.unit}
                                          </div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <input 
                                              type="text" 
                                              value={data.unitPrice}
                                              onChange={(e) => handleLineDataChange(item.mtfLineId, 'unitPrice', e.target.value)}
                                              className="w-full text-sm p-2 border rounded-md border-gray-300"
                                          />
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold">
                                          {(quantity * unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                  </tr>
                              )})}
                          </tbody>
                          <tfoot className="bg-gray-100">
                              <tr>
                                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-800">Grand Total</td>
                                  <td className="px-4 py-3 text-right font-bold text-lg text-primary">
                                      {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Submit STF
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