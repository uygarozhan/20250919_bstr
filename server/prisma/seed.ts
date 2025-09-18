import { PrismaClient } from '@prisma/client';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
    console.log(`Start seeding ...`);

    // --- CLEAR DATABASE ---
    await prisma.$transaction([
        prisma.mDF_IssueLine.deleteMany({}),
        prisma.mDF_Issue.deleteMany({}),
        prisma.mRF_Line.deleteMany({}),
        prisma.mRF_History_Log.deleteMany({}),
        prisma.mRF_Header.deleteMany({}),
        prisma.oTF_OrderLine.deleteMany({}),
        prisma.oTF_History_Log.deleteMany({}),
        prisma.oTF_Order.deleteMany({}),
        prisma.sTF_OrderLine.deleteMany({}),
        prisma.sTF_History_Log.deleteMany({}),
        prisma.sTF_Order.deleteMany({}),
        prisma.mTF_Line.deleteMany({}),
        prisma.mTF_History_Log.deleteMany({}),
        prisma.mTF_Header.deleteMany({}),
        prisma.supplier.deleteMany({}),
        prisma.itemLibrary.deleteMany({}),
        prisma.userRole.deleteMany({}),
        prisma.userProject.deleteMany({}),
        prisma.userDiscipline.deleteMany({}),
        prisma.user.deleteMany({}),
        prisma.position.deleteMany({}),
        prisma.project.deleteMany({}),
        prisma.discipline.deleteMany({}),
        prisma.tenant.deleteMany({}),
        prisma.role.deleteMany({}),
    ]);
    console.log('Cleared existing data.');
    
    // --- SEED CORE DATA ---
    // Create tenants
    const tenant1 = await prisma.tenant.create({ 
        data: {
            name: 'Global Construction Inc.',
            active: true
        }
    });
    
    const tenant2 = await prisma.tenant.create({ 
        data: {
            name: 'Metro Rail Systems',
            active: true
        }
    });
    console.log('Seeded tenants.');
    
    // Create roles
    const role1 = await prisma.role.create({ data: { name: 'Administrator', level: null } });
    const role2 = await prisma.role.create({ data: { name: 'Requester', level: null } });
    const role3 = await prisma.role.create({ data: { name: 'MTF Approver', level: 1 } });
    const role4 = await prisma.role.create({ data: { name: 'MTF Approver', level: 2 } });
    const role5 = await prisma.role.create({ data: { name: 'MTF Approver', level: 3 } });
    const role6 = await prisma.role.create({ data: { name: 'STF Initiator', level: null } });
    const role7 = await prisma.role.create({ data: { name: 'STF Approver', level: 1 } });
    const role8 = await prisma.role.create({ data: { name: 'STF Approver', level: 2 } });
    const role9 = await prisma.role.create({ data: { name: 'STF Approver', level: 3 } });
    const role10 = await prisma.role.create({ data: { name: 'OTF Initiator', level: null } });
    const role11 = await prisma.role.create({ data: { name: 'OTF Approver', level: 1 } });
    const role12 = await prisma.role.create({ data: { name: 'OTF Approver', level: 2 } });
    const role13 = await prisma.role.create({ data: { name: 'OTF Approver', level: 3 } });
    const role14 = await prisma.role.create({ data: { name: 'MRF Initiator', level: null } });
    const role15 = await prisma.role.create({ data: { name: 'MRF Approver', level: 1 } });
    const role16 = await prisma.role.create({ data: { name: 'Viewer', level: null } });
    console.log('Seeded roles.');
    
    // Create projects
    const project1 = await prisma.project.create({ 
        data: {
            tenant_id: tenant1.id,
            name: 'Downtown Tower',
            code: 'DT-2024',
            country: 'USA',
            base_currency: 'USD',
            max_mtf_approval_level: 2,
            max_stf_approval_level: 3,
            max_otf_approval_level: 2,
            max_mrf_approval_level: 1,
            max_mdf_approval_level: 1
        }
    });
    
    const project2 = await prisma.project.create({ 
        data: {
            tenant_id: tenant1.id,
            name: 'Coastal Highway Bridge',
            code: 'CHB-2025',
            country: 'Canada',
            base_currency: 'CAD',
            max_mtf_approval_level: 3,
            max_stf_approval_level: 3,
            max_otf_approval_level: 2,
            max_mrf_approval_level: 1,
            max_mdf_approval_level: 1
        }
    });
    
    const project3 = await prisma.project.create({ 
        data: {
            tenant_id: tenant2.id,
            name: 'City Metro Line 4',
            code: 'CML-4',
            country: 'UK',
            base_currency: 'GBP',
            max_mtf_approval_level: 3,
            max_stf_approval_level: 3,
            max_otf_approval_level: 2,
            max_mrf_approval_level: 1,
            max_mdf_approval_level: 1
        }
    });
    console.log('Seeded projects.');
    
    // Create disciplines
    const discipline1 = await prisma.discipline.create({ 
        data: {
            tenant_id: tenant1.id,
            discipline_code: 'CIV',
            discipline_name: 'Civil Works',
            budget_code: 'BUD-CIV-100',
            budget_name: 'General Civil Budget'
        }
    });
    
    const discipline2 = await prisma.discipline.create({ 
        data: {
            tenant_id: tenant1.id,
            discipline_code: 'MEC',
            discipline_name: 'Mechanical',
            budget_code: 'BUD-MEC-200',
            budget_name: 'Mechanical Works Budget'
        }
    });
    
    const discipline3 = await prisma.discipline.create({ 
        data: {
            tenant_id: tenant1.id,
            discipline_code: 'ELE',
            discipline_name: 'Electrical',
            budget_code: 'BUD-ELE-300',
            budget_name: 'Electrical Works Budget'
        }
    });
    
    const discipline4 = await prisma.discipline.create({ 
        data: {
            tenant_id: tenant2.id,
            discipline_code: 'SIG',
            discipline_name: 'Signaling',
            budget_code: 'METRO-SIG-A1',
            budget_name: 'Signaling Systems Budget'
        }
    });
    
    const discipline5 = await prisma.discipline.create({ 
        data: {
            tenant_id: tenant2.id,
            discipline_code: 'TUN',
            discipline_name: 'Tunneling',
            budget_code: 'METRO-TUN-B2',
            budget_name: 'Tunneling Operations Budget'
        }
    });
    console.log('Seeded disciplines.');
    
    // Create positions
    const position1 = await prisma.position.create({ data: { tenant_id: tenant1.id, name: 'Project Manager' } });
    const position2 = await prisma.position.create({ data: { tenant_id: tenant1.id, name: 'Lead Engineer' } });
    const position3 = await prisma.position.create({ data: { tenant_id: tenant1.id, name: 'Site Engineer' } });
    const position4 = await prisma.position.create({ data: { tenant_id: tenant1.id, name: 'Procurement Officer' } });
    const position5 = await prisma.position.create({ data: { tenant_id: tenant2.id, name: 'Metro Director' } });
    const position6 = await prisma.position.create({ data: { tenant_id: tenant2.id, name: 'Tunneling Supervisor' } });
    const position7 = await prisma.position.create({ data: { tenant_id: tenant1.id, name: 'System Admin' } });
    console.log('Seeded positions.');
    
    // Create items
    const item1 = await prisma.itemLibrary.create({ 
        data: {
            tenant_id: tenant1.id,
            material_code: 'CEM-001',
            material_name: 'Portland Cement',
            material_description: 'High-strength Portland cement',
            unit: 'bag',
            budget_unit_price: 15
        }
    });
    
    const item2 = await prisma.itemLibrary.create({ 
        data: {
            tenant_id: tenant1.id,
            material_code: 'REB-016',
            material_name: 'Rebar 16mm',
            material_description: 'Deformed steel reinforcement bar',
            unit: 'ton',
            budget_unit_price: 800
        }
    });
    
    const item3 = await prisma.itemLibrary.create({ 
        data: {
            tenant_id: tenant1.id,
            material_code: 'PVC-100',
            material_name: 'PVC Pipe 100mm',
            material_description: '100mm diameter PVC pipe',
            unit: 'm',
            budget_unit_price: 12
        }
    });
    
    const item4 = await prisma.itemLibrary.create({ 
        data: {
            tenant_id: tenant2.id,
            material_code: 'RAIL-S45',
            material_name: 'Steel Rail S45',
            material_description: 'Standard gauge S45 steel rail',
            unit: 'm',
            budget_unit_price: 150
        }
    });
    
    const item5 = await prisma.itemLibrary.create({ 
        data: {
            tenant_id: tenant2.id,
            material_code: 'SIG-CBL-04',
            material_name: 'Signaling Cable 4-core',
            material_description: '4-core copper signaling cable',
            unit: 'm',
            budget_unit_price: 25
        }
    });
    console.log('Seeded items.');
    
    // Create suppliers
    const supplier1 = await prisma.supplier.create({ 
        data: {
            tenant_id: tenant1.id,
            name: 'Steel Dynamics',
            contact_person: 'John Steele',
            email: 'sales@steeldynamics.com',
            phone: '555-0101',
            address: '123 Industrial Way, Steeltown, USA',
            active: true
        }
    });
    
    const supplier2 = await prisma.supplier.create({ 
        data: {
            tenant_id: tenant1.id,
            name: 'Concrete Solutions Ltd.',
            contact_person: 'Maria Garcia',
            email: 'maria.g@concretesolutions.com',
            phone: '555-0102',
            address: '456 Quarry Rd, Rocksolid, USA',
            active: true
        }
    });
    
    const supplier3 = await prisma.supplier.create({ 
        data: {
            tenant_id: tenant1.id,
            name: 'FastenerPro',
            contact_person: 'Chen Wei',
            email: 'w.chen@fastener.pro',
            phone: '555-0103',
            address: '789 Bolt Ave, Anytown, USA',
            active: false
        }
    });
    
    const supplier4 = await prisma.supplier.create({ 
        data: {
            tenant_id: tenant2.id,
            name: 'RailTech International',
            contact_person: 'David Miller',
            email: 'dmiller@railtech.com',
            phone: '555-0201',
            address: '101 Rail Spur, Metroville, UK',
            active: true
        }
    });
    
    const supplier5 = await prisma.supplier.create({ 
        data: {
            tenant_id: tenant2.id,
            name: 'Signal & Comms Co.',
            contact_person: 'Fatima Al-Jamil',
            email: 'fatima.aj@signalcomms.co.uk',
            phone: '555-0202',
            address: '212 Circuit Lane, London, UK',
            active: true
        }
    });
    console.log('Seeded suppliers.');
    
    // Create users
    const user1 = await prisma.user.create({
        data: {
            tenant_id: null,
            is_super_admin: true,
            firstName: 'Super',
            lastName: 'Admin',
            email: 'super@admin.com',
            password: 'password',
            phone: 'N/A',
            position_id: position7.id,
            active: true
        }
    });
    
    const user2 = await prisma.user.create({
        data: {
            tenant_id: tenant1.id,
            is_super_admin: false,
            firstName: 'Alice',
            lastName: 'Manager',
            email: 'alice.manager@gci.com',
            password: 'password',
            phone: '123-456-7890',
            position_id: position1.id,
            active: true
        }
    });
    
    const user3 = await prisma.user.create({
        data: {
            tenant_id: tenant1.id,
            is_super_admin: false,
            firstName: 'Bob',
            lastName: 'Engineer',
            email: 'bob.engineer@gci.com',
            password: 'password',
            phone: '234-567-8901',
            position_id: position3.id,
            active: true
        }
    });
    
    const user4 = await prisma.user.create({
        data: {
            tenant_id: tenant1.id,
            is_super_admin: false,
            firstName: 'Charlie',
            lastName: 'Procurement',
            email: 'charlie.proc@gci.com',
            password: 'password',
            phone: '345-678-9012',
            position_id: position4.id,
            active: true
        }
    });
    
    const user5 = await prisma.user.create({
        data: {
            tenant_id: tenant2.id,
            is_super_admin: false,
            firstName: 'Diana',
            lastName: 'Director',
            email: 'diana.director@mrs.com',
            password: 'password',
            phone: '456-789-0123',
            position_id: position5.id,
            active: true
        }
    });
    console.log('Seeded users.');
    
    // Create user roles relations
    await prisma.userRole.create({ data: { user_id: user2.id, role_id: role1.id } });
    await prisma.userRole.create({ data: { user_id: user2.id, role_id: role4.id } });
    await prisma.userRole.create({ data: { user_id: user2.id, role_id: role9.id } });
    await prisma.userRole.create({ data: { user_id: user2.id, role_id: role13.id } });
    await prisma.userRole.create({ data: { user_id: user2.id, role_id: role15.id } });
    
    await prisma.userRole.create({ data: { user_id: user3.id, role_id: role2.id } });
    
    await prisma.userRole.create({ data: { user_id: user4.id, role_id: role6.id } });
    await prisma.userRole.create({ data: { user_id: user4.id, role_id: role7.id } });
    await prisma.userRole.create({ data: { user_id: user4.id, role_id: role10.id } });
    await prisma.userRole.create({ data: { user_id: user4.id, role_id: role14.id } });
    
    await prisma.userRole.create({ data: { user_id: user5.id, role_id: role1.id } });
    await prisma.userRole.create({ data: { user_id: user5.id, role_id: role5.id } });
    await prisma.userRole.create({ data: { user_id: user5.id, role_id: role9.id } });
    console.log('Seeded user roles.');
    
    // Create user projects relations
    await prisma.userProject.create({ data: { user_id: user2.id, project_id: project1.id } });
    await prisma.userProject.create({ data: { user_id: user3.id, project_id: project1.id } });
    await prisma.userProject.create({ data: { user_id: user4.id, project_id: project1.id } });
    await prisma.userProject.create({ data: { user_id: user4.id, project_id: project2.id } });
    await prisma.userProject.create({ data: { user_id: user5.id, project_id: project3.id } });
    console.log('Seeded user projects.');
    
    // Create user disciplines relations
    await prisma.userDiscipline.create({ data: { user_id: user2.id, discipline_id: discipline1.id } });
    await prisma.userDiscipline.create({ data: { user_id: user2.id, discipline_id: discipline2.id } });
    await prisma.userDiscipline.create({ data: { user_id: user2.id, discipline_id: discipline3.id } });
    
    await prisma.userDiscipline.create({ data: { user_id: user3.id, discipline_id: discipline1.id } });
    
    await prisma.userDiscipline.create({ data: { user_id: user4.id, discipline_id: discipline1.id } });
    await prisma.userDiscipline.create({ data: { user_id: user4.id, discipline_id: discipline2.id } });
    await prisma.userDiscipline.create({ data: { user_id: user4.id, discipline_id: discipline3.id } });
    
    await prisma.userDiscipline.create({ data: { user_id: user5.id, discipline_id: discipline4.id } });
    await prisma.userDiscipline.create({ data: { user_id: user5.id, discipline_id: discipline5.id } });
    console.log('Seeded user disciplines.');
    
    // Create MTF headers
    const mtfHeader1 = await prisma.mTF_Header.create({ 
        data: {
            MTF_ID: 'MTF-0001',
            project_id: project1.id,
            discipline_id: discipline1.id,
            date_created: new Date('2024-01-15T00:00:00.000Z'),
            created_by: user3.id,
            status: 'Approved',
            current_approval_level: 2
        }
    });
    
    const mtfHeader2 = await prisma.mTF_Header.create({ 
        data: {
            MTF_ID: 'MTF-0002',
            project_id: project1.id,
            discipline_id: discipline2.id,
            date_created: new Date('2024-02-10T00:00:00.000Z'),
            created_by: user3.id,
            status: 'Pending Approval',
            current_approval_level: 1
        }
    });
    console.log('Seeded MTF headers.');
    
    // Create MTF lines
    const mtfLine1 = await prisma.mTF_Line.create({ 
        data: {
            mtf_header_id: mtfHeader1.id,
            item_id: item1.id,
            material_description: 'High-strength Portland cement',
            request_qty: 200,
            status: 'Closed',
            current_approval_level: 2,
            est_unit_price: 15,
            est_total_price: 3000
        }
    });
    
    const mtfLine2 = await prisma.mTF_Line.create({ 
        data: {
            mtf_header_id: mtfHeader1.id,
            item_id: item2.id,
            material_description: 'Deformed steel reinforcement bar',
            request_qty: 10,
            status: 'Closed',
            current_approval_level: 2,
            est_unit_price: 800,
            est_total_price: 8000
        }
    });
    
    const mtfLine3 = await prisma.mTF_Line.create({ 
        data: {
            mtf_header_id: mtfHeader2.id,
            item_id: item3.id,
            material_description: '100mm diameter PVC pipe',
            request_qty: 500,
            status: 'Pending Approval',
            current_approval_level: 1,
            est_unit_price: 12,
            est_total_price: 6000
        }
    });
    console.log('Seeded MTF lines.');
    
    // Create STF orders
    const stfOrder1 = await prisma.sTF_Order.create({ 
        data: {
            STF_ID: 'STF-0001',
            project_id: project1.id,
            discipline_id: discipline1.id,
            supplier_id: supplier2.id,
            date_created: new Date('2024-01-20T00:00:00.000Z'),
            created_by: user4.id,
            status: 'Approved',
            current_approval_level: 3,
            total_value: 10800
        }
    });
    console.log('Seeded STF orders.');
    
    // Create STF order lines
    const stfOrderLine1 = await prisma.sTF_OrderLine.create({ 
        data: {
            stf_order_id: stfOrder1.id,
            mtf_line_id: mtfLine1.id,
            material_description: 'High-strength Portland cement',
            order_qty: 200,
            unit_price: 14
        }
    });
    
    const stfOrderLine2 = await prisma.sTF_OrderLine.create({ 
        data: {
            stf_order_id: stfOrder1.id,
            mtf_line_id: mtfLine2.id,
            material_description: 'Deformed steel reinforcement bar',
            order_qty: 10,
            unit_price: 800
        }
    });
    console.log('Seeded STF order lines.');
    
    // Create OTF orders
    const otfOrder1 = await prisma.oTF_Order.create({ 
        data: {
            OTF_ID: 'OTF-0001',
            project_id: project1.id,
            discipline_id: discipline1.id,
            date_created: new Date('2024-03-01T00:00:00.000Z'),
            created_by: user4.id,
            status: 'Pending Approval',
            current_approval_level: 1,
            total_value: 700,
            invoice_no: 'INV-A-101',
            invoice_date: new Date('2024-03-02T00:00:00.000Z')
        }
    });
    
    const otfOrder2 = await prisma.oTF_Order.create({ 
        data: {
            OTF_ID: 'OTF-0002',
            project_id: project1.id,
            discipline_id: discipline1.id,
            date_created: new Date('2024-03-05T00:00:00.000Z'),
            created_by: user4.id,
            status: 'Approved',
            current_approval_level: 2,
            total_value: 1400,
            invoice_no: 'INV-A-105',
            invoice_date: new Date('2024-03-06T00:00:00.000Z')
        }
    });
    console.log('Seeded OTF orders.');
    
    // Create OTF order lines
    const otfOrderLine1 = await prisma.oTF_OrderLine.create({ 
        data: {
            otf_order_id: otfOrder1.id,
            stf_order_line_id: stfOrderLine1.id,
            order_qty: 50,
            unit_price: 14
        }
    });
    
    const otfOrderLine2 = await prisma.oTF_OrderLine.create({ 
        data: {
            otf_order_id: otfOrder2.id,
            stf_order_line_id: stfOrderLine1.id,
            order_qty: 100,
            unit_price: 14
        }
    });
    console.log('Seeded OTF order lines.');
    
    // Create MRF headers
    const mrfHeader1 = await prisma.mRF_Header.create({ 
        data: {
            MRF_ID: 'MRF-0001',
            project_id: project1.id,
            discipline_id: discipline1.id,
            date_created: new Date('2024-03-10T00:00:00.000Z'),
            created_by: user4.id,
            status: 'Approved',
            current_approval_level: 1
        }
    });
    console.log('Seeded MRF headers.');
    
    // Create MRF lines
    const mrfLine1 = await prisma.mRF_Line.create({ 
        data: {
            mrf_header_id: mrfHeader1.id,
            otf_order_line_id: otfOrderLine2.id,
            received_qty: 80
        }
    });
    console.log('Seeded MRF lines.');
    
    // Create MDF issues
    const mdfIssue1 = await prisma.mDF_Issue.create({ 
        data: {
            issue_id: 'MDF-0001',
            date_created: new Date('2024-03-12T00:00:00.000Z'),
            project_id: project1.id,
            created_by: user3.id
        }
    });
    console.log('Seeded MDF issues.');
    
    // Create MDF issue lines
    const mdfIssueLine1 = await prisma.mDF_IssueLine.create({ 
        data: {
            mdf_issue_id: mdfIssue1.id,
            mrf_line_id: mrfLine1.id,
            delivered_qty: 50
        }
    });
    console.log('Seeded MDF issue lines.');
    
    // Create history logs
    await prisma.sTF_History_Log.create({ 
        data: { 
            stfHeaderId: stfOrder1.id,
            stfIdString: 'STF-0001',
            action: 'Created',
            actorId: user4.id,
            timestamp: new Date('2024-01-20T10:00:00Z'),
            fromStatus: null,
            toStatus: 'Pending Approval',
            details: 'STF created.'
        } 
    });
    
    await prisma.sTF_History_Log.create({ 
        data: { 
            stfHeaderId: stfOrder1.id,
            stfIdString: 'STF-0001',
            action: 'Approved',
            actorId: user2.id,
            timestamp: new Date('2024-01-21T11:00:00Z'),
            fromStatus: 'Pending Approval',
            toStatus: 'Approved',
            details: 'Final approval given.'
        } 
    });
    
    await prisma.oTF_History_Log.create({ 
        data: { 
            otfHeaderId: otfOrder1.id,
            otfIdString: 'OTF-0001',
            action: 'Created',
            actorId: user4.id,
            timestamp: new Date('2024-03-01T09:00:00Z'),
            fromStatus: null,
            toStatus: 'Pending Approval',
            details: 'OTF created from STF-0001.'
        } 
    });
    
    await prisma.oTF_History_Log.create({ 
        data: { 
            otfHeaderId: otfOrder2.id,
            otfIdString: 'OTF-0002',
            action: 'Created',
            actorId: user4.id,
            timestamp: new Date('2024-03-05T09:00:00Z'),
            fromStatus: null,
            toStatus: 'Pending Approval',
            details: 'OTF created from STF-0001.'
        } 
    });
    
    await prisma.oTF_History_Log.create({ 
        data: { 
            otfHeaderId: otfOrder2.id,
            otfIdString: 'OTF-0002',
            action: 'Approved',
            actorId: user2.id,
            timestamp: new Date('2024-03-06T10:00:00Z'),
            fromStatus: 'Pending Approval',
            toStatus: 'Approved',
            details: 'Final approval given.'
        } 
    });
    
    await prisma.mRF_History_Log.create({ 
        data: { 
            mrfHeaderId: mrfHeader1.id,
            mrfIdString: 'MRF-0001',
            action: 'Created',
            actorId: user4.id,
            timestamp: new Date('2024-03-10T14:00:00Z'),
            fromStatus: null,
            toStatus: 'Pending Approval',
            details: 'Receipt created for OTF-0002.'
        } 
    });
    
    await prisma.mRF_History_Log.create({ 
        data: { 
            mrfHeaderId: mrfHeader1.id,
            mrfIdString: 'MRF-0001',
            action: 'Approved',
            actorId: user2.id,
            timestamp: new Date('2024-03-11T15:00:00Z'),
            fromStatus: 'Pending Approval',
            toStatus: 'Approved',
            details: 'Goods receipt confirmed.'
        } 
    });
    console.log('Seeded history logs.');

    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });