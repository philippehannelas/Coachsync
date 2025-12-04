import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { adminAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// Utility component for a simple table
const UserTable = ({ users, onStatusChange }) => {
    // Safely check if users is an array before mapping
    if (!Array.isArray(users)) return <tr><td colSpan="5" className="text-center py-4">No user data available.</td></tr>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = async (authToken) => {
        setLoading(true);
        if (!authToken) {
            setError("Authentication token not found.");
            setLoading(false);
            return;
        }
        
        try {
            const response = await adminAPI.get('/users');
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

    useEffect(() => {
        if (user && user.role === 'admin' && token) {
            fetchUsers(token);
        } else if (user) {
            // Redirect if not admin
            navigate(user.role === 'coach' ? '/coach/dashboard' : '/customer/dashboard');
        }
    }, [user, navigate, token]);

    const handleStatusChange = async (userId, newStatus) => {
        if (window.confirm(`Are you sure you want to change user ${userId}'s status to ${newStatus}?`)) {
            if (!token) {
                alert("Authentication token not found. Please log in again.");
                return;
            }
            try {
                await adminAPI.put(`/users/${userId}/status`, {
                    status: newStatus,
                    reason: `Changed by Admin ${user.email}`
                });
                // Refresh the user list
                fetchUsers(token);
            } catch (err) {
                console.error("Failed to update status:", err);
                alert("Failed to update user status. Check console for details.");
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
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">All Platform Users ({users.length})</h2>
                <UserTable users={users} onStatusChange={handleStatusChange} />
            </div>
        </div>
    );
};

export default AdminDashboard;
