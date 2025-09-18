import React from 'react';
import type { OTF_Order, OTF_OrderLine, STF_OrderLine, STF_Order, MTF_Line, Project, Discipline, User, ItemLibrary } from '../../types';
import { PaperAirplaneIcon } from '../icons/Icons';
import { WorkflowStatus } from '../../types';

interface OtfDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  otfOrder: OTF_Order;
  otfOrderLines: OTF_OrderLine[];
  stfOrderLines: STF_OrderLine[];
  stfOrders: STF_Order[];
  mtfLines: MTF_Line[];
  projects: Project[];
  disciplines: Discipline[];
  users: User[];
  items: ItemLibrary[];
}

const getStatusBadge = (status: WorkflowStatus) => {
  const baseClasses = 'px-2 py-0.5 text-xs font-medium rounded-full';
  switch (status) {
    case WorkflowStatus.Approved:
      return `${baseClasses} bg-green-100 text-green-800`;
    case WorkflowStatus.Rejected:
      return `${baseClasses} bg-red-100 text-red-800`;
    case WorkflowStatus.PendingApproval:
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case WorkflowStatus.Closed:
      return `${baseClasses} bg-gray-600 text-white`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
     <div className="grid grid-cols-3 gap-2 py-1">
        <span className="font-medium text-gray-500">{label}</span>
        <span className="col-span-2 text-gray-800 font-medium">{value}</span>
    </div>
);


export const OtfDetailModal: React.FC<OtfDetailModalProps> = ({ isOpen, onClose, otfOrder, otfOrderLines, stfOrderLines, stfOrders, mtfLines, projects, disciplines, users, items }) => {

  const project = projects.find(p => p.id === otfOrder.project_id);
  const discipline = disciplines.find(d => d.id === otfOrder.discipline_id);
  const creator = users.find(u => u.id === otfOrder.created_by);
  const lines = otfOrderLines
    .filter(l => l.otf_order_id === otfOrder.id)
    .map(otfLine => {
        const stfLine = stfOrderLines.find(sl => sl.id === otfLine.stf_order_line_id);
        const stfHeader = stfLine ? stfOrders.find(so => so.id === stfLine.stf_order_id) : null;
        const mtfLine = stfLine ? mtfLines.find(ml => ml.id === stfLine.mtf_line_id) : null;
        const item = mtfLine ? items.find(i => i.id === mtfLine.item_id) : null;

        return {
            ...otfLine,
            materialName: item?.material_name || 'Unknown',
            materialCode: item?.material_code || 'N/A',
            unit: item?.unit || 'unit',
            stfId: stfHeader?.STF_ID || 'N/A',
        }
    });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 sm:mx-0 sm:h-10 sm:w-10 text-teal-600">
              <PaperAirplaneIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                OTF Details: {otfOrder.OTF_ID}
              </h3>
              
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 p-4 border rounded-lg bg-gray-50 text-sm">
                    <DetailRow label="Project" value={`${project?.code} - ${project?.name}`} />
                    <DetailRow label="Discipline" value={discipline?.discipline_name} />
                    <DetailRow label="Created By" value={creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown'} />
                    <DetailRow label="Date Created" value={new Date(otfOrder.date_created).toLocaleDateString()} />
                    <DetailRow label="Status" value={<span className={getStatusBadge(otfOrder.status)}>{otfOrder.status}</span>} />
                    {otfOrder.invoice_no && <DetailRow label="Invoice #" value={otfOrder.invoice_no} />}
                    {otfOrder.invoice_date && <DetailRow label="Invoice Date" value={new Date(otfOrder.invoice_date).toLocaleDateString()} />}
                    <DetailRow 
                        label="Total Value" 
                        value={
                            <span className="text-lg text-teal-600 font-bold">
                                {otfOrder.total_value.toLocaleString(undefined, { style: 'currency', currency: project?.base_currency || 'USD' })}
                            </span>
                        } 
                    />
                </div>
                
                <div className="overflow-y-auto border rounded-lg max-h-80">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Material</th>
                                <th scope="col" className="px-4 py-3">Source STF</th>
                                <th scope="col" className="px-4 py-3 text-right">Order Qty</th>
                                <th scope="col" className="px-4 py-3 text-right">Unit Price</th>
                                <th scope="col" className="px-4 py-3 text-right">Total Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map(line => {
                                const lineTotal = line.order_qty * line.unit_price;
                                return (
                                <tr key={line.id} className="bg-white border-b">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-800">{line.materialName}</div>
                                        <div className="text-xs text-gray-500">{line.materialCode}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono">{line.stfId}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{line.order_qty.toLocaleString()} {line.unit}</td>
                                    <td className="px-4 py-3 text-right font-mono">{line.unit_price.toLocaleString(undefined, { style: 'currency', currency: project?.base_currency || 'USD' })}</td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold">{lineTotal.toLocaleString(undefined, { style: 'currency', currency: project?.base_currency || 'USD' })}</td>
                                </tr>
                            )})}
                        </tbody>
                         <tfoot className="bg-gray-100">
                            <tr>
                                <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-800">Grand Total</td>
                                <td className="px-4 py-3 text-right font-bold text-lg text-teal-600">
                                    {otfOrder.total_value.toLocaleString(undefined, { style: 'currency', currency: project?.base_currency || 'USD' })}
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
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};