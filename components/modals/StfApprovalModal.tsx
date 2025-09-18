import React, { useMemo, useState } from 'react';
import type { DashboardItem, MTF_Line, STF_Order, STF_OrderLine, Project, Supplier, User, ItemLibrary } from '../../types';
import { ShoppingCartIcon, PaperClipIcon, EyeIcon } from '../icons/Icons';
import { FilePreviewModal } from './FilePreviewModal';

interface StfApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  itemToReview: DashboardItem;
  stfOrders: STF_Order[];
  stfOrderLines: STF_OrderLine[];
  mtfLines: MTF_Line[];
  projects: Project[];
  suppliers: Supplier[];
  users: User[];
  items: ItemLibrary[];
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
     <div className="grid grid-cols-3 gap-2 py-1">
        <span className="font-medium text-gray-500">{label}</span>
        <span className="col-span-2 text-gray-800 font-medium">{value}</span>
    </div>
);

export const StfApprovalModal: React.FC<StfApprovalModalProps> = ({ isOpen, onClose, onApprove, onReject, itemToReview, stfOrders, stfOrderLines, mtfLines, projects, suppliers, users, items }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const stfDetails = useMemo(() => {
    if (!itemToReview.stfHeaderId) return null;

    const header = stfOrders.find(h => h.id === itemToReview.stfHeaderId);
    if (!header) return null;

    const project = projects.find(p => p.id === header.project_id);
    const creator = users.find(u => u.id === header.created_by);
    const supplier = suppliers.find(s => s.id === header.supplier_id);

    const lines = stfOrderLines
      .filter(l => l.stf_order_id === header.id)
      .map(stfLine => {
        const mtfLine = mtfLines.find(ml => ml.id === stfLine.mtf_line_id);
        const item = mtfLine ? items.find(i => i.id === mtfLine.item_id) : null;
        const mtfHeader = mtfLine ? mtfLines.find(ml => ml.id === stfLine.mtf_line_id) : null;

        return {
          id: stfLine.id,
          materialName: item?.material_name ?? 'Unknown',
          materialCode: item?.material_code ?? 'N/A',
          unit: item?.unit ?? '',
          mtfId: itemToReview.mtfId, // Simplified for this view
          orderQty: stfLine.order_qty,
          unitPrice: stfLine.unit_price,
          lineTotal: stfLine.order_qty * stfLine.unit_price,
        };
      });

    return { header, project, creator, lines, supplier };
  }, [itemToReview, stfOrders, stfOrderLines, mtfLines, projects, suppliers, users, items]);

  if (!isOpen || !stfDetails) return null;

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
                  Review Stock Transfer Form: {stfDetails.header.STF_ID}
                </h3>
                <p className="text-sm text-gray-500">
                  Please review the details below before approving or rejecting this request.
                </p>
                
                <div className="mt-6 space-y-4">
                  {/* Header Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 p-4 border rounded-lg bg-gray-50 text-sm">
                      <DetailRow label="Project" value={`${stfDetails.project?.code} - ${stfDetails.project?.name}`} />
                      <DetailRow label="Supplier" value={stfDetails.supplier?.name ?? 'Unknown'} />
                      <DetailRow label="Discipline" value={itemToReview.disciplineName} />
                      <DetailRow label="Created By" value={stfDetails.creator ? `${stfDetails.creator.firstName} ${stfDetails.creator.lastName}` : 'Unknown'} />
                      <DetailRow label="Date Created" value={new Date(stfDetails.header.date_created).toLocaleDateString()} />
                      <DetailRow label="Approval Level" value={`Pending L${stfDetails.header.current_approval_level + 1}`} />
                      <DetailRow 
                          label="Total STF Value" 
                          value={
                              <span className="text-lg text-primary font-bold">
                                  {stfDetails.header.total_value.toLocaleString(undefined, { style: 'currency', currency: stfDetails.project?.base_currency || 'USD' })}
                              </span>
                          } 
                      />
                  </div>
                  {/* Items Table */}
                  <div className="overflow-y-auto border rounded-lg max-h-80">
                      <table className="w-full text-sm text-left text-gray-500">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                              <tr>
                                  <th scope="col" className="px-4 py-3">Material</th>
                                  <th scope="col" className="px-4 py-3">MTF ID</th>
                                  <th scope="col" className="px-4 py-3 text-right">Order Qty</th>
                                  <th scope="col" className="px-4 py-3 text-right">Unit Price</th>
                                  <th scope="col" className="px-4 py-3 text-right">Total Price</th>
                              </tr>
                          </thead>
                          <tbody>
                              {stfDetails.lines.map(line => (
                                  <tr key={line.id} className="bg-white border-b">
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-gray-800">{line.materialName}</div>
                                          <div className="text-xs text-gray-500">{line.materialCode}</div>
                                      </td>
                                      <td className="px-4 py-3 font-mono">{line.mtfId}</td>
                                      <td className="px-4 py-3 text-right">{line.orderQty.toLocaleString()} {line.unit}</td>
                                      <td className="px-4 py-3 text-right font-mono">{line.unitPrice.toLocaleString(undefined, { style: 'currency', currency: stfDetails.project?.base_currency || 'USD' })}</td>
                                      <td className="px-4 py-3 text-right font-semibold">{line.lineTotal.toLocaleString(undefined, { style: 'currency', currency: stfDetails.project?.base_currency || 'USD' })}</td>
                                  </tr>
                              ))}
                          </tbody>
                          <tfoot className="bg-gray-100">
                              <tr>
                                  <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-800">Grand Total</td>
                                  <td className="px-4 py-3 text-right font-bold text-lg text-primary">
                                      {stfDetails.header.total_value.toLocaleString(undefined, { style: 'currency', currency: stfDetails.project?.base_currency || 'USD' })}
                                  </td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>

                  {/* Attachment */}
                  {stfDetails.header.attachment && (
                      <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Attachment</h4>
                          <div className="flex items-center text-sm text-gray-700 bg-gray-100 p-2 rounded-md">
                              <PaperClipIcon />
                              <span className="ml-2 font-medium flex-grow truncate">{stfDetails.header.attachment.fileName}</span>
                              <button
                                  onClick={() => setIsPreviewOpen(true)}
                                  className="ml-4 text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                  Preview
                              </button>
                              <a 
                                  href={stfDetails.header.attachment.fileContent} 
                                  download={stfDetails.header.attachment.fileName}
                                  className="ml-4 text-gray-600 hover:text-gray-800 font-semibold"
                              >
                                  Download
                              </a>
                          </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onApprove}
            >
              Approve STF
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onReject}
            >
              Reject STF
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
      {stfDetails.header.attachment && isPreviewOpen && (
        <FilePreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            attachment={stfDetails.header.attachment}
        />
      )}
    </>
  );
};