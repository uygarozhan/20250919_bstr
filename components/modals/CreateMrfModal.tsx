import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { DashboardItem, OTF_Order, OTF_OrderLine, MRF_Line } from '../../types';
import { InboxStackIcon, PaperClipIcon, XMarkIcon, EyeIcon } from '../icons/Icons';
import { FilePreviewModal } from './FilePreviewModal';

interface CreateMrfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMrf: (
    otfOrderLineId: number,
    mrfData: {
      lines: { otfOrderLineId: number; receivedQty: number }[];
      attachment: { fileName: string; fileType: string; fileContent: string; } | null;
    }
  ) => void;
  otfOrders: OTF_Order[];
  otfOrderLines: OTF_OrderLine[];
  mrfLines: MRF_Line[];
  selectedItems: DashboardItem[];
}

interface LineData {
    quantity: string;
}

interface EligibleOtfLine {
    otfOrderLineId: number;
    otfId: string;
    materialName: string;
    materialCode: string;
    unit: string;
    otfOrderedQty: number;
    otfBacklog: number;
}

export const CreateMrfModal: React.FC<CreateMrfModalProps> = ({ 
    isOpen, onClose, onCreateMrf, selectedItems, otfOrders, otfOrderLines, mrfLines
}) => {
  
  const [lineData, setLineData] = useState<Record<number, LineData>>({});
  const [eligibleLines, setEligibleLines] = useState<EligibleOtfLine[]>([]);
  const [attachment, setAttachment] = useState<{ fileName: string; fileType: string; fileContent: string; } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        // Fix: Correct logic to find related OTF lines. Instead of accessing a non-existent `stfOrderLines` property,
        // it now correctly filters OTF lines by checking if their header ID matches the `otfHeaderId` on the selected DashboardItems.
        const allOtfLinesForSelectedItems = otfOrderLines.filter(ol => {
            const dashboardItem = selectedItems.find(item => item.otfHeaderId === ol.otf_order_id);
            if (!dashboardItem) return false;
            const otfHeader = otfOrders.find(h => h.id === ol.otf_order_id);
            return otfHeader?.status === 'Approved';
        });

        const initialEligibleLines: EligibleOtfLine[] = allOtfLinesForSelectedItems.map(ol => {
            const header = otfOrders.find(h => h.id === ol.otf_order_id)!;
            // Fix: Find the corresponding dashboard item to get material details.
            const dashboardItem = selectedItems.find(item => {
                // This is an approximation. A more robust solution would need the STF line to link MTF and OTF.
                // For now, we link by OTF header and assume the material is the one from the dashboard item.
                return item.otfHeaderId === ol.otf_order_id;
            })!;

            const alreadyReceived = mrfLines
                .filter(ml => ml.otf_order_line_id === ol.id)
                .reduce((sum, ml) => sum + ml.received_qty, 0);

            return {
                otfOrderLineId: ol.id,
                otfId: header.OTF_ID,
                materialName: dashboardItem.materialName,
                materialCode: dashboardItem.materialCode,
                unit: dashboardItem.unit,
                otfOrderedQty: ol.order_qty,
                otfBacklog: ol.order_qty - alreadyReceived,
            };
        }).filter(line => line.otfBacklog > 0);
        
        setEligibleLines(initialEligibleLines);

        const initialData: Record<number, LineData> = {};
        initialEligibleLines.forEach(line => {
            initialData[line.otfOrderLineId] = {
                quantity: line.otfBacklog.toString(),
            };
        });
        setLineData(initialData);

        setAttachment(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [isOpen, selectedItems, otfOrders, otfOrderLines, mrfLines]);
  

  const handleLineDataChange = (otfOrderLineId: number, field: keyof LineData, value: string) => {
    if ((field === 'quantity') && !/^\d*\.?\d*$/.test(value)) {
        return;
    }
    setLineData(prev => ({
        ...prev,
        [otfOrderLineId]: {
            ...prev[otfOrderLineId],
            [field]: value,
        }
    }));
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
    if (eligibleLines.length === 0) return false;
    const hasAtLeastOneItem = eligibleLines.some(line => {
        const data = lineData[line.otfOrderLineId];
        return data && parseFloat(data.quantity) > 0;
    });
    if (!hasAtLeastOneItem) return false;

    return eligibleLines.every(line => {
        const data = lineData[line.otfOrderLineId];
        const quantity = parseFloat(data?.quantity);
        return data && !isNaN(quantity) && quantity >= 0 && quantity <= line.otfBacklog;
    });
  }, [lineData, eligibleLines]);

  const handleSubmit = () => {
    if (!isFormValid) return;
    
    const finalLines = eligibleLines.map(line => ({
        otfOrderLineId: line.otfOrderLineId,
        receivedQty: parseFloat(lineData[line.otfOrderLineId].quantity),
    })).filter(line => line.receivedQty > 0);

    if (finalLines.length === 0) {
        alert("Please enter a received quantity for at least one item.");
        return;
    }

    onCreateMrf(finalLines[0].otfOrderLineId, {
        lines: finalLines,
        attachment,
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
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10 text-purple-600">
                <InboxStackIcon />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New Material Receipt Form (MRF)
                </h3>
                <p className="text-sm text-gray-500">
                  Record the receipt of goods from approved OTF orders.
                </p>
                
                <div className="mt-6 space-y-6">
                  <div className="overflow-y-auto border rounded-lg max-h-80">
                      <table className="w-full text-sm text-left text-gray-500">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                              <tr>
                                  <th scope="col" className="px-4 py-3">Material</th>
                                  <th scope="col" className="px-4 py-3">OTF Info</th>
                                  <th scope="col" className="px-4 py-3 w-40">Received Qty</th>
                              </tr>
                          </thead>
                          <tbody>
                            {eligibleLines.length === 0 ? (
                                <tr><td colSpan={3} className="text-center p-8 text-gray-500">No eligible OTF items with outstanding quantities found.</td></tr>
                            ) : (
                              eligibleLines.map(line => {
                                  const data = lineData[line.otfOrderLineId] || { quantity: '0' };
                                  const quantity = parseFloat(data.quantity) || 0;
                                  const isInvalidQty = quantity > line.otfBacklog;

                                  return (
                                  <tr key={line.otfOrderLineId} className="bg-white border-b hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-gray-800">{line.materialName}</div>
                                          <div className="text-xs text-gray-500">{line.materialCode}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <div className="font-mono text-gray-800">{line.otfId}</div>
                                          <div className="text-xs text-gray-500">Outstanding: {line.otfBacklog.toLocaleString()} {line.unit}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <input 
                                              type="text" 
                                              value={data.quantity}
                                              onChange={(e) => handleLineDataChange(line.otfOrderLineId, 'quantity', e.target.value)}
                                              className={`w-full text-sm p-2 border rounded-md ${isInvalidQty ? 'border-red-500' : 'border-gray-300'}`}
                                          />
                                          {isInvalidQty && <p className="text-xs text-red-600 mt-1">Max: {line.otfBacklog}</p>}
                                      </td>
                                  </tr>
                              )
                            }))}
                          </tbody>
                      </table>
                  </div>

                  <div>
                      <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">Attachment (e.g., Delivery Note)</label>
                      <input 
                          type="file" id="attachment" ref={fileInputRef} onChange={handleFileChange} 
                          className="w-full text-sm p-2 border rounded-md bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
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
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Submit MRF
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
