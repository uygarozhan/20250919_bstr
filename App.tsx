
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RoleName, WorkflowStatus } from './types';
import type { User, Page, MTF_Header, MTF_Line, Discipline, STF_Order, Project, Position, OTF_Order, MRF_Header, Supplier, AppData, Role, Attachment, DashboardItem, STF_OrderLine, STF_History_Log, ItemLibrary, Tenant, OTF_OrderLine, OTF_History_Log, MTF_History_Log } from './types';
import { Header } from './components/Header';
import { UserManagement } from './components/UserManagement';
import { ItemManagement } from './components/ItemManagement';
import { ProjectManagement } from './components/ProjectManagement';
import { TenantManagement } from './components/TenantManagement';
import { DisciplineManagement } from './components/DisciplineManagement';
import { MtfHistory } from './components/MtfHistory';
import { StfHistory } from './components/StfHistory';
import { OtfHistory } from './components/OtfHistory';
import { PositionManagement } from './components/PositionManagement';
import { MrfHistory } from './components/MrfHistory';
import { MtfManagement } from './components/MtfManagement';
import { StfManagement } from './components/StfManagement';
import { OtfManagement } from './components/OtfManagement';
import { SupplierManagement } from './components/SupplierManagement';
import { Login } from './components/Login';

const API_BASE_URL = 'https://two0250919-bstr-backend.onrender.com/api/v1';

const App: React.FC = () => {
  // Global App State - starts null, loaded from API
  const [appData, setAppData] = useState<AppData | null>(null);
  
  // UI State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when user logs in
  useEffect(() => {
    const fetchAppData = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = currentUser.is_super_admin 
                ? `${API_BASE_URL}/all-data` 
                : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
            
            console.log('Fetching data from:', endpoint);
            
            const response = await fetch(endpoint);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            const data: AppData = await response.json();
            console.log('Received raw data:', data);
            
            // Ensure all required arrays exist and are arrays
            const processedData: AppData = {
                users: Array.isArray(data.users) ? data.users : [],
                tenants: Array.isArray(data.tenants) ? data.tenants : [],
                projects: Array.isArray(data.projects) ? data.projects : [],
                disciplines: Array.isArray(data.disciplines) ? data.disciplines : [],
                positions: Array.isArray(data.positions) ? data.positions : [],
                suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
                items: Array.isArray(data.items) ? data.items : [],
                roles: Array.isArray(data.roles) ? data.roles : [],
                mtfHeaders: Array.isArray(data.mtfHeaders) ? data.mtfHeaders : [],
                mtfLines: Array.isArray(data.mtfLines) ? data.mtfLines : [],
                mtfHistory: Array.isArray(data.mtfHistory) ? data.mtfHistory : [],
                stfOrders: Array.isArray(data.stfOrders) ? data.stfOrders : [],
                stfOrderLines: Array.isArray(data.stfOrderLines) ? data.stfOrderLines : [],
                stfHistory: Array.isArray(data.stfHistory) ? data.stfHistory : [],
                otfOrders: Array.isArray(data.otfOrders) ? data.otfOrders : [],
                otfOrderLines: Array.isArray(data.otfOrderLines) ? data.otfOrderLines : [],
                otfHistory: Array.isArray(data.otfHistory) ? data.otfHistory : [],
                mrfHeaders: Array.isArray(data.mrfHeaders) ? data.mrfHeaders : [],
                mrfLines: Array.isArray(data.mrfLines) ? data.mrfLines : [],
                mrfHistory: Array.isArray(data.mrfHistory) ? data.mrfHistory : [],
                mdfIssues: Array.isArray(data.mdfIssues) ? data.mdfIssues : [],
                mdfIssueLines: Array.isArray(data.mdfIssueLines) ? data.mdfIssueLines : [],
            };
            
            // The backend returns related objects, but the frontend sometimes expects just IDs.
            // We can add them here for compatibility.
            if (processedData.users) {
                processedData.users.forEach(u => {
                    // Only add project_ids and discipline_ids if they don't already exist
                    if (!u.project_ids && u.projects) {
                        u.project_ids = u.projects.map(p => p.id);
                    }
                    if (!u.discipline_ids && u.disciplines) {
                        u.discipline_ids = u.disciplines.map(d => d.id);
                    }
                });
            }
            
            console.log('Processed data:', processedData);

            setAppData(processedData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError((err as Error).message);
            setAppData(null);
        } finally {
            setIsLoading(false);
        }
    };

    fetchAppData();
  }, [currentUser]);

  // Switch active page based on user role
  useEffect(() => {
    console.log('User or activePage changed:', { currentUser, activePage }); // Add logging
    if (currentUser) {
        if (currentUser.is_super_admin) {
            console.log('Setting active page to Tenant Management for super admin'); // Add logging
            setActivePage('Tenant Management');
        } else {
            if (activePage === 'Tenant Management') {
                console.log('Setting active page to Dashboard for tenant user'); // Add logging
                setActivePage('Dashboard');
            }
        }
    }
  }, [currentUser, activePage]);

  const handleLogin = async (email: string, password: string): Promise<void> => {
      console.log('Attempting login with:', { email, password });
      setError(null);
      setIsLoading(true);
      try {
          const response = await fetch(`${API_BASE_URL}/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
          });
          
          console.log('Login response status:', response.status);
          
          if (!response.ok) {
              const errorData = await response.json();
              console.log('Login error data:', errorData);
              throw new Error(errorData.message || 'Invalid email or password.');
          }
          const user: User = await response.json();
          console.log('Login successful, user data:', user);
          setCurrentUser(user);
          setActivePage(user.is_super_admin ? 'Tenant Management' : 'Dashboard');
      } catch (err) {
          console.error('Login error:', err);
          setError((err as Error).message);
          throw err; // Re-throw to inform Login component
      } finally {
          setIsLoading(false);
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setAppData(null);
      setActivePage('Dashboard');
  };

  const handleResetData = async () => {
    if (window.confirm("Are you sure you want to reset the data? This will restore the initial mock data state in the database.")) {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/reset-db`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to reset database.');
            alert("Demo data has been reset. Reloading data...");
            // Trigger a re-fetch by temporarily clearing the user
            const tempUser = currentUser;
            setCurrentUser(null); 
            setCurrentUser(tempUser);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }
  };

    // NOTE: The create/update/revise functions below still mutate local state.
    // In a full implementation, each of these would be converted into an API call
    // to the backend, which would then update the database. The frontend would
    // then re-fetch the updated data or optimistically update its state.
    const handleCreateMtf = async (header: MTF_Header, lines: Omit<MTF_Line, 'id'>[]) => {
        if (!currentUser || !appData) return;
        
        try {
            // Make API call to create MTF
            const response = await fetch(`${API_BASE_URL}/mtf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ header, lines }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create MTF');
            }
            
            // Refresh data from backend
            const endpoint = currentUser.is_super_admin 
                ? `${API_BASE_URL}/all-data` 
                : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
            
            const dataResponse = await fetch(endpoint);
            if (!dataResponse.ok) {
                throw new Error('Failed to fetch updated data');
            }
            
            const updatedData: AppData = await dataResponse.json();
            // The backend returns related objects, but the frontend sometimes expects just IDs.
            // We can add them here for compatibility.
            updatedData.users.forEach(u => {
                u.project_ids = u.projects.map(p => p.id);
                u.discipline_ids = u.disciplines.map(d => d.id);
            });
            
            setAppData(updatedData);
        } catch (error) {
            console.error("Error creating MTF:", error);
            // Handle error appropriately
        }
    };
    const handleReviseMtf = async (mtfHeaderId: number, mtfData: { lines: { itemId: number; quantity: number, description: string }[], attachment: Attachment | null }) => {
        if (!currentUser || !appData) return;
        
        try {
            // Make API call to revise MTF
            const response = await fetch(`${API_BASE_URL}/mtf/${mtfHeaderId}/revise`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mtfData),
            });
            
            if (!response.ok) {
                throw new Error('Failed to revise MTF');
            }
            
            // Refresh data from backend
            const endpoint = currentUser.is_super_admin 
                ? `${API_BASE_URL}/all-data` 
                : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
            
            const dataResponse = await fetch(endpoint);
            if (!dataResponse.ok) {
                throw new Error('Failed to fetch updated data');
            }
            
            const updatedData: AppData = await dataResponse.json();
            // The backend returns related objects, but the frontend sometimes expects just IDs.
            // We can add them here for compatibility.
            updatedData.users.forEach(u => {
                u.project_ids = u.projects.map(p => p.id);
                u.discipline_ids = u.disciplines.map(d => d.id);
            });
            
            setAppData(updatedData);
        } catch (error) {
            console.error("Error revising MTF:", error);
            // Handle error appropriately
        }
    };


    const handleCreateStf = async (firstItem: DashboardItem, stfData: { lines: { mtfLineId: number; orderQty: number; unitPrice: number; material_description: string }[]; attachment: Attachment | null; totalValue: number; supplierId: number; }) => {
        if (!currentUser || !appData) return;
        
        try {
            // Make API call to create STF
            const response = await fetch(`${API_BASE_URL}/stf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstItem, stfData }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create STF');
            }
            
            // Refresh data from backend
            const endpoint = currentUser.is_super_admin 
                ? `${API_BASE_URL}/all-data` 
                : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
            
            const dataResponse = await fetch(endpoint);
            if (!dataResponse.ok) {
                throw new Error('Failed to fetch updated data');
            }
            
            const updatedData: AppData = await dataResponse.json();
            // The backend returns related objects, but the frontend sometimes expects just IDs.
            // We can add them here for compatibility.
            updatedData.users.forEach(u => {
                u.project_ids = u.projects.map(p => p.id);
                u.discipline_ids = u.disciplines.map(d => d.id);
            });
            
            setAppData(updatedData);
        } catch (error) {
            console.error("Error creating STF:", error);
            // Handle error appropriately
        }
    };
  
    const renderApp = () => {
        console.log('Rendering app with state:', { currentUser, isLoading, error, appData });
        
        if (!currentUser) {
            console.log('No current user, showing login');
            return <Login onLogin={handleLogin} />;
        }
    
        if (isLoading) {
            console.log('Loading data, showing spinner');
            return (
                <div className="flex items-center justify-center h-screen bg-gray-100">
                    <div className="text-center">
                        <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-lg font-semibold text-gray-700">Loading Application Data...</p>
                    </div>
                </div>
            );
        }
    
        if (error) {
            console.log('Error occurred, showing error message');
            return (
                <div className="flex items-center justify-center h-screen bg-gray-100">
                    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                        <h1 className="text-2xl font-bold text-red-600">Failed to Load Data</h1>
                        <p className="text-gray-600 mt-2">{error}</p>
                        <p className="text-gray-500 mt-2 text-sm">Please ensure the backend server is running and try again.</p>
                        <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary">Go to Login</button>
                    </div>
                </div>
            );
        }
    
        if (!appData) {
            console.log('No appData, showing login as fallback');
            return <Login onLogin={handleLogin} />; // Should not be reached if currentUser is set, but as a fallback
        }

        console.log('Rendering main application with appData:', appData);
        const allUsers = appData.users || [];
        // State setters for child components
        const setMtfHeaders = (updater: React.SetStateAction<MTF_Header[]>) => setAppData(prev => prev ? ({ ...prev, mtfHeaders: typeof updater === 'function' ? updater(prev.mtfHeaders) : updater }) : null);
        const setMtfLines = (updater: React.SetStateAction<MTF_Line[]>) => setAppData(prev => prev ? ({ ...prev, mtfLines: typeof updater === 'function' ? updater(prev.mtfLines) : updater }) : null);
        const setStfOrders = (updater: React.SetStateAction<STF_Order[]>) => setAppData(prev => prev ? ({ ...prev, stfOrders: typeof updater === 'function' ? updater(prev.stfOrders) : updater }) : null);
        const setOtfOrders = (updater: React.SetStateAction<OTF_Order[]>) => setAppData(prev => prev ? ({ ...prev, otfOrders: typeof updater === 'function' ? updater(prev.otfOrders) : updater }) : null);
        const setMrfHeaders = (updater: React.SetStateAction<MRF_Header[]>) => setAppData(prev => prev ? ({ ...prev, mrfHeaders: typeof updater === 'function' ? updater(prev.mrfHeaders) : updater }) : null);
        const setPositions = (updater: React.SetStateAction<Position[]>) => setAppData(prev => prev ? ({ ...prev, positions: typeof updater === 'function' ? updater(prev.positions) : updater }) : null);
        const setSuppliers = (updater: React.SetStateAction<Supplier[]>) => setAppData(prev => prev ? ({ ...prev, suppliers: typeof updater === 'function' ? updater(prev.suppliers) : updater }) : null);
        const setDisciplines = (updater: React.SetStateAction<Discipline[]>) => setAppData(prev => prev ? ({ ...prev, disciplines: typeof updater === 'function' ? updater(prev.disciplines) : updater }) : null);
        
        // --- Handlers still mutating local state (to be converted to API calls) ---
        const handleUpdateUser = async (updatedUser: User) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to update user
                const response = await fetch(`${API_BASE_URL}/user/${updatedUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedUser),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update user');
                }
                
                // Update user roles
                const rolesResponse = await fetch(`${API_BASE_URL}/user/${updatedUser.id}/roles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roleIds: updatedUser.roles?.map(r => r.id) || [] }),
                });
                
                if (!rolesResponse.ok) {
                    throw new Error('Failed to update user roles');
                }
                
                // Update user projects
                const projectsResponse = await fetch(`${API_BASE_URL}/user/${updatedUser.id}/projects`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectIds: updatedUser.project_ids || [] }),
                });
                
                if (!projectsResponse.ok) {
                    throw new Error('Failed to update user projects');
                }
                
                // Update user disciplines
                const disciplinesResponse = await fetch(`${API_BASE_URL}/user/${updatedUser.id}/disciplines`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ disciplineIds: updatedUser.discipline_ids || [] }),
                });
                
                if (!disciplinesResponse.ok) {
                    throw new Error('Failed to update user disciplines');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error updating user:", error);
                // Handle error appropriately
            }
        };
        
        const handleCreateUser = async (newUser: Omit<User, 'id'>) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to create user
                const response = await fetch(`${API_BASE_URL}/user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create user');
                }
                
                // Get the created user from the response
                const createdUser = await response.json();
                
                // Update user roles
                const rolesResponse = await fetch(`${API_BASE_URL}/user/${createdUser.id}/roles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roleIds: newUser.roles?.map(r => r.id) || [] }),
                });
                
                if (!rolesResponse.ok) {
                    throw new Error('Failed to update user roles');
                }
                
                // Update user projects
                const projectsResponse = await fetch(`${API_BASE_URL}/user/${createdUser.id}/projects`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectIds: newUser.project_ids || [] }),
                });
                
                if (!projectsResponse.ok) {
                    throw new Error('Failed to update user projects');
                }
                
                // Update user disciplines
                const disciplinesResponse = await fetch(`${API_BASE_URL}/user/${createdUser.id}/disciplines`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ disciplineIds: newUser.discipline_ids || [] }),
                });
                
                if (!disciplinesResponse.ok) {
                    throw new Error('Failed to update user disciplines');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error creating user:", error);
                // Handle error appropriately
            }
        };
        
        const onCreateProject = async (newProjectData: Omit<Project, 'id'>) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to create project
                const response = await fetch(`${API_BASE_URL}/project`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProjectData),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create project');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error creating project:", error);
                // Handle error appropriately
            }
        };
        
        const handleUpdateProject = async (updatedProject: Project) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to update project
                const response = await fetch(`${API_BASE_URL}/project/${updatedProject.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedProject),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update project');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error updating project:", error);
                // Handle error appropriately
            }
        };
        
        const onCreateSupplier = async (newSupplierData: Omit<Supplier, 'id'>) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to create supplier
                const response = await fetch(`${API_BASE_URL}/supplier`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSupplierData),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create supplier');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error creating supplier:", error);
                // Handle error appropriately
            }
        };
        
        const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to update supplier
                const response = await fetch(`${API_BASE_URL}/supplier/${updatedSupplier.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedSupplier),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update supplier');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error updating supplier:", error);
                // Handle error appropriately
            }
        };
        
        const handleCreateItem = async (newItemData: Omit<ItemLibrary, 'id'>) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to create item
                const response = await fetch(`${API_BASE_URL}/item`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newItemData),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create item');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error creating item:", error);
                // Handle error appropriately
            }
        };
        
        const handleUpdateItem = async (updatedItem: ItemLibrary) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to update item
                const response = await fetch(`${API_BASE_URL}/item/${updatedItem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedItem),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update item');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error updating item:", error);
                // Handle error appropriately
            }
        };
        
        const handleCreatePosition = async (newPositionData: Omit<Position, 'id'>) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to create position
                const response = await fetch(`${API_BASE_URL}/position`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPositionData),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create position');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error creating position:", error);
                // Handle error appropriately
            }
        };
        
        const handleUpdatePosition = async (updatedPosition: Position) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to update position
                const response = await fetch(`${API_BASE_URL}/position/${updatedPosition.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedPosition),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update position');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error updating position:", error);
                // Handle error appropriately
            }
        };
        
        const handleUpdateDiscipline = async (updatedDiscipline: Discipline) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to update discipline
                const response = await fetch(`${API_BASE_URL}/discipline/${updatedDiscipline.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedDiscipline),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update discipline');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error updating discipline:", error);
                // Handle error appropriately
            }
        };
        
        const handleCreateDiscipline = async (newDisciplineData: Omit<Discipline, 'id'>) => {
            if (!currentUser || !appData) return;
            
            try {
                // Make API call to create discipline
                const response = await fetch(`${API_BASE_URL}/discipline`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newDisciplineData),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create discipline');
                }
                
                // Refresh data from backend
                const endpoint = currentUser.is_super_admin 
                    ? `${API_BASE_URL}/all-data` 
                    : `${API_BASE_URL}/all-data/${currentUser.tenant_id}`;
                
                const dataResponse = await fetch(endpoint);
                if (!dataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                
                const updatedData: AppData = await dataResponse.json();
                // The backend returns related objects, but the frontend sometimes expects just IDs.
                // We can add them here for compatibility.
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    // Populate projects and disciplines arrays from the available data
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                
                setAppData(updatedData);
            } catch (error) {
                console.error("Error creating discipline:", error);
                // Handle error appropriately
            }
        };
        
        const handleReviseStf = async () => {};
        const handleCreateOtf = async () => {};
        const handleCreateTenantAndAdmin = async (data: any) => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/tenant`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error('Failed to create tenant');
                }
                // Refresh all data after creation
                const allDataResponse = await fetch(`${API_BASE_URL}/all-data`);
                if (!allDataResponse.ok) {
                    throw new Error('Failed to fetch updated data');
                }
                const updatedData: AppData = await allDataResponse.json();
                // Fix user project_ids and discipline_ids for compatibility
                updatedData.users.forEach(u => {
                    u.project_ids = u.project_ids || u.projects.map(p => p.id);
                    u.discipline_ids = u.discipline_ids || u.disciplines.map(d => d.id);
                    u.projects = u.project_ids.map(id => updatedData.projects.find(p => p.id === id)!).filter(Boolean);
                    u.disciplines = u.discipline_ids.map(id => updatedData.disciplines.find(d => d.id === id)!).filter(Boolean);
                });
                setAppData(updatedData);
            } catch (error) {
                setError('Error creating tenant: ' + (error as Error).message);
                console.error('Error creating tenant:', error);
            } finally {
                setIsLoading(false);
            }
        };
        const handleUpdateTenant = async () => {};
        const handleResetPassword = async () => {};
        const handleReassignAdmin = async () => {};
    
        const mainContent = () => {
            switch (activePage) {
                case 'Dashboard':
                    return <Dashboard currentUser={currentUser} data={appData} onResetData={handleResetData} setMtfHeaders={setMtfHeaders} setMtfLines={setMtfLines} setStfOrders={setStfOrders} setOtfOrders={setOtfOrders} setMrfHeaders={setMrfHeaders} onCreateMtf={handleCreateMtf} onBulkCreateMtf={() => {}} onCreateStf={handleCreateStf} onCreateOtf={handleCreateOtf} onCreateMrf={() => {}} onReviseStf={handleReviseStf} onReviseMtf={handleReviseMtf} onLogMtfAction={() => {}} onLogStfAction={() => {}} onLogOtfAction={() => {}} onLogMrfAction={() => {}} />;
                case 'MTF':
                    return <MtfManagement currentUser={currentUser} mtfHeaders={appData.mtfHeaders} mtfLines={appData.mtfLines} projects={appData.projects} disciplines={appData.disciplines} users={allUsers} setMtfHeaders={setMtfHeaders} setMtfLines={setMtfLines} onCreateMtf={handleCreateMtf} onReviseMtf={handleReviseMtf} onLogMtfAction={() => {}} stfOrderLines={appData.stfOrderLines} onCreateStf={handleCreateStf} items={appData.items} />;
                case 'STF':
                    return <StfManagement currentUser={currentUser} stfOrders={appData.stfOrders} projects={appData.projects} disciplines={appData.disciplines} stfOrderLines={appData.stfOrderLines} mtfLines={appData.mtfLines} mtfHeaders={appData.mtfHeaders} suppliers={appData.suppliers} otfOrderLines={appData.otfOrderLines} users={allUsers} setStfOrders={setStfOrders} onLogStfAction={() => {}} onReviseStf={handleReviseStf} otfOrders={appData.otfOrders} onCreateOtf={handleCreateOtf} items={appData.items} />;
                case 'OTF':
                    return <OtfManagement currentUser={currentUser} otfOrders={appData.otfOrders} projects={appData.projects} disciplines={appData.disciplines} otfOrderLines={appData.otfOrderLines} stfOrderLines={appData.stfOrderLines} mtfLines={appData.mtfLines} stfOrders={appData.stfOrders} users={allUsers} setOtfOrders={setOtfOrders} onLogOtfAction={() => {}} onReviseOtf={() => {}} suppliers={appData.suppliers} items={appData.items} />;
                case 'MTF History':
                    return <MtfHistory currentUser={currentUser} mtfHistory={appData.mtfHistory} users={allUsers} />;
                case 'STF History':
                    return <StfHistory currentUser={currentUser} stfHistory={appData.stfHistory} users={allUsers} />;
                case 'OTF History':
                    return <OtfHistory currentUser={currentUser} otfHistory={appData.otfHistory} users={allUsers} />;
                case 'MRF History':
                    return <MrfHistory currentUser={currentUser} mrfHistory={appData.mrfHistory} users={allUsers} />;
                case 'User Management':
                    return <UserManagement currentUser={currentUser} users={appData.users} disciplines={appData.disciplines} projects={appData.projects} positions={appData.positions} roles={appData.roles} onUpdateUser={handleUpdateUser} onCreateUser={handleCreateUser} />;
                case 'Item Management':
                    return <ItemManagement currentUser={currentUser} items={appData.items} onUpdateItem={handleUpdateItem} onCreateItem={handleCreateItem} />;
                case 'Project Management':
                    return <ProjectManagement currentUser={currentUser} projects={appData.projects} onUpdateProject={handleUpdateProject} onCreateProject={onCreateProject} />;
                case 'Discipline Management':
                    return <DisciplineManagement currentUser={currentUser} disciplines={appData.disciplines} onUpdateDiscipline={handleUpdateDiscipline} onCreateDiscipline={handleCreateDiscipline} />;
                case 'Position Management':
                    return <PositionManagement currentUser={currentUser} positions={appData.positions} onUpdatePosition={handleUpdatePosition} onCreatePosition={handleCreatePosition} />;
                case 'Supplier Management':
                    return <SupplierManagement currentUser={currentUser} suppliers={appData.suppliers} setSuppliers={setSuppliers} onUpdateSupplier={handleUpdateSupplier} onCreateSupplier={onCreateSupplier} />;
                case 'Tenant Management':
                    return <TenantManagement currentUser={currentUser} tenants={appData.tenants} users={appData.users} projects={appData.projects} onUpdateTenant={handleUpdateTenant} onCreateTenantAndAdmin={handleCreateTenantAndAdmin} onResetPassword={handleResetPassword} onReassignAdmin={handleReassignAdmin} />;
                default:
                    return <div className="p-8">Page not found</div>;
            }
        };
    
        return (
            <div className="flex h-screen bg-gray-100 font-sans">
                <Sidebar activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header currentUser={currentUser} onLogout={handleLogout} tenants={appData.tenants || []} activePage={activePage} />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
                        {mainContent()}
                    </main>
                </div>
            </div>
        );
    };

    return renderApp();
};

export default App;
