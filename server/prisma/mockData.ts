// This file serves as the single source of truth for the initial database seed.
import { Currency, RoleName, WorkflowStatus } from '../../types.js';

// --- CORE DATA ---

export const mockTenants = [
    { id: 1, name: 'Global Construction Inc.', active: true },
    { id: 2, name: 'Metro Rail Systems', active: true },
];

export const mockRoles = [
    { id: 1, name: RoleName.Administrator, level: null },
    { id: 2, name: RoleName.Requester, level: null },
    { id: 3, name: RoleName.MTF_Approver, level: 1 },
    { id: 4, name: RoleName.MTF_Approver, level: 2 },
    { id: 5, name: RoleName.MTF_Approver, level: 3 },
    { id: 6, name: RoleName.STF_Initiator, level: null },
    { id: 7, name: RoleName.STF_Approver, level: 1 },
    { id: 8, name: RoleName.STF_Approver, level: 2 },
    { id: 9, name: RoleName.STF_Approver, level: 3 },
    { id: 10, name: RoleName.OTF_Initiator, level: null },
    { id: 11, name: RoleName.OTF_Approver, level: 1 },
    { id: 12, name: RoleName.OTF_Approver, level: 2 },
    { id: 13, name: RoleName.OTF_Approver, level: 3 },
    { id: 14, name: RoleName.MRF_Initiator, level: null },
    { id: 15, name: RoleName.MRF_Approver, level: 1 },
    { id: 16, name: RoleName.Viewer, level: null },
];

export const mockPositions = [
    { id: 1, tenant_id: 1, name: 'Project Manager' },
    { id: 2, tenant_id: 1, name: 'Lead Engineer' },
    { id: 3, tenant_id: 1, name: 'Site Engineer' },
    { id: 4, tenant_id: 1, name: 'Procurement Officer' },
    { id: 5, tenant_id: 2, name: 'Metro Director' },
    { id: 6, tenant_id: 2, name: 'Tunneling Supervisor' },
    { id: 7, tenant_id: 1, name: 'System Admin' } // For super admin
];

export const mockUsers = [
    { 
        id: 1, tenant_id: null, is_super_admin: true,
        firstName: 'Super', lastName: 'Admin', email: 'super@admin.com', password: 'password', phone: 'N/A',
        position_id: 7, active: true,
        role_ids: [], project_ids: [], discipline_ids: []
    },
    { 
        id: 2, tenant_id: 1, is_super_admin: false,
        firstName: 'Alice', lastName: 'Manager', email: 'alice.manager@gci.com', password: 'password', phone: '123-456-7890',
        position_id: 1, active: true,
        role_ids: [1, 4, 9, 13, 15], project_ids: [1], discipline_ids: [1, 2, 3]
    },
    { 
        id: 3, tenant_id: 1, is_super_admin: false,
        firstName: 'Bob', lastName: 'Engineer', email: 'bob.engineer@gci.com', password: 'password', phone: '234-567-8901',
        position_id: 3, active: true,
        role_ids: [2], project_ids: [1], discipline_ids: [1]
    },
    { 
        id: 4, tenant_id: 1, is_super_admin: false,
        firstName: 'Charlie', lastName: 'Procurement', email: 'charlie.proc@gci.com', password: 'password', phone: '345-678-9012',
        position_id: 4, active: true,
        role_ids: [6, 7, 10, 14], project_ids: [1, 2], discipline_ids: [1, 2, 3]
    },
    { 
        id: 5, tenant_id: 2, is_super_admin: false,
        firstName: 'Diana', lastName: 'Director', email: 'diana.director@mrs.com', password: 'password', phone: '456-789-0123',
        position_id: 5, active: true,
        role_ids: [1, 5, 9], project_ids: [3], discipline_ids: [4, 5]
    },
];

export const mockProjects = [
    { id: 1, tenant_id: 1, name: 'Downtown Tower', code: 'DT-2024', country: 'USA', base_currency: Currency.USD, max_mtf_approval_level: 2, max_stf_approval_level: 3, max_otf_approval_level: 2, max_mrf_approval_level: 1, max_mdf_approval_level: 1 },
    { id: 2, tenant_id: 1, name: 'Coastal Highway Bridge', code: 'CHB-2025', country: 'Canada', base_currency: Currency.CAD, max_mtf_approval_level: 3, max_stf_approval_level: 3, max_otf_approval_level: 2, max_mrf_approval_level: 1, max_mdf_approval_level: 1 },
    { id: 3, tenant_id: 2, name: 'City Metro Line 4', code: 'CML-4', country: 'UK', base_currency: Currency.GBP, max_mtf_approval_level: 3, max_stf_approval_level: 3, max_otf_approval_level: 2, max_mrf_approval_level: 1, max_mdf_approval_level: 1 },
];

export const mockDisciplines = [
    { id: 1, tenant_id: 1, discipline_code: 'CIV', discipline_name: 'Civil Works', budget_code: 'BUD-CIV-100', budget_name: 'General Civil Budget' },
    { id: 2, tenant_id: 1, discipline_code: 'MEC', discipline_name: 'Mechanical', budget_code: 'BUD-MEC-200', budget_name: 'Mechanical Works Budget' },
    { id: 3, tenant_id: 1, discipline_code: 'ELE', discipline_name: 'Electrical', budget_code: 'BUD-ELE-300', budget_name: 'Electrical Works Budget' },
    { id: 4, tenant_id: 2, discipline_code: 'SIG', discipline_name: 'Signaling', budget_code: 'METRO-SIG-A1', budget_name: 'Signaling Systems Budget' },
    { id: 5, tenant_id: 2, discipline_code: 'TUN', discipline_name: 'Tunneling', budget_code: 'METRO-TUN-B2', budget_name: 'Tunneling Operations Budget' },
];

export const mockItems = [
    { id: 1, tenant_id: 1, material_code: 'CEM-001', material_name: 'Portland Cement', material_description: 'High-strength Portland cement', unit: 'bag', budget_unit_price: 15 },
    { id: 2, tenant_id: 1, material_code: 'REB-016', material_name: 'Rebar 16mm', material_description: 'Deformed steel reinforcement bar', unit: 'ton', budget_unit_price: 800 },
    { id: 3, tenant_id: 1, material_code: 'PVC-100', material_name: 'PVC Pipe 100mm', material_description: '100mm diameter PVC pipe', unit: 'm', budget_unit_price: 12 },
    { id: 4, tenant_id: 2, material_code: 'RAIL-S45', material_name: 'Steel Rail S45', material_description: 'Standard gauge S45 steel rail', unit: 'm', budget_unit_price: 150 },
    { id: 5, tenant_id: 2, material_code: 'SIG-CBL-04', material_name: 'Signaling Cable 4-core', material_description: '4-core copper signaling cable', unit: 'm', budget_unit_price: 25 },
];

export const mockSuppliers = [
    { id: 1, tenant_id: 1, name: 'Steel Dynamics', contact_person: 'John Steele', email: 'sales@steeldynamics.com', phone: '555-0101', address: '123 Industrial Way, Steeltown, USA', active: true },
    { id: 2, tenant_id: 1, name: 'Concrete Solutions Ltd.', contact_person: 'Maria Garcia', email: 'maria.g@concretesolutions.com', phone: '555-0102', address: '456 Quarry Rd, Rocksolid, USA', active: true },
    { id: 3, tenant_id: 1, name: 'FastenerPro', contact_person: 'Chen Wei', email: 'w.chen@fastener.pro', phone: '555-0103', address: '789 Bolt Ave, Anytown, USA', active: false },
    { id: 4, tenant_id: 2, name: 'RailTech International', contact_person: 'David Miller', email: 'dmiller@railtech.com', phone: '555-0201', address: '101 Rail Spur, Metroville, UK', active: true },
    { id: 5, tenant_id: 2, name: 'Signal & Comms Co.', contact_person: 'Fatima Al-Jamil', email: 'fatima.aj@signalcomms.co.uk', phone: '555-0202', address: '212 Circuit Lane, London, UK', active: true },
];

// --- WORKFLOW DATA ---

export const mockMtfHeaders = [
    { id: 1, MTF_ID: 'MTF-0001', project_id: 1, discipline_id: 1, date_created: new Date('2024-01-15T00:00:00.000Z'), created_by: 3, status: WorkflowStatus.Approved, current_approval_level: 2 },
    { id: 2, MTF_ID: 'MTF-0002', project_id: 1, discipline_id: 2, date_created: new Date('2024-02-10T00:00:00.000Z'), created_by: 3, status: WorkflowStatus.PendingApproval, current_approval_level: 1 },
];

export const mockMtfLines = [
    { id: 1, mtf_header_id: 1, item_id: 1, material_description: 'High-strength Portland cement', request_qty: 200, status: WorkflowStatus.Closed, current_approval_level: 2, est_unit_price: 15, est_total_price: 3000 },
    { id: 2, mtf_header_id: 1, item_id: 2, material_description: 'Deformed steel reinforcement bar', request_qty: 10, status: WorkflowStatus.Closed, current_approval_level: 2, est_unit_price: 800, est_total_price: 8000 },
    { id: 3, mtf_header_id: 2, item_id: 3, material_description: '100mm diameter PVC pipe', request_qty: 500, status: WorkflowStatus.PendingApproval, current_approval_level: 1, est_unit_price: 12, est_total_price: 6000 },
];

export const mockStfOrders = [
    { id: 1, STF_ID: 'STF-0001', project_id: 1, discipline_id: 1, supplier_id: 2, date_created: new Date('2024-01-20T00:00:00.000Z'), created_by: 4, status: WorkflowStatus.Approved, current_approval_level: 3, total_value: 10800 },
];

export const mockStfOrderLines = [
    { id: 1, stf_order_id: 1, mtf_line_id: 1, material_description: 'High-strength Portland cement', order_qty: 200, unit_price: 14 },
    { id: 2, stf_order_id: 1, mtf_line_id: 2, material_description: 'Deformed steel reinforcement bar', order_qty: 10, unit_price: 800 },
];

export const mockOtfOrders = [
    { id: 1, OTF_ID: 'OTF-0001', project_id: 1, discipline_id: 1, date_created: new Date('2024-03-01T00:00:00.000Z'), created_by: 4, status: WorkflowStatus.PendingApproval, current_approval_level: 1, total_value: 700, invoice_no: 'INV-A-101', invoice_date: new Date('2024-03-02T00:00:00.000Z') },
    { id: 2, OTF_ID: 'OTF-0002', project_id: 1, discipline_id: 1, date_created: new Date('2024-03-05T00:00:00.000Z'), created_by: 4, status: WorkflowStatus.Approved, current_approval_level: 2, total_value: 1400, invoice_no: 'INV-A-105', invoice_date: new Date('2024-03-06T00:00:00.000Z') },
];

export const mockOtfOrderLines = [
    { id: 1, otf_order_id: 1, stf_order_line_id: 1, order_qty: 50, unit_price: 14 },
    { id: 2, otf_order_id: 2, stf_order_line_id: 1, order_qty: 100, unit_price: 14 },
];

export const mockMrfHeaders = [
    { id: 1, MRF_ID: 'MRF-0001', project_id: 1, discipline_id: 1, date_created: new Date('2024-03-10T00:00:00.000Z'), created_by: 4, status: WorkflowStatus.Approved, current_approval_level: 1 },
];

export const mockMrfLines = [
    { id: 1, mrf_header_id: 1, otf_order_line_id: 2, received_qty: 80 },
];

export const mockMdfIssues = [
    { id: 1, issue_id: 'MDF-0001', date_created: new Date('2024-03-12T00:00:00.000Z'), project_id: 1, created_by: 3 },
];

export const mockMdfIssueLines = [
    { id: 1, mdf_issue_id: 1, mrf_line_id: 1, delivered_qty: 50 },
];

export const mockMtfHistory: any[] = [];

export const mockStfHistory = [
    { id: 1, stfHeaderId: 1, stfIdString: 'STF-0001', action: 'Created', actorId: 4, timestamp: '2024-01-20T10:00:00Z', fromStatus: null, toStatus: WorkflowStatus.PendingApproval, details: 'STF created.' },
    { id: 2, stfHeaderId: 1, stfIdString: 'STF-0001', action: 'Approved', actorId: 2, timestamp: '2024-01-21T11:00:00Z', fromStatus: WorkflowStatus.PendingApproval, toStatus: WorkflowStatus.Approved, details: 'Final approval given.' },
];

export const mockOtfHistory = [
    { id: 1, otfHeaderId: 1, otfIdString: 'OTF-0001', action: 'Created', actorId: 4, timestamp: '2024-03-01T09:00:00Z', fromStatus: null, toStatus: WorkflowStatus.PendingApproval, details: 'OTF created from STF-0001.' },
    { id: 2, otfHeaderId: 2, otfIdString: 'OTF-0002', action: 'Created', actorId: 4, timestamp: '2024-03-05T09:00:00Z', fromStatus: null, toStatus: WorkflowStatus.PendingApproval, details: 'OTF created from STF-0001.' },
    { id: 3, otfHeaderId: 2, otfIdString: 'OTF-0002', action: 'Approved', actorId: 2, timestamp: '2024-03-06T10:00:00Z', fromStatus: WorkflowStatus.PendingApproval, toStatus: WorkflowStatus.Approved, details: 'Final approval given.' },
];

export const mockMrfHistory = [
    { id: 1, mrfHeaderId: 1, mrfIdString: 'MRF-0001', action: 'Created', actorId: 4, timestamp: '2024-03-10T14:00:00Z', fromStatus: null, toStatus: WorkflowStatus.PendingApproval, details: 'Receipt created for OTF-0002.'},
    { id: 2, mrfHeaderId: 1, mrfIdString: 'MRF-0001', action: 'Approved', actorId: 2, timestamp: '2024-03-11T15:00:00Z', fromStatus: WorkflowStatus.PendingApproval, toStatus: WorkflowStatus.Approved, details: 'Goods receipt confirmed.' },
];