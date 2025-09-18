import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { OTF_Order, OTF_OrderLine, STF_OrderLine } from '../../types';
import { ShoppingCartIcon, PaperClipIcon, XMarkIcon, PlusCircleIcon, TrashIcon, EyeIcon } from '../icons/Icons';
import { FilePreviewModal } from './FilePreviewModal';

interface EligibleStfLineForOtf {
    stfOrderLineId: number;
    stfId: string;
    materialName: string;
    materialCode: string;
    unit: string;
    stfOrderedQty: number;
    stfBacklog: number;
}

interface ReviseOtfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResubmit: (otfData: {
    lines: { stfOrderLineId: number; orderQty: number; unitPrice: number }[];
    attachment: { fileName: string; fileType: string; fileContent: string; } | null;
    totalValue: number;
  }) => void;
  otfToRevise: OTF_Order;
  otfOrderLines: OTF_OrderLine[];
  stfOrderLines: STF_OrderLine[];
  eligibleStfLines: EligibleStfLineForOtf[];
}

interface EditableLine {
    stfOrderLineId: number;
    materialName: string;
    materialCode: string;
    unit: string;
    backlog: number;
    quantity: string;
    unitPrice: string;
}

export const ReviseOtfModal: React.FC<ReviseOtfModalProps> = ({ isOpen, onClose, onResubmit, otfToRevise, otfOrderLines, stfOrderLines, eligibleStfLines }) => {
  
  const [editableLines, setEditableLines] = useState<EditableLine[]>([]);
  const [attachment, setAttachment] = useState(otfToRevise.attachment || null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        const initialLines: EditableLine[] = otfOrderLines
            .filter(line => line.otf_order_id === otfToRevise.id)
            .map(otfLine => {
                const stfLine = stfOrderLines.find(sl => sl.id === otfLine.stf_order_line_id);
                const eligibleLineInfo = eligibleStfLines.find(el => el.stfOrderLineId === otfLine.stf_order_line_id);
                
                // The backlog for an existing line in a rejected OTF is its own quantity plus any remaining STF backlog.
                const currentBacklog = eligibleLineInfo ? eligibleLineInfo.stfBacklog : 0;
                const totalAvailable = currentBacklog + otfLine.order_qty;

                return {
                    stfOrderLineId: otfLine.stf_order_line_id,
                    materialName: eligibleLineInfo?.materialName ?? 'Unknown',
                    materialCode: eligibleLineInfo?.materialCode ?? 'N/A',
                    unit: eligibleLineInfo?.unit ?? '',
                    backlog: totalAvailable,
                    quantity: String(otfLine.order_qty),
                    unitPrice: String(otfLine.unit_price),
                };
            });
        
        setEditableLines(initialLines);
        setAttachment(otfToRevise.attachment || null);
        setItemToAdd('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [isOpen, otfToRevise, otfOrderLines, stfOrderLines, eligibleStfLines]);
  
  const availableItemsToAdd = useMemo(() => {
    const currentLineIds = new Set(editableLines.map(l => l.stfOrderLineId));
    return eligibleStfLines.filter(item => !currentLineIds.has(item.stfOrderLineId));
  }, [eligibleStfLines, editableLines]);

  const handleLineDataChange = (stfOrderLineId: number, field: 'quantity' | 'unitPrice', value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;

    setEditableLines(prev => prev.map(line => 
        line.stfOrderLineId === stfOrderLineId ? { ...line, [field]: value } : line
    ));
  };
  
  const handleRemoveLine = (stfOrderLineId: number) => {
    setEditableLines(prev => prev.filter(line => line.stfOrderLineId !== stfOrderLineId));
  };
  
  const handleAddItem = () => {
    if (!itemToAdd) return;
    const stfLineId = parseInt(itemToAdd, 10);
    const item = eligibleStfLines.find(i => i.stfOrderLineId === stfLineId);
    if (!item) return;

    const originalStfLine = stfOrderLines.find(sl => sl.id === stfLineId);

    setEditableLines(prev => [...prev, {
        stfOrderLineId: item.stfOrderLineId,
        materialName: item.materialName,
        materialCode: item.materialCode,
        unit: item.unit,
        backlog: item.stfBacklog,
        quantity: item.stfBacklog.toString(),
        unitPrice: originalStfLine?.unit_price.toString() ?? '0',
    }]);
    setItemToAdd('');
  };

  const totalValue = useMemo(() => {
    return editableLines.reduce((total, line) => {
        const quantity = parseFloat(line.quantity) || 0;
        const unitPrice = parseFloat(line.unitPrice) || 0;
        return total + (quantity * unitPrice);
    }, 0);
  }, [editableLines]);
  
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
        const quantity = parseFloat(line.quantity);
        return !isNaN(quantity) && quantity > 0 && quantity <= line.backlog && !isNaN(parseFloat(line.unitPrice));
    });
  }, [editableLines]);

  const handleSubmit = () => {
    if (!isFormValid) return;
    
    const finalLines = editableLines.map(line => ({
        stfOrderLineId: line.stfOrderLineId,
        orderQty: parseFloat(line.quantity),
        unitPrice: parseFloat(line.unitPrice),
    }));

    onResubmit({
        lines: finalLines,
        attachment,
        totalValue,
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
          className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-5xl sm:w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 sm:mx-0 sm:h-10 sm:w-10 text-teal-600">
                <ShoppingCartIcon />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Revise On-The-Fly (OTF) Order ({otfToRevise.OTF_ID})
                </h3>
                
                <div className="mt-6 space-y-6">
                  <div className="overflow-y-auto border rounded-lg max-h-80">
                      <table className="w-full text-sm text-left text-gray-500">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                              <tr>
                                  <th scope="col" className="px-4 py-3">Material</th>
                                  <th scope="col" className="px-4 py-3 w-48">Order Qty</th>
                                  <th scope="col" className="px-4 py-3 w-32">Unit Price</th>
                                  <th scope="col" className="px-4 py-3 text-right w-40">Total Price</th>
                                  <th scope="col" className="px-4 py-3 text-center">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {editableLines.map(line => {
                                  const quantity = parseFloat(line.quantity) || 0;
                                  const unitPrice = parseFloat(line.unitPrice) || 0;
                                  const isInvalidQty = quantity <= 0 || quantity > line.backlog;

                                  return (
                                  <tr key={line.stfOrderLineId} className="bg-white border-b hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-gray-800">{line.materialName}</div>
                                          <div className="text-xs text-gray-500">{line.materialCode}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <input 
                                              type="text" 
                                              value={line.quantity}
                                              onChange={(e) => handleLineDataChange(line.stfOrderLineId, 'quantity', e.target.value)}
                                              className={`w-full text-sm p-2 border rounded-md ${isInvalidQty ? 'border-red-500' : 'border-gray-300'}`}
                                          />
                                          <div className={`text-xs mt-1 ${isInvalidQty ? 'text-red-600' : 'text-gray-500'}`}>
                                              Backlog: {line.backlog.toLocaleString()} {line.unit}
                                          </div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <input 
                                              type="text" 
                                              value={line.unitPrice}
                                              onChange={(e) => handleLineDataChange(line.stfOrderLineId, 'unitPrice', e.target.value)}
                                              className="w-full text-sm p-2 border rounded-md border-gray-300"
                                          />
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold">
                                          {(quantity * unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                          <button onClick={() => handleRemoveLine(line.stfOrderLineId)} className="text-red-500 hover:text-red-700 p-1" title="Remove Item">
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
                          <label className="block text-xs font-medium text-gray-600">Add Item from STF Backlog</label>
                          <select value={itemToAdd} onChange={e => setItemToAdd(e.target.value)} className="w-full text-sm p-2 border rounded-md bg-white">
                              <option value="" disabled>Select a material to add...</option>
                              {availableItemsToAdd.map(i => <option key={i.stfOrderLineId} value={i.stfOrderLineId}>{i.materialCode} - {i.materialName} (Backlog: {i.stfBacklog})</option>)}
                          </select>
                      </div>
                      <button onClick={handleAddItem} className="flex items-center bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 text-sm">
                          <PlusCircleIcon />
                          <span className="ml-2">Add</span>
                      </button>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                      {/* Attachment */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="w-full text-sm p-2 border rounded-md bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
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
                      {/* Total */}
                      <div className="text-right">
                          <p className="text-sm font-medium text-gray-600">New Total Value</p>
                          <p className="font-bold text-2xl text-teal-600">
                              {totalValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                          </p>
                      </div>
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
              Revise & Resubmit OTF
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