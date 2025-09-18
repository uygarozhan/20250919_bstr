
import React, { useState, useMemo, useCallback } from 'react';
import type { User, STF_Order, Project, Discipline, STF_OrderLine, MTF_Line, DashboardItem, MTF_Header, Supplier, OTF_Order, OTF_OrderLine, ItemLibrary, Attachment } from '../types';
import { WorkflowStatus, RoleName } from '../types';
import { EyeIcon, CheckCircleIcon, ChevronUpIcon, ChevronDownIcon, XCircleIcon, XMarkIcon, PencilIcon, TrashIcon } from './icons/Icons';
import { StfDetailModal } from './modals/StfDetailModal';
import { ReviseStfModal } from './modals/ReviseStfModal';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { CreateOtfModal } from './modals/CreateOtfModal';

interface StfManagementProps {
    currentUser: User;
    stfOrders: STF_Order[];
    setStfOrders: React.Dispatch<React.SetStateAction<STF_Order[]>>;
    projects: Project[];
    disciplines: Discipline[];
    users: User[];
    onLogStfAction: (
        stfHeaderId: number,
        stfIdString: string,
        action: 'Created' | 'Approved' | 'Rejected' | 'Revised' | 'Closed',
        fromStatus: WorkflowStatus | null,
        toStatus: WorkflowStatus,
        details: string
    ) => void;
    stfOrderLines: STF_OrderLine[];
    mtfLines: MTF_Line[];
    mtfHeaders: MTF_Header[];
    onReviseStf: (
        stfHeaderId: number,
        stfData: {
          lines: { mtfLineId: number; orderQty: number; unitPrice: number; material_description: string }[];
          attachment: Attachment | null;
          totalValue: number;
          supplierId: number;
        }
    ) => void;
    suppliers: Supplier[];
    otfOrders: OTF_Order[];
    otfOrderLines: OTF_OrderLine[];
    onCreateOtf: (
        stfOrderLineId: number,
        otfData: {
          lines: { stfOrderLineId: number; orderQty: number; unitPrice: number }[];
          attachment: Attachment | null;
          totalValue: number;
        }
    ) => void;
    items: ItemLibrary[];
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

export const StfManagement: React.FC<StfManagementProps> = ({ 
    currentUser, stfOrders, setStfOrders, projects, disciplines, users, onLogStfAction, stfOrderLines, mtfLines, mtfHeaders, onReviseStf, suppliers, otfOrders, otfOrderLines, onCreateOtf, items
}) => {
    
    const [detailStf, setDetailStf] = useState<STF_Order | null>(null);
    const [stfToRevise, setStfToRevise] = useState<STF_Order | null>(null);
    const [stfToClose, setStfToClose] = useState<STF_Order | null>(null);
    const [isCreateOtfModalOpen, setCreateOtfModalOpen] = useState(false);

    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'date_created', direction: 'descending' });
    const [showMyPending, setShowMyPending] = useState(false);

    const initialFilters = {
        stfId: '',
        project: '',
        status: '',
        creator: '',
        supplier: '',
    };
    const [filters, setFilters] = useState(initialFilters);

    const canCreateOtf = useMemo(() => currentUser.roles.some(role => role.name === RoleName.OTF_Initiator), [currentUser]);

    const userStfOrders = useMemo(() => {
        const userProjectIds = new Set(currentUser.project_ids);
        return stfOrders.filter(h => userProjectIds.has(h.project_id));
    }, [stfOrders, currentUser.project_ids]);

    const canApproveStf = useCallback((order: STF_Order): boolean => {
        if (order.status !== WorkflowStatus.PendingApproval) {
            return false;
        }

        const project = projects.find(p => p.id === order.project_id);
        if (!project) return false;

        const requiredLevel = order.current_approval_level + 1;
        if (requiredLevel > project.max_stf_approval_level) return false;

        const hasDiscipline = currentUser.discipline_ids.includes(order.discipline_id);
        const hasProject = currentUser.project_ids.includes(order.project_id);
        const hasRole = currentUser.roles.some(role =>
            role.name === RoleName.STF_Approver &&
            role.level === requiredLevel
        );
        
        return hasDiscipline && hasRole && hasProject;
    }, [currentUser, projects]);
    
    const canActOnRejectedStf = useCallback((order: STF_Order): boolean => {
        return order.status === WorkflowStatus.Rejected && order.created_by === currentUser.id;
    }, [currentUser.id]);

    const handleApproveStf = useCallback((orderId: number) => {
        const order = stfOrders.find(h => h.id === orderId);
        if (!order) return;
        const project = projects.find(p => p.id === order.project_id);
        if (!project) return;
        
        const oldLevel = order.current_approval_level;
        const newLevel = oldLevel + 1;
        const isFinalApproval = newLevel >= project.max_stf_approval_level;
        const newStatus = isFinalApproval ? WorkflowStatus.Approved : WorkflowStatus.PendingApproval;

        setStfOrders(currentOrders =>
            currentOrders.map(h =>
                h.id === orderId
                    ? { ...h, current_approval_level: newLevel, status: newStatus }
                    : h
            )
        );

        const details = isFinalApproval
            ? `STF fully approved at L${newLevel}.`
            : `STF approved to L${newLevel}.`;

        onLogStfAction(order.id, order.STF_ID, 'Approved', WorkflowStatus.PendingApproval, newStatus, details);
    }, [stfOrders, projects, setStfOrders, onLogStfAction]);
    
    const handleRejectStf = useCallback((orderId: number) => {
        const order = stfOrders.find(h => h.id === orderId);
        if (!order) return;

        setStfOrders(currentOrders =>
            currentOrders.map(h =>
                h.id === orderId ? { ...h, status: WorkflowStatus.Rejected } : h
            )
        );
        
        onLogStfAction(order.id, order.STF_ID, 'Rejected', order.status, WorkflowStatus.Rejected, `STF rejected at L${order.current_approval_level + 1}.`);
    }, [stfOrders, setStfOrders, onLogStfAction]);

     const handleAcknowledgeRejection = useCallback(() => {
        if (!stfToClose) return;

        setStfOrders(currentOrders =>
            currentOrders.map(h =>
                h.id === stfToClose.id ? { ...h, status: WorkflowStatus.Closed } : h
            )
        );
        
        onLogStfAction(stfToClose.id, stfToClose.STF_ID, 'Closed', stfToClose.status, WorkflowStatus.Closed, `STF rejection acknowledged by initiator.`);
        setStfToClose(null);
    }, [stfToClose, setStfOrders, onLogStfAction]);

     const handleConfirmReviseStf = (
         stfData: {
          lines: { mtfLineId: number; orderQty: number; unitPrice: number; material_description: string }[];
          attachment: Attachment | null;
          totalValue: number;
          supplierId: number;
        }
    ) => {
        if (!stfToRevise) return;
        onReviseStf(stfToRevise.id, stfData as any);
        setStfToRevise(null);
    };

    const handleConfirmCreateOtf = (
      stfOrderLineId: number,
      otfData: {
        lines: { stfOrderLineId: number; orderQty: number; unitPrice: number }[];
        attachment: Attachment | null;
        totalValue: number;
      }
    ) => {
        onCreateOtf(stfOrderLineId, otfData);
        setCreateOtfModalOpen(false);
        setSelectedRows(new Set());
    };

    const eligibleMtfLinesForRevise = useMemo(() => {
        const userProjectIds = new Set(currentUser.project_ids);
        // Find all approved MTF lines that belong to the user's projects
        const approvedMtfLines = mtfLines.filter(line => {
            const header = mtfHeaders.find(h => h.id === line.mtf_header_id);
            return header && userProjectIds.has(header.project_id) && line.status === WorkflowStatus.Approved;
        });

        return approvedMtfLines.map(line => {
            const stfOrderedQty = stfOrderLines
                .filter(sol => sol.mtf_line_id === line.id)
                .reduce((sum, sol) => sum + sol.order_qty, 0);

            const mtfBacklog = line.request_qty - stfOrderedQty;
            const item = items.find(i => i.id === line.item_id);

            return {
                mtfLineId: line.id,
                materialCode: item?.material_code || 'N/A',
                materialName: item?.material_name || 'Unknown',
                mtfBacklog: mtfBacklog,
                mtfStatus: WorkflowStatus.Approved,
            } as DashboardItem; // Cast to DashboardItem
        }).filter(item => item.mtfBacklog > 0);
    }, [currentUser.project_ids, mtfLines, mtfHeaders, stfOrderLines, items]);

    const processedOrders = useMemo(() => {
        let orders = userStfOrders.filter(order => {
            if (showMyPending && !canApproveStf(order)) {
                return false;
            }
            return (filters.stfId ? order.STF_ID.toLowerCase().includes(filters.stfId.toLowerCase()) : true) &&
                   (filters.project ? order.project_id === parseInt(filters.project, 10) : true) &&
                   (filters.status ? order.status === filters.status : true) &&
                   (filters.creator ? order.created_by === parseInt(filters.creator, 10) : true) &&
                   (filters.supplier ? order.supplier_id === parseInt(filters.supplier, 10) : true);
        });

        const sortableOrders = [...orders];
        if (sortConfig.key) {
            sortableOrders.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'discipline_code') {
                    aValue = disciplines.find(d => d.id === a.discipline_id)?.discipline_code || '';
                    bValue = disciplines.find(d => d.id === b.discipline_id)?.discipline_code || '';
                } else if (sortConfig.key === 'supplier_name') {
                    aValue = suppliers.find(s => s.id === a.supplier_id)?.name || '';
                    bValue = suppliers.find(s => s.id === b.supplier_id)?.name || '';
                } else {
                    aValue = a[sortConfig.key as keyof STF_Order];
                    bValue = b[sortConfig.key as keyof STF_Order];
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
    }, [userStfOrders, filters, showMyPending, sortConfig, canApproveStf, disciplines, suppliers]);

    const selectedOrders = useMemo(() => {
      return stfOrders.filter(order => selectedRows.has(order.id));
    }, [selectedRows, stfOrders]);

    const isCreateOtfDisabled = useMemo(() => {
        if (selectedOrders.length === 0) return true;
        return !selectedOrders.every(order => order.status === WorkflowStatus.Approved);
    }, [selectedOrders]);

    const selectedItemsForOtfModal = useMemo((): DashboardItem[] => {
        if (!isCreateOtfModalOpen) return [];
        const selectedStfLines = stfOrderLines.filter(line => selectedRows.has(line.stf_order_id));
        const uniqueMtfLineIds = [...new Set(selectedStfLines.map(l => l.mtf_line_id))];

        return uniqueMtfLineIds.map(mtfLineId => {
            const mtfLine = mtfLines.find(ml => ml.id === mtfLineId);
            const item = mtfLine ? items.find(i => i.id === mtfLine.item_id) : null;
            
            return {
                mtfLineId: mtfLineId,
                materialName: item?.material_name || 'Unknown',
                materialCode: item?.material_code || 'N/A',
                unit: item?.unit || '',
            } as DashboardItem;
        });
    }, [isCreateOtfModalOpen, selectedRows, stfOrderLines, mtfLines, items]);

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

    const handleSelectRow = useCallback((id: number) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedRows.size === processedOrders.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(processedOrders.map(item => item.id)));
        }
    }, [selectedRows.size, processedOrders]);


    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">STF Management</h2>
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
                 {selectedRows.size > 0 && (
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-800">{selectedRows.size} order(s) selected.</p>
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => setCreateOtfModalOpen(true)}
                                className={`bg-teal-600 text-white font-semibold px-4 py-2 text-sm rounded-lg transition duration-200 ${!canCreateOtf || isCreateOtfDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'}`}
                                disabled={!canCreateOtf || isCreateOtfDisabled}
                                title={
                                    !canCreateOtf ? "You don't have the OTF Initiator role." :
                                    isCreateOtfDisabled ? "Only 'Approved' STF orders can be used for an OTF." :
                                    "Create an OTF from selected approved orders."
                                }
                            >
                                Create OTF
                            </button>
                        </div>
                     </div>
                )}


                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">STF ID</label>
                        <input type="text" name="stfId" value={filters.stfId} onChange={handleFilterChange} placeholder="Search by ID..." className="w-full text-sm p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                        <select name="project" value={filters.project} onChange={handleFilterChange} className="w-full text-sm p-2 border rounded-md bg-white">
                            <option value="">All Projects</option>
                            {projects.filter(p => currentUser.project_ids.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                        <select name="supplier" value={filters.supplier} onChange={handleFilterChange} className="w-full text-sm p-2 border rounded-md bg-white">
                            <option value="">All Suppliers</option>
                            {suppliers.filter(s => s.tenant_id === currentUser.tenant_id && s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full text-sm p-2 border rounded-md bg-white">
                            <option value="">All Statuses</option>
                            {Object.values(WorkflowStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Creator</label>
                        <select name="creator" value={filters.creator} onChange={handleFilterChange} className="w-full text-sm p-2 border rounded-md bg-white">
                            <option value="">All Creators</option>
                            {users.filter(u => u.tenant_id === currentUser.tenant_id).map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
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
                                <th scope="col" className="p-4">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        checked={selectedRows.size > 0 && selectedRows.size === processedOrders.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3">STF ID</th>
                                <th scope="col" className="px-6 py-3">Project</th>
                                <th scope="col" className="px-6 py-3">
                                    <button onClick={() => requestSort('discipline_code')} className="flex items-center space-x-1 group">
                                        <span>Discipline</span>
                                        <span className="opacity-50 group-hover:opacity-100">{getSortIcon('discipline_code')}</span>
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    <button onClick={() => requestSort('supplier_name')} className="flex items-center space-x-1 group">
                                        <span>Supplier</span>
                                        <span className="opacity-50 group-hover:opacity-100">{getSortIcon('supplier_name')}</span>
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
                                const supplier = suppliers.find(s => s.id === order.supplier_id);
                                return (
                                <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="w-4 p-4">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            checked={selectedRows.has(order.id)}
                                            onChange={() => handleSelectRow(order.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-mono font-semibold text-gray-700">{order.STF_ID}</td>
                                    <td className="px-6 py-4 font-medium">{project?.code}</td>
                                    <td className="px-6 py-4">{discipline?.discipline_code}</td>
                                    <td className="px-6 py-4">{supplier?.name}</td>
                                    <td className="px-6 py-4 font-mono font-semibold text-blue-700">
                                        {order.total_value.toLocaleString(undefined, { style: 'currency', currency: project?.base_currency || 'USD' })}
                                    </td>
                                    <td className="px-6 py-4"><span className={getStatusBadge(order.status)}>{order.status}</span></td>
                                    <td className="px-6 py-4">{creator ? `${creator.firstName} ${creator.lastName}` : 'N/A'}</td>
                                    <td className="px-6 py-4">{new Date(order.date_created).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-center">{order.current_approval_level} / {project?.max_stf_approval_level}</td>
                                    <td className="px-6 py-4 flex items-center space-x-2">
                                        <button onClick={() => setDetailStf(order)} className="text-gray-500 hover:text-blue-600 p-1" title="View Details"><EyeIcon /></button>
                                        {canApproveStf(order) && (
                                            <>
                                                <button 
                                                    onClick={() => handleApproveStf(order.id)}
                                                    className="text-gray-500 hover:text-green-600 p-1" 
                                                    title="Approve STF"
                                                >
                                                    <CheckCircleIcon />
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectStf(order.id)}
                                                    className="text-gray-500 hover:text-red-600 p-1" 
                                                    title="Reject STF"
                                                >
                                                    <XCircleIcon />
                                                </button>
                                            </>
                                        )}
                                        {canActOnRejectedStf(order) && (
                                            <>
                                                <button 
                                                    onClick={() => setStfToRevise(order)}
                                                    className="text-gray-500 hover:text-blue-600 p-1" 
                                                    title="Revise and Resubmit STF"
                                                >
                                                    <PencilIcon />
                                                </button>
                                                <button 
                                                    onClick={() => setStfToClose(order)}
                                                    className="text-gray-500 hover:text-gray-700 p-1" 
                                                    title="Acknowledge Rejection and Close STF"
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
                                <td className="px-6 py-3 font-mono font-bold text-blue-800 text-sm">
                                    {totals.grandTotal}
                                </td>
                                <td colSpan={5}></td>
                            </tr>
                        </tfoot>
                    </table>
                     {processedOrders.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No STF documents found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {detailStf && (
                <StfDetailModal
                    isOpen={!!detailStf}
                    onClose={() => setDetailStf(null)}
                    stfOrder={detailStf}
                    stfOrderLines={stfOrderLines}
                    mtfLines={mtfLines}
                    projects={projects}
                    disciplines={disciplines}
                    users={users}
                    suppliers={suppliers}
                    items={items}
                />
            )}

             {stfToRevise && (
                <ReviseStfModal
                    isOpen={!!stfToRevise}
                    onClose={() => setStfToRevise(null)}
                    onResubmit={handleConfirmReviseStf}
                    stfToRevise={stfToRevise}
                    stfOrderLines={stfOrderLines}
                    mtfLines={mtfLines}
                    eligibleMtfLines={eligibleMtfLinesForRevise}
                    suppliers={suppliers}
                    currentUser={currentUser}
                    items={items}
                />
            )}

            {stfToClose && (
                <ConfirmationModal
                    isOpen={!!stfToClose}
                    onClose={() => setStfToClose(null)}
                    onConfirm={handleAcknowledgeRejection}
                    title="Acknowledge STF Rejection"
                >
                   <p>Are you sure you want to close this STF ({stfToClose.STF_ID})?</p>
                   <p className="mt-2">This action cannot be undone. The STF will be permanently marked as 'Closed' and removed from active workflows.</p>
                </ConfirmationModal>
            )}

            <CreateOtfModal
                isOpen={isCreateOtfModalOpen}
                onClose={() => setCreateOtfModalOpen(false)}
                onCreateOtf={handleConfirmCreateOtf}
                selectedItems={selectedItemsForOtfModal}
                stfOrders={stfOrders}
                stfOrderLines={stfOrderLines}
                otfOrderLines={otfOrderLines}
            />
        </>
    );
};
