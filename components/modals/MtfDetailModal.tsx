import React from 'react';
import type { MTF_Header, MTF_Line, Project, Discipline, User, ItemLibrary } from '../../types';
import { DocumentTextIcon } from '../icons/Icons';
import { WorkflowStatus } from '../../types';

interface MtfDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mtfHeader: MTF_Header;
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


export const MtfDetailModal: React.FC<MtfDetailModalProps> = ({ isOpen, onClose, mtfHeader, mtfLines, projects, disciplines, users, items }) => {

  const project = projects.find(p => p.id === mtfHeader.project_id);
  const discipline = disciplines.find(d => d.id === mtfHeader.discipline_id);
  const creator = users.find(u => u.id === mtfHeader.created_by);
  const lines = mtfLines.filter(l => l.mtf_header_id === mtfHeader.id);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-3xl sm:w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 text-blue-600">
              <DocumentTextIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                MTF Details: {mtfHeader.MTF_ID}
              </h3>
              
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 p-4 border rounded-lg bg-gray-50 text-sm">
                    <DetailRow label="Project" value={`${project?.code} - ${project?.name}`} />
                    <DetailRow label="Discipline" value={discipline?.discipline_name} />
                    <DetailRow label="Created By" value={creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown'} />
                    <DetailRow label="Date Created" value={new Date(mtfHeader.date_created).toLocaleDateString()} />
                    <DetailRow label="Status" value={<span className={getStatusBadge(mtfHeader.status)}>{mtfHeader.status}</span>} />
                </div>
                
                <div className="overflow-y-auto border rounded-lg max-h-80">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Material</th>
                                <th scope="col" className="px-4 py-3 text-right">Requested Qty</th>
                                <th scope="col" className="px-4 py-3 text-right">Est. Unit Price</th>
                                <th scope="col" className="px-4 py-3 text-right">Est. Total Price</th>
                                <th scope="col" className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map(line => {
                                const item = items.find(i => i.id === line.item_id);
                                return (
                                <tr key={line.id} className="bg-white border-b">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-800">{item?.material_name}</div>
                                        <div className="text-xs text-gray-500">{item?.material_code}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold">{line.request_qty.toLocaleString()} {item?.unit}</td>
                                    <td className="px-4 py-3 text-right font-mono">{line.est_unit_price.toLocaleString(undefined, { style: 'currency', currency: project?.base_currency || 'USD' })}</td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold">{line.est_total_price.toLocaleString(undefined, { style: 'currency', currency: project?.base_currency || 'USD' })}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={getStatusBadge(line.status)}>{line.status}</span>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
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