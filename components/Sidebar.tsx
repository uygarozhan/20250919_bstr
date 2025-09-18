
import React from 'react';
//-fix: Import Page type to use in component props.
import type { User, Page } from '../types';
import { RoleName } from '../types';
import { BriefcaseIcon, BuildingOfficeIcon, ChartPieIcon, CogIcon, DocumentTextIcon, HomeIcon, InboxStackIcon, PaperAirplaneIcon, ShoppingCartIcon, TagIcon, TruckIcon, UsersIcon, ClockIcon, BookmarkSquareIcon } from './icons/Icons';

interface SidebarProps {
  //-fix: Use the specific Page type instead of string for better type safety.
  activePage: Page;
  //-fix: Use the specific Page type to match the state setter from App.tsx.
  setActivePage: (page: Page) => void;
  currentUser: User;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
      isActive
        ? 'bg-secondary text-white shadow-md'
        : 'text-gray-600 hover:bg-blue-100 hover:text-primary'
    }`}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </li>
);

//-fix: Define a type for navigation links to ensure the `page` property is of type `Page`.
interface NavLink {
    label: string;
    icon: React.ReactNode;
    page: Page;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, currentUser }) => {
    const isTenantAdmin = currentUser.roles.some(role => role.name === RoleName.Administrator);
    const isSuperAdmin = currentUser.is_super_admin;
    const canViewHistory = currentUser.roles.some(role => 
        role.name === RoleName.Administrator || 
        role.name.includes('_Approver')
    );

    const baseNavLinks: NavLink[] = [
        { label: 'Dashboard', icon: <HomeIcon />, page: 'Dashboard' },
    ];
    
    const historyLinks: NavLink[] = [
        { label: 'MTF History', icon: <ClockIcon />, page: 'MTF History' },
        { label: 'STF History', icon: <ClockIcon />, page: 'STF History' },
        { label: 'OTF History', icon: <ClockIcon />, page: 'OTF History' },
        { label: 'MRF History', icon: <ClockIcon />, page: 'MRF History' },
    ];

    const workflowLinks: NavLink[] = [
        { label: 'MTF', icon: <DocumentTextIcon />, page: 'MTF' },
        { label: 'STF', icon: <ShoppingCartIcon />, page: 'STF' },
        { label: 'OTF', icon: <PaperAirplaneIcon />, page: 'OTF' },
        { label: 'MRF', icon: <InboxStackIcon />, page: 'MRF' },
        { label: 'MDF', icon: <TruckIcon />, page: 'MDF' },
    ];
    
    // Combine links based on user role
    const navLinks: NavLink[] = [
      ...baseNavLinks,
      ...(canViewHistory ? historyLinks : []),
      ...workflowLinks
    ];
    
    const tenantAdminLinks: NavLink[] = [
        { label: 'User Management', icon: <UsersIcon />, page: 'User Management' },
        { label: 'Position Mgt.', icon: <BookmarkSquareIcon />, page: 'Position Management' },
        { label: 'Project Management', icon: <BriefcaseIcon />, page: 'Project Management' },
        { label: 'Discipline Mgt.', icon: <TagIcon />, page: 'Discipline Management' },
        { label: 'Supplier Management', icon: <BuildingOfficeIcon />, page: 'Supplier Management' },
        { label: 'Item Management', icon: <CogIcon />, page: 'Item Management' },
    ];
    
    const superAdminLinks: NavLink[] = [
        { label: 'Tenant Management', icon: <BuildingOfficeIcon />, page: 'Tenant Management' },
    ];

  return (
    <aside className="w-64 bg-white flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
            <ChartPieIcon />
            <h1 className="text-xl font-bold text-primary ml-2">BasitOrSys</h1>
        </div>
      <nav className="flex-1 p-4">
        {isSuperAdmin ? (
            <>
                 <h2 className="px-3 text-xs font-semibold text-red-500 uppercase tracking-wider">Super Admin</h2>
                 <ul>
                    {superAdminLinks.map(link => (
                        <NavItem 
                            key={link.page}
                            icon={link.icon}
                            label={link.label}
                            isActive={activePage === link.page}
                            onClick={() => setActivePage(link.page)}
                        />
                    ))}
                </ul>
            </>
        ) : (
            <>
                <ul>
                {navLinks.map(link => (
                    <NavItem 
                        key={link.page}
                        icon={link.icon}
                        label={link.label}
                        isActive={activePage === link.page}
                        onClick={() => setActivePage(link.page)}
                    />
                ))}
                </ul>
                {isTenantAdmin && (
                    <>
                        <hr className="my-4 border-t border-gray-200" />
                        <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h2>
                        <ul>
                            {tenantAdminLinks.map(link => (
                                <NavItem 
                                    key={link.page}
                                    icon={link.icon}
                                    label={link.label}
                                    isActive={activePage === link.page}
                                    onClick={() => setActivePage(link.page)}
                                />
                            ))}
                        </ul>
                    </>
                )}
            </>
        )}
      </nav>
      <div className="p-4 border-t border-gray-200">
         <p className="text-sm text-center text-gray-500">&copy; 2025 BasitOrSys</p>
      </div>
    </aside>
  );
};
