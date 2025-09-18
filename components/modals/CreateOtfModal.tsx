

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, DashboardItem, STF_Order, STF_OrderLine, OTF_OrderLine } from '../../types';
import { ShoppingCartIcon, PaperClipIcon, XMarkIcon, EyeIcon } from '../icons/Icons';
import { FilePreviewModal } from './FilePreviewModal';

interface CreateOtfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOtf: (
    stfOrderLineId: number,
    otfData: {
      lines: { stfOrderLineId: number; orderQty: number; unitPrice: number }[];
      attachment: { fileName: string; fileType: string; fileContent: string; } | null;
      totalValue: number;
      invoiceNo: string;
      invoiceDate: string;
    }
  ) => void;
  stfOrders: STF_Order[];
  stfOrderLines: STF_OrderLine[];
  otfOrderLines: OTF_OrderLine[];
  selectedItems: DashboardItem[];
}

interface LineData {
    quantity: string;
    unitPrice: string;
}

interface EligibleStfLine {
    stfOrderLineId: number;
    stfId: string;
    materialName: string;
    materialCode: string;
    unit: string;
    stfOrderedQty: number;
    stfBacklog: number;
}

export const CreateOtfModal: React.FC<CreateOtfModalProps> = ({ 
    isOpen, onClose, onCreateOtf, selectedItems, stfOrders, stfOrderLines, otfOrderLines 
}) => {
  
  const [lineData, setLineData] = useState<Record<number, LineData>>({});
  const [eligibleLines, setEligibleLines] = useState<EligibleStfLine[]>([]);
  const [attachment, setAttachment] = useState<{ fileName: string; fileType: string; fileContent: string; } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        // Find all approved STF lines from the selected dashboard items
        const approvedStfLines = stfOrderLines.filter(sl => {
            const header = stfOrders.find(so => so.id === sl.stf_order_id);
            return header?.status === 'Approved' && selectedItems.some(item => item.mtfLineId === sl.mtf_line_id);
        });

        const initialEligibleLines: EligibleStfLine[] = approvedStfLines.map(sl => {
            const mtfLine = selectedItems.find(i => i.mtfLineId === sl.mtf_line_id)!;
            const header = stfOrders.find(so => so.id === sl.stf_order_id)!;
            const otfOrderedTotal = otfOrderLines
                .filter(ol => ol.stf_order_line_id === sl.id)
                .reduce((sum, ol) => sum + ol.order_qty, 0);
            
            return {
                stfOrderLineId: sl.id,
                stfId: header.STF_ID,
                materialName: mtfLine.materialName,
                materialCode: mtfLine.materialCode,
                unit: mtfLine.unit,
                stfOrderedQty: sl.order_qty,
                stfBacklog: sl.order_qty - otfOrderedTotal,
            };
        }).filter(line => line.stfBacklog > 0);
        
        setEligibleLines(initialEligibleLines);

        const initialData: Record<number, LineData> = {};
        initialEligibleLines.forEach(line => {
            const stfLine = stfOrderLines.find(sl => sl.id === line.stfOrderLineId);
            initialData[line.stfOrderLineId] = {
                quantity: line.stfBacklog.toString(),
                unitPrice: stfLine?.unit_price.toString() ?? '0',
            };
        });
        setLineData(initialData);

        setInvoiceNo('');
        setInvoiceDate('');
        setAttachment(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [isOpen, selectedItems, stfOrders, stfOrderLines, otfOrderLines]);

  const handleLineDataChange = (stfOrderLineId: number, field: keyof LineData, value: string) => {
    if ((field === 'quantity' || field === 'unitPrice') && !/^\d*\.?\d*$/.test(value)) {
        return;
    }
    setLineData(prev => ({
        ...prev,
        [stfOrderLineId]: {
            ...prev[stfOrderLineId],
            [field]: value,
        }
    }));
  };

  const totalValue = useMemo(() => {
    return eligibleLines.reduce((total, line) => {
        const data = lineData[line.stfOrderLineId];
        const quantity = parseFloat(data?.quantity) || 0;
        const unitPrice = parseFloat(data?.unitPrice) || 0;
        return total + (quantity * unitPrice);
    }, 0);
  }, [lineData, eligibleLines]);
  
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
    if (eligibleLines.length === 0) return false;
    return eligibleLines.every(line => {
        const data = lineData[line.stfOrderLineId];
        const quantity = parseFloat(data?.quantity);
        const unitPrice = parseFloat(data?.unitPrice);
        
        return data && 
               !isNaN(quantity) && quantity > 0 && quantity <= line.stfBacklog &&
               !isNaN(unitPrice) && unitPrice >= 0;
    });
  }, [lineData, eligibleLines]);

  const handleSubmit = () => {
    if (!isFormValid) return;
    
    const finalLines = eligibleLines.map(line => ({
        stfOrderLineId: line.stfOrderLineId,
        orderQty: parseFloat(lineData[line.stfOrderLineId].quantity),
        unitPrice: parseFloat(lineData[line.stfOrderLineId].unitPrice),
    })).filter(line => line.orderQty > 0);

    if (finalLines.length === 0) {
        alert("Please enter a quantity for at least one item.");
        return;
    }

    onCreateOtf(finalLines[0].stfOrderLineId, {
        lines: finalLines,
        attachment,
        totalValue,
        invoiceNo,
        invoiceDate
    });
    onClose();
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
                  Create New On-The-Fly (OTF) Order
                </h3>
                <p className="text-sm text-gray-500">
                  Create an OTF from approved STF items. Only items with a remaining backlog are shown.
                </p>
                
                <div className="mt-6 space-y-6">
                  <div className="overflow-y-auto border rounded-lg max-h-80">
                      <table className="w-full text-sm text-left text-gray-500">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                              <tr>
                                  <th scope="col" className="px-4 py-3">Material</th>
                                  <th scope="col" className="px-4 py-3">STF Info</th>
                                  <th scope="col" className="px-4 py-3 w-32">OTF Order Qty</th>
                                  <th scope="col" className="px-4 py-3 w-32">Unit Price</th>
                                  <th scope="col" className="px-4 py-3 text-right w-40">Total Price</th>
                              </tr>
                          </thead>
                          <tbody>
                            {eligibleLines.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-8 text-gray-500">No eligible STF items found from your selection.</td></tr>
                            ) : (
                              eligibleLines.map(line => {
                                  const data = lineData[line.stfOrderLineId] || { quantity: '0', unitPrice: '0' };
                                  const quantity = parseFloat(data.quantity) || 0;
                                  const unitPrice = parseFloat(data.unitPrice) || 0;
                                  const isInvalidQty = quantity > line.stfBacklog;

                                  return (
                                  <tr key={line.stfOrderLineId} className="bg-white border-b hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-gray-800">{line.materialName}</div>
                                          <div className="text-xs text-gray-500">{line.materialCode}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <div className="font-mono text-gray-800">{line.stfId}</div>
                                          <div className="text-xs text-gray-500">Backlog: {line.stfBacklog.toLocaleString()} {line.unit}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <input 
                                              type="text" 
                                              value={data.quantity}
                                              onChange={(e) => handleLineDataChange(line.stfOrderLineId, 'quantity', e.target.value)}
                                              className={`w-full text-sm p-2 border rounded-md ${isInvalidQty ? 'border-red-500' : 'border-gray-300'}`}
                                          />
                                          {isInvalidQty && <p className="text-xs text-red-600 mt-1">Max: {line.stfBacklog}</p>}
                                      </td>
                                      <td className="px-4 py-3">
                                          <input 
                                              type="text" 
                                              value={data.unitPrice}
                                              onChange={(e) => handleLineDataChange(line.stfOrderLineId, 'unitPrice', e.target.value)}
                                              className="w-full text-sm p-2 border rounded-md border-gray-300"
                                          />
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold">
                                          {(quantity * unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                  </tr>
                              )
                            }))}
                          </tbody>
                          <tfoot className="bg-gray-100">
                              <tr>
                                  <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-800">Grand Total</td>
                                  <td className="px-4 py-3 text-right font-bold text-lg text-primary">
                                      {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="invoiceNo" className="block text-sm font-medium text-gray-700 mb-1">Invoice No (Optional)</label>
                        <input 
                            type="text" id="invoiceNo" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)}
                            className="w-full text-sm p-2 border rounded-md bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-1">Invoice Date (Optional)</label>
                        <input 
                            type="date" id="invoiceDate" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
                            className="w-full text-sm p-2 border rounded-md bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                          <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">Attachment (Optional)</label>
                          <input 
                              type="file" id="attachment" ref={fileInputRef} onChange={handleFileChange} 
                              className="w-full text-sm p-2 border rounded-md bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {attachment && (
                              <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                  <div className="flex items-center text-sm text-gray-700 overflow-hidden">
                                      <PaperClipIcon />
                                      <span className="ml-2 font-medium truncate" title={attachment.fileName}>{attachment.fileName}</span>
                                  </div>
                                  <div className="flex items-center">
                                      <button onClick={() => setIsPreviewOpen(true)} className="text-blue-500 hover:text-blue-700 p-1 flex-shrink-0" title="Preview Attachment"><EyeIcon /></button>
                                      <button onClick={removeAttachment} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0" title="Remove Attachment"><XMarkIcon /></button>
                                  </div>
                              </div>
                          )}
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
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Submit OTF
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