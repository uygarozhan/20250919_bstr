

import React, { useMemo } from 'react';
import type { User, MTF_History_Log } from '../types';
import { ClockIcon } from './icons/Icons';

interface MtfHistoryProps {
    currentUser: User;
    mtfHistory: MTF_History_Log[];
    //-fix: Add 'users' to the props interface to accept the full user list from App.tsx.
    users: User[];
}

//-fix: Widened the type of 'action' to include all possible values from MTF_History_Log.
const getActionBadge = (action: 'Created' | 'Approved' | 'Rejected' | 'Revised' | 'Closed') => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full leading-tight';
  switch (action) {
    case 'Approved':
      return `${baseClasses} bg-green-100 text-green-700`;
    case 'Rejected':
      return `${baseClasses} bg-red-100 text-red-700`;
    case 'Created':
      return `${baseClasses} bg-blue-100 text-blue-700`;
    //-fix: Added cases for 'Revised' and 'Closed' to handle all action types.
    case 'Revised':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
    case 'Closed':
        return `${baseClasses} bg-gray-600 text-white`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-500`;
  }
};

//-fix: Destructure the new 'users' prop to use it for looking up actor details.
export const MtfHistory: React.FC<MtfHistoryProps> = ({ currentUser, mtfHistory, users }) => {
    if (currentUser.is_super_admin) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-700">Access Denied</h1>
                    <p className="text-gray-500 mt-2">This page is for tenant-level users.</p>
                </div>
            </div>
        );
    }

    const sortedHistory = useMemo(() => {
        return [...mtfHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [mtfHistory]);

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">MTF Action History</h2>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">MTF ID</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                            <th scope="col" className="px-6 py-3">Details</th>
                            <th scope="col" className="px-6 py-3">Actor</th>
                            <th scope="col" className="px-6 py-3">Date & Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedHistory.map(log => {
                            //-fix: Use the 'users' prop passed from App.tsx to find the actor, instead of relying on mock data.
                            const actor = users.find(u => u.id === log.actorId);
                            return (
                                <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-semibold text-gray-700">{log.mtfIdString}</td>
                                    <td className="px-6 py-4">
                                        <span className={getActionBadge(log.action)}>{log.action}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{log.details}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{actor ? `${actor.firstName} ${actor.lastName}` : 'Unknown User'}</div>
                                        <div className="text-xs text-gray-500">{actor?.position.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{new Date(log.timestamp).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {sortedHistory.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <div className="flex justify-center items-center mb-2">
                           <ClockIcon/>
                        </div>
                        <p>No MTF actions have been recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};