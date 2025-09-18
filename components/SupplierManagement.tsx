

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Supplier, User } from '../types';
import { PencilIcon, PlusCircleIcon, TrashIcon, BuildingOfficeIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ChevronDownIcon } from './icons/Icons';
import { SupplierEditModal } from './modals/SupplierEditModal';
import { ConfirmationModal } from './modals/ConfirmationModal';

// Add declaration for XLSX library loaded from CDN
declare var XLSX: any;

interface SupplierManagementProps {
    currentUser: User;
    suppliers: Supplier[];
    //-fix: Changed onDataRefresh to specific handlers to match App.tsx's implementation.
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    onUpdateSupplier: (supplier: Supplier) => void;
    onCreateSupplier: (supplier: Omit<Supplier, 'id'>) => void;
}

const getStatusBadge = (isActive: boolean) => {
    return isActive
        ? 'px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700'
        : 'px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700';
};

export const SupplierManagement: React.FC<SupplierManagementProps> = ({ currentUser, suppliers, setSuppliers, onUpdateSupplier, onCreateSupplier }) => {
    if (currentUser.is_super_admin) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-700">Access Denied</h1>
                    <p className="text-gray-500 mt-2">This page is for tenant-level administrators.</p>
                </div>
            </div>
        );
    }
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportDropdownRef = useRef<HTMLDivElement>(null);

    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isExportOpen, setIsExportOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const tenantSuppliers = useMemo(() => suppliers.filter(s => s.tenant_id === currentUser.tenant_id), [suppliers, currentUser.tenant_id]);
    
    const filteredSuppliers = useMemo(() => {
        return tenantSuppliers.filter(supplier =>
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tenantSuppliers, searchTerm]);

    const handleSaveSupplier = (supplierData: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in supplierData) { // Editing
            onUpdateSupplier(supplierData);
        } else { // Adding
            onCreateSupplier(supplierData);
        }
        setEditingSupplier(null);
        setAddModalOpen(false);
    };

    const handleDeleteSupplier = () => {
        if (!deletingSupplier) return;
        console.warn(`Deletion not implemented. Would delete supplier: ${deletingSupplier.name}`);
        setDeletingSupplier(null);
        alert('Deletion is disabled in this demo.');
    };

    const handleExportCSV = () => {
        if (filteredSuppliers.length === 0) {
            alert("No suppliers to export.");
            return;
        }

        const headers: (keyof Supplier)[] = ['id', 'tenant_id', 'name', 'contact_person', 'email', 'phone', 'address', 'active'];
        const csvContent = [
            headers.join(','),
            ...filteredSuppliers.map(item => headers.map(header => {
                const value = item[header];
                const stringValue = value === null || value === undefined ? '' : String(value);
                return `"${stringValue.replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "suppliers.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportOpen(false);
    };
    
    const handleExportXLSX = () => {
        if (filteredSuppliers.length === 0) {
            alert("No suppliers to export.");
            return;
        }
        
        const headers: (keyof Supplier)[] = ['id', 'tenant_id', 'name', 'contact_person', 'email', 'phone', 'address', 'active'];
        
        const dataToExport = filteredSuppliers.map(item => {
            let row: any = {};
            headers.forEach(header => {
                row[header] = item[header];
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");
        XLSX.writeFile(workbook, "suppliers.xlsx");
        setIsExportOpen(false);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const processAndSetSuppliers = (importedData: Supplier[]) => {
            const newSuppliersForCurrentTenant = importedData.filter(d => d.tenant_id === currentUser.tenant_id);
            
            if (importedData.length > 0 && newSuppliersForCurrentTenant.length === 0) {
                alert("The imported file contains data, but none of it matches your tenant ID. No changes were made.");
                return;
            }
            
            setSuppliers(prevGlobalSuppliers => {
                const otherTenantsSuppliers = prevGlobalSuppliers.filter(d => d.tenant_id !== currentUser.tenant_id);
                return [...otherTenantsSuppliers, ...newSuppliersForCurrentTenant];
            });

            alert(`${newSuppliersForCurrentTenant.length} suppliers have been successfully imported and saved.`);
        };
    
        const reader = new FileReader();
    
        if (file.name.endsWith('.csv')) {
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const rows = text.split('\n').filter(row => row.trim() !== '');
                    if (rows.length < 2) throw new Error("CSV file must have a header and at least one data row.");

                    const headerRow = rows[0].trim().split(',').map(h => h.replace(/"/g, '').trim());
                    const dataRows = rows.slice(1);

                    const expectedHeaders: (keyof Supplier)[] = ['id', 'tenant_id', 'name', 'contact_person', 'email', 'phone', 'address', 'active'];
                     if (headerRow.length !== expectedHeaders.length || !headerRow.every((h, i) => h === expectedHeaders[i])) {
                        throw new Error(`Invalid CSV header. Expected: ${expectedHeaders.join(',')}`);
                    }

                    const parsedSuppliers: Supplier[] = dataRows.map((row, rowIndex) => {
                        const values = row.trim().split(',').map(v => v.replace(/"/g, ''));
                        if (values.length !== headerRow.length) throw new Error(`Row ${rowIndex + 2} has incorrect number of columns.`);
                        
                        const supplier: Supplier = {
                            id: parseInt(values[0], 10),
                            tenant_id: parseInt(values[1], 10),
                            name: values[2],
                            contact_person: values[3],
                            email: values[4],
                            phone: values[5],
                            address: values[6],
                            active: values[7].toLowerCase() === 'true',
                        };

                        if (isNaN(supplier.id) || isNaN(supplier.tenant_id)) throw new Error(`Invalid number format in row ${rowIndex + 2}.`);
                        return supplier;
                    });
                    processAndSetSuppliers(parsedSuppliers.filter(d => !!d));
                } catch (error) {
                    alert(`Failed to import CSV: ${(error as Error).message}`);
                } finally {
                    if (event.target) event.target.value = '';
                }
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx')) {
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target!.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json: any[] = XLSX.utils.sheet_to_json(worksheet);
                    
                    const expectedHeaders: (keyof Supplier)[] = ['id', 'tenant_id', 'name', 'contact_person', 'email', 'phone', 'address', 'active'];
                     if (json.length > 0) {
                        const actualHeaders = Object.keys(json[0]);
                        if (!expectedHeaders.every(h => actualHeaders.includes(h))) {
                            throw new Error(`Invalid XLSX file. Missing required columns. Expected: ${expectedHeaders.join(', ')}`);
                        }
                    } else {
                        throw new Error(`XLSX file is empty or has no data rows.`);
                    }

                    const parsedSuppliers: Supplier[] = json.map((row, rowIndex) => {
                        const supplier: Supplier = {
                            id: Number(row.id),
                            tenant_id: Number(row.tenant_id),
                            name: String(row.name),
                            contact_person: String(row.contact_person),
                            email: String(row.email),
                            phone: String(row.phone),
                            address: String(row.address),
                            active: String(row.active).toLowerCase() === 'true',
                        };

                        if (isNaN(supplier.id) || isNaN(supplier.tenant_id)) throw new Error(`Invalid number format in XLSX row ${rowIndex + 2}.`);
                        return supplier;
                    });
                    processAndSetSuppliers(parsedSuppliers.filter(d => !!d));
                } catch (error) {
                    alert(`Failed to import XLSX: ${(error as Error).message}`);
                } finally {
                     if (event.target) event.target.value = '';
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
             alert("Unsupported file type. Please upload a .csv or .xlsx file.");
             if (event.target) event.target.value = '';
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Supplier Management</h2>
                     <div className="flex items-center space-x-2">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200">
                            <ArrowUpTrayIcon />
                            <span className="ml-2">Import</span>
                        </button>
                        
                        <div className="relative" ref={exportDropdownRef}>
                            <button onClick={() => setIsExportOpen(prev => !prev)} className="flex items-center bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200">
                                <ArrowDownTrayIcon />
                                <span className="ml-2">Export</span>
                                <ChevronDownIcon/>
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

                        <button onClick={() => setAddModalOpen(true)} className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-secondary transition duration-200">
                            <PlusCircleIcon />
                            <span className="ml-2">Add New Supplier</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" />
                    </div>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Suppliers</label>
                    <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by name, contact, or email..."
                        className="w-full md:w-1/2 text-sm p-2 border rounded-md"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Supplier Name</th>
                                <th scope="col" className="px-6 py-3">Contact Person</th>
                                <th scope="col" className="px-6 py-3">Contact Info</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map(supplier => (
                                <tr key={supplier.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{supplier.name}</td>
                                    <td className="px-6 py-4">{supplier.contact_person}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{supplier.email}</div>
                                        <div className="text-xs text-gray-500">{supplier.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={getStatusBadge(supplier.active)}>
                                            {supplier.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex items-center space-x-2">
                                        <button onClick={() => setEditingSupplier(supplier)} className="text-gray-500 hover:text-blue-600 p-1" title="Edit Supplier"><PencilIcon /></button>
                                        <button onClick={() => setDeletingSupplier(supplier)} className="text-gray-500 hover:text-red-600 p-1" title="Delete Supplier"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredSuppliers.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <div className="flex justify-center items-center mb-2 text-gray-400">
                                <BuildingOfficeIcon />
                            </div>
                            <p>No suppliers found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {(isAddModalOpen || editingSupplier) && (
                <SupplierEditModal
                    isOpen={isAddModalOpen || !!editingSupplier}
                    onClose={() => { setAddModalOpen(false); setEditingSupplier(null); }}
                    onSave={handleSaveSupplier}
                    supplierToEdit={editingSupplier}
                    tenantId={currentUser.tenant_id!}
                />
            )}

            {deletingSupplier && (
                <ConfirmationModal
                    isOpen={!!deletingSupplier}
                    onClose={() => setDeletingSupplier(null)}
                    onConfirm={handleDeleteSupplier}
                    title="Delete Supplier"
                >
                   <p>Are you sure you want to delete the supplier "{deletingSupplier.name}"?</p>
                   <p className="mt-2 text-xs text-yellow-600">Note: Deleting a supplier associated with existing orders may cause issues. This action is irreversible in this demo.</p>
                </ConfirmationModal>
            )}
        </>
    );
};
