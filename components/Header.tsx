import React from 'react';
import type { User, Tenant, Page } from '../types';
import { BellIcon, LogoutIcon } from './icons/Icons';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    tenants: Tenant[];
    activePage: Page;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, tenants, activePage }) => {
    
    const displayTenant = tenants.find(t => t.id === currentUser.tenant_id);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-700">{activePage}</h1>
            </div>
            <div className="flex items-center space-x-6">
                 <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{displayTenant?.name ?? 'Super Admin Panel'}</p>
                    <p className="text-xs text-gray-500">Tenant</p>
                </div>
                <div className="relative">
                    <button className="p-2 rounded-full hover:bg-gray-100">
                        <BellIcon />
                        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    <img 
                        src={`https://i.pravatar.cc/40?u=${currentUser.email}`}
                        alt="User Avatar"
                        className="h-10 w-10 rounded-full"
                    />
                    <div className="text-sm">
                        <p className="font-semibold text-gray-800">{currentUser.firstName} {currentUser.lastName}</p>
                        <p className="text-gray-500">{currentUser.position.name}</p>
                    </div>
                </div>
                
                <button 
                    onClick={onLogout}
                    className="flex items-center text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600 rounded-lg p-2 transition-colors duration-200"
                    title="Logout"
                >
                    <LogoutIcon />
                    <span className="ml-2 font-medium">Logout</span>
                </button>
            </div>
        </header>
    );
};