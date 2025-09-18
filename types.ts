export enum WorkflowStatus {
    Initialized = 'Initialized',
    PendingApproval = 'Pending Approval',
    Approved = 'Approved',
    Rejected = 'Rejected',
    Received = 'Received',
    Delivered = 'Delivered',
    Closed = 'Closed',
}

export enum RoleName {
    Administrator = 'Administrator',
    Requester = 'Requester',
    MTF_Approver = 'MTF Approver',
    STF_Initiator = 'STF Initiator',
    STF_Approver = 'STF Approver',
    OTF_Initiator = 'OTF Initiator',
    OTF_Approver = 'OTF Approver',
    MRF_Initiator = 'MRF Initiator',
    MRF_Approver = 'MRF Approver',
    Viewer = 'Viewer',
}

export enum Currency {
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
    CAD = 'CAD',
    SAR = 'SAR',
    RUB = 'RUB',
    TRY = 'TRY',
}

export type Page = 
    'Dashboard' | 
    'MTF History' |
    'STF History' |
    'OTF History' |
    'MRF History' |
    'MTF' | 
    'STF' | 
    'OTF' | 
    'MRF' | 
    'MDF' | 
    'User Management' | 
    'Item Management' | 
    'Project Management' | 
    'Discipline Management' |
    'Position Management' |
    'Tenant Management' |
    'Supplier Management';

export interface Role {
    id: number;
    name: RoleName;
    level?: number;
}

export interface Position {
    id: number;
    tenant_id: number;
    name: string;
}

export interface User {
    id: number;
    tenant_id: number | null;
    is_super_admin?: boolean;
    firstName: string;
    lastName: string;
    email: string;
    password?: string; // NOTE: Storing plain text passwords is not secure. This is for demo purposes only.
    phone: string;
    position_id: number;
    position: Position;
    active: boolean;
    roles: Role[];
    projects: Project[];
    disciplines: Discipline[];
    project_ids?: number[]; // Kept for frontend state convenience
    discipline_ids?: number[]; // Kept for frontend state convenience
}

export interface Tenant {
    id: number;
    name: string;
    active: boolean;
}

export interface Project {
    id: number;
    tenant_id: number;
    name: string;
    code: string;
    country: string;
    base_currency: Currency;
    max_mtf_approval_level: number;
    max_stf_approval_level: number;
    max_otf_approval_level: number;
    max_mrf_approval_level: number;
    max_mdf_approval_level: number;
}

export interface Discipline {
    id: number;
    tenant_id: number;
    discipline_code: string;
    discipline_name: string;
    budget_code: string;
    budget_name: string;
}

export interface GroupedDiscipline {
    discipline_code: string;
    discipline_name: string;
    budgets: {
        id: number;
        budget_code: string;
        budget_name: string;
    }[];
}


export interface Attachment {
    fileName: string;
    fileType: string;
    fileContent: string;
}

export interface MTF_Header {
    id: number;
    MTF_ID: string;
    project_id: number;
    discipline_id: number;
    date_created: string; // ISO String
    created_by: number; // User ID
    status: WorkflowStatus;
    current_approval_level: number;
    attachment?: Attachment;
}

export interface MTF_Line {
    id: number;
    mtf_header_id: number;
    item_id: number;
    material_description: string;
    request_qty: number;
    status: WorkflowStatus;
    current_approval_level: number;
    est_unit_price: number;
    est_total_price: number;
}

export interface Supplier {
    id: number;
    tenant_id: number;
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    active: boolean;
}

export interface STF_Order {
    id: number;
    STF_ID: string;
    project_id: number;
    discipline_id: number;
    supplier_id: number;
    date_created: string; // ISO String
    created_by: number; // User ID
    status: WorkflowStatus;
    current_approval_level: number;
    total_value: number;
    attachment?: Attachment;
}

export interface STF_OrderLine {
    id: number;
    stf_order_id: number;
    mtf_line_id: number;
    material_description: string;
    order_qty: number;
    unit_price: number;
}

export interface OTF_Order {
    id: number;
    OTF_ID: string;
    project_id: number;
    discipline_id: number;
    date_created: string; // ISO String
    created_by: number; // User ID
    status: WorkflowStatus;
    current_approval_level: number;
    total_value: number;
    attachment?: Attachment;
    invoice_no?: string;
    invoice_date?: string;
}

export interface OTF_OrderLine {
    id: number;
    otf_order_id: number;
    stf_order_line_id: number;
    order_qty: number;
    unit_price: number;
}

export interface MRF_Header {
    id: number;
    MRF_ID: string;
    project_id: number;
    discipline_id: number;
    date_created: string; // ISO String
    created_by: number;
    status: WorkflowStatus;
    current_approval_level: number;
    attachment?: Attachment;
}

export interface MRF_Line {
    id: number;
    mrf_header_id: number;
    otf_order_line_id: number;
    received_qty: number;
}

export interface MDF_Issue {
    id: number;
    issue_id: string;
    date_created: string; // ISO String
}

export interface MDF_IssueLine {
    id: number;
    mdf_issue_id: number;
    mrf_line_id: number;
    delivered_qty: number;
}

export interface MTF_History_Log {
    id: number;
    mtfHeaderId: number;
    mtfIdString: string;
    action: 'Created' | 'Approved' | 'Rejected' | 'Revised' | 'Closed';
    actorId: number;
    timestamp: string; // ISO string
    fromStatus: WorkflowStatus | null;
    toStatus: WorkflowStatus;
    details: string;
}

export interface STF_History_Log {
    id: number;
    stfHeaderId: number;
    stfIdString: string;
    action: 'Created' | 'Approved' | 'Rejected' | 'Revised' | 'Closed';
    actorId: number;
    timestamp: string; // ISO string
    fromStatus: WorkflowStatus | null;
    toStatus: WorkflowStatus;
    details: string;
}

export interface OTF_History_Log {
    id: number;
    otfHeaderId: number;
    otfIdString: string;
    action: 'Created' | 'Approved' | 'Rejected' | 'Revised' | 'Closed';
    actorId: number;
    timestamp: string; // ISO string
    fromStatus: WorkflowStatus | null;
    toStatus: WorkflowStatus;
    details: string;
}

export interface MRF_History_Log {
    id: number;
    mrfHeaderId: number;
    mrfIdString: string;
    action: 'Created' | 'Approved' | 'Rejected';
    actorId: number;
    timestamp: string; // ISO string
    fromStatus: WorkflowStatus | null;
    toStatus: WorkflowStatus;
    details: string;
}


export interface ItemLibrary {
    id: number;
    tenant_id: number;
    material_code: string;
    material_name: string;
    material_description?: string;
    unit: string;
    budget_unit_price?: number;
}

export interface DashboardItem {
    mtfHeaderId: number;
    mtfLineId: number;
    mtfId: string;
    project_id: number;
    projectCode: string;
    projectName: string;
    projectCurrency: Currency;
    discipline_id: number;
    disciplineCode: string;
    disciplineName: string;
    budgetCode: string;
    budgetName: string;
    materialCode: string;
    materialName: string;
    materialDescription: string | null;
    unit: string;
    mtfStatus: WorkflowStatus;
    mtfLineApprovalLevel: number;
    stfHeaderId: number | null;
    stfId: string | null;
    stfStatus: WorkflowStatus | null;
    supplierName: string | null;
    otfHeaderId: number | null;
    otfId: string | null;
    otfStatus: WorkflowStatus | null;
    mrfHeaderId: number | null;
    mrfId: string | null;
    mrfStatus: WorkflowStatus | null;
    requestQty: number;
    stfOrderedQty: number;
    otfOrderedQty: number;
    mrfReceivedQty: number;
    mdfDeliveredQty: number;
    mtfBacklog: number; // MTF Req - STF Ordered
    stfBacklog: number; // STF Ordered - OTF Ordered
    otfBacklog: number; // OTF Ordered - MRF Received
    requester: string;
    dateCreated: string; // ISO String
    mtfEstUnitPrice: number;
    mtfEstTotalPrice: number;
    stfUnitPrice: number | null;
    stfTotalPrice: number | null;
    otfUnitPrice: number | null;
    otfTotalPrice: number | null;
}

// Type for the combined data fetched from the server
export interface AppData {
    users: User[];
    tenants: Tenant[];
    projects: Project[];
    disciplines: Discipline[];
    positions: Position[];
    suppliers: Supplier[];
    items: ItemLibrary[];
    roles: Role[];
    mtfHeaders: MTF_Header[];
    mtfLines: MTF_Line[];
    mtfHistory: MTF_History_Log[];
    stfOrders: STF_Order[];
    stfOrderLines: STF_OrderLine[];
    stfHistory: STF_History_Log[];
    otfOrders: OTF_Order[];
    otfOrderLines: OTF_OrderLine[];
    otfHistory: OTF_History_Log[];
    mrfHeaders: MRF_Header[];
    mrfLines: MRF_Line[];
    mrfHistory: MRF_History_Log[];
    mdfIssues: MDF_Issue[];
    mdfIssueLines: MDF_IssueLine[];
}