-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "base_currency" TEXT NOT NULL,
    "max_mtf_approval_level" INTEGER NOT NULL,
    "max_stf_approval_level" INTEGER NOT NULL,
    "max_otf_approval_level" INTEGER NOT NULL,
    "max_mrf_approval_level" INTEGER NOT NULL,
    "max_mdf_approval_level" INTEGER NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discipline" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "discipline_code" TEXT NOT NULL,
    "discipline_name" TEXT NOT NULL,
    "budget_code" TEXT NOT NULL,
    "budget_name" TEXT NOT NULL,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER,
    "is_super_admin" BOOLEAN,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT NOT NULL,
    "position_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "UserProject" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "UserProject_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "UserDiscipline" (
    "user_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,

    CONSTRAINT "UserDiscipline_pkey" PRIMARY KEY ("user_id","discipline_id")
);

-- CreateTable
CREATE TABLE "ItemLibrary" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "material_code" TEXT NOT NULL,
    "material_name" TEXT NOT NULL,
    "material_description" TEXT,
    "unit" TEXT NOT NULL,
    "budget_unit_price" DOUBLE PRECISION,

    CONSTRAINT "ItemLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MTF_Header" (
    "id" SERIAL NOT NULL,
    "MTF_ID" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,

    CONSTRAINT "MTF_Header_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MTF_Line" (
    "id" SERIAL NOT NULL,
    "mtf_header_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "material_description" TEXT NOT NULL,
    "request_qty" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,
    "est_unit_price" DOUBLE PRECISION NOT NULL,
    "est_total_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MTF_Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "STF_Order" (
    "id" SERIAL NOT NULL,
    "STF_ID" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,
    "total_value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "STF_Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "STF_OrderLine" (
    "id" SERIAL NOT NULL,
    "stf_order_id" INTEGER NOT NULL,
    "mtf_line_id" INTEGER NOT NULL,
    "material_description" TEXT NOT NULL,
    "order_qty" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "STF_OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTF_Order" (
    "id" SERIAL NOT NULL,
    "OTF_ID" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,
    "total_value" DOUBLE PRECISION NOT NULL,
    "invoice_no" TEXT,
    "invoice_date" TIMESTAMP(3),

    CONSTRAINT "OTF_Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTF_OrderLine" (
    "id" SERIAL NOT NULL,
    "otf_order_id" INTEGER NOT NULL,
    "stf_order_line_id" INTEGER NOT NULL,
    "order_qty" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OTF_OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MRF_Header" (
    "id" SERIAL NOT NULL,
    "MRF_ID" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,

    CONSTRAINT "MRF_Header_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MRF_Line" (
    "id" SERIAL NOT NULL,
    "mrf_header_id" INTEGER NOT NULL,
    "otf_order_line_id" INTEGER NOT NULL,
    "received_qty" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MRF_Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MDF_Issue" (
    "id" SERIAL NOT NULL,
    "issue_id" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL,
    "project_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "MDF_Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MDF_IssueLine" (
    "id" SERIAL NOT NULL,
    "mdf_issue_id" INTEGER NOT NULL,
    "mrf_line_id" INTEGER NOT NULL,
    "delivered_qty" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MDF_IssueLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MTF_History_Log" (
    "id" SERIAL NOT NULL,
    "mtfHeaderId" INTEGER NOT NULL,
    "mtfIdString" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "MTF_History_Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "STF_History_Log" (
    "id" SERIAL NOT NULL,
    "stfHeaderId" INTEGER NOT NULL,
    "stfIdString" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "STF_History_Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTF_History_Log" (
    "id" SERIAL NOT NULL,
    "otfHeaderId" INTEGER NOT NULL,
    "otfIdString" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "OTF_History_Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MRF_History_Log" (
    "id" SERIAL NOT NULL,
    "mrfHeaderId" INTEGER NOT NULL,
    "mrfIdString" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "MRF_History_Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MTF_Header_MTF_ID_key" ON "MTF_Header"("MTF_ID");

-- CreateIndex
CREATE UNIQUE INDEX "STF_Order_STF_ID_key" ON "STF_Order"("STF_ID");

-- CreateIndex
CREATE UNIQUE INDEX "OTF_Order_OTF_ID_key" ON "OTF_Order"("OTF_ID");

-- CreateIndex
CREATE UNIQUE INDEX "MRF_Header_MRF_ID_key" ON "MRF_Header"("MRF_ID");

-- CreateIndex
CREATE UNIQUE INDEX "MDF_Issue_issue_id_key" ON "MDF_Issue"("issue_id");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discipline" ADD CONSTRAINT "Discipline_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDiscipline" ADD CONSTRAINT "UserDiscipline_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDiscipline" ADD CONSTRAINT "UserDiscipline_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemLibrary" ADD CONSTRAINT "ItemLibrary_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MTF_Header" ADD CONSTRAINT "MTF_Header_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MTF_Header" ADD CONSTRAINT "MTF_Header_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MTF_Header" ADD CONSTRAINT "MTF_Header_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MTF_Line" ADD CONSTRAINT "MTF_Line_mtf_header_id_fkey" FOREIGN KEY ("mtf_header_id") REFERENCES "MTF_Header"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MTF_Line" ADD CONSTRAINT "MTF_Line_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ItemLibrary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STF_Order" ADD CONSTRAINT "STF_Order_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STF_Order" ADD CONSTRAINT "STF_Order_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STF_Order" ADD CONSTRAINT "STF_Order_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STF_Order" ADD CONSTRAINT "STF_Order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STF_OrderLine" ADD CONSTRAINT "STF_OrderLine_stf_order_id_fkey" FOREIGN KEY ("stf_order_id") REFERENCES "STF_Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STF_OrderLine" ADD CONSTRAINT "STF_OrderLine_mtf_line_id_fkey" FOREIGN KEY ("mtf_line_id") REFERENCES "MTF_Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTF_Order" ADD CONSTRAINT "OTF_Order_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTF_Order" ADD CONSTRAINT "OTF_Order_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTF_Order" ADD CONSTRAINT "OTF_Order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTF_OrderLine" ADD CONSTRAINT "OTF_OrderLine_otf_order_id_fkey" FOREIGN KEY ("otf_order_id") REFERENCES "OTF_Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTF_OrderLine" ADD CONSTRAINT "OTF_OrderLine_stf_order_line_id_fkey" FOREIGN KEY ("stf_order_line_id") REFERENCES "STF_OrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MRF_Header" ADD CONSTRAINT "MRF_Header_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MRF_Header" ADD CONSTRAINT "MRF_Header_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MRF_Header" ADD CONSTRAINT "MRF_Header_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MRF_Line" ADD CONSTRAINT "MRF_Line_mrf_header_id_fkey" FOREIGN KEY ("mrf_header_id") REFERENCES "MRF_Header"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MRF_Line" ADD CONSTRAINT "MRF_Line_otf_order_line_id_fkey" FOREIGN KEY ("otf_order_line_id") REFERENCES "OTF_OrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MDF_Issue" ADD CONSTRAINT "MDF_Issue_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MDF_Issue" ADD CONSTRAINT "MDF_Issue_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MDF_IssueLine" ADD CONSTRAINT "MDF_IssueLine_mdf_issue_id_fkey" FOREIGN KEY ("mdf_issue_id") REFERENCES "MDF_Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MDF_IssueLine" ADD CONSTRAINT "MDF_IssueLine_mrf_line_id_fkey" FOREIGN KEY ("mrf_line_id") REFERENCES "MRF_Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MTF_History_Log" ADD CONSTRAINT "MTF_History_Log_mtfHeaderId_fkey" FOREIGN KEY ("mtfHeaderId") REFERENCES "MTF_Header"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STF_History_Log" ADD CONSTRAINT "STF_History_Log_stfHeaderId_fkey" FOREIGN KEY ("stfHeaderId") REFERENCES "STF_Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTF_History_Log" ADD CONSTRAINT "OTF_History_Log_otfHeaderId_fkey" FOREIGN KEY ("otfHeaderId") REFERENCES "OTF_Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MRF_History_Log" ADD CONSTRAINT "MRF_History_Log_mrfHeaderId_fkey" FOREIGN KEY ("mrfHeaderId") REFERENCES "MRF_Header"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
