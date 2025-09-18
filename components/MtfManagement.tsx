
import React, { useState, useMemo, useCallback } from 'react';
import type { User, MTF_Header, MTF_Line, Project, Discipline, Attachment, ItemLibrary } from '../types';
import { WorkflowStatus, RoleName } from '../types';
import { EyeIcon, PlusCircleIcon, CheckCircleIcon, ChevronUpIcon, ChevronDownIcon, XCircleIcon, XMarkIcon } from './icons/Icons';
import { CreateMtfModal } from './modals/CreateMtfModal';
import { MtfDetailModal } from './modals/MtfDetailModal';

interface MtfManagementProps {
    currentUser: User;
    mtfHeaders: MTF_Header[];
    setMtfHeaders: React.Dispatch<React.SetStateAction<MTF_Header[]>>;
    mtfLines: MTF_Line[];
    setMtfLines: React.Dispatch<React.SetStateAction<MTF_Line[]>>;
    projects: Project[];
    disciplines: Discipline[];
    users: User[];
    onCreateMtf: (header: MTF_Header, lines: Omit<MTF_Line, 'id'>[]) => void;
    onReviseMtf: (mtfHeaderId: number, mtfData: { lines: { itemId: number; quantity: number, description: string }[], attachment: Attachment | null }) => void;
    onLogMtfAction: (
        mtfHeaderId: number,
        mtfIdString: string,
        action: 'Created' | 'Approved' | 'Rejected',
        fromStatus: WorkflowStatus | null,
        toStatus: WorkflowStatus,
        details: string
    ) => void;
    stfOrderLines: any;
    onCreateStf: (firstItem: any, stfData: any) => void;
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
    default:
      return `${baseClasses} bg-gray-100 text-gray-500`;
  }
};

export const MtfManagement: React.FC<MtfManagementProps> = ({ 
    currentUser, mtfHeaders, setMtfHeaders, mtfLines, setMtfLines, projects, disciplines, users, onCreateMtf, onLogMtfAction, items
}) => {
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [detailMtf, setDetailMtf] = useState<MTF_Header | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'date_created', direction: 'descending' });
    const [showMyPending, setShowMyPending] = useState(false);

    const initialFilters = {
        mtfId: '',
        project: '',
        status: '',
        creator: '',
    };
    const [filters, setFilters] = useState(initialFilters);
    
    const canCreateMtf = useMemo(() => {
        return currentUser.roles.some(role => role.name === RoleName.Requester || role.name === RoleName.Administrator);
    }, [currentUser]);

    const userMtfHeaders = useMemo(() => {
        const userProjectIds = new Set(currentUser.project_ids);
        return mtfHeaders.filter(h => userProjectIds.has(h.project_id));
    }, [mtfHeaders, currentUser.project_ids]);

    const canApproveMtf = useCallback((header: MTF_Header): boolean => {
        if (header.status !== WorkflowStatus.PendingApproval) {
            return false;
        }

        const project = projects.find(p => p.id === header.project_id);
        if (!project) return false;

        const requiredLevel = header.current_approval_level + 1;
        if (requiredLevel > project.max_mtf_approval_level) return false;

        const hasDiscipline = currentUser.discipline_ids.includes(header.discipline_id);
        const hasProject = currentUser.project_ids.includes(header.project_id);
        const hasRole = currentUser.roles.some(role =>
            role.name === RoleName.MTF_Approver &&
            role.level === requiredLevel
        );
        
        return hasDiscipline && hasRole && hasProject;
    }, [currentUser, projects]);

    const handleApproveMtf = useCallback((headerId: number) => {
        const header = mtfHeaders.find(h => h.id === headerId);
        if (!header) return;
        const project = projects.find(p => p.id === header.project_id);
        if (!project) return;
        
        const oldLevel = header.current_approval_level;
        const newLevel = oldLevel + 1;
        const isFinalApproval = newLevel >= project.max_mtf_approval_level;
        const newStatus = isFinalApproval ? WorkflowStatus.Approved : WorkflowStatus.PendingApproval;

        const updatedLines = mtfLines.map(l => {
            if (l.mtf_header_id === headerId && l.status === WorkflowStatus.PendingApproval && l.current_approval_level === oldLevel) {
                return { ...l, current_approval_level: newLevel, status: newStatus };
            }
            return l;
        });
        setMtfLines(updatedLines);
        
        const lineStatuses = new Set(updatedLines.filter(l => l.mtf_header_id === headerId).map(l => l.status));

        let newHeaderStatus: WorkflowStatus = header.status;
        if (!lineStatuses.has(WorkflowStatus.PendingApproval)) {
            newHeaderStatus = WorkflowStatus.Approved;
        }

        const updatedHeader = { ...header, current_approval_level: newLevel, status: newHeaderStatus };
        setMtfHeaders(currentHeaders =>
            currentHeaders.map(h => h.id === headerId ? updatedHeader : h)
        );
        
        const details = isFinalApproval ? `MTF fully approved at L${newLevel}.` : `MTF approved to L${newLevel}.`;
        onLogMtfAction(header.id, header.MTF_ID, 'Approved', WorkflowStatus.PendingApproval, newStatus, details);
    }, [mtfHeaders, mtfLines, projects, setMtfHeaders, setMtfLines, onLogMtfAction]);
    
    const handleRejectMtf = useCallback((headerId: number) => {
        const header = mtfHeaders.find(h => h.id === headerId);
        if (!header) return;

        const updatedLines = mtfLines.map(l => {
            if (l.mtf_header_id === headerId && l.status === WorkflowStatus.PendingApproval) {
                return { ...l, status: WorkflowStatus.Rejected };
            }
            return l;
        });
        setMtfLines(updatedLines);

        const updatedHeader = { ...header, status: WorkflowStatus.Rejected };
        setMtfHeaders(currentHeaders =>
            currentHeaders.map(h => h.id === headerId ? updatedHeader : h)
        );
        
        onLogMtfAction(header.id, header.MTF_ID, 'Rejected', header.status, WorkflowStatus.Rejected, `MTF rejected at L${header.current_approval_level + 1}.`);
    }, [mtfHeaders, mtfLines, setMtfHeaders, setMtfLines, onLogMtfAction]);

    const processedHeaders = useMemo(() => {
        let headers = userMtfHeaders.filter(header => {
            if (showMyPending && !canApproveMtf(header)) {
                return false;
            }
            return (filters.mtfId ? header.MTF_ID.toLowerCase().includes(filters.mtfId.toLowerCase()) : true) &&
                   (filters.project ? header.project_id === parseInt(filters.project, 10) : true) &&
                   (filters.status ? header.status === filters.status : true) &&
                   (filters.creator ? header.created_by === parseInt(filters.creator, 10) : true);
        });

        const sortableHeaders = [...headers];
        if (sortConfig.key) {
            sortableHeaders.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'discipline_code') {
                    aValue = disciplines.find(d => d.id === a.discipline_id)?.discipline_code || '';
                    bValue = disciplines.find(d => d.id === b.discipline_id)?.discipline_code || '';
                } else {
                    aValue = a[sortConfig.key as keyof MTF_Header];
                    bValue = b[sortConfig.key as keyof MTF_Header];
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
        
        return sortableHeaders;
    }, [userMtfHeaders, filters, showMyPending, sortConfig, canApproveMtf, disciplines]);

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
                    <h2 className="text-2xl font-bold text-gray-800">MTF Management</h2>
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
                            onClick={() => setCreateModalOpen(true)} 
                            className={`flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg transition duration-200 ${
                                canCreateMtf ? 'hover:bg-secondary' : 'opacity-50 cursor-not-allowed'
                            }`}
                            disabled={!canCreateMtf}
                            title={canCreateMtf ? "Create a new MTF" : "You do not have the 'Requester' or 'Administrator' role to create an MTF"}
                        >
                            <PlusCircleIcon />
                            <span className="ml-2">Create New MTF</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg items-end">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">MTF ID</label>
                        <input type="text" name="mtfId" value={filters.mtfId} onChange={handleFilterChange} placeholder="Search by ID..." className="w-full text-sm p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                        <select name="project" value={filters.project} onChange={handleFilterChange} className="w-full text-sm p-2 border rounded-md bg-white">
                            <option value="">All Projects</option>
                            {projects.filter(p => currentUser.project_ids.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
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
                                <th scope="col" className="px-6 py-3">MTF ID</th>
                                <th scope="col" className="px-6 py-3">Project</th>
                                <th scope="col" className="px-6 py-3">
                                    <button onClick={() => requestSort('discipline_code')} className="flex items-center space-x-1 group">
                                        <span>Discipline</span>
                                        <span className="opacity-50 group-hover:opacity-100">{getSortIcon('discipline_code')}</span>
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
                            {processedHeaders.map(header => {
                                const project = projects.find(p => p.id === header.project_id);
                                const discipline = disciplines.find(d => d.id === header.discipline_id);
                                const creator = users.find(u => u.id === header.created_by);
                                return (
                                <tr key={header.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-semibold text-gray-700">{header.MTF_ID}</td>
                                    <td className="px-6 py-4 font-medium">{project?.code}</td>
                                    <td className="px-6 py-4">{discipline?.discipline_code}</td>
                                    <td className="px-6 py-4"><span className={getStatusBadge(header.status)}>{header.status}</span></td>
                                    <td className="px-6 py-4">{creator ? `${creator.firstName} ${creator.lastName}` : 'N/A'}</td>
                                    <td className="px-6 py-4">{new Date(header.date_created).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-center">{header.current_approval_level} / {project?.max_mtf_approval_level}</td>
                                    <td className="px-6 py-4 flex items-center space-x-2">
                                        <button onClick={() => setDetailMtf(header)} className="text-gray-500 hover:text-blue-600 p-1" title="View Details"><EyeIcon /></button>
                                        {canApproveMtf(header) && (
                                            <>
                                                <button 
                                                    onClick={() => handleApproveMtf(header.id)}
                                                    className="text-gray-500 hover:text-green-600 p-1" 
                                                    title="Approve MTF"
                                                >
                                                    <CheckCircleIcon />
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectMtf(header.id)}
                                                    className="text-gray-500 hover:text-red-600 p-1" 
                                                    title="Reject MTF"
                                                >
                                                    <XCircleIcon />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                     {processedHeaders.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No MTF documents found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <CreateMtfModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreate={onCreateMtf}
                currentUser={currentUser}
                allMtfHeaders={mtfHeaders}
                allMtfLines={mtfLines}
                allDisciplines={disciplines}
                projects={projects}
                allItems={items}
            />

            {detailMtf && (
                <MtfDetailModal
                    isOpen={!!detailMtf}
                    onClose={() => setDetailMtf(null)}
                    mtfHeader={detailMtf}
                    mtfLines={mtfLines}
                    projects={projects}
                    disciplines={disciplines}
                    users={users}
                    items={items}
                />
            )}
        </>
    );
};
