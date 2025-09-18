import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ItemLibrary, User } from '../types';
import { PencilIcon, PlusCircleIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ChevronDownIcon } from './icons/Icons';
import { ItemAddModal } from './modals/ItemAddModal';
import { ItemEditModal } from './modals/ItemEditModal';

// Add declaration for XLSX library loaded from CDN
declare var XLSX: any;

interface ItemManagementProps {
    currentUser: User;
    items: ItemLibrary[];
    onUpdateItem: (item: ItemLibrary) => void;
    onCreateItem: (item: Omit<ItemLibrary, 'id'>) => void;
}

export const ItemManagement: React.FC<ItemManagementProps> = ({ currentUser, items, onUpdateItem, onCreateItem }) => {
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
    
    const [editingItem, setEditingItem] = useState<ItemLibrary | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportDropdownRef = useRef<HTMLDivElement>(null);

    const initialFilters = {
        search: '',
        unit: '',
    };
    const [filters, setFilters] = useState(initialFilters);
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

    const tenantItems = useMemo(() => items.filter(i => i.tenant_id === currentUser.tenant_id), [items, currentUser.tenant_id]);
    const uniqueUnits = useMemo(() => [...new Set(tenantItems.map(item => item.unit))], [tenantItems]);

    const filteredItems = useMemo(() => {
        return tenantItems.filter(item => {
            const searchMatch = filters.search ?
                item.material_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                item.material_code.toLowerCase().includes(filters.search.toLowerCase()) :
                true;
            const unitMatch = filters.unit ? item.unit === filters.unit : true;
            return searchMatch && unitMatch;
        });
    }, [tenantItems, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = (updatedItem: ItemLibrary) => {
        onUpdateItem(updatedItem);
        setEditingItem(null);
    };

    const handleSaveNew = (newItem: Omit<ItemLibrary, 'id'>) => {
        onCreateItem(newItem);
        setAddModalOpen(false);
    };

    const handleExportCSV = () => {
        if (filteredItems.length === 0) {
            alert("No items to export.");
            return;
        }

        const headers: (keyof ItemLibrary)[] = ['id', 'tenant_id', 'material_code', 'material_name', 'unit', 'budget_unit_price'];
        const csvContent = [
            headers.join(','),
            ...filteredItems.map(item => headers.map(header => {
                const value = item[header];
                const stringValue = value === null || value === undefined ? '' : String(value);
                return `"${stringValue.replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "items.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportOpen(false);
    };
    
    const handleExportXLSX = () => {
        if (filteredItems.length === 0) {
            alert("No items to export.");
            return;
        }
        const headers: (keyof ItemLibrary)[] = ['id', 'tenant_id', 'material_code', 'material_name', 'unit', 'budget_unit_price'];
        const dataToExport = filteredItems.map(item => {
            let row: any = {};
            headers.forEach(header => {
                row[header] = item[header];
            });
            return row;
        });
        const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
        XLSX.writeFile(workbook, "items.xlsx");
        setIsExportOpen(false);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        alert("Import functionality is not yet implemented in this demo.");
        if (event.target) event.target.value = '';
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Item Management</h2>
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
                            <span className="ml-2">Add New Item</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="md:col-span-2">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Material Name / Code</label>
                        <input
                            type="text"
                            id="search"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search by name or code..."
                            className="w-full text-sm p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <select
                            id="unit"
                            name="unit"
                            value={filters.unit}
                            onChange={handleFilterChange}
                            className="w-full text-sm p-2 border rounded-md bg-white"
                        >
                            <option value="">All Units</option>
                            {uniqueUnits.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Material Code</th>
                                <th scope="col" className="px-6 py-3">Material Name</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3">Unit</th>
                                <th scope="col" className="px-6 py-3 text-right">Budget Unit Price</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-semibold text-gray-700">{item.material_code}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.material_name}</td>
                                    <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate" title={item.material_description}>{item.material_description}</td>
                                    <td className="px-6 py-4">{item.unit}</td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        {item.budget_unit_price?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => setEditingItem(item)} className="text-gray-500 hover:text-blue-600 p-1" title="Edit Item">
                                            <PencilIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No items found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {editingItem && (
                <ItemEditModal
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    onSave={handleSaveEdit}
                    itemToEdit={editingItem}
                />
            )}
            
            {isAddModalOpen && (
                <ItemAddModal
                    isOpen={isAddModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    onSave={handleSaveNew}
                    tenantId={currentUser.tenant_id!}
                />
            )}
        </>
    );
};