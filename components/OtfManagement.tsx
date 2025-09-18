
import React, { useState, useMemo, useCallback } from 'react';
import type { User, OTF_Order, Project, Discipline, STF_Order, OTF_OrderLine, STF_OrderLine, MTF_Line, Supplier, Attachment, ItemLibrary } from '../types';
import { WorkflowStatus, RoleName } from '../types';
import { EyeIcon, CheckCircleIcon, ChevronUpIcon, ChevronDownIcon, XCircleIcon, XMarkIcon, PencilIcon, TrashIcon } from './icons/Icons';
import { OtfDetailModal } from './modals/OtfDetailModal';
import { ReviseOtfModal } from './modals/ReviseOtfModal';
import { ConfirmationModal } from './modals/ConfirmationModal';

interface OtfManagementProps {
    currentUser: User;
    otfOrders: OTF_Order[];
    setOtfOrders: React.Dispatch<React.SetStateAction<OTF_Order[]>>;
    projects: Project[];
    disciplines: Discipline[];
    users: User[];
    onLogOtfAction: (
        otfHeaderId: number,
        otfIdString: string,
        action: 'Created' | 'Approved' | 'Rejected' | 'Revised' | 'Closed',
        fromStatus: WorkflowStatus | null,
        toStatus: WorkflowStatus,
        details: string
    ) => void;
    otfOrderLines: OTF_OrderLine[];
    stfOrderLines: STF_OrderLine[];
    mtfLines: MTF_Line[];
    stfOrders: STF_Order[];
    onReviseOtf: (
        otfHeaderId: number,
        otfData: {
          lines: { stfOrderLineId: number; orderQty: number; unitPrice: number }[];
          attachment: Attachment | null;
          totalValue: number;
        }
    ) => void;
    suppliers: Supplier[];
    items: ItemLibrary[];
}

interface EligibleStfLineForOtf {
    stfOrderLineId: number;
    stfId: string;
    materialName: string;
    materialCode: string;
    unit: string;
    stfOrderedQty: number;
    stfBacklog: number;
}


const getStatusBadge = (status: WorkflowStatus) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full leading-tight';
  switch (status) {
    case WorkflowStatus.Approved:
      return `${baseClasses} bg-green-100 text-green-700`;
    case WorkflowStatus.Rejected:
      return `${baseClasses} bg-red-100 text-red-700`;
    case WorkflowStatus.PendingApproval:
      return `${baseClasses} bg-yellow-100 text-yellow-700`;
    case WorkflowStatus.Closed:
      return `${baseClasses} bg-gray-600 text-white`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-500`;
  }
};

export const OtfManagement: React.FC<OtfManagementProps> = ({ 
    currentUser, otfOrders, setOtfOrders, projects, disciplines, users, onLogOtfAction, otfOrderLines, stfOrderLines, mtfLines, stfOrders, onReviseOtf, suppliers, items
}) => {
    
    const [detailOtf, setDetailOtf] = useState<OTF_Order | null>(null);
    const [otfToRevise, setOtfToRevise] = useState<OTF_Order | null>(null);
    const [otfToClose, setOtfToClose] = useState<OTF_Order | null>(null);


    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'date_created', direction: 'descending' });
    const [showMyPending, setShowMyPending] = useState(false);

    const initialFilters = {
        otfId: '',
        project: '',
        status: '',
        creator: '',
        supplier: '',
        invoiceNo: '',
    };
    const [filters, setFilters] = useState(initialFilters);

    const userOtfOrders = useMemo(() => {
        const userProjectIds = new Set(currentUser.project_ids);
        return otfOrders.filter(h => userProjectIds.has(h.project_id));
    }, [otfOrders, currentUser.project_ids]);

    const canApproveOtf = useCallback((order: OTF_Order): boolean => {
        if (order.status !== WorkflowStatus.PendingApproval) {
            return false;
        }

        const project = projects.find(p => p.id === order.project_id);
        if (!project) return false;

        const requiredLevel = order.current_approval_level + 1;
        if (requiredLevel > project.max_otf_approval_level) return false;

        const hasDiscipline = currentUser.discipline_ids.includes(order.discipline_id);
        const hasProject = currentUser.project_ids.includes(order.project_id);
        const hasRole = currentUser.roles.some(role =>
            role.name === RoleName.OTF_Approver &&
            role.level === requiredLevel
        );
        
        return hasDiscipline && hasRole && hasProject;
    }, [currentUser, projects]);
    
    const canActOnRejectedOtf = useCallback((order: OTF_Order): boolean => {
        return order.status === WorkflowStatus.Rejected && order.created_by === currentUser.id;
    }, [currentUser.id]);

    const handleApproveOtf = useCallback((orderId: number) => {
        const order = otfOrders.find(h => h.id === orderId);
        if (!order) return;
        const project = projects.find(p => p.id === order.project_id);
        if (!project) return;
        
        const oldLevel = order.current_approval_level;
        const newLevel = oldLevel + 1;
        const isFinalApproval = newLevel >= project.max_otf_approval_level;
        const newStatus = isFinalApproval ? WorkflowStatus.Approved : WorkflowStatus.PendingApproval;

        setOtfOrders(currentOrders =>
            currentOrders.map(h =>
                h.id === orderId
                    ? { ...h, current_approval_level: newLevel, status: newStatus }
                    : h
            )
        );

        const details = isFinalApproval
            ? `OTF fully approved at L${newLevel}.`
            : `OTF approved to L${newLevel}.`;

        onLogOtfAction(order.id, order.OTF_ID, 'Approved', WorkflowStatus.PendingApproval, newStatus, details);
    }, [otfOrders, projects, setOtfOrders, onLogOtfAction]);
    
    const handleRejectOtf = useCallback((orderId: number) => {
        const order = otfOrders.find(h => h.id === orderId);
        if (!order) return;

        setOtfOrders(currentOrders =>
            currentOrders.map(h =>
                h.id === orderId ? { ...h, status: WorkflowStatus.Rejected } : h
            )
        );
        
        onLogOtfAction(order.id, order.OTF_ID, 'Rejected', order.status, WorkflowStatus.Rejected, `OTF rejected at L${order.current_approval_level + 1}.`);
    }, [otfOrders, setOtfOrders, onLogOtfAction]);
    
    const handleAcknowledgeRejection = useCallback(() => {
        if (!otfToClose) return;

        setOtfOrders(currentOrders =>
            currentOrders.map(h =>
                h.id === otfToClose.id ? { ...h, status: WorkflowStatus.Closed } : h
            )
        );
        
        onLogOtfAction(otfToClose.id, otfToClose.OTF_ID, 'Closed', otfToClose.status, WorkflowStatus.Closed, `OTF rejection acknowledged by initiator.`);
        setOtfToClose(null);
    }, [otfToClose, setOtfOrders, onLogOtfAction]);

    const handleConfirmReviseOtf = (
         otfData: {
          lines: { stfOrderLineId: number; orderQty: number; unitPrice: number }[];
          attachment: Attachment | null;
          totalValue: number;
        }
    ) => {
        if (!otfToRevise) return;
        onReviseOtf(otfToRevise.id, otfData);
        setOtfToRevise(null);
    };

    const eligibleStfLinesForRevise = useMemo((): EligibleStfLineForOtf[] => {
        const userProjectIds = new Set(currentUser.project_ids);
        
        const approvedStfLines = stfOrderLines.filter(stfLine => {
            const stfHeader = stfOrders.find(h => h.id === stfLine.stf_order_id);
            return stfHeader && userProjectIds.has(stfHeader.project_id) && stfHeader.status === WorkflowStatus.Approved;
        });

        return approvedStfLines.map(stfLine => {
            const otfOrderedQty = otfOrderLines
                .filter(ol => ol.stf_order_line_id === stfLine.id)
                .reduce((sum, ol) => sum + ol.order_qty, 0);

            const stfBacklog = stfLine.order_qty - otfOrderedQty;
            
            const mtfLine = mtfLines.find(ml => ml.id === stfLine.mtf_line_id);
            const item = mtfLine ? items.find(i => i.id === mtfLine.item_id) : null;
            const stfHeader = stfOrders.find(so => so.id === stfLine.stf_order_id)!;

            return {
                stfOrderLineId: stfLine.id,
                stfId: stfHeader.STF_ID,
                materialName: item?.material_name || 'Unknown',
                materialCode: item?.material_code || 'N/A',
                unit: item?.unit || 'unit',
                stfOrderedQty: stfLine.order_qty,
                stfBacklog: stfBacklog,
            };
        }).filter(item => item.stfBacklog > 0);
    }, [currentUser.project_ids, stfOrderLines, stfOrders, otfOrderLines, mtfLines, items]);

    const processedOrders = useMemo(() => {
        let orders = userOtfOrders.filter(order => {
            if (showMyPending && !canApproveOtf(order)) {
                return false;
            }

            const supplierMatch = filters.supplier ?
                otfOrderLines.some(ol => {
                    if (ol.otf_order_id !== order.id) return false;
                    const stfLine = stfOrderLines.find(sl => sl.id === ol.stf_order_line_id);
                    if (!stfLine) return false;
                    const stfHeader = stfOrders.find(so => so.id === stfLine.stf_order_id);
                    return stfHeader?.supplier_id === parseInt(filters.supplier, 10);
                })
                : true;

            return (filters.otfId ? order.OTF_ID.toLowerCase().includes(filters.otfId.toLowerCase()) : true) &&
                   (filters.project ? order.project_id === parseInt(filters.project, 10) : true) &&
                   (filters.status ? order.status === filters.status : true) &&
                   (filters.creator ? order.created_by === parseInt(filters.creator, 10) : true) &&
                   (filters.invoiceNo ? order.invoice_no?.toLowerCase().includes(filters.invoiceNo.toLowerCase()) : true) &&
                   supplierMatch;
        });

        const sortableOrders = [...orders];
        if (sortConfig.key) {
            sortableOrders.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'discipline_code') {
                    aValue = disciplines.find(d => d.id === a.discipline_id)?.discipline_code || '';
                    bValue = disciplines.find(d => d.id === b.discipline_id)?.discipline_code || '';
                } else {
                    aValue = a[sortConfig.key as keyof OTF_Order];
                    bValue = b[sortConfig.key as keyof OTF_Order];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return sortableOrders;
    }, [userOtfOrders, filters, showMyPending, sortConfig, canApproveOtf, disciplines, otfOrderLines, stfOrderLines, stfOrders]);

    const totals = useMemo(() => {
        const valueTotals = new Map<string, number>();

        processedOrders.forEach(order => {
            const project = projects.find(p => p.id === order.project_id);
            const currency = project?.base_currency || 'USD';
            const currentTotal = valueTotals.get(currency) || 0;
            valueTotals.set(currency, currentTotal + order.total_value);
        });

        const formatCurrency = (value: number, currency: string) => {
            return value.toLocaleString('en-US', { style: 'currency', currency });
        };

        const formatTotals = (totalsMap: Map<string, number>) => {
            if (totalsMap.size === 0) return 'N/A';
            return Array.from(totalsMap.entries())
                .map(([currency, total]) => formatCurrency(total, currency))
                .join(' / ');
        };

        return {
            grandTotal: formatTotals(valueTotals),
        };
    }, [processedOrders, projects]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? <ChevronUpIcon /> : <ChevronDownIcon />;
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">OTF Management</h2>
                    <div className="flex items-center space-x-2">
                         <button 
                            onClick={() => setShowMyPending(prev => !prev)} 
                            className={`flex items-center font-semibold px-4 py-2 rounded-lg transition duration-200 ${
                                showMyPending 
                                ? 'bg-yellow-400 text-yellow-900' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <CheckCircleIcon />
                            <span className="ml-2">My Pending Approvals</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg items-end">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">OTF ID</label>
                        <input type="text" name="otfId" value={filters.otfId} onChange={handleFilterChange} placeholder="Search by ID..." className="w-full text-sm p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No.</label>
                        <input type="text" name="invoiceNo" value={filters.invoiceNo} onChange={handleFilterChange} placeholder="Search by Invoice..." className="w-full text-sm p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                        <select name="project" value={filters.project} onChange={handleFilterChange} className="w-full text-sm p-2 border rounded-md bg-white">
                            <option value="">All Projects</option>
                            {projects.filter(p => currentUser.project_ids.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                        </select>
                    </div>
                    <div>
                         <button onClick={() => setFilters(initialFilters)} className="flex items-center bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200 w-full justify-center">
                            <XMarkIcon />
                            <span className="ml-2">Clear</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">OTF ID</th>
                                <th scope="col" className="px-6 py-3">Invoice #</th>
                                <th scope="col" className="px-6 py-3">Invoice Date</th>
                                <th scope="col" className="px-6 py-3">Project</th>
                                <th scope="col" className="px-6 py-3">
                                    <button onClick={() => requestSort('discipline_code')} className="flex items-center space-x-1 group">
                                        <span>Discipline</span>
                                        <span className="opacity-50 group-hover:opacity-100">{getSortIcon('discipline_code')}</span>
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    <button onClick={() => requestSort('total_value')} className="flex items-center space-x-1 group">
                                        <span>Total Value</span>
                                        <span className="opacity-50 group-hover:opacity-100">{getSortIcon('total_value')}</span>
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Creator</th>
                                <th scope="col" className="px-6 py-3">
                                    <button onClick={() => requestSort('date_created')} className="flex items-center space-x-1 group">
                                        <span>Date Created</span>
                                        <span className="opacity-50 group-hover:opacity-100">{getSortIcon('date_created')}</span>
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-center">Approval Level</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedOrders.map(order => {
                                const project = projects.find(p => p.id === order.project_id);
                                const discipline = disciplines.find(d => d.id === order.discipline_id);
                                const creator = users.find(u => u.id === order.created_by);
                                return (
                                <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-semibold text-gray-700">{order.OTF_ID}</td>
                                    <td className="px-6 py-4 font-mono">{order.invoice_no}</td>
                                    <td className="px-6 py-4">{order.invoice_date ? new Date(order.invoice_date).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4 font-medium">{project?.code}</td>
                                    <td className="px-6 py-4">{discipline?.discipline_code}</td>
                                    <td className="px-6 py-4 font-mono font-semibold text-teal-700">
                                        {order.total_value.toLocaleString(undefined, { style: 'currency', currency: project?.base_currency || 'USD' })}
                                    </td>
                                    <td className="px-6 py-4"><span className={getStatusBadge(order.status)}>{order.status}</span></td>
                                    <td className="px-6 py-4">{creator ? `${creator.firstName} ${creator.lastName}` : 'N/A'}</td>
                                    <td className="px-6 py-4">{new Date(order.date_created).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-center">{order.current_approval_level} / {project?.max_otf_approval_level}</td>
                                    <td className="px-6 py-4 flex items-center space-x-2">
                                        <button onClick={() => setDetailOtf(order)} className="text-gray-500 hover:text-blue-600 p-1" title="View Details"><EyeIcon /></button>
                                        {canApproveOtf(order) && (
                                            <>
                                                <button 
                                                    onClick={() => handleApproveOtf(order.id)}
                                                    className="text-gray-500 hover:text-green-600 p-1" 
                                                    title="Approve OTF"
                                                >
                                                    <CheckCircleIcon />
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectOtf(order.id)}
                                                    className="text-gray-500 hover:text-red-600 p-1" 
                                                    title="Reject OTF"
                                                >
                                                    <XCircleIcon />
                                                </button>
                                            </>
                                        )}
                                        {canActOnRejectedOtf(order) && (
                                            <>
                                                <button 
                                                    onClick={() => setOtfToRevise(order)}
                                                    className="text-gray-500 hover:text-blue-600 p-1" 
                                                    title="Revise and Resubmit OTF"
                                                >
                                                    <PencilIcon />
                                                </button>
                                                <button 
                                                    onClick={() => setOtfToClose(order)}
                                                    className="text-gray-500 hover:text-gray-700 p-1" 
                                                    title="Acknowledge Rejection and Close OTF"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                        <tfoot className="bg-gray-100">
                            <tr className="font-semibold text-gray-800">
                                <td colSpan={5} className="px-6 py-3 text-right">Grand Total:</td>
                                <td className="px-6 py-3 font-mono font-bold text-teal-800 text-sm">
                                    {totals.grandTotal}
                                </td>
                                <td colSpan={5}></td>
                            </tr>
                        </tfoot>
                    </table>
                     {processedOrders.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No OTF documents found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {detailOtf && (
                <OtfDetailModal
                    isOpen={!!detailOtf}
                    onClose={() => setDetailOtf(null)}
                    otfOrder={detailOtf}
                    otfOrderLines={otfOrderLines}
                    stfOrderLines={stfOrderLines}
                    stfOrders={stfOrders}
                    mtfLines={mtfLines}
                    projects={projects}
                    disciplines={disciplines}
                    users={users}
                    items={items}
                />
            )}

            {otfToRevise && (
                <ReviseOtfModal
                    isOpen={!!otfToRevise}
                    onClose={() => setOtfToRevise(null)}
                    onResubmit={handleConfirmReviseOtf}
                    otfToRevise={otfToRevise}
                    otfOrderLines={otfOrderLines}
                    stfOrderLines={stfOrderLines}
                    eligibleStfLines={eligibleStfLinesForRevise}
                />
            )}

            {otfToClose && (
                <ConfirmationModal
                    isOpen={!!otfToClose}
                    onClose={() => setOtfToClose(null)}
                    onConfirm={handleAcknowledgeRejection}
                    title="Acknowledge OTF Rejection"
                >
                   <p>Are you sure you want to close this OTF ({otfToClose.OTF_ID})?</p>
                   <p className="mt-2">This action cannot be undone. The OTF will be permanently marked as 'Closed' and removed from active workflows.</p>
                </ConfirmationModal>
            )}
        </>
    );
};
