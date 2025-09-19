// Basic seedDatabase function: creates a default admin user if not exists
async function seedDatabase() {
    // Check if admin user exists
    const existing = await prisma.user.findFirst({ where: { email: 'admin' } });
    if (!existing) {
        // Create a tenant for the admin if needed
        let tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            tenant = await prisma.tenant.create({ data: { name: 'Default Tenant', active: true } });
        }
        // Create a position for the admin if needed
        let position = await prisma.position.findFirst({ where: { tenant_id: tenant.id } });
        if (!position) {
            position = await prisma.position.create({ data: { tenant_id: tenant.id, name: 'Administrator' } });
        }
        // Create the admin user
        const user = await prisma.user.create({
            data: {
                tenant_id: tenant.id,
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin',
                password: 'password',
                phone: '',
                position_id: position.id,
                active: true,
                is_super_admin: true
            }
        });
        // Create Administrator role if not exists
        let adminRole = await prisma.role.findFirst({ where: { name: 'Administrator' } });
        if (!adminRole) {
            adminRole = await prisma.role.create({ data: { name: 'Administrator' } });
        }
        // Assign Administrator role to user
        await prisma.userRole.create({ data: { user_id: user.id, role_id: adminRole.id } });
    }
}
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { AppData, Role, User, RoleName, Currency, WorkflowStatus } from '../types';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ...existing code...

// Create MTF Header and Lines
app.post('/api/v1/mtf', async (req: express.Request, res: express.Response) => {
    try {
        const { header, lines }: { header: any; lines: any[] } = req.body;
        
        // Log the incoming data for debugging
        console.log('Creating MTF with header:', header);
        console.log('Creating MTF with lines:', lines);
        

        // Create MTF Header
        const mtfHeader = await prisma.mTF_Header.create({
            data: {
                MTF_ID: header.MTF_ID,
                project_id: header.project_id,
                discipline_id: header.discipline_id,
                date_created: new Date(header.date_created),
                created_by: header.created_by,
                status: header.status,
                current_approval_level: header.current_approval_level,
                mtf_lines: {
                    create: lines.map(line => ({
                        item_id: line.item_id,
                        material_description: line.material_description,
                        request_qty: line.request_qty,
                        status: line.status,
                        current_approval_level: line.current_approval_level,
                        est_unit_price: line.est_unit_price,
                        est_total_price: line.est_total_price,
                    }))
                }
            },
            include: {
                mtf_lines: true
            }
        });

        res.status(201).json(mtfHeader);
    } catch (error) {
        console.error("Error creating MTF:", error);
        res.status(500).json({ message: 'Failed to create MTF.', error: (error as Error).message });
    }
});

// Revise MTF Header and Lines
app.put('/api/v1/mtf/:id/revise', async (req: express.Request, res: express.Response) => {
    try {
        const mtfHeaderId = parseInt(req.params.id);
        const mtfData = req.body;
        
        // Log the incoming data for debugging
        console.log('Revising MTF with ID:', mtfHeaderId);
        console.log('Revising MTF with data:', mtfData);
        
        // Update MTF Header
        const updatedMtfHeader = await prisma.mTF_Header.update({
            where: { id: mtfHeaderId },
            data: {
                status: 'Pending Approval',
                current_approval_level: 0,
            }
        });
        
        // Delete existing lines and create new ones
        await prisma.mTF_Line.deleteMany({
            where: { mtf_header_id: mtfHeaderId }
        });
        
        // Get items for unit prices
        const items = await prisma.itemLibrary.findMany({
            where: {
                id: {
                    in: mtfData.lines.map((line: any) => line.itemId)
                }
            }
        });
        
        // Create new lines
        const newLines = await prisma.mTF_Line.createMany({
            data: mtfData.lines.map((line: any) => {
                const libraryItem = items.find(item => item.id === line.itemId)!;
                const unitPrice = libraryItem.budget_unit_price || 0;
                return {
                    mtf_header_id: mtfHeaderId,
                    item_id: line.itemId,
                    material_description: line.description,
                    request_qty: line.quantity,
                    est_unit_price: unitPrice,
                    est_total_price: unitPrice * line.quantity,
                    status: 'Pending Approval',
                    current_approval_level: 0,
                };
            })
        });

        res.status(200).json({ message: 'MTF revised successfully' });
    } catch (error) {
        console.error("Error revising MTF:", error);
        res.status(500).json({ message: 'Failed to revise MTF.', error: (error as Error).message });
    }
});

// Create STF Order and Lines
app.post('/api/v1/stf', async (req: express.Request, res: express.Response) => {
    try {
        const { firstItem, stfData }: { firstItem: any; stfData: any } = req.body;
        
        // Log the incoming data for debugging
        console.log('Creating STF with firstItem:', firstItem);
        console.log('Creating STF with stfData:', stfData);
        
        // Get the last STF numeric ID to generate a new one
        const lastStf = await prisma.sTF_Order.findFirst({
            orderBy: { id: 'desc' }
        });
        
        const lastStfNumericId = lastStf ? parseInt(lastStf.STF_ID.split('-')[1], 10) : 0;
        const newStfId = `STF-${(lastStfNumericId + 1).toString().padStart(4, '0')}`;
        
        // Create STF Order
        const stfOrder = await prisma.sTF_Order.create({
            data: {
                STF_ID: newStfId,
                project_id: firstItem.project_id,
                discipline_id: firstItem.discipline_id,
                supplier_id: stfData.supplierId,
                date_created: new Date(),
                created_by: firstItem.requesterId, // Assuming we have this in firstItem
                status: 'Pending Approval',
                current_approval_level: 0,
                total_value: stfData.totalValue,
                stf_order_lines: {
                    create: stfData.lines.map((line: any) => ({
                        mtf_line_id: line.mtfLineId,
                        material_description: line.material_description,
                        order_qty: line.orderQty,
                        unit_price: line.unitPrice,
                    }))
                }
            },
            include: {
                stf_order_lines: true
            }
        });

        res.status(201).json(stfOrder);
    } catch (error) {
        console.error("Error creating STF:", error);
        res.status(500).json({ message: 'Failed to create STF.', error: (error as Error).message });
    }
});

// Create User
app.post('/api/v1/user', async (req: express.Request, res: express.Response) => {
    try {
        const userData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Creating user with data:', userData);
        
        // Create User
        const user = await prisma.user.create({
            data: {
                tenant_id: userData.tenant_id,
                is_super_admin: userData.is_super_admin,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: userData.password,
                phone: userData.phone,
                position_id: userData.position_id,
                active: userData.active,
                // Note: We're not handling many-to-many relationships here for simplicity
                // In a full implementation, you would need to handle user_roles, user_projects, and user_disciplines
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: 'Failed to create user.', error: (error as Error).message });
    }
});

// Login Endpoint
app.post('/api/v1/login', async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                position: true,
                user_roles: { include: { role: true } },
                user_projects: true,
                user_disciplines: true,
            },
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        
        // Transform Prisma user to match AppData user type
        const { password: _, ...userWithoutPassword } = user;
        const transformedUser: any = {
            ...userWithoutPassword,
            is_super_admin: userWithoutPassword.is_super_admin ?? undefined,
            roles: userWithoutPassword.user_roles.map((ur: any) => ur.role),
            project_ids: userWithoutPassword.user_projects.map((p: any) => p.project_id),
            discipline_ids: userWithoutPassword.user_disciplines.map((d: any) => d.discipline_id),
            projects: [], // Will be populated on frontend
            disciplines: [], // Will be populated on frontend
        };
        
        res.status(200).json(transformedUser);
    } catch (error) {
        console.error("Login failed:", error);
        res.status(500).json({ message: 'An unexpected error occurred during login.' });
    }
});

// Fetch all data for a specific tenant
app.get('/api/v1/all-data/:tenantId', async (req: express.Request, res: express.Response) => {
    try {
        const tenantId = parseInt(req.params.tenantId, 10);
        if (isNaN(tenantId)) {
            return res.status(400).json({ message: 'Invalid tenant ID.' });
        }
        
        const [
            users, tenants, projects, disciplines, positions, suppliers, items, roles,
            mtfHeaders, mtfLines, mtfHistory,
            stfOrders, stfOrderLines, stfHistory,
            otfOrders, otfOrderLines, otfHistory,
            mrfHeaders, mrfLines, mrfHistory,
            mdfIssues, mdfIssueLines
        ] = await prisma.$transaction([
            prisma.user.findMany({ 
                where: { tenant_id: tenantId },
                include: {
                    position: true,
                    user_roles: { include: { role: true } },
                    user_projects: true,
                    user_disciplines: true,
                }
            }),
            prisma.tenant.findMany(), 
            prisma.project.findMany({ where: { tenant_id: tenantId } }),
            prisma.discipline.findMany({ where: { tenant_id: tenantId } }),
            prisma.position.findMany({ where: { tenant_id: tenantId } }),
            prisma.supplier.findMany({ where: { tenant_id: tenantId } }),
            prisma.itemLibrary.findMany({ where: { tenant_id: tenantId } }),
            prisma.role.findMany(),
            prisma.mTF_Header.findMany({ where: { project: { tenant_id: tenantId } } }),
            prisma.mTF_Line.findMany({ where: { mtf_header: { project: { tenant_id: tenantId } } } }),
            prisma.mTF_History_Log.findMany({ where: { mtf_header: { project: { tenant_id: tenantId } } } }),
            prisma.sTF_Order.findMany({ where: { project: { tenant_id: tenantId } } }),
            prisma.sTF_OrderLine.findMany({ where: { stf_order: { project: { tenant_id: tenantId } } } }),
            prisma.sTF_History_Log.findMany({ where: { stf_order: { project: { tenant_id: tenantId } } } }),
            prisma.oTF_Order.findMany({ where: { project: { tenant_id: tenantId } } }),
            prisma.oTF_OrderLine.findMany({ where: { otf_order: { project: { tenant_id: tenantId } } } }),
            prisma.oTF_History_Log.findMany({ where: { otf_order: { project: { tenant_id: tenantId } } } }),
            prisma.mRF_Header.findMany({ where: { project: { tenant_id: tenantId } } }),
            prisma.mRF_Line.findMany({ where: { mrf_header: { project: { tenant_id: tenantId } } } }),
            prisma.mRF_History_Log.findMany({ where: { mrf_header: { project: { tenant_id: tenantId } } } }),
            prisma.mDF_Issue.findMany({ where: { project: { tenant_id: tenantId } } }),
            prisma.mDF_IssueLine.findMany({ where: { mdf_issue: { project: { tenant_id: tenantId } } } }),
        ]);

        // Convert Prisma types to match the AppData interface
        const appData: AppData = {
            users: users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    is_super_admin: userWithoutPassword.is_super_admin ?? undefined,
                    roles: user.user_roles.map((ur: any) => ur.role),
                    project_ids: user.user_projects.map((p: any) => p.project_id),
                    discipline_ids: user.user_disciplines.map((d: any) => d.discipline_id),
                    projects: [], // Will be populated on frontend
                    disciplines: [], // Will be populated on frontend
                };
            }) as any[],
            tenants, 
            projects: projects.map(p => ({
                ...p,
                base_currency: p.base_currency as Currency
            })) as any[], 
            disciplines, 
            positions, 
            suppliers, 
            items: items.map(i => ({
                ...i,
                budget_unit_price: i.budget_unit_price ?? undefined,
                material_description: i.material_description || undefined
            })) as any[], 
            roles: roles.map(r => ({
                ...r,
                level: r.level ?? undefined,
                name: r.name as RoleName
            })) as any[], 
            mtfHeaders: mtfHeaders.map(h => ({
                ...h,
                status: h.status as WorkflowStatus,
                date_created: h.date_created.toISOString()
            })) as any[], 
            mtfLines: mtfLines.map(l => ({
                ...l,
                status: l.status as WorkflowStatus
            })) as any[],
            mtfHistory: mtfHistory.map(h => ({
                ...h,
                timestamp: h.timestamp.toISOString(),
                action: h.action as "Created" | "Approved" | "Rejected" | "Revised" | "Closed",
                fromStatus: h.fromStatus as WorkflowStatus | undefined,
                toStatus: h.toStatus as WorkflowStatus
            })) as any[], 
            stfOrders: stfOrders.map(o => ({
                ...o,
                status: o.status as WorkflowStatus,
                date_created: o.date_created.toISOString()
            })) as any[], 
            stfOrderLines, 
            stfHistory: stfHistory.map(h => ({
                ...h,
                timestamp: h.timestamp.toISOString(),
                action: h.action as "Created" | "Approved" | "Rejected" | "Revised" | "Closed",
                fromStatus: h.fromStatus as WorkflowStatus | undefined,
                toStatus: h.toStatus as WorkflowStatus
            })) as any[], 
            otfOrders: otfOrders.map(o => ({
                ...o,
                status: o.status as WorkflowStatus,
                date_created: o.date_created.toISOString(),
                invoice_date: o.invoice_date ? o.invoice_date.toISOString() : undefined
            })) as any[], 
            otfOrderLines, 
            otfHistory: otfHistory.map(h => ({
                ...h,
                timestamp: h.timestamp.toISOString(),
                action: h.action as "Created" | "Approved" | "Rejected" | "Revised" | "Closed",
                fromStatus: h.fromStatus as WorkflowStatus | undefined,
                toStatus: h.toStatus as WorkflowStatus
            })) as any[], 
            mrfHeaders: mrfHeaders.map(h => ({
                ...h,
                status: h.status as WorkflowStatus,
                date_created: h.date_created.toISOString()
            })) as any[], 
            mrfLines, 
            mrfHistory: mrfHistory.map(h => ({
                ...h,
                timestamp: h.timestamp.toISOString(),
                action: h.action as "Created" | "Approved" | "Rejected",
                fromStatus: h.fromStatus as WorkflowStatus | undefined,
                toStatus: h.toStatus as WorkflowStatus
            })) as any[], 
            mdfIssues: mdfIssues.map(i => ({
                ...i,
                date_created: i.date_created.toISOString()
            })) as any[], 
            mdfIssueLines
        };

        res.status(200).json(appData);

    } catch (error) {
        console.error(`Error fetching data for tenant ${req.params.tenantId}:`, error);
        res.status(500).json({ message: 'Failed to fetch application data.' });
    }
});

// Fetch all data for a super admin
app.get('/api/v1/all-data', async (req: express.Request, res: express.Response) => {
    try {
        const [
            users, tenants, projects, disciplines, positions, suppliers, items, roles,
            mtfHeaders, mtfLines, mtfHistory,
            stfOrders, stfOrderLines, stfHistory,
            otfOrders, otfOrderLines, otfHistory,
            mrfHeaders, mrfLines, mrfHistory,
            mdfIssues, mdfIssueLines
        ] = await prisma.$transaction([
            prisma.user.findMany({
                include: {
                    position: true,
                    user_roles: { include: { role: true } },
                    user_projects: true,
                    user_disciplines: true,
                }
            }),
            prisma.tenant.findMany(),
            prisma.project.findMany(),
            prisma.discipline.findMany(),
            prisma.position.findMany(),
            prisma.supplier.findMany(),
            prisma.itemLibrary.findMany(),
            prisma.role.findMany(),
            prisma.mTF_Header.findMany(), 
            prisma.mTF_Line.findMany(), 
            prisma.mTF_History_Log.findMany(),
            prisma.sTF_Order.findMany(), 
            prisma.sTF_OrderLine.findMany(), 
            prisma.sTF_History_Log.findMany(),
            prisma.oTF_Order.findMany(), 
            prisma.oTF_OrderLine.findMany(), 
            prisma.oTF_History_Log.findMany(),
            prisma.mRF_Header.findMany(), 
            prisma.mRF_Line.findMany(), 
            prisma.mRF_History_Log.findMany(),
            prisma.mDF_Issue.findMany(), 
            prisma.mDF_IssueLine.findMany(),
        ]);

        // Convert Prisma types to match the AppData interface
        const appData: AppData = {
            users: users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    is_super_admin: userWithoutPassword.is_super_admin ?? undefined,
                    roles: user.user_roles.map((ur: any) => ur.role),
                    project_ids: user.user_projects.map((p: any) => p.project_id),
                    discipline_ids: user.user_disciplines.map((d: any) => d.discipline_id),
                    projects: [], // Will be populated on frontend
                    disciplines: [], // Will be populated on frontend
                };
            }) as any[],
            tenants, 
            projects: projects.map(p => ({
                ...p,
                base_currency: p.base_currency as Currency
            })) as any[], 
            disciplines, 
            positions, 
            suppliers, 
            items: items.map(i => ({
                ...i,
                budget_unit_price: i.budget_unit_price ?? undefined,
                material_description: i.material_description || undefined
            })) as any[], 
            roles: roles.map(r => ({
                ...r,
                level: r.level ?? undefined,
                name: r.name as RoleName
            })) as any[], 
            mtfHeaders: mtfHeaders.map(h => ({
                ...h,
                status: h.status as WorkflowStatus,
                date_created: h.date_created.toISOString()
            })) as any[], 
            mtfLines: mtfLines.map(l => ({
                ...l,
                status: l.status as WorkflowStatus
            })) as any[],
            mtfHistory: mtfHistory.map(h => ({
                ...h,
                timestamp: h.timestamp.toISOString(),
                action: h.action as "Created" | "Approved" | "Rejected" | "Revised" | "Closed",
                fromStatus: h.fromStatus as WorkflowStatus | undefined,
                toStatus: h.toStatus as WorkflowStatus
            })) as any[], 
            stfOrders: stfOrders.map(o => ({
                ...o,
                status: o.status as WorkflowStatus,
                date_created: o.date_created.toISOString()
            })) as any[], 
            stfOrderLines, 
            stfHistory: stfHistory.map(h => ({
                ...h,
                timestamp: h.timestamp.toISOString(),
                action: h.action as "Created" | "Approved" | "Rejected" | "Revised" | "Closed",
                fromStatus: h.fromStatus as WorkflowStatus | undefined,
                toStatus: h.toStatus as WorkflowStatus
            })) as any[], 
            otfOrders: otfOrders.map(o => ({
                ...o,
                status: o.status as WorkflowStatus,
                date_created: o.date_created.toISOString(),
                invoice_date: o.invoice_date ? o.invoice_date.toISOString() : undefined
            })) as any[], 
            otfOrderLines, 
            otfHistory: otfHistory.map(h => ({
                ...h,
                timestamp: h.timestamp.toISOString(),
                action: h.action as "Created" | "Approved" | "Rejected" | "Revised" | "Closed",
                fromStatus: h.fromStatus as WorkflowStatus | undefined,
                toStatus: h.toStatus as WorkflowStatus
            })) as any[], 
            mrfHeaders: mrfHeaders.map(h => ({
                ...h,
                status: h.status as WorkflowStatus,
                date_created: h.date_created.toISOString()
            })) as any[], 
            mrfLines, 
            mrfHistory: mrfHistory.map(h => ({
                ...h,
                timestamp: h.timestamp.toISOString(),
                action: h.action as "Created" | "Approved" | "Rejected",
                fromStatus: h.fromStatus as WorkflowStatus | undefined,
                toStatus: h.toStatus as WorkflowStatus
            })) as any[], 
            mdfIssues: mdfIssues.map(i => ({
                ...i,
                date_created: i.date_created.toISOString()
            })) as any[], 
            mdfIssueLines
        };
        
        res.status(200).json(appData);

    } catch (error) {
        console.error("Error fetching all data for super admin:", error);
        res.status(500).json({ message: 'Failed to fetch all application data.' });
    }
});

// Reset Database Endpoint
app.post('/api/v1/reset-db', async (req: express.Request, res: express.Response) => {
    console.log('Received request to reset database...');
    try {
        await seedDatabase();
        res.status(200).json({ message: 'Database reset and seeded successfully.' });
    } catch (error) {
        console.error("Database reset failed:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// Create Project
app.post('/api/v1/project', async (req: express.Request, res: express.Response) => {
    try {
        const projectData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Creating project with data:', projectData);
        
        // Create Project
        const project = await prisma.project.create({
            data: {
                tenant_id: projectData.tenant_id,
                name: projectData.name,
                code: projectData.code,
                country: projectData.country,
                base_currency: projectData.base_currency,
                max_mtf_approval_level: projectData.max_mtf_approval_level,
                max_stf_approval_level: projectData.max_stf_approval_level,
                max_otf_approval_level: projectData.max_otf_approval_level,
                max_mrf_approval_level: projectData.max_mrf_approval_level,
                max_mdf_approval_level: projectData.max_mdf_approval_level,
            }
        });

        res.status(201).json(project);
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: 'Failed to create project.', error: (error as Error).message });
    }
});

// Update Project
app.put('/api/v1/project/:id', async (req: express.Request, res: express.Response) => {
    try {
        const projectId = parseInt(req.params.id);
        const projectData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Updating project with ID:', projectId, 'and data:', projectData);
        
        // Update Project
        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                name: projectData.name,
                code: projectData.code,
                country: projectData.country,
                base_currency: projectData.base_currency,
                max_mtf_approval_level: projectData.max_mtf_approval_level,
                max_stf_approval_level: projectData.max_stf_approval_level,
                max_otf_approval_level: projectData.max_otf_approval_level,
                max_mrf_approval_level: projectData.max_mrf_approval_level,
                max_mdf_approval_level: projectData.max_mdf_approval_level,
            }
        });

        res.status(200).json(project);
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: 'Failed to update project.', error: (error as Error).message });
    }
});

// Create Supplier
app.post('/api/v1/supplier', async (req: express.Request, res: express.Response) => {
    try {
        const supplierData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Creating supplier with data:', supplierData);
        
        // Create Supplier
        const supplier = await prisma.supplier.create({
            data: {
                tenant_id: supplierData.tenant_id,
                name: supplierData.name,
                contact_person: supplierData.contact_person,
                email: supplierData.email,
                phone: supplierData.phone,
                address: supplierData.address,
                active: supplierData.active,
            }
        });

        res.status(201).json(supplier);
    } catch (error) {
        console.error("Error creating supplier:", error);
        res.status(500).json({ message: 'Failed to create supplier.', error: (error as Error).message });
    }
});

// Update Supplier
app.put('/api/v1/supplier/:id', async (req: express.Request, res: express.Response) => {
    try {
        const supplierId = parseInt(req.params.id);
        const supplierData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Updating supplier with ID:', supplierId, 'and data:', supplierData);
        
        // Update Supplier
        const supplier = await prisma.supplier.update({
            where: { id: supplierId },
            data: {
                name: supplierData.name,
                contact_person: supplierData.contact_person,
                email: supplierData.email,
                phone: supplierData.phone,
                address: supplierData.address,
                active: supplierData.active,
            }
        });

        res.status(200).json(supplier);
    } catch (error) {
        console.error("Error updating supplier:", error);
        res.status(500).json({ message: 'Failed to update supplier.', error: (error as Error).message });
    }
});

// Create Item
app.post('/api/v1/item', async (req: express.Request, res: express.Response) => {
    try {
        const itemData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Creating item with data:', itemData);
        
        // Create Item
        const item = await prisma.itemLibrary.create({
            data: {
                tenant_id: itemData.tenant_id,
                material_code: itemData.material_code,
                material_name: itemData.material_name,
                material_description: itemData.material_description,
                unit: itemData.unit,
                budget_unit_price: itemData.budget_unit_price,
            }
        });

        res.status(201).json(item);
    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ message: 'Failed to create item.', error: (error as Error).message });
    }
});

// Update Item
app.put('/api/v1/item/:id', async (req: express.Request, res: express.Response) => {
    try {
        const itemId = parseInt(req.params.id);
        const itemData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Updating item with ID:', itemId, 'and data:', itemData);
        
        // Update Item
        const item = await prisma.itemLibrary.update({
            where: { id: itemId },
            data: {
                material_code: itemData.material_code,
                material_name: itemData.material_name,
                material_description: itemData.material_description,
                unit: itemData.unit,
                budget_unit_price: itemData.budget_unit_price,
            }
        });

        res.status(200).json(item);
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: 'Failed to update item.', error: (error as Error).message });
    }
});

// Create Position
app.post('/api/v1/position', async (req: express.Request, res: express.Response) => {
    try {
        const positionData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Creating position with data:', positionData);
        
        // Create Position
        const position = await prisma.position.create({
            data: {
                tenant_id: positionData.tenant_id,
                name: positionData.name,
            }
        });

        res.status(201).json(position);
    } catch (error) {
        console.error("Error creating position:", error);
        res.status(500).json({ message: 'Failed to create position.', error: (error as Error).message });
    }
});

// Update Position
app.put('/api/v1/position/:id', async (req: express.Request, res: express.Response) => {
    try {
        const positionId = parseInt(req.params.id);
        const positionData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Updating position with ID:', positionId, 'and data:', positionData);
        
        // Update Position
        const position = await prisma.position.update({
            where: { id: positionId },
            data: {
                name: positionData.name,
            }
        });

        res.status(200).json(position);
    } catch (error) {
        console.error("Error updating position:", error);
        res.status(500).json({ message: 'Failed to update position.', error: (error as Error).message });
    }
});

// Create Discipline
app.post('/api/v1/discipline', async (req: express.Request, res: express.Response) => {
    try {
        const disciplineData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Creating discipline with data:', disciplineData);
        
        // Create Discipline
        const discipline = await prisma.discipline.create({
            data: {
                tenant_id: disciplineData.tenant_id,
                discipline_code: disciplineData.discipline_code,
                discipline_name: disciplineData.discipline_name,
                budget_code: disciplineData.budget_code,
                budget_name: disciplineData.budget_name,
            }
        });

        res.status(201).json(discipline);
    } catch (error) {
        console.error("Error creating discipline:", error);
        res.status(500).json({ message: 'Failed to create discipline.', error: (error as Error).message });
    }
});

// Update Discipline
app.put('/api/v1/discipline/:id', async (req: express.Request, res: express.Response) => {
    try {
        const disciplineId = parseInt(req.params.id);
        const disciplineData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Updating discipline with ID:', disciplineId, 'and data:', disciplineData);
        
        // Update Discipline
        const discipline = await prisma.discipline.update({
            where: { id: disciplineId },
            data: {
                discipline_code: disciplineData.discipline_code,
                discipline_name: disciplineData.discipline_name,
                budget_code: disciplineData.budget_code,
                budget_name: disciplineData.budget_name,
            }
        });

        res.status(200).json(discipline);
    } catch (error) {
        console.error("Error updating discipline:", error);
        res.status(500).json({ message: 'Failed to update discipline.', error: (error as Error).message });
    }
});

// Update User
app.put('/api/v1/user/:id', async (req: express.Request, res: express.Response) => {
    try {
        const userId = parseInt(req.params.id);
        const userData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Updating user with ID:', userId, 'and data:', userData);
        
        // Update User
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone,
                position_id: userData.position_id,
                active: userData.active,
                // Handle many-to-many relationships
                user_roles: {
                    deleteMany: {}, // Delete all existing roles
                    create: userData.roles?.map((role: any) => ({
                        role: {
                            connect: { id: role.id }
                        }
                    })) || []
                },
                user_projects: {
                    deleteMany: {}, // Delete all existing projects
                    create: userData.project_ids?.map((projectId: number) => ({
                        project: {
                            connect: { id: projectId }
                        }
                    })) || []
                },
                user_disciplines: {
                    deleteMany: {}, // Delete all existing disciplines
                    create: userData.discipline_ids?.map((disciplineId: number) => ({
                        discipline: {
                            connect: { id: disciplineId }
                        }
                    })) || []
                }
            }
        });

        res.status(200).json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Failed to update user.', error: (error as Error).message });
    }
});

// Assign roles to user
app.post('/api/v1/user/:id/roles', async (req: express.Request, res: express.Response) => {
    try {
        const userId = parseInt(req.params.id);
        const { roleIds }: { roleIds: number[] } = req.body;
        
        // Delete existing roles and assign new ones
        await prisma.userRole.deleteMany({
            where: { user_id: userId }
        });
        
        // Create new role assignments
        if (roleIds && roleIds.length > 0) {
            await prisma.userRole.createMany({
                data: roleIds.map(roleId => ({
                    user_id: userId,
                    role_id: roleId
                }))
            });
        }
        
        res.status(200).json({ message: 'User roles updated successfully' });
    } catch (error) {
        console.error("Error updating user roles:", error);
        res.status(500).json({ message: 'Failed to update user roles.', error: (error as Error).message });
    }
});

// Assign projects to user
app.post('/api/v1/user/:id/projects', async (req: express.Request, res: express.Response) => {
    try {
        const userId = parseInt(req.params.id);
        const { projectIds }: { projectIds: number[] } = req.body;
        
        // Delete existing projects and assign new ones
        await prisma.userProject.deleteMany({
            where: { user_id: userId }
        });
        
        // Create new project assignments
        if (projectIds && projectIds.length > 0) {
            await prisma.userProject.createMany({
                data: projectIds.map(projectId => ({
                    user_id: userId,
                    project_id: projectId
                }))
            });
        }
        
        res.status(200).json({ message: 'User projects updated successfully' });
    } catch (error) {
        console.error("Error updating user projects:", error);
        res.status(500).json({ message: 'Failed to update user projects.', error: (error as Error).message });
    }
});

// Assign disciplines to user
app.post('/api/v1/user/:id/disciplines', async (req: express.Request, res: express.Response) => {
    try {
        const userId = parseInt(req.params.id);
        const { disciplineIds }: { disciplineIds: number[] } = req.body;
        
        // Delete existing disciplines and assign new ones
        await prisma.userDiscipline.deleteMany({
            where: { user_id: userId }
        });
        
        // Create new discipline assignments
        if (disciplineIds && disciplineIds.length > 0) {
            await prisma.userDiscipline.createMany({
                data: disciplineIds.map(disciplineId => ({
                    user_id: userId,
                    discipline_id: disciplineId
                }))
            });
        }
        
        res.status(200).json({ message: 'User disciplines updated successfully' });
    } catch (error) {
        console.error("Error updating user disciplines:", error);
        res.status(500).json({ message: 'Failed to update user disciplines.', error: (error as Error).message });
    }
});

// Create User
app.post('/api/v1/user', async (req: express.Request, res: express.Response) => {
    try {
        const userData: any = req.body;
        
        // Log the incoming data for debugging
        console.log('Creating user with data:', userData);
        
        // Create User
        const user = await prisma.user.create({
            data: {
                tenant_id: userData.tenant_id,
                is_super_admin: userData.is_super_admin,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: userData.password,
                phone: userData.phone,
                position_id: userData.position_id,
                active: userData.active,
                // Handle many-to-many relationships
                user_roles: {
                    create: userData.roles?.map((role: any) => ({
                        role: {
                            connect: { id: role.id }
                        }
                    })) || []
                },
                user_projects: {
                    create: userData.project_ids?.map((projectId: number) => ({
                        project: {
                            connect: { id: projectId }
                        }
                    })) || []
                },
                user_disciplines: {
                    create: userData.discipline_ids?.map((disciplineId: number) => ({
                        discipline: {
                            connect: { id: disciplineId }
                        }
                    })) || []
                }
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: 'Failed to create user.', error: (error as Error).message });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});