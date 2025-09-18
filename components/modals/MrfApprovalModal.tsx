import React, { useMemo, useState } from 'react';
import type { DashboardItem, MRF_Header, MRF_Line, OTF_OrderLine, Project, MTF_Line, User, ItemLibrary, STF_OrderLine } from '../../types';
import { InboxStackIcon, PaperClipIcon } from '../icons/Icons';
import { FilePreviewModal } from './FilePreviewModal';

interface MrfApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  itemToReview: DashboardItem;
  mrfHeaders: MRF_Header[];
  mrfLines: MRF_Line[];
  otfOrderLines: OTF_OrderLine[];
  stfOrderLines: STF_OrderLine[];
  mtfLines: MTF_Line[];
  projects: Project[];
  users: User[];
  items: ItemLibrary[];
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
     <div className="grid grid-cols-3 gap-2 py-1">
        <span className="font-medium text-gray-500">{label}</span>
        <span className="col-span-2 text-gray-800 font-medium">{value}</span>
    </div>
);

export const MrfApprovalModal: React.FC<MrfApprovalModalProps> = ({ isOpen, onClose, onApprove, onReject, itemToReview, mrfHeaders, mrfLines, otfOrderLines, stfOrderLines, mtfLines, projects, users, items }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const mrfDetails = useMemo(() => {
    if (!itemToReview.mrfHeaderId) return null;

    const header = mrfHeaders.find(h => h.id === itemToReview.mrfHeaderId);
    if (!header) return null;

    const project = projects.find(p => p.id === header.project_id);
    const creator = users.find(u => u.id === header.created_by);

    const lines = mrfLines
      .filter(l => l.mrf_header_id === header.id)
      .map(mrfLine => {
        const otfLine = otfOrderLines.find(ol => ol.id === mrfLine.otf_order_line_id);
        const stfLine = otfLine ? stfOrderLines.find(sl => sl.id === otfLine.stf_order_line_id) : null;
        const mtfLine = stfLine ? mtfLines.find(ml => ml.id === stfLine.mtf_line_id) : null;
        const item = mtfLine ? items.find(i => i.id === mtfLine.item_id) : null;

        return {
          id: mrfLine.id,
          materialName: item?.material_name ?? 'Unknown',
          materialCode: item?.material_code ?? 'N/A',
          unit: item?.unit ?? '',
          otfId: itemToReview.otfId, 
          receivedQty: mrfLine.received_qty,
        };
      });

    return { header, project, creator, lines };
  }, [itemToReview, mrfHeaders, mrfLines, otfOrderLines, projects, users, items, stfOrderLines, mtfLines]);

  if (!isOpen || !mrfDetails) return null;

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
                  Review Material Receipt Form: {mrfDetails.header.MRF_ID}
                </h3>
                
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 p-4 border rounded-lg bg-gray-50 text-sm">
                      <DetailRow label="Project" value={`${mrfDetails.project?.code} - ${mrfDetails.project?.name}`} />
                      <DetailRow label="Discipline" value={itemToReview.disciplineName} />
                      <DetailRow label="Created By" value={mrfDetails.creator ? `${mrfDetails.creator.firstName} ${mrfDetails.creator.lastName}` : 'Unknown'} />
                      <DetailRow label="Date Created" value={new Date(mrfDetails.header.date_created).toLocaleDateString()} />
                      <DetailRow label="Approval Level" value={`Pending L${mrfDetails.header.current_approval_level + 1}`} />
                  </div>
                  <div className="overflow-y-auto border rounded-lg max-h-80">
                      <table className="w-full text-sm text-left text-gray-500">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                              <tr>
                                  <th scope="col" className="px-4 py-3">Material</th>
                                  <th scope="col" className="px-4 py-3">Source OTF ID</th>
                                  <th scope="col" className="px-4 py-3 text-right">Received Qty</th>
                              </tr>
                          </thead>
                          <tbody>
                              {mrfDetails.lines.map(line => (
                                  <tr key={line.id} className="bg-white border-b">
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-gray-800">{line.materialName}</div>
                                          <div className="text-xs text-gray-500">{line.materialCode}</div>
                                      </td>
                                      <td className="px-4 py-3 font-mono">{line.otfId}</td>
                                      <td className="px-4 py-3 text-right font-semibold">{line.receivedQty.toLocaleString()} {line.unit}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {mrfDetails.header.attachment && (
                      <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Attachment</h4>
                          <div className="flex items-center text-sm text-gray-700 bg-gray-100 p-2 rounded-md">
                              <PaperClipIcon />
                              <span className="ml-2 font-medium flex-grow truncate">{mrfDetails.header.attachment.fileName}</span>
                              <button
                                  onClick={() => setIsPreviewOpen(true)}
                                  className="ml-4 text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                  Preview
                              </button>
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
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onApprove}
            >
              Approve MRF
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onReject}
            >
              Reject MRF
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
      {mrfDetails.header.attachment && isPreviewOpen && (
        <FilePreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            attachment={mrfDetails.header.attachment}
        />
      )}
    </>
  );
};