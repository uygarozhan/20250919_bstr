import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Discipline, User } from '../types';
import { PencilIcon, PlusCircleIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ChevronDownIcon } from './icons/Icons';
import { DisciplineAddModal } from './modals/DisciplineAddModal';
import { DisciplineEditModal } from './modals/DisciplineEditModal';

// Add declaration for XLSX library loaded from CDN
declare var XLSX: any;

interface DisciplineManagementProps {
    currentUser: User;
    disciplines: Discipline[];
    onUpdateDiscipline?: (updatedDiscipline: Discipline) => void;
    onCreateDiscipline?: (newDisciplineData: Omit<Discipline, 'id'>) => void;
}

export const DisciplineManagement: React.FC<DisciplineManagementProps> = ({ 
    currentUser, 
    disciplines, 
    onUpdateDiscipline,
    onCreateDiscipline
}) => {
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

    const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
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

    const tenantDisciplines = useMemo(() => {
        return disciplines.filter(d => d.tenant_id === currentUser.tenant_id);
    }, [disciplines, currentUser.tenant_id]);

    const filteredDisciplines = useMemo(() => {
        return tenantDisciplines.filter(discipline =>
            discipline.discipline_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            discipline.discipline_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            discipline.budget_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            discipline.budget_code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tenantDisciplines, searchTerm]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleCreateDiscipline = (newDisciplineData: Omit<Discipline, 'id'>) => {
        if (onCreateDiscipline) {
            onCreateDiscipline(newDisciplineData);
        }
        setAddModalOpen(false);
    };
    
    const handleUpdateDiscipline = (updatedDiscipline: Discipline) => {
        if (onUpdateDiscipline) {
            onUpdateDiscipline(updatedDiscipline);
        }
        setEditingDiscipline(null);
    };


    const handleExportCSV = () => {
        if (filteredDisciplines.length === 0) {
            alert("No disciplines to export.");
            return;
        }

        const headers: (keyof Discipline)[] = ['id', 'tenant_id', 'discipline_code', 'discipline_name', 'budget_code', 'budget_name'];
        const csvContent = [
            headers.join(','),
            ...filteredDisciplines.map(item => headers.map(header => {
                const value = item[header];
                const stringValue = value === null || value === undefined ? '' : String(value);
                return `"${stringValue.replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "disciplines.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportOpen(false);
    };
    
    const handleExportXLSX = () => {
        if (filteredDisciplines.length === 0) {
            alert("No disciplines to export.");
            return;
        }
        
        const headers: (keyof Discipline)[] = ['id', 'tenant_id', 'discipline_code', 'discipline_name', 'budget_code', 'budget_name'];
        
        const dataToExport = filteredDisciplines.map(item => {
            let row: any = {};
            headers.forEach(header => {
                row[header] = item[header];
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Disciplines");
        XLSX.writeFile(workbook, "disciplines.xlsx");
        setIsExportOpen(false);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
    
        if (file.name.endsWith('.csv')) {
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const rows = text.split('\n').filter(row => row.trim() !== '');
                    if (rows.length < 2) throw new Error("CSV file must have a header and at least one data row.");

                    const headerRow = rows[0].trim().split(',').map(h => h.replace(/"/g, '').trim());
                    const dataRows = rows.slice(1);

                    const expectedHeaders = ['id', 'tenant_id', 'discipline_code', 'discipline_name', 'budget_code', 'budget_name'];
                     if (headerRow.length !== expectedHeaders.length || !headerRow.every((h, i) => h === expectedHeaders[i])) {
                        throw new Error(`Invalid CSV header. Expected: ${expectedHeaders.join(',')}`);
                    }

                    const parsedDisciplines: Discipline[] = dataRows.map((row, rowIndex) => {
                        const values = row.trim().split(',').map(v => v.replace(/"/g, ''));
                        if (values.length !== headerRow.length) throw new Error(`Row ${rowIndex + 2} has incorrect number of columns.`);
                        
                        const discipline: Discipline = {
                            id: parseInt(values[0], 10),
                            tenant_id: parseInt(values[1], 10),
                            discipline_code: values[2],
                            discipline_name: values[3],
                            budget_code: values[4],
                            budget_name: values[5],
                        };

                        if (isNaN(discipline.id) || isNaN(discipline.tenant_id)) throw new Error(`Invalid number format in row ${rowIndex + 2}.`);
                        return discipline;
                    });
                    
                    // Process imported data through the API
                    parsedDisciplines.forEach(discipline => {
                        if (discipline.tenant_id === currentUser.tenant_id) {
                            if (discipline.id && onUpdateDiscipline) {
                                onUpdateDiscipline(discipline);
                            } else if (onCreateDiscipline) {
                                const newDisciplineData: Omit<Discipline, 'id'> = {
                                    tenant_id: discipline.tenant_id,
                                    discipline_code: discipline.discipline_code,
                                    discipline_name: discipline.discipline_name,
                                    budget_code: discipline.budget_code,
                                    budget_name: discipline.budget_name
                                };
                                onCreateDiscipline(newDisciplineData);
                            }
                        }
                    });
                    
                    alert(`${parsedDisciplines.filter(d => d.tenant_id === currentUser.tenant_id).length} disciplines have been successfully imported.`);
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
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                    
                    if (jsonData.length < 2) throw new Error("Excel file must have a header and at least one data row.");
                    
                    const headers = jsonData[0] as string[];
                    const expectedHeaders = ['id', 'tenant_id', 'discipline_code', 'discipline_name', 'budget_code', 'budget_name'];
                    if (headers.length !== expectedHeaders.length || !headers.every((h, i) => h === expectedHeaders[i])) {
                        throw new Error(`Invalid Excel header. Expected: ${expectedHeaders.join(',')}`);
                    }
                    
                    const parsedDisciplines: Discipline[] = jsonData.slice(1).map((row: any[], rowIndex) => {
                        const discipline: Discipline = {
                            id: parseInt(row[0], 10),
                            tenant_id: parseInt(row[1], 10),
                            discipline_code: row[2],
                            discipline_name: row[3],
                            budget_code: row[4],
                            budget_name: row[5],
                        };
                        
                        if (isNaN(discipline.id) || isNaN(discipline.tenant_id)) throw new Error(`Invalid number format in row ${rowIndex + 2}.`);
                        return discipline;
                    });
                    
                    // Process imported data through the API
                    parsedDisciplines.forEach(discipline => {
                        if (discipline.tenant_id === currentUser.tenant_id) {
                            if (discipline.id && onUpdateDiscipline) {
                                onUpdateDiscipline(discipline);
                            } else if (onCreateDiscipline) {
                                const newDisciplineData: Omit<Discipline, 'id'> = {
                                    tenant_id: discipline.tenant_id,
                                    discipline_code: discipline.discipline_code,
                                    discipline_name: discipline.discipline_name,
                                    budget_code: discipline.budget_code,
                                    budget_name: discipline.budget_name
                                };
                                onCreateDiscipline(newDisciplineData);
                            }
                        }
                    });
                    
                    alert(`${parsedDisciplines.filter(d => d.tenant_id === currentUser.tenant_id).length} disciplines have been successfully imported.`);
                } catch (error) {
                    alert(`Failed to import Excel: ${(error as Error).message}`);
                } finally {
                    if (event.target) event.target.value = '';
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };


    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Discipline Management</h2>
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
                        <button 
                            onClick={() => setAddModalOpen(true)}
                            className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-secondary transition duration-200">
                            <PlusCircleIcon />
                            <span className="ml-2">Add New Discipline</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" />
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Disciplines</label>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search by name or code..."
                        className="w-full md:w-1/3 text-sm p-2 border rounded-md"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Discipline</th>
                                <th scope="col" className="px-6 py-3">Budget</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDisciplines.map(discipline => (
                                <tr key={discipline.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div>{discipline.discipline_name}</div>
                                        <div className="text-xs font-mono text-gray-500">{discipline.discipline_code}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{discipline.budget_name}</div>
                                        <div className="text-xs font-mono text-gray-500">{discipline.budget_code}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => setEditingDiscipline(discipline)}
                                            className="text-gray-500 hover:text-blue-600 p-1" title="Edit Discipline">
                                            <PencilIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredDisciplines.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No disciplines found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
            {isAddModalOpen && (
                <DisciplineAddModal
                    isOpen={isAddModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    onSave={handleCreateDiscipline}
                    tenantId={currentUser.tenant_id!}
                />
            )}
            {editingDiscipline && (
                <DisciplineEditModal
                    isOpen={!!editingDiscipline}
                    onClose={() => setEditingDiscipline(null)}
                    onSave={handleUpdateDiscipline}
                    disciplineToEdit={editingDiscipline}
                />
            )}
        </>
    );
};
