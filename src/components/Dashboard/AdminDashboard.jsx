import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { adminAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// Utility component for a simple table
const AuditLogTable = ({ logs }) => {
    if (!Array.isArray(logs)) return <tr><td colSpan="5" className="text-center py-4">No audit log data available.</td></tr>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                        <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.actor_email || log.actor_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.target_id || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.details ? JSON.stringify(log.details) : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Utility component for a simple table
const UserTable = ({ users, onStatusChange, onResetPassword }) => {
    // Safely check if users is an array before mapping
    if (!Array.isArray(users)) return <tr><td colSpan="6" className="text-center py-4">No user data available.</td></tr>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold capitalize" style={{ color: user.account_status === 'active' ? 'green' : 'red' }}>{user.account_status}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <select
                                    value={user.account_status}
                                    onChange={(e) => onStatusChange(user.id, e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="deleted">Deleted</option>
                                </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    onClick={() => onResetPassword(user.id, user.email)}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                                >
                                    Reset Password
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const AdminDashboard = () => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'audit'

    const fetchUsers = async (filters = {}) => {
        setLoading(true);
        if (!token) { // Use token from useAuth hook
            setError("Authentication token not found.");
            setLoading(false);
            return;
        }
        
        try {
            const response = await adminAPI.getUsers(filters);
            // Ensure response.data is an array before setting state
            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                // If it's not an array, it might be an object with a key containing the array
                // For now, we'll assume the backend returns the array directly.
                // If this still fails, we'll need to check the backend response structure.
                setUsers([]); 
                console.error("API response for users was not an array:", response.data);
            }
            setError(null);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError("Failed to load user data. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const response = await adminAPI.getAuditLog();
            if (Array.isArray(response.data)) {
                setAuditLogs(response.data);
            } else {
                setAuditLogs([]);
                console.error("API response for audit logs was not an array:", response.data);
            }
        } catch (err) {
            console.error("Failed to fetch audit logs:", err);
            // Don't set global error, just log it
        }
    };

    useEffect(() => {
        if (user && user.role === 'admin' && token) {
            if (activeTab === 'users') {
                const filters = {
                    search: searchTerm,
                    role: roleFilter,
                    status: statusFilter,
                };
                
                // Simple debouncing for search term
                const handler = setTimeout(() => {
                    fetchUsers(filters);
                }, 300); // 300ms debounce

                return () => {
                    clearTimeout(handler);
                };
            } else if (activeTab === 'audit') {
                fetchAuditLogs();
                setLoading(false); // Manually set loading to false after fetching logs
            }
        } else if (user) {
            // Redirect if not admin
            navigate(user.role === 'coach' ? '/coach/dashboard' : '/customer/dashboard');
        }
    }, [user, navigate, token, searchTerm, roleFilter, statusFilter, activeTab]); // Re-fetch on filter/tab change

    const handleStatusChange = async (userId, newStatus) => {
        if (window.confirm(`Are you sure you want to change user ${userId}'s status to ${newStatus}?`)) {
            if (!token) {
                alert("Authentication token not found. Please log in again.");
                return;
            }
            try {
                await adminAPI.updateUserStatus(userId, {
                    status: newStatus,
                    reason: `Changed by Admin ${user.email}`
                });
                // Refresh the user list with current filters
                fetchUsers({
                    search: searchTerm,
                    role: roleFilter,
                    status: statusFilter,
                });
                alert(`Successfully updated user status to ${newStatus}.`);
            } catch (err) {
                console.error("Failed to update status:", err);
                alert("Failed to update user status. Check console for details.");
            }
        }
    };

    const handleResetPassword = async (userId, userEmail) => {
        if (window.confirm(`Are you sure you want to initiate a password reset for user ${userEmail}? This will send a password reset email to them.`)) {
            if (!token) {
                alert("Authentication token not found. Please log in again.");
                return;
            }
            try {
                const response = await adminAPI.adminResetPassword(userId);
                alert(`Password reset initiated for ${userEmail}. A reset email has been sent.`);
                console.log("Password Reset Token (for debug/testing):", response.data.reset_token);
            } catch (err) {
                console.error("Failed to initiate password reset:", err);
                alert(`Failed to initiate password reset for ${userEmail}. Check console for details.`);
            }
        }
    };

    if (loading) return <div className="p-8">Loading Admin Dashboard...</div>;
    if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Platform Admin Dashboard</h1>
                <button 
                    onClick={logout} 
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Logout
                </button>
            </div>

            {/* Tabs for Users and Audit Log */}
            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`${
                            activeTab === 'users'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        User Management ({users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`${
                            activeTab === 'audit'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Audit Log ({auditLogs.length})
                    </button>
                </nav>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                {activeTab === 'users' && (
                    <>
                        <h2 className="text-xl font-semibold mb-4">All Platform Users</h2>

                        {/* Search and Filter Controls */}
                        <div className="flex space-x-4 mb-4">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-grow p-2 border border-gray-300 rounded-md"
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md"
                            >
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="coach">Coach</option>
                                <option value="customer">Customer</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                                <option value="deleted">Deleted</option>
                            </select>
                        </div>

                        <UserTable users={users} onStatusChange={handleStatusChange} onResetPassword={handleResetPassword} />
                    </>
                )}

                {activeTab === 'audit' && (
                    <>
                        <h2 className="text-xl font-semibold mb-4">System Audit Log</h2>
                        <AuditLogTable logs={auditLogs} />
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
