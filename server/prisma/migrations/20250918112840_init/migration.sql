-- CreateTable
CREATE TABLE "Tenant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "level" INTEGER
);

-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    CONSTRAINT "Project_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Discipline" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenant_id" INTEGER NOT NULL,
    "discipline_code" TEXT NOT NULL,
    "discipline_name" TEXT NOT NULL,
    "budget_code" TEXT NOT NULL,
    "budget_name" TEXT NOT NULL,
    CONSTRAINT "Discipline_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Position" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Position_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenant_id" INTEGER,
    "is_super_admin" BOOLEAN,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT NOT NULL,
    "position_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRole" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    PRIMARY KEY ("user_id", "role_id"),
    CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserProject" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,

    PRIMARY KEY ("user_id", "project_id"),
    CONSTRAINT "UserProject_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserProject_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserDiscipline" (
    "user_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,

    PRIMARY KEY ("user_id", "discipline_id"),
    CONSTRAINT "UserDiscipline_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserDiscipline_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemLibrary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenant_id" INTEGER NOT NULL,
    "material_code" TEXT NOT NULL,
    "material_name" TEXT NOT NULL,
    "material_description" TEXT,
    "unit" TEXT NOT NULL,
    "budget_unit_price" REAL,
    CONSTRAINT "ItemLibrary_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    CONSTRAINT "Supplier_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MTF_Header" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "MTF_ID" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "date_created" DATETIME NOT NULL,
    "created_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,
    CONSTRAINT "MTF_Header_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MTF_Header_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MTF_Header_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MTF_Line" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mtf_header_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "material_description" TEXT NOT NULL,
    "request_qty" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,
    "est_unit_price" REAL NOT NULL,
    "est_total_price" REAL NOT NULL,
    CONSTRAINT "MTF_Line_mtf_header_id_fkey" FOREIGN KEY ("mtf_header_id") REFERENCES "MTF_Header" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MTF_Line_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ItemLibrary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "STF_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "STF_ID" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "date_created" DATETIME NOT NULL,
    "created_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,
    "total_value" REAL NOT NULL,
    CONSTRAINT "STF_Order_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "STF_Order_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "STF_Order_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "STF_Order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "STF_OrderLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stf_order_id" INTEGER NOT NULL,
    "mtf_line_id" INTEGER NOT NULL,
    "material_description" TEXT NOT NULL,
    "order_qty" REAL NOT NULL,
    "unit_price" REAL NOT NULL,
    CONSTRAINT "STF_OrderLine_stf_order_id_fkey" FOREIGN KEY ("stf_order_id") REFERENCES "STF_Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "STF_OrderLine_mtf_line_id_fkey" FOREIGN KEY ("mtf_line_id") REFERENCES "MTF_Line" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OTF_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "OTF_ID" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "date_created" DATETIME NOT NULL,
    "created_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,
    "total_value" REAL NOT NULL,
    "invoice_no" TEXT,
    "invoice_date" DATETIME,
    CONSTRAINT "OTF_Order_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OTF_Order_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OTF_Order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OTF_OrderLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "otf_order_id" INTEGER NOT NULL,
    "stf_order_line_id" INTEGER NOT NULL,
    "order_qty" REAL NOT NULL,
    "unit_price" REAL NOT NULL,
    CONSTRAINT "OTF_OrderLine_otf_order_id_fkey" FOREIGN KEY ("otf_order_id") REFERENCES "OTF_Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OTF_OrderLine_stf_order_line_id_fkey" FOREIGN KEY ("stf_order_line_id") REFERENCES "STF_OrderLine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MRF_Header" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "MRF_ID" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "date_created" DATETIME NOT NULL,
    "created_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_approval_level" INTEGER NOT NULL,
    CONSTRAINT "MRF_Header_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MRF_Header_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "Discipline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MRF_Header_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MRF_Line" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mrf_header_id" INTEGER NOT NULL,
    "otf_order_line_id" INTEGER NOT NULL,
    "received_qty" REAL NOT NULL,
    CONSTRAINT "MRF_Line_mrf_header_id_fkey" FOREIGN KEY ("mrf_header_id") REFERENCES "MRF_Header" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MRF_Line_otf_order_line_id_fkey" FOREIGN KEY ("otf_order_line_id") REFERENCES "OTF_OrderLine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MDF_Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "issue_id" TEXT NOT NULL,
    "date_created" DATETIME NOT NULL,
    "project_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    CONSTRAINT "MDF_Issue_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MDF_Issue_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MDF_IssueLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mdf_issue_id" INTEGER NOT NULL,
    "mrf_line_id" INTEGER NOT NULL,
    "delivered_qty" REAL NOT NULL,
    CONSTRAINT "MDF_IssueLine_mdf_issue_id_fkey" FOREIGN KEY ("mdf_issue_id") REFERENCES "MDF_Issue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MDF_IssueLine_mrf_line_id_fkey" FOREIGN KEY ("mrf_line_id") REFERENCES "MRF_Line" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MTF_History_Log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mtfHeaderId" INTEGER NOT NULL,
    "mtfIdString" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    CONSTRAINT "MTF_History_Log_mtfHeaderId_fkey" FOREIGN KEY ("mtfHeaderId") REFERENCES "MTF_Header" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "STF_History_Log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stfHeaderId" INTEGER NOT NULL,
    "stfIdString" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    CONSTRAINT "STF_History_Log_stfHeaderId_fkey" FOREIGN KEY ("stfHeaderId") REFERENCES "STF_Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OTF_History_Log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "otfHeaderId" INTEGER NOT NULL,
    "otfIdString" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    CONSTRAINT "OTF_History_Log_otfHeaderId_fkey" FOREIGN KEY ("otfHeaderId") REFERENCES "OTF_Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MRF_History_Log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mrfHeaderId" INTEGER NOT NULL,
    "mrfIdString" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    CONSTRAINT "MRF_History_Log_mrfHeaderId_fkey" FOREIGN KEY ("mrfHeaderId") REFERENCES "MRF_Header" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
