
import React, { useMemo, useState } from 'react';
import type { DashboardItem, Attachment, MTF_Header, STF_Order, STF_OrderLine, OTF_Order, OTF_OrderLine, MRF_Header, MRF_Line, Supplier, MDF_Issue, MDF_IssueLine } from '../../types';
import { DocumentTextIcon, PaperClipIcon } from '../icons/Icons';
import { FilePreviewModal } from './FilePreviewModal';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DashboardItem;
  mtfHeaders: MTF_Header[];
  stfOrders: STF_Order[];
  stfOrderLines: STF_OrderLine[];
  otfOrders: OTF_Order[];
  otfOrderLines: OTF_OrderLine[];
  mrfHeaders: MRF_Header[];
  mrfLines: MRF_Line[];
  suppliers: Supplier[];
  mdfIssues: MDF_Issue[];
  mdfIssueLines: MDF_IssueLine[];
}

const Section: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div>
        <h4 className="text-md font-semibold text-gray-700 mb-2 pb-1 border-b">{title}</h4>
        <div className="text-sm text-gray-600 space-y-2">
            {children}
        </div>
    </div>
);

const DetailRow: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
     <div className="grid grid-cols-3 gap-2">
        <span className="font-medium text-gray-500">{label}</span>
        <span className="col-span-2 text-gray-800">{value}</span>
    </div>
);

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ isOpen, onClose, item, mtfHeaders, stfOrders, stfOrderLines, otfOrders, otfOrderLines, mrfHeaders, mrfLines, suppliers, mdfIssues, mdfIssueLines }) => {
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const mtfHeader = useMemo(() => mtfHeaders.find(h => h.id === item.mtfHeaderId), [item.mtfHeaderId, mtfHeaders]);

  const lifecycleData = useMemo(() => {
    const relevantStfLines = stfOrderLines.filter(sl => sl.mtf_line_id === item.mtfLineId);
    
    const stfs = relevantStfLines.map(sl => {
        const order = stfOrders.find(so => so.id === sl.stf_order_id)!;
        const supplier = suppliers.find(s => s.id === order.supplier_id);
        
        const otfLines = otfOrderLines.filter(ol => ol.stf_order_line_id === sl.id);
        const otfs = otfLines.map(ol => {
            const otfHeader = otfOrders.find(oh => oh.id === ol.otf_order_id)!;

            const mrfLinesForOtf = mrfLines.filter(mrl => mrl.otf_order_line_id === ol.id);
            const mrfs = mrfLinesForOtf.map(mrl => {
                const mrfHeader = mrfHeaders.find(mh => mh.id === mrl.mrf_header_id)!;
                const mdfLines = mdfIssueLines.filter(mdl => mdl.mrf_line_id === mrl.id);
                const mdfs = mdfLines.map(mdl => {
                    const issue = mdfIssues.find(mi => mi.id === mdl.mdf_issue_id)!;
                    return {
                        id: issue.id,
                        issueId: issue.issue_id,
                        deliveredQty: mdl.delivered_qty,
                        date: issue.date_created,
                    };
                });
                return {
                    id: mrfHeader.id,
                    receiptId: mrfHeader.MRF_ID,
                    receivedQty: mrl.received_qty,
                    date: mrfHeader.date_created,
                    mdfs,
                };
            });

            return {
                id: otfHeader.id,
                otfId: otfHeader.OTF_ID,
                orderQty: ol.order_qty,
                date: otfHeader.date_created,
                attachment: otfHeader.attachment,
                invoiceNo: otfHeader.invoice_no,
                invoiceDate: otfHeader.invoice_date,
                mrfs,
            };
        });
        
        return {
            id: order.id,
            stfId: order.STF_ID,
            supplierName: supplier?.name ?? 'Unknown Supplier',
            orderQty: sl.order_qty,
            date: order.date_created,
            attachment: order.attachment,
            otfs,
        };
    });

    return { stfs };
  }, [item.mtfLineId, stfOrders, stfOrderLines, otfOrders, otfOrderLines, mrfHeaders, mrfLines, suppliers, mdfIssues, mdfIssueLines]);

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
          className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 text-blue-600">
                <DocumentTextIcon />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Item Lifecycle Details
                </h3>
                <p className="text-sm text-gray-500">{item.materialName} ({item.materialCode})</p>
                
                <div className="mt-4 space-y-6">
                  <Section title="Material Transfer Form (MTF)">
                      <DetailRow label="MTF ID" value={item.mtfId} />
                      <DetailRow label="Project" value={`${item.projectCode} - ${item.projectName}`} />
                      <DetailRow label="Requested Qty" value={<span className="font-bold">{item.requestQty.toLocaleString()} {item.unit}</span>} />
                      <DetailRow label="Requester" value={item.requester} />
                      <DetailRow label="Date Created" value={new Date(item.dateCreated).toLocaleDateString()} />
                      {mtfHeader?.attachment && (
                          <DetailRow 
                              label="Attachment" 
                              value={
                                  <div className="flex items-center space-x-2 text-gray-800">
                                      <PaperClipIcon />
                                      <span className="truncate" title={mtfHeader.attachment.fileName}>{mtfHeader.attachment.fileName}</span>
                                      <button 
                                          onClick={() => setPreviewAttachment(mtfHeader.attachment!)}
                                          className="text-blue-600 hover:underline text-xs font-semibold flex-shrink-0"
                                      >
                                          (Preview)
                                      </button>
                                  </div>
                              } 
                          />
                      )}
                  </Section>

                  <Section title="Procurement Chain">
                      {lifecycleData.stfs.length > 0 ? (
                          lifecycleData.stfs.map(stf => (
                              <div key={stf.id} className="p-3 bg-gray-50 rounded-md border space-y-2">
                                  <DetailRow label="STF ID" value={<span className="font-semibold text-blue-700">{stf.stfId}</span>} />
                                  <DetailRow label="Supplier" value={<span className="font-semibold text-gray-800">{stf.supplierName}</span>} />
                                  <DetailRow label="Ordered Qty" value={`${stf.orderQty.toLocaleString()} ${item.unit}`} />
                                  <DetailRow label="Date Ordered" value={new Date(stf.date).toLocaleDateString()} />
                                  {stf.attachment && (
                                      <DetailRow 
                                          label="Attachment" 
                                          value={
                                              <div className="flex items-center space-x-2 text-gray-800">
                                                  <PaperClipIcon />
                                                  <span className="truncate" title={stf.attachment.fileName}>{stf.attachment.fileName}</span>
                                                  <button 
                                                      onClick={() => setPreviewAttachment(stf.attachment!)}
                                                      className="text-blue-600 hover:underline text-xs font-semibold flex-shrink-0"
                                                  >
                                                      (Preview)
                                                  </button>
                                              </div>
                                          } 
                                      />
                                  )}
                                  
                                  {stf.otfs.length > 0 && (
                                       <div className="mt-2 pt-2 pl-4 border-l-2 border-teal-300">
                                          <h5 className="text-sm font-semibold text-gray-600 mb-1">On-The-Fly Orders (OTF)</h5>
                                          {stf.otfs.map(otf => (
                                              <div key={otf.id} className="p-2 bg-white rounded border mt-1 space-y-1">
                                                  <DetailRow label="OTF ID" value={<span className="font-semibold text-teal-700">{otf.otfId}</span>} />
                                                  {otf.invoiceNo && <DetailRow label="Invoice #" value={otf.invoiceNo} />}
                                                  {otf.invoiceDate && <DetailRow label="Invoice Date" value={new Date(otf.invoiceDate).toLocaleDateString()} />}
                                                  <DetailRow label="Ordered Qty" value={`${otf.orderQty.toLocaleString()} ${item.unit}`} />
                                                  <DetailRow label="Date Ordered" value={new Date(otf.date).toLocaleDateString()} />
                                                  
                                                  {otf.mrfs.length > 0 && (
                                                       <div className="mt-2 pt-2 pl-4 border-l-2 border-purple-300">
                                                          <h5 className="text-sm font-semibold text-gray-600 mb-1">Receipts (MRF)</h5>
                                                          {otf.mrfs.map(mrf => (
                                                              <div key={mrf.id} className="p-2 bg-white rounded border mt-1 space-y-1">
                                                                  <DetailRow label="Receipt ID" value={<span className="font-semibold text-purple-700">{mrf.receiptId}</span>} />
                                                                  <DetailRow label="Received Qty" value={`${mrf.receivedQty.toLocaleString()} ${item.unit}`} />
                                                                  <DetailRow label="Date Received" value={new Date(mrf.date).toLocaleDateString()} />

                                                                  {mrf.mdfs.length > 0 && (
                                                                      <div className="mt-2 pt-2 pl-4 border-l-2 border-gray-300">
                                                                          <h6 className="text-xs font-semibold text-gray-500 mb-1">Issues (MDF)</h6>
                                                                           {mrf.mdfs.map(mdf => (
                                                                             <div key={mdf.id} className="p-1 mt-1 space-y-1">
                                                                                 <DetailRow label="Issue ID" value={<span className="font-semibold text-gray-700">{mdf.issueId}</span>} />
                                                                                 <DetailRow label="Delivered Qty" value={`${mdf.deliveredQty.toLocaleString()} ${item.unit}`} />
                                                                                 <DetailRow label="Date Issued" value={new Date(mdf.date).toLocaleDateString()} />
                                                                             </div>
                                                                          ))}
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          ))}
                                                      </div>
                                                  )}
                                              </div>
                                          ))}
                                      </div>
                                  )}

                              </div>
                          ))
                      ) : ( <p className="text-gray-500 italic">No STF orders created for this item yet.</p> )}
                  </Section>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {previewAttachment && (
          <FilePreviewModal
              isOpen={!!previewAttachment}
              onClose={() => setPreviewAttachment(null)}
              attachment={previewAttachment}
          />
      )}
    </>
  );
};
