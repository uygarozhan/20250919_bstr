

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { DashboardItem, MTF_Header, MTF_Line, User, STF_Order, OTF_Order, MRF_Header, AppData, MTF_History_Log, STF_OrderLine, Attachment, ItemLibrary, MDF_Issue, MDF_IssueLine } from '../types';
import { RoleName, WorkflowStatus } from '../types';
import { CheckCircleIcon, EyeIcon, XCircleIcon, FunnelIcon, XMarkIcon, ArrowPathIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ChevronDownIcon } from './icons/Icons';
import { ItemDetailModal } from './modals/ItemDetailModal';
import { CreateMtfModal } from './modals/CreateMtfModal';
import { CreateStfModal } from './modals/CreateStfModal';
import { StfApprovalModal } from './modals/StfApprovalModal';
import { ReviseStfModal } from './modals/ReviseStfModal';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { CreateOtfModal } from './modals/CreateOtfModal';
import { OtfApprovalModal } from './modals/OtfApprovalModal';
import { CreateMrfModal } from './modals/CreateMrfModal';
import { MrfApprovalModal } from './modals/MrfApprovalModal';
import { ReviseMtfModal } from './modals/ReviseMtfModal';

// Add declaration for XLSX library loaded from CDN
declare var XLSX: any;

// Update DashboardProps to align with what App.tsx provides.
interface DashboardProps {
    currentUser: User;
    data: AppData;
    onResetData: () => void;
    setMtfHeaders: React.Dispatch<React.SetStateAction<MTF_Header[]>>;
    setMtfLines: React.Dispatch<React.SetStateAction<MTF_Line[]>>;
    setStfOrders: React.Dispatch<React.SetStateAction<STF_Order[]>>;
    setOtfOrders: React.Dispatch<React.SetStateAction<OTF_Order[]>>;
    setMrfHeaders: React.Dispatch<React.SetStateAction<MRF_Header[]>>;
    onCreateMtf: (header: MTF_Header, lines: Omit<MTF_Line, 'id'>[]) => void;
    onBulkCreateMtf: (items: { project_id: number; discipline_id: number; item_id: number; request_qty: number; }[]) => void;
    onCreateStf: (
        firstItem: DashboardItem,
        stfData: {
          lines: { mtfLineId: number; orderQty: number; unitPrice: number; material_description: string; }[];
          attachment: { fileName: string; fileType: string; fileContent: string; } | null;
          totalValue: number;
          supplierId: number;
        }
    ) => void;
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
    onCreateMrf: (
        otfOrderLineId: number,
        mrfData: {
            lines: { otfOrderLineId: number; receivedQty: number }[];
            attachment: { fileName: string; fileType: string; fileContent: string; } | null;
        }
    ) => void;
    onReviseStf: (
        stfHeaderId: number,
        stfData: {
          lines: { mtfLineId: number; orderQty: number; unitPrice: number; material_description: string; }[];
          attachment: { fileName: string; fileType: string; fileContent: string; } | null;
          totalValue: number;
          supplierId: number;
        }
    ) => void;
    onReviseMtf: (
      mtfHeaderId: number,
      mtfData: {
        lines: { itemId: number, quantity: number, description: string }[];
        attachment: { fileName: string; fileType: string; fileContent: string; } | null;
      }
    ) => void;
    onLogMtfAction: (log: Omit<MTF_History_Log, 'id'>) => void;
    onLogStfAction: (stfHeaderId: number, stfIdString: string, action: 'Created' | 'Approved' | 'Rejected' | 'Revised' | 'Closed', fromStatus: WorkflowStatus | null, toStatus: WorkflowStatus, details: string) => void;
    onLogOtfAction: (otfHeaderId: number, otfIdString: string, action: 'Created' | 'Approved' | 'Rejected' | 'Revised' | 'Closed', fromStatus: WorkflowStatus | null, toStatus: WorkflowStatus, details: string) => void;
    onLogMrfAction: (mrfHeaderId: number, mrfIdString: string, action: 'Created' | 'Approved' | 'Rejected', fromStatus: WorkflowStatus | null, toStatus: WorkflowStatus, details: string) => void;
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
    case WorkflowStatus.Initialized:
      return `${baseClasses} bg-blue-100 text-blue-700`;
    case WorkflowStatus.Received:
        return `${baseClasses} bg-purple-100 text-purple-700`;
    case WorkflowStatus.Delivered:
        return `${baseClasses} bg-gray-200 text-gray-700`;
     case WorkflowStatus.Closed:
        return `${baseClasses} bg-gray-600 text-white`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-500`;
  }
};

const ActionButtons: React.FC<{ 
    item: DashboardItem;
    onView: () => void;
    canApproveMtf: boolean;
    onApproveMtf: () => void;
    onRejectMtf: () => void;
    canActOnRejectedMtf: boolean;
    onReviseMtf: () => void;
    onAcknowledgeMtfRejection: () => void;
    canApproveStf: boolean;
    onApproveStf: () => void;
    onRejectStf: () => void;
    canApproveOtf: boolean;
    onApproveOtf: () => void;
    onRejectOtf: () => void;
    canApproveMrf: boolean;
    onApproveMrf: () => void;
    onRejectMrf: () => void;
    canActOnRejectedStf: boolean;
    onReviseStf: () => void;
    onAcknowledgeStfRejection: () => void;
}> = ({ 
    item, onView, 
    canApproveMtf, onApproveMtf, onRejectMtf, 
    canActOnRejectedMtf, onReviseMtf, onAcknowledgeMtfRejection,
    canApproveStf, onApproveStf, onRejectStf, 
    canApproveOtf, onApproveOtf, onRejectOtf,
    canApproveMrf, onApproveMrf, onRejectMrf,
    canActOnRejectedStf, onReviseStf: onReviseStfAction, onAcknowledgeStfRejection 
}) => {
    return (
        <div className="flex items-center space-x-2">
            <button 
                onClick={onView}
                className="text-gray-500 hover:text-blue-600 p-1" 
                title="View Details"
            >
                <EyeIcon />
            </button>
            {canApproveMtf && (
                <>
                    <button 
                        onClick={onApproveMtf}
                        className="text-gray-500 hover:text-green-600 p-1" 
                        title="Approve MTF Line"
                    >
                        <CheckCircleIcon />
                    </button>
                    <button 
                        onClick={onRejectMtf}
                        className="text-gray-500 hover:text-red-600 p-1" 
                        title="Reject MTF Line"
                    >
                        <XCircleIcon />
                    </button>
                </>
            )}
             {canActOnRejectedMtf && (
                <>
                    <button 
                        onClick={onReviseMtf}
                        className="text-gray-500 hover:text-blue-600 p-1" 
                        title="Revise and Resubmit MTF"
                    >
                        <PencilIcon />
                    </button>
                    <button 
                        onClick={onAcknowledgeMtfRejection}
                        className="text-gray-500 hover:text-gray-700 p-1" 
                        title="Acknowledge Rejection and Close MTF"
                    >
                        <TrashIcon />
                    </button>
                </>
            )}
            {canApproveStf && (
                 <>
                    <button 
                        onClick={onApproveStf}
                        className="text-gray-500 hover:text-green-600 p-1" 
                        title="Approve STF"
                    >
                        <CheckCircleIcon />
                    </button>
                    <button 
                        onClick={onRejectStf}
                        className="text-gray-500 hover:text-red-600 p-1" 
                        title="Reject STF"
                    >
                        <XCircleIcon />
                    </button>
                </>
            )}
            {canApproveOtf && (
                 <>
                    <button 
                        onClick={onApproveOtf}
                        className="text-gray-500 hover:text-green-600 p-1" 
                        title="Approve OTF"
                    >
                        <CheckCircleIcon />
                    </button>
                    <button 
                        onClick={onRejectOtf}
                        className="text-gray-500 hover:text-red-600 p-1" 
                        title="Reject OTF"
                    >
                        <XCircleIcon />
                    </button>
                </>
            )}
             {canApproveMrf && (
                 <>
                    <button 
                        onClick={onApproveMrf}
                        className="text-gray-500 hover:text-green-600 p-1" 
                        title="Approve MRF"
                    >
                        <CheckCircleIcon />
                    </button>
                    <button 
                        onClick={onRejectMrf}
                        className="text-gray-500 hover:text-red-600 p-1" 
                        title="Reject MRF"
                    >
                        <XCircleIcon />
                    </button>
                </>
            )}
            {canActOnRejectedStf && (
                <>
                    <button 
                        onClick={onReviseStfAction}
                        className="text-gray-500 hover:text-blue-600 p-1" 
                        title="Revise and Resubmit STF"
                    >
                        <PencilIcon />
                    </button>
                    <button 
                        onClick={onAcknowledgeStfRejection}
                        className="text-gray-500 hover:text-gray-700 p-1" 
                        title="Acknowledge Rejection and Close STF"
                    >
                        <TrashIcon />
                    </button>
                </>
            )}
        </div>
    );
};


export const Dashboard: React.FC<DashboardProps> = ({ 
    currentUser, data, onResetData,
    setMtfHeaders, setMtfLines, setStfOrders, setOtfOrders, setMrfHeaders,
    onCreateMtf, onBulkCreateMtf, onCreateStf, onCreateOtf, onCreateMrf, onReviseStf, onReviseMtf,
    onLogMtfAction, onLogStfAction, onLogOtfAction, onLogMrfAction
}) => {
    const { 
        mtfHeaders, mtfLines, stfOrders, stfOrderLines, 
        otfOrders, otfOrderLines, mrfHeaders, mrfLines,
        disciplines, projects, suppliers, users, mdfIssues, mdfIssueLines
    } = data;
    
    console.log('Dashboard received props:', { currentUser, data }); // Add logging
    
    if (currentUser.is_super_admin) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-700">Access Denied</h1>
                    <p className="text-gray-500 mt-2">The dashboard is for tenant-level users. Please use the Super Admin panel.</p>
                </div>
            </div>
        );
    }
    
    const userDashboardData = useMemo<DashboardItem[]>(() => {
        console.log('Processing userDashboardData with:', { currentUser, mtfHeaders, mtfLines }); // Add logging
        
        const userProjectIds = new Set(currentUser.project_ids);
        const tenantItemIds = new Set(data.items.filter(i => i.tenant_id === currentUser.tenant_id).map(i => i.id));
        
        console.log('User project IDs:', userProjectIds); // Add logging
        console.log('Tenant item IDs:', tenantItemIds); // Add logging

        const filteredMtfLines = mtfLines.filter(mtfLine => {
            const mtfHeader = mtfHeaders.find(h => h.id === mtfLine.mtf_header_id);
            const result = mtfHeader && userProjectIds.has(mtfHeader.project_id) && tenantItemIds.has(mtfLine.item_id);
            console.log('MTF Line filter result:', { mtfLine, mtfHeader, result }); // Add logging
            return result;
        });
        
        console.log('Filtered MTF lines count:', filteredMtfLines.length); // Add logging

        return filteredMtfLines
            .filter(mtfLine => {
                // Filter out lines where we can't find all required related data
                const mtfHeader = mtfHeaders.find(h => h.id === mtfLine.mtf_header_id);
                const project = projects.find(p => p.id === mtfHeader?.project_id);
                const item = data.items.find(i => i.id === mtfLine.item_id);
                const discipline = disciplines.find(d => d.id === mtfHeader?.discipline_id);
                
                // Check if all required data is available
                const hasAllData = mtfHeader && project && item && discipline;
                console.log('Data availability check:', { mtfLine, mtfHeader, project, item, discipline, hasAllData });
                return hasAllData;
            })
            .map(mtfLine => {
                const mtfHeader = mtfHeaders.find(h => h.id === mtfLine.mtf_header_id)!;
                const project = projects.find(p => p.id === mtfHeader.project_id)!;
                const item = data.items.find(i => i.id === mtfLine.item_id)!;
                const discipline = disciplines.find(d => d.id === mtfHeader.discipline_id)!;
                const requester = users.find(u => u.id === mtfHeader.created_by);
                
                const associatedStfLines = stfOrderLines.filter(sl => sl.mtf_line_id === mtfLine.id);
                const firstStfLine = associatedStfLines.length > 0 ? associatedStfLines[0] : null;
                const stfHeader = firstStfLine ? stfOrders.find(so => so.id === firstStfLine.stf_order_id) : null;
                const supplier = stfHeader ? suppliers.find(s => s.id === stfHeader.supplier_id) : null;
                const stfOrderedQty = associatedStfLines.reduce((sum, line) => sum + line.order_qty, 0);

                const associatedOtfLines = otfOrderLines.filter(ol => associatedStfLines.some(sl => sl.id === ol.stf_order_line_id));
                const firstOtfLine = associatedOtfLines.length > 0 ? associatedOtfLines[0] : null;
                const otfHeader = firstOtfLine ? otfOrders.find(oo => oo.id === firstOtfLine.otf_order_id) : null;
                const otfOrderedQty = associatedOtfLines.reduce((sum, line) => sum + line.order_qty, 0);

                const mrfLinesForOtf = mrfLines.filter(mrl => associatedOtfLines.some(ol => ol.id === mrl.otf_order_line_id));
                const firstMrfLine = mrfLinesForOtf.length > 0 ? mrfLinesForOtf[0] : null;
                const mrfHeader = firstMrfLine ? mrfHeaders.find(mh => mh.id === firstMrfLine.mrf_header_id) : null;
                const mrfReceivedQty = mrfLinesForOtf.reduce((sum, line) => sum + line.received_qty, 0);

                const mdfLines = mdfIssueLines.filter(mdl => mrfLinesForOtf.some(mrl => mrl.id === mdl.mrf_line_id));
                const mdfDeliveredQty = mdfLines.reduce((sum, line) => sum + line.delivered_qty, 0);

                const stfTotalPrice = associatedStfLines.reduce((sum, line) => sum + (line.order_qty * line.unit_price), 0);
                const stfUnitPrice = stfOrderedQty > 0 ? stfTotalPrice / stfOrderedQty : null;
                
                const otfTotalPrice = associatedOtfLines.reduce((sum, line) => sum + (line.order_qty * line.unit_price), 0);
                const otfUnitPrice = otfOrderedQty > 0 ? otfTotalPrice / otfOrderedQty : null;

                const materialDescription = firstStfLine?.material_description ?? mtfLine.material_description;

                return {
                    mtfHeaderId: mtfHeader.id,
                    mtfLineId: mtfLine.id,
                    mtfId: mtfHeader.MTF_ID,
                    project_id: mtfHeader.project_id,
                    projectCode: project.code,
                    projectName: project.name,
                    projectCurrency: project.base_currency,
                    discipline_id: mtfHeader.discipline_id,
                    disciplineCode: discipline.discipline_code,
                    disciplineName: discipline.discipline_name,
                    budgetCode: discipline.budget_code,
                    budgetName: discipline.budget_name,
                    materialCode: item.material_code,
                    materialName: item.material_name,
                    materialDescription: materialDescription,
                    unit: item.unit,
                    mtfStatus: mtfLine.status,
                    mtfLineApprovalLevel: mtfLine.current_approval_level,
                    stfHeaderId: stfHeader?.id ?? null,
                    stfId: stfHeader?.STF_ID ?? null,
                    stfStatus: stfHeader?.status ?? null,
                    supplierName: supplier?.name ?? null,
                    otfHeaderId: otfHeader?.id ?? null,
                    otfId: otfHeader?.OTF_ID ?? null,
                    otfStatus: otfHeader?.status ?? null,
                    mrfHeaderId: mrfHeader?.id ?? null,
                    mrfId: mrfHeader?.MRF_ID ?? null,
                    mrfStatus: mrfHeader?.status ?? null,
                    requestQty: mtfLine.request_qty,
                    stfOrderedQty,
                    otfOrderedQty,
                    mrfReceivedQty,
                    mdfDeliveredQty,
                    mtfBacklog: mtfLine.request_qty - stfOrderedQty,
                    stfBacklog: stfOrderedQty - otfOrderedQty,
                    otfBacklog: otfOrderedQty - mrfReceivedQty,
                    requester: requester ? `${requester.firstName} ${requester.lastName}` : 'Unknown User',
                    dateCreated: mtfHeader.date_created,
                    mtfEstUnitPrice: mtfLine.est_unit_price,
                    mtfEstTotalPrice: mtfLine.est_total_price,
                    stfUnitPrice: stfUnitPrice,
                    stfTotalPrice: stfTotalPrice > 0 ? stfTotalPrice : null,
                    otfUnitPrice: otfUnitPrice,
                    otfTotalPrice: otfTotalPrice > 0 ? otfTotalPrice : null,
                };
            });
    }, [currentUser, mtfHeaders, mtfLines, disciplines, stfOrders, stfOrderLines, otfOrders, otfOrderLines, mrfHeaders, mrfLines, projects, users, suppliers, data.items, mdfIssueLines]);

    const canApproveOrRejectMtf = useCallback((item: DashboardItem, user: User): boolean => {
      const mtfLine = mtfLines.find(l => l.id === item.mtfLineId);
      if (!mtfLine || mtfLine.status !== WorkflowStatus.PendingApproval) {
        return false;
      }

      const mtfHeader = mtfHeaders.find(h => h.id === item.mtfHeaderId);
      if (!mtfHeader) return false;

      const project = projects.find(p => p.id === mtfHeader.project_id);
      if (!project) return false;

      const requiredLevel = mtfLine.current_approval_level + 1;
      if (requiredLevel > project.max_mtf_approval_level) return false;

      const hasDiscipline = user.discipline_ids.includes(mtfHeader.discipline_id);
      const hasRole = user.roles.some(role =>
        role.name === RoleName.MTF_Approver &&
        role.level === requiredLevel
      );

      return hasDiscipline && hasRole;
    }, [mtfHeaders, mtfLines, projects]);

    const canActOnRejectedMtf = useCallback((item: DashboardItem, user: User): boolean => {
        if (item.mtfStatus !== WorkflowStatus.Rejected) return false;
        const mtfHeader = mtfHeaders.find(h => h.id === item.mtfHeaderId);
        return mtfHeader?.created_by === user.id;
    }, [mtfHeaders]);
    
    const canApproveOrRejectStf = useCallback((item: DashboardItem, user: User): boolean => {
      const stfHeader = stfOrders.find(h => h.id === item.stfHeaderId);
      if (!stfHeader || stfHeader.status !== WorkflowStatus.PendingApproval) {
        return false;
      }

      const project = projects.find(p => p.id === stfHeader.project_id);
      if (!project) return false;

      const requiredLevel = stfHeader.current_approval_level + 1;
      if (requiredLevel > project.max_stf_approval_level) return false;

      const hasProject = user.project_ids.includes(stfHeader.project_id);
      const hasDiscipline = user.discipline_ids.includes(stfHeader.discipline_id);
      const hasRole = user.roles.some(role =>
        role.name === RoleName.STF_Approver &&
        role.level === requiredLevel
      );

      return hasProject && hasDiscipline && hasRole;
    }, [stfOrders, projects]);
    
    const canApproveOrRejectOtf = useCallback((item: DashboardItem, user: User): boolean => {
      const otfHeader = otfOrders.find(h => h.id === item.otfHeaderId);
      if (!otfHeader || otfHeader.status !== WorkflowStatus.PendingApproval) {
        return false;
      }

      const project = projects.find(p => p.id === otfHeader.project_id);
      if (!project) return false;

      const requiredLevel = otfHeader.current_approval_level + 1;
      if (requiredLevel > project.max_otf_approval_level) return false;

      const hasProject = user.project_ids.includes(otfHeader.project_id);
      const hasDiscipline = user.discipline_ids.includes(otfHeader.discipline_id);
      const hasRole = user.roles.some(role =>
        role.name === RoleName.OTF_Approver &&
        role.level === requiredLevel
      );

      return hasProject && hasDiscipline && hasRole;
    }, [otfOrders, projects]);

    const canApproveOrRejectMrf = useCallback((item: DashboardItem, user: User): boolean => {
      const mrfHeader = mrfHeaders.find(h => h.id === item.mrfHeaderId);
      if (!mrfHeader || mrfHeader.status !== WorkflowStatus.PendingApproval) {
        return false;
      }

      const project = projects.find(p => p.id === mrfHeader.project_id);
      if (!project) return false;

      const requiredLevel = mrfHeader.current_approval_level + 1;
      if (requiredLevel > project.max_mrf_approval_level) return false;

      const hasDiscipline = user.discipline_ids.includes(mrfHeader.discipline_id);
      const hasRole = user.roles.some(role =>
        role.name === RoleName.MRF_Approver &&
        role.level === requiredLevel
      );

      return hasDiscipline && hasRole;
    }, [mrfHeaders, projects]);

    const canActOnRejectedStf = useCallback((item: DashboardItem, user: User): boolean => {
        if (item.stfStatus !== WorkflowStatus.Rejected) return false;
        const stfHeader = stfOrders.find(h => h.id === item.stfHeaderId);
        return stfHeader?.created_by === user.id;
    }, [stfOrders]);

    const initialFilters = {
        mtfId: '',
        material: '',
        project: '',
        status: '',
        discipline: '',
        budget: '',
        supplier: '',
    };
    const [filters, setFilters] = useState(initialFilters);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [isCreateMtfModalOpen, setCreateMtfModalOpen] = useState(false);
    const [isCreateStfModalOpen, setCreateStfModalOpen] = useState(false);
    const [isCreateOtfModalOpen, setCreateOtfModalOpen] = useState(false);
    const [isCreateMrfModalOpen, setCreateMrfModalOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<DashboardItem | null>(null);
    const [stfToReview, setStfToReview] = useState<DashboardItem | null>(null);
    const [otfToReview, setOtfToReview] = useState<DashboardItem | null>(null);
    const [mrfToReview, setMrfToReview] = useState<DashboardItem | null>(null);
    const [stfToRevise, setStfToRevise] = useState<STF_Order | null>(null);
    const [stfToClose, setStfToClose] = useState<STF_Order | null>(null);
    const [mtfToRevise, setMtfToRevise] = useState<MTF_Header | null>(null);
    const [mtfToClose, setMtfToClose] = useState<MTF_Header | null>(null);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [showMyPending, setShowMyPending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportDropdownRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const canCreateMtf = useMemo(() => currentUser.roles.some(role => role.name === RoleName.Requester || role.name === RoleName.Administrator), [currentUser]);
    const canCreateStf = useMemo(() => currentUser.roles.some(role => role.name === RoleName.STF_Initiator), [currentUser]);
    const canCreateOtf = useMemo(() => currentUser.roles.some(role => role.name === RoleName.OTF_Initiator), [currentUser]);
    const canCreateMrf = useMemo(() => currentUser.roles.some(role => role.name === RoleName.MRF_Initiator), [currentUser]);
    
    const uniqueProjects = useMemo(() => {
        const userProjects = projects.filter(p => currentUser.project_ids.includes(p.id));
        return [...new Set(userProjects.map(p => p.code))];
    }, [currentUser, projects]);

    const uniqueDisciplines = useMemo(() => {
        const userDisciplines = disciplines.filter(d => currentUser.discipline_ids.includes(d.id));
        return [...new Set(userDisciplines.map(d => d.discipline_code))];
    }, [currentUser, disciplines]);

    const uniqueBudgets = useMemo(() => {
        return [...new Set(userDashboardData.map(item => item.budgetCode))];
    }, [userDashboardData]);
    
    const uniqueSuppliers = useMemo(() => {
        const tenantSuppliers = suppliers.filter(s => s.tenant_id === currentUser.tenant_id);
        return [...new Set(tenantSuppliers.map(s => s.name))];
    }, [currentUser, suppliers]);

    const uniqueStatuses = Object.values(WorkflowStatus);

    const filteredData = useMemo(() => {
        let dataToFilter = userDashboardData;

        if (showMyPending) {
            dataToFilter = dataToFilter.filter(item => 
                canApproveOrRejectMtf(item, currentUser) ||
                (item.stfHeaderId ? canApproveOrRejectStf(item, currentUser) : false) ||
                (item.otfHeaderId ? canApproveOrRejectOtf(item, currentUser) : false) ||
                (item.mrfHeaderId ? canApproveOrRejectMrf(item, currentUser) : false)
            );
        }

        return dataToFilter.filter(item => {
            const overallStatus = item.mrfStatus || item.otfStatus || item.stfStatus || item.mtfStatus;
            return (filters.mtfId ? item.mtfId.toLowerCase().includes(filters.mtfId.toLowerCase()) || item.stfId?.toLowerCase().includes(filters.mtfId.toLowerCase()) || item.otfId?.toLowerCase().includes(filters.mtfId.toLowerCase()) || item.mrfId?.toLowerCase().includes(filters.mtfId.toLowerCase()): true) &&
            (filters.material ? item.materialName.toLowerCase().includes(filters.material.toLowerCase()) || item.materialCode.toLowerCase().includes(filters.material.toLowerCase()) : true) &&
            (filters.project ? item.projectCode === filters.project : true) &&
            (filters.status ? overallStatus === filters.status : true) &&
            (filters.discipline ? item.disciplineCode === filters.discipline : true) &&
            (filters.budget ? item.budgetCode === filters.budget : true) &&
            (filters.supplier ? item.supplierName === filters.supplier : true)
        });
    }, [userDashboardData, filters, showMyPending, currentUser, canApproveOrRejectMtf, canApproveOrRejectStf, canApproveOrRejectOtf, canApproveOrRejectMrf]);

    const selectedItemsData = useMemo(() => {
        return userDashboardData.filter(item => selectedRows.has(item.mtfLineId));
    }, [selectedRows, userDashboardData]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters(initialFilters);
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
        if (selectedRows.size === filteredData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredData.map(item => item.mtfLineId)));
        }
    }, [selectedRows.size, filteredData]);
    
    const handleConfirmCreateStf = (
         stfData: {
          lines: { mtfLineId: number; orderQty: number; unitPrice: number; material_description: string; }[];
          attachment: { fileName: string; fileType: string; fileContent: string; } | null;
          totalValue: number;
          supplierId: number;
        }
    ) => {
        onCreateStf(selectedItemsData[0], stfData);
        setCreateStfModalOpen(false);
        setSelectedRows(new Set());
    };

    const handleConfirmCreateOtf = (
        stfOrderLineId: number,
        otfData: {
          lines: { stfOrderLineId: number; orderQty: number; unitPrice: number }[];
          attachment: { fileName: string; fileType: string; fileContent: string; } | null;
          totalValue: number;
          invoiceNo: string;
          invoiceDate: string;
        }
    ) => {
        onCreateOtf(stfOrderLineId, otfData);
        setCreateOtfModalOpen(false);
        setSelectedRows(new Set());
    };

    const handleConfirmCreateMrf = (
        otfOrderLineId: number,
        mrfData: {
            lines: { otfOrderLineId: number; receivedQty: number }[];
            attachment: { fileName: string; fileType: string; fileContent: string; } | null;
        }
    ) => {
        onCreateMrf(otfOrderLineId, mrfData);
        setCreateMrfModalOpen(false);
        setSelectedRows(new Set());
    };

    const handleConfirmReviseStf = (
         stfData: {
          lines: { mtfLineId: number; orderQty: number; unitPrice: number; material_description: string; }[];
          attachment: { fileName: string; fileType: string; fileContent: string; } | null;
          totalValue: number;
          supplierId: number;
        }
    ) => {
        if (!stfToRevise) return;
        onReviseStf(stfToRevise.id, stfData);
        setStfToRevise(null);
    };

    const handleConfirmReviseMtf = (
      mtfData: {
        lines: { itemId: number, quantity: number, description: string }[];
        attachment: { fileName: string; fileType: string; fileContent: string; } | null;
      }
    ) => {
        if (!mtfToRevise) return;
        onReviseMtf(mtfToRevise.id, mtfData);
        setMtfToRevise(null);
    };

    const updateMtfHeaderStatus = (headerId: number, allLines: MTF_Line[]): { newHeaderStatus: WorkflowStatus, newApprovalLevel: number } | null => {
        const headerLines = allLines.filter(l => l.mtf_header_id === headerId);
        if (headerLines.length === 0) return null;

        const lineStatuses = new Set(headerLines.map(l => l.status));

        let newHeaderStatus: WorkflowStatus;
        if (lineStatuses.has(WorkflowStatus.PendingApproval)) {
            newHeaderStatus = WorkflowStatus.PendingApproval;
        } else if (lineStatuses.size === 1 && lineStatuses.has(WorkflowStatus.Approved)) {
            newHeaderStatus = WorkflowStatus.Approved;
        } else if (lineStatuses.size === 1 && lineStatuses.has(WorkflowStatus.Rejected)) {
            newHeaderStatus = WorkflowStatus.Rejected;
        } else if (lineStatuses.size === 1 && lineStatuses.has(WorkflowStatus.Closed)) {
            newHeaderStatus = WorkflowStatus.Closed;
        } else if (!lineStatuses.has(WorkflowStatus.PendingApproval) && (lineStatuses.has(WorkflowStatus.Approved) || lineStatuses.has(WorkflowStatus.Closed))) {
            newHeaderStatus = WorkflowStatus.Approved;
        } else {
             newHeaderStatus = WorkflowStatus.Rejected;
        }

        const minApprovalLevel = Math.min(...headerLines.map(l => l.current_approval_level));
        return { newHeaderStatus, newApprovalLevel: minApprovalLevel };
    };

    const handleApproveMtf = useCallback((mtfLineId: number) => {
        const line = mtfLines.find(l => l.id === mtfLineId);
        if (!line) return;
        const header = mtfHeaders.find(h => h.id === line.mtf_header_id);
        if (!header) return;
        const project = projects.find(p => p.id === header.project_id);
        if (!project) return;
        
        const oldLevel = line.current_approval_level;
        const newLevel = oldLevel + 1;
        const newStatus = newLevel >= project.max_mtf_approval_level ? WorkflowStatus.Approved : WorkflowStatus.PendingApproval;

        const updatedLines = mtfLines.map(l => 
            l.id === mtfLineId ? { ...l, current_approval_level: newLevel, status: newStatus } : l
        );
        setMtfLines(updatedLines);

        const statusUpdate = updateMtfHeaderStatus(header.id, updatedLines);
        if (statusUpdate) {
            setMtfHeaders(currentHeaders =>
                currentHeaders.map(h =>
                    h.id === header.id
                        ? { ...h, status: statusUpdate.newHeaderStatus, current_approval_level: statusUpdate.newApprovalLevel }
                        : h
                )
            );
        }
    }, [mtfLines, mtfHeaders, setMtfLines, setMtfHeaders, projects]);

    const handleRejectMtf = useCallback((mtfLineId: number) => {
        const line = mtfLines.find(l => l.id === mtfLineId);
        if (!line) return;
        const header = mtfHeaders.find(h => h.id === line.mtf_header_id);
        if (!header) return;

        const updatedLines = mtfLines.map(l => 
            l.id === mtfLineId ? { ...l, status: WorkflowStatus.Rejected } : l
        );
        setMtfLines(updatedLines);

        const statusUpdate = updateMtfHeaderStatus(header.id, updatedLines);
        if (statusUpdate) {
            setMtfHeaders(currentHeaders =>
                currentHeaders.map(h =>
                    h.id === header.id
                        ? { ...h, status: statusUpdate.newHeaderStatus, current_approval_level: statusUpdate.newApprovalLevel }
                        : h
                )
            );
        }
    }, [mtfLines, mtfHeaders, setMtfLines, setMtfHeaders]);

    const handleAcknowledgeMtfRejection = useCallback(() => {
        if (!mtfToClose) return;
        
        const updatedLines = mtfLines.map(l => 
            l.mtf_header_id === mtfToClose.id && l.status === WorkflowStatus.Rejected
            ? { ...l, status: WorkflowStatus.Closed } 
            : l
        );
        setMtfLines(updatedLines);
        
        const statusUpdate = updateMtfHeaderStatus(mtfToClose.id, updatedLines);
        if (statusUpdate) {
             setMtfHeaders(currentHeaders =>
                currentHeaders.map(h =>
                    h.id === mtfToClose.id
                        ? { ...h, status: statusUpdate.newHeaderStatus }
                        : h
                )
            );
        }
        
        setMtfToClose(null);
    }, [mtfToClose, mtfLines, setMtfLines, setMtfHeaders]);
    
    const handleApproveStf = useCallback((stfHeaderId: number) => {
        const header = stfOrders.find(h => h.id === stfHeaderId);
        if (!header) return;
        
        const project = projects.find(p => p.id === header.project_id);
        if (!project) return;
        
        const oldLevel = header.current_approval_level;
        const newLevel = oldLevel + 1;
        const newStatus = newLevel >= project.max_stf_approval_level ? WorkflowStatus.Approved : WorkflowStatus.PendingApproval;

        setStfOrders(currentHeaders =>
            currentHeaders.map(h =>
                h.id === stfHeaderId
                    ? { ...h, current_approval_level: newLevel, status: newStatus }
                    : h
            )
        );
    }, [setStfOrders, stfOrders, projects]);

    const handleRejectStf = useCallback((stfHeaderId: number) => {
        const header = stfOrders.find(h => h.id === stfHeaderId);
        if (!header) return;

        setStfOrders(currentHeaders =>
            currentHeaders.map(h =>
                h.id === stfHeaderId ? { ...h, status: WorkflowStatus.Rejected } : h
            )
        );
    }, [setStfOrders, stfOrders]);
    
    const handleApproveOtf = useCallback((otfHeaderId: number) => {
        const header = otfOrders.find(h => h.id === otfHeaderId);
        if (!header) return;
        
        const project = projects.find(p => p.id === header.project_id);
        if (!project) return;
        
        const oldLevel = header.current_approval_level;
        const newLevel = oldLevel + 1;
        const newStatus = newLevel >= project.max_otf_approval_level ? WorkflowStatus.Approved : WorkflowStatus.PendingApproval;

        setOtfOrders(currentHeaders =>
            currentHeaders.map(h =>
                h.id === otfHeaderId
                    ? { ...h, current_approval_level: newLevel, status: newStatus }
                    : h
            )
        );
    }, [setOtfOrders, otfOrders, projects]);

    const handleRejectOtf = useCallback((otfHeaderId: number) => {
        const header = otfOrders.find(h => h.id === otfHeaderId);
        if (!header) return;

        setOtfOrders(currentHeaders =>
            currentHeaders.map(h =>
                h.id === otfHeaderId ? { ...h, status: WorkflowStatus.Rejected } : h
            )
        );
    }, [setOtfOrders, otfOrders]);

    const handleApproveMrf = useCallback((mrfHeaderId: number) => {
        const header = mrfHeaders.find(h => h.id === mrfHeaderId);
        if (!header) return;
        
        const project = projects.find(p => p.id === header.project_id);
        if (!project) return;
        
        const oldLevel = header.current_approval_level;
        const newLevel = oldLevel + 1;
        const newStatus = newLevel >= project.max_mrf_approval_level ? WorkflowStatus.Approved : WorkflowStatus.PendingApproval;

        setMrfHeaders(currentHeaders =>
            currentHeaders.map(h =>
                h.id === mrfHeaderId
                    ? { ...h, current_approval_level: newLevel, status: newStatus }
                    : h
            )
        );
    }, [setMrfHeaders, mrfHeaders, projects]);

    const handleRejectMrf = useCallback((mrfHeaderId: number) => {
        const header = mrfHeaders.find(h => h.id === mrfHeaderId);
        if (!header) return;

        setMrfHeaders(currentHeaders =>
            currentHeaders.map(h =>
                h.id === mrfHeaderId ? { ...h, status: WorkflowStatus.Rejected } : h
            )
        );
    }, [setMrfHeaders, mrfHeaders]);


    const handleAcknowledgeStfRejection = useCallback(() => {
        if (!stfToClose) return;

        setStfOrders(currentHeaders =>
            currentHeaders.map(h =>
                h.id === stfToClose.id ? { ...h, status: WorkflowStatus.Closed } : h
            )
        );
        setStfToClose(null);
    }, [stfToClose, setStfOrders]);


    const getStatusText = (item: DashboardItem): string => {
        if (item.mrfStatus === WorkflowStatus.PendingApproval) {
            const mrfHeader = mrfHeaders.find(h => h.id === item.mrfHeaderId);
            return `MRF Pending L${(mrfHeader?.current_approval_level ?? 0) + 1}`;
        }
        if (item.mrfStatus) {
            return `MRF ${item.mrfStatus}`;
        }
        if (item.otfStatus === WorkflowStatus.PendingApproval) {
            const otfHeader = otfOrders.find(h => h.id === item.otfHeaderId);
            return `OTF Pending L${(otfHeader?.current_approval_level ?? 0) + 1}`;
        }
         if (item.otfStatus) {
            return `OTF ${item.otfStatus}`;
        }
        if (item.stfStatus === WorkflowStatus.PendingApproval) {
            const stfHeader = stfOrders.find(h => h.id === item.stfHeaderId);
            return `STF Pending L${(stfHeader?.current_approval_level ?? 0) + 1}`;
        }
        if (item.stfStatus) {
            return `STF ${item.stfStatus}`;
        }
        if (item.mtfStatus === WorkflowStatus.PendingApproval) {
            return `MTF Pending L${item.mtfLineApprovalLevel + 1}`;
        }
        return item.mtfStatus;
    };
    
    const isCreateStfDisabled = !canCreateStf || selectedItemsData.length === 0 || !selectedItemsData.every(item => item.mtfStatus === WorkflowStatus.Approved && item.mtfBacklog > 0);
    const isCreateOtfDisabled = !canCreateOtf || selectedItemsData.length === 0 || !selectedItemsData.every(item => item.stfStatus === WorkflowStatus.Approved);
    const isCreateMrfDisabled = !canCreateMrf || selectedItemsData.length === 0 || !selectedItemsData.every(item => item.otfStatus === WorkflowStatus.Approved && item.otfBacklog > 0);


    const formatCurrency = (value: number, currency: string) => {
        return value.toLocaleString('en-US', { style: 'currency', currency });
    };

    const totals = useMemo(() => {
        const estTotals = new Map<string, number>();
        const stfTotals = new Map<string, number>();
        const otfTotals = new Map<string, number>();

        filteredData.forEach(item => {
            const estCurrent = estTotals.get(item.projectCurrency) || 0;
            estTotals.set(item.projectCurrency, estCurrent + item.mtfEstTotalPrice);

            if (item.stfTotalPrice) {
                const stfCurrent = stfTotals.get(item.projectCurrency) || 0;
                stfTotals.set(item.projectCurrency, stfCurrent + item.stfTotalPrice);
            }
            if (item.otfTotalPrice) {
                const otfCurrent = otfTotals.get(item.projectCurrency) || 0;
                otfTotals.set(item.projectCurrency, otfCurrent + item.otfTotalPrice);
            }
        });

        const formatTotals = (totalsMap: Map<string, number>) => {
            if (totalsMap.size === 0) return 'N/A';
            return Array.from(totalsMap.entries())
                .map(([currency, total]) => formatCurrency(total, currency))
                .join(' / ');
        };

        return {
            estTotal: formatTotals(estTotals),
            stfTotal: formatTotals(stfTotals),
            otfTotal: formatTotals(otfTotals),
        };
    }, [filteredData]);

    const handleExportCSV = () => {
        if (filteredData.length === 0) {
            alert("No data to export.");
            return;
        }
        const headers: (keyof DashboardItem)[] = ['mtfId', 'projectCode', 'disciplineCode', 'materialCode', 'materialName', 'requestQty', 'stfOrderedQty', 'otfOrderedQty', 'mrfReceivedQty', 'mtfBacklog', 'stfBacklog', 'otfBacklog', 'mtfStatus'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(item => headers.map(header => {
                const value = item[header];
                const stringValue = value === null || value === undefined ? '' : String(value);
                return `"${stringValue.replace(/"/g, '""')}"`; // Handle quotes
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "dashboard_export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportOpen(false);
    };

    const handleExportXLSX = () => {
        if (filteredData.length === 0) {
            alert("No data to export.");
            return;
        }
        const headers: (keyof DashboardItem)[] = ['mtfId', 'projectCode', 'disciplineCode', 'materialCode', 'materialName', 'requestQty', 'stfOrderedQty', 'otfOrderedQty', 'mrfReceivedQty', 'mtfBacklog', 'stfBacklog', 'otfBacklog', 'mtfStatus'];
        const dataToExport = filteredData.map(item => {
            let row: any = {};
            headers.forEach(header => {
                row[header] = item[header];
            });
            return row;
        });
        const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Data");
        XLSX.writeFile(workbook, "dashboard_export.xlsx");
        setIsExportOpen(false);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        const processData = (parsedData: any[]) => {
            try {
                if (parsedData.length === 0) throw new Error("File is empty or has no data rows.");
                
                const requiredHeaders = ['project_code', 'discipline_code', 'material_code', 'request_qty'];
                const fileHeaders = Object.keys(parsedData[0]);
                if (!requiredHeaders.every(h => fileHeaders.includes(h))) {
                    throw new Error(`Invalid file headers. Required columns are: ${requiredHeaders.join(', ')}`);
                }

                const processedItems = parsedData.map((row, index) => {
                    const project = projects.find(p => p.code === row.project_code);
                    const discipline = disciplines.find(d => d.discipline_code === row.discipline_code && d.tenant_id === currentUser.tenant_id);
//-fix: Use the `data` prop from the component scope to find items, instead of the local `parsedData` variable which was causing an error.
                    const item = data.items.find(i => i.material_code === row.material_code && i.tenant_id === currentUser.tenant_id);
                    const request_qty = Number(row.request_qty);
                    
                    if (!project) throw new Error(`Row ${index + 2}: Project code "${row.project_code}" not found.`);
                    if (!currentUser.project_ids.includes(project.id)) throw new Error(`Row ${index + 2}: You are not assigned to project "${row.project_code}".`);
                    if (!discipline) throw new Error(`Row ${index + 2}: Discipline code "${row.discipline_code}" not found for your tenant.`);
                    if (!item) throw new Error(`Row ${index + 2}: Material code "${row.material_code}" not found for your tenant.`);
                    if (isNaN(request_qty) || request_qty <= 0) throw new Error(`Row ${index + 2}: Invalid request quantity "${row.request_qty}".`);

                    return {
                        project_id: project.id,
                        discipline_id: discipline.id,
                        item_id: item.id,
                        request_qty: request_qty,
                    };
                });
                
                onBulkCreateMtf(processedItems);
                alert(`${processedItems.length} MTF line items imported successfully! They have been grouped into new MTFs by project and discipline.`);

            } catch (error) {
                alert(`Import failed: ${(error as Error).message}`);
            } finally {
                 if (event.target) event.target.value = '';
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const rows = text.split('\n').filter(row => row.trim() !== '');
                if (rows.length < 2) {
                    alert('CSV file must have a header and at least one data row.');
                    if (event.target) event.target.value = '';
                    return;
                }
                const headers = rows[0].trim().split(',').map(h => h.trim());
                const data = rows.slice(1).map(rowStr => {
                    const values = rowStr.trim().split(',');
                    const row: any = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index];
                    });
                    return row;
                });
                processData(data);
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx')) {
            reader.onload = (e) => {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);
                processData(json);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Unsupported file type. Please upload a .csv or .xlsx file.");
            if (event.target) event.target.value = '';
        }
    };


    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Items Dashboard</h2>
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
                    <button
                        onClick={onResetData}
                        className="flex items-center bg-yellow-400 text-yellow-900 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 transition duration-200"
                        title="Reset all demo data to its original state"
                    >
                        <ArrowPathIcon />
                        <span className="ml-2">Reset Demo</span>
                    </button>
                     <button 
                        onClick={clearFilters}
                        className="flex items-center bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200"
                    >
                        <XMarkIcon />
                        <span className="ml-2">Clear Filters</span>
                    </button>
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200"
                        title="Import MTF items from a CSV or Excel file"
                    >
                        <ArrowUpTrayIcon />
                        <span className="ml-2">Import</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" />

                    <div className="relative" ref={exportDropdownRef}>
                        <button
                            onClick={() => setIsExportOpen(prev => !prev)}
                            className="flex items-center bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200"
                        >
                            <ArrowDownTrayIcon />
                            <span className="ml-2">Export</span>
                            <ChevronDownIcon />
                        </button>
                        {isExportOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleExportCSV(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Export as CSV</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleExportXLSX(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Export as Excel (.xlsx)</a>
                                </div>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => setCreateMtfModalOpen(true)}
                        className={`bg-primary text-white font-semibold px-4 py-2 rounded-lg transition duration-200 ${
                            canCreateMtf ? 'hover:bg-secondary' : 'opacity-50 cursor-not-allowed'
                        }`}
                        disabled={!canCreateMtf}
                        title={canCreateMtf ? 'Create a new Material Transfer Form' : "You do not have the 'Requester' or 'Administrator' role"}
                    >
                        Create MTF
                    </button>
                </div>
            </div>

            {selectedRows.size > 0 && (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-800">{selectedRows.size} item(s) selected.</p>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => setCreateStfModalOpen(true)}
                            className={`bg-blue-600 text-white font-semibold px-4 py-2 text-sm rounded-lg transition duration-200 ${isCreateStfDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                            disabled={isCreateStfDisabled}
                            title={
                                !canCreateStf ? "You don't have the STF Initiator role." :
                                selectedItemsData.length === 0 ? "Select approved items with a backlog to create an STF." :
                                !selectedItemsData.every(item => item.mtfStatus === WorkflowStatus.Approved) ? "Only items with 'Approved' MTF status can be added to an STF." :
                                !selectedItemsData.every(item => item.mtfBacklog > 0) ? "All selected items must have a positive MTF backlog." :
                                "Create an STF from selected items."
                            }
                        >
                            Create STF
                        </button>
                        <button 
                            onClick={() => setCreateOtfModalOpen(true)}
                            className={`bg-teal-600 text-white font-semibold px-4 py-2 text-sm rounded-lg transition duration-200 ${isCreateOtfDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'}`}
                            disabled={isCreateOtfDisabled}
                            title={
                                !canCreateOtf ? "You don't have the OTF Initiator role." :
                                selectedItemsData.length === 0 ? "Select approved STF items to create an OTF." :
                                !selectedItemsData.every(item => item.stfStatus === WorkflowStatus.Approved) ? "Only 'Approved' STF items can be used for an OTF." :
                                "Create an OTF from selected items."
                            }
                        >
                            Create OTF
                        </button>
                         <button 
                            onClick={() => setCreateMrfModalOpen(true)}
                            className={`bg-purple-600 text-white font-semibold px-4 py-2 text-sm rounded-lg transition duration-200 ${isCreateMrfDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}
                            disabled={isCreateMrfDisabled}
                            title={
                                !canCreateMrf ? "You don't have the MRF Initiator role." :
                                selectedItemsData.length === 0 ? "Please select one or more items." :
                                !selectedItemsData.every(item => item.otfStatus === WorkflowStatus.Approved && item.otfBacklog > 0) ? "Only items with an 'Approved' OTF status and an outstanding backlog can have an MRF created." :
                                "Create an MRF for selected items."
                            }
                        >
                            Create MRF
                        </button>
                    </div>
                 </div>
            )}
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="p-4">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    checked={selectedRows.size > 0 && selectedRows.size === filteredData.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th scope="col" className="px-6 py-3">Project</th>
                            <th scope="col" className="px-6 py-3">MTF / STF / OTF / MRF ID</th>
                            <th scope="col" className="px-6 py-3">Discipline</th>
                            <th scope="col" className="px-6 py-3">Budget</th>
                            <th scope="col" className="px-6 py-3">Material</th>
                            <th scope="col" className="px-6 py-3">Description</th>
                            <th scope="col" className="px-6 py-3">Supplier</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-right">Req. Qty</th>
                            <th scope="col" className="px-6 py-3 text-right">STF Ord.</th>
                            <th scope="col" className="px-6 py-3 text-right">OTF Ord.</th>
                            <th scope="col" className="px-6 py-3 text-right">Received</th>
                            <th scope="col" className="px-6 py-3 text-right">On the way</th>
                            <th scope="col" className="px-6 py-3 text-right">Est. Total</th>
                            <th scope="col" className="px-6 py-3 text-right">STF Total</th>
                            <th scope="col" className="px-6 py-3 text-right">OTF Total</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                        <tr className="bg-gray-50">
                            <th className="p-4"><FunnelIcon /></th>
                            <th className="px-6 py-2">
                                <select name="project" value={filters.project} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded bg-white">
                                    <option value="">All Projects</option>
                                    {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </th>
                            <th className="px-6 py-2">
                                <input type="text" name="mtfId" value={filters.mtfId} onChange={handleFilterChange} placeholder="Filter ID..." className="w-full text-xs p-1 border rounded" />
                            </th>
                            <th className="px-6 py-2">
                                <select name="discipline" value={filters.discipline} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded bg-white">
                                    <option value="">All Disciplines</option>
                                    {uniqueDisciplines.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </th>
                            <th className="px-6 py-2">
                                <select name="budget" value={filters.budget} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded bg-white">
                                    <option value="">All Budgets</option>
                                    {uniqueBudgets.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </th>
                            <th className="px-6 py-2">
                                <input type="text" name="material" value={filters.material} onChange={handleFilterChange} placeholder="Filter material..." className="w-full text-xs p-1 border rounded" />
                            </th>
                            <th></th>
                            <th className="px-6 py-2">
                                <select name="supplier" value={filters.supplier} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded bg-white">
                                    <option value="">All Suppliers</option>
                                    {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </th>
                            <th className="px-6 py-2">
                                <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded bg-white">
                                    <option value="">All Statuses</option>
                                    {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </th>
                            <th colSpan={9}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(item => (
                            <tr key={item.mtfLineId} className="bg-white border-b hover:bg-gray-50">
                                <td className="w-4 p-4">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        checked={selectedRows.has(item.mtfLineId)}
                                        onChange={() => handleSelectRow(item.mtfLineId)}
                                    />
                                </td>
                                 <td className="px-6 py-4">
                                    <div className="font-medium text-gray-800">{item.projectCode}</div>
                                    <div className="text-xs text-gray-500">{item.projectName}</div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    <div>{item.mtfId}</div>
                                    {item.stfId && <div className="text-xs font-mono text-blue-600">{item.stfId}</div>}
                                    {item.otfId && <div className="text-xs font-mono text-teal-600">{item.otfId}</div>}
                                    {item.mrfId && <div className="text-xs font-mono text-purple-600">{item.mrfId}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-800">{item.disciplineName}</div>
                                    <div className="text-xs text-gray-500">{item.disciplineCode}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-800" title={item.budgetName}>{item.budgetCode}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-800">{item.materialName}</div>
                                    <div className="text-xs text-gray-500">{item.materialCode}</div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" title={item.materialDescription || ''}>
                                    {item.materialDescription}
                                </td>
                                <td className="px-6 py-4">{item.supplierName}</td>
                                <td className="px-6 py-4">
                                    <span className={getStatusBadge(item.mrfStatus ?? item.otfStatus ?? item.stfStatus ?? item.mtfStatus)}>{getStatusText(item)}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-semibold">{item.requestQty.toLocaleString()} {item.unit}</td>
                                <td className="px-6 py-4 text-right">{item.stfOrderedQty.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">{item.otfOrderedQty.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">{item.mrfReceivedQty.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-medium text-cyan-600">{item.otfBacklog.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-mono">{formatCurrency(item.mtfEstTotalPrice, item.projectCurrency)}</td>
                                <td className="px-6 py-4 text-right font-mono font-semibold text-blue-700">{item.stfTotalPrice ? formatCurrency(item.stfTotalPrice, item.projectCurrency) : 'N/A'}</td>
                                <td className="px-6 py-4 text-right font-mono font-semibold text-teal-700">{item.otfTotalPrice ? formatCurrency(item.otfTotalPrice, item.projectCurrency) : 'N/A'}</td>
                                <td className="px-6 py-4">
                                   <ActionButtons 
                                        item={item} 
                                        onView={() => setDetailItem(item)}
                                        canApproveMtf={canApproveOrRejectMtf(item, currentUser)}
                                        onApproveMtf={() => handleApproveMtf(item.mtfLineId)}
                                        onRejectMtf={() => handleRejectMtf(item.mtfLineId)}
                                        canActOnRejectedMtf={canActOnRejectedMtf(item, currentUser)}
                                        onReviseMtf={() => setMtfToRevise(mtfHeaders.find(h => h.id === item.mtfHeaderId) || null)}
                                        onAcknowledgeMtfRejection={() => setMtfToClose(mtfHeaders.find(h => h.id === item.mtfHeaderId) || null)}
                                        canApproveStf={item.stfHeaderId ? canApproveOrRejectStf(item, currentUser) : false}
                                        onApproveStf={() => setStfToReview(item)}
                                        onRejectStf={() => setStfToReview(item)}
                                        canApproveOtf={item.otfHeaderId ? canApproveOrRejectOtf(item, currentUser) : false}
                                        onApproveOtf={() => setOtfToReview(item)}
                                        onRejectOtf={() => setOtfToReview(item)}
                                        canApproveMrf={item.mrfHeaderId ? canApproveOrRejectMrf(item, currentUser) : false}
                                        onApproveMrf={() => setMrfToReview(item)}
                                        onRejectMrf={() => setMrfToReview(item)}
                                        canActOnRejectedStf={canActOnRejectedStf(item, currentUser)}
                                        onReviseStf={() => setStfToRevise(stfOrders.find(h => h.id === item.stfHeaderId) || null)}
                                        onAcknowledgeStfRejection={() => setStfToClose(stfOrders.find(h => h.id === item.stfHeaderId) || null)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                        <tr className="font-semibold text-gray-800">
                            <td colSpan={14} className="px-6 py-3 text-right">Grand Totals:</td>
                            <td className="px-6 py-3 text-right font-mono text-sm">{totals.estTotal}</td>
                            <td className="px-6 py-3 text-right font-mono font-bold text-blue-800 text-sm">{totals.stfTotal}</td>
                            <td className="px-6 py-3 text-right font-mono font-bold text-teal-800 text-sm">{totals.otfTotal}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                 {filteredData.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No items found for your assigned projects.</p>
                    </div>
                )}
            </div>
            
            {detailItem && (
                <ItemDetailModal
                    isOpen={!!detailItem}
                    onClose={() => setDetailItem(null)}
                    item={detailItem}
                    mtfHeaders={mtfHeaders}
                    stfOrders={stfOrders}
                    stfOrderLines={stfOrderLines}
                    otfOrders={otfOrders}
                    otfOrderLines={otfOrderLines}
                    mrfHeaders={mrfHeaders}
                    mrfLines={mrfLines}
                    suppliers={suppliers}
                    mdfIssues={mdfIssues}
                    mdfIssueLines={mdfIssueLines}
                />
            )}

            <CreateMtfModal
                isOpen={isCreateMtfModalOpen}
                onClose={() => setCreateMtfModalOpen(false)}
                onCreate={onCreateMtf}
                currentUser={currentUser}
                allMtfHeaders={mtfHeaders}
                allMtfLines={mtfLines}
                allDisciplines={disciplines}
                projects={projects}
                allItems={data.items}
            />

            <CreateStfModal
                isOpen={isCreateStfModalOpen}
                onClose={() => setCreateStfModalOpen(false)}
                onCreateStf={handleConfirmCreateStf}
                currentUser={currentUser}
                selectedItems={selectedItemsData}
                suppliers={suppliers}
                items={data.items}
            />

            <CreateOtfModal
                isOpen={isCreateOtfModalOpen}
                onClose={() => setCreateOtfModalOpen(false)}
                onCreateOtf={handleConfirmCreateOtf}
                selectedItems={selectedItemsData}
                stfOrders={stfOrders}
                stfOrderLines={stfOrderLines}
                otfOrderLines={otfOrderLines}
            />

            <CreateMrfModal
                isOpen={isCreateMrfModalOpen}
                onClose={() => setCreateMrfModalOpen(false)}
                onCreateMrf={handleConfirmCreateMrf}
                selectedItems={selectedItemsData}
                otfOrders={otfOrders}
                otfOrderLines={otfOrderLines}
                mrfLines={mrfLines}
            />

            {stfToReview && (
                <StfApprovalModal
                    isOpen={!!stfToReview}
                    onClose={() => setStfToReview(null)}
                    onApprove={() => {
                        handleApproveStf(stfToReview.stfHeaderId!);
                        setStfToReview(null);
                    }}
                    onReject={() => {
                        handleRejectStf(stfToReview.stfHeaderId!);
                        setStfToReview(null);
                    }}
                    itemToReview={stfToReview}
                    stfOrders={stfOrders}
                    stfOrderLines={stfOrderLines}
                    mtfLines={mtfLines}
                    projects={projects}
                    suppliers={suppliers}
                    users={users}
                    items={data.items}
                />
            )}

            {otfToReview && (
                <OtfApprovalModal
                    isOpen={!!otfToReview}
                    onClose={() => setOtfToReview(null)}
                    onApprove={() => {
                        handleApproveOtf(otfToReview.otfHeaderId!);
                        setOtfToReview(null);
                    }}
                    onReject={() => {
                        handleRejectOtf(otfToReview.otfHeaderId!);
                        setOtfToReview(null);
                    }}
                    itemToReview={otfToReview}
                    otfOrders={otfOrders}
                    otfOrderLines={otfOrderLines}
                    stfOrderLines={stfOrderLines}
                    mtfLines={mtfLines}
                    projects={projects}
                    users={users}
                    items={data.items}
                />
            )}

            {mrfToReview && (
                <MrfApprovalModal
                    isOpen={!!mrfToReview}
                    onClose={() => setMrfToReview(null)}
                    onApprove={() => {
                        handleApproveMrf(mrfToReview.mrfHeaderId!);
                        setMrfToReview(null);
                    }}
                    onReject={() => {
                        handleRejectMrf(mrfToReview.mrfHeaderId!);
                        setMrfToReview(null);
                    }}
                    itemToReview={mrfToReview}
                    mrfHeaders={mrfHeaders}
                    mrfLines={mrfLines}
                    otfOrderLines={otfOrderLines}
                    stfOrderLines={stfOrderLines}
                    mtfLines={mtfLines}
                    projects={projects}
                    users={users}
                    items={data.items}
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
                    eligibleMtfLines={userDashboardData.filter(item => item.mtfStatus === WorkflowStatus.Approved)}
                    suppliers={suppliers}
                    currentUser={currentUser}
                    items={data.items}
                />
            )}

            {stfToClose && (
                <ConfirmationModal
                    isOpen={!!stfToClose}
                    onClose={() => setStfToClose(null)}
                    onConfirm={handleAcknowledgeStfRejection}
                    title="Acknowledge STF Rejection"
                >
                   <p>Are you sure you want to close this STF ({stfToClose.STF_ID})?</p>
                   <p className="mt-2">This action cannot be undone. The STF will be permanently marked as 'Closed' and removed from active workflows.</p>
                </ConfirmationModal>
            )}

            {mtfToRevise && (
                <ReviseMtfModal
                    isOpen={!!mtfToRevise}
                    onClose={() => setMtfToRevise(null)}
                    onResubmit={handleConfirmReviseMtf}
                    currentUser={currentUser}
                    mtfToRevise={mtfToRevise}
                    mtfLines={mtfLines}
                    allItems={data.items}
                />
            )}

            {mtfToClose && (
                <ConfirmationModal
                    isOpen={!!mtfToClose}
                    onClose={() => setMtfToClose(null)}
                    onConfirm={handleAcknowledgeMtfRejection}
                    title="Acknowledge MTF Rejection"
                >
                   <p>Are you sure you want to close this MTF ({mtfToClose.MTF_ID})?</p>
                   <p className="mt-2">This action will mark all rejected lines as 'Closed' and cannot be undone.</p>
                </ConfirmationModal>
            )}
        </div>
    );
};