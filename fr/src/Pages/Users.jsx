import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import Modal from '../components/Modal';
import ModalActions, { PrimaryButton, SecondaryButton, DangerButton } from '../components/ModalActions';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher"
  });
  
  // Notification system
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get the token and make the request
      const res = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: getAuthHeader()
      });

      console.log("API Response:", res);
      setUsers(res.data); // Assuming res.data is an array of users
    } catch (err) {
      console.error("Error:", err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please check if the backend is running.');
      } else if (err.response && err.response.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError("Failed to fetch users: " + (err.message || "Unknown error"));
      }
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users`, formData, {
        headers: getAuthHeader()
      });
      
      setUsers([...users, response.data]);
      setShowAddModal(false);
      setFormData({ name: "", email: "", password: "", role: "teacher" });
      showNotification("success", "User added successfully");
    } catch (err) {
      console.error("Error adding user:", err);
      showNotification("error", `Failed to add user: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleEditClick = (user) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't set the password for editing
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      // Only send required fields, don't send empty password
      const dataToUpdate = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };
      
      // Only include password if it was entered
      if (formData.password) {
        dataToUpdate.password = formData.password;
      }
      
      const response = await axios.put(`${API_BASE_URL}/api/users/${currentUser.id}`, dataToUpdate, {
        headers: getAuthHeader()
      });
      
      // Update users list with the updated user
      setUsers(users.map(u => u.id === currentUser.id ? response.data : u));
      setShowEditModal(false);
      showNotification("success", "User updated successfully");
    } catch (err) {
      console.error("Error updating user:", err);
      showNotification("error", `Failed to update user: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteClick = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${currentUser.id}`, {
        headers: getAuthHeader()
      });
      
      // Remove the deleted user from the state
      setUsers(users.filter(u => u.id !== currentUser.id));
      setShowDeleteModal(false);
      showNotification("success", "User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      showNotification("error", `Failed to delete user: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Floating Header */}
      <div className="sticky top-4 z-30 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Manage Users</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {users.length} Users in the system
                </p>
              </div>
              
              <button 
                onClick={() => {
                  setFormData({ name: "", email: "", password: "", role: "teacher" });
                  setShowAddModal(true);
                }}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 p-5 rounded-lg my-6 text-center">
            <p>{error}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={user.id} className="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <td className="px-5 py-3.5">{index + 1}</td>
                        <td className="px-5 py-3.5 font-medium">{user.name}</td>
                        <td className="px-5 py-3.5">{user.email}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin" 
                              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                              : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditClick(user)}
                              className="px-3 py-1 text-xs bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-400 rounded-md font-medium transition-all duration-200 border border-gray-200 dark:border-gray-600 shadow-sm"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(user)}
                              className="px-3 py-1 text-xs bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-red-600 dark:text-red-400 rounded-md font-medium transition-all duration-200 border border-gray-200 dark:border-gray-600 shadow-sm"
                              disabled={user.role === "admin" && users.filter(u => u.role === "admin").length === 1}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleAddUser}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type="password"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300"
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          <ModalActions>
            <SecondaryButton type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Add User
            </PrimaryButton>
          </ModalActions>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal && !!currentUser}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="md"
      >
        {currentUser && (
          <form onSubmit={handleEditUser}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password <span className="text-gray-400 dark:text-gray-500 text-xs">(Leave blank to keep current password)</span>
                </label>
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type="password"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                  disabled={currentUser.role === "admin" && users.filter(u => u.role === "admin").length === 1}
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                {currentUser.role === "admin" && users.filter(u => u.role === "admin").length === 1 && (
                  <p className="text-xs text-amber-500 mt-1">Cannot change role of the last admin user</p>
                )}
              </div>
            </div>
            
            <ModalActions>
              <SecondaryButton type="button" onClick={() => setShowEditModal(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">
                Save Changes
              </PrimaryButton>
            </ModalActions>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal && !!currentUser}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        size="sm"
      >
        {currentUser && (
          <>
            <div className="py-2">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <span className="font-medium">{currentUser.name}</span>?
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                This action cannot be undone.
              </p>
            </div>
            
            <ModalActions>
              <SecondaryButton onClick={() => setShowDeleteModal(false)}>
                Cancel
              </SecondaryButton>
              <DangerButton onClick={handleDeleteUser}>
                Delete
              </DangerButton>
            </ModalActions>
          </>
        )}
      </Modal>

      {/* Toast notification */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 z-[9999] animate-fade-in-up">
          <div className={`px-6 py-3 rounded-md shadow-xl flex items-center ${
            notification.type === 'error' 
              ? 'bg-red-600 text-white' 
              : 'bg-green-600 text-white'
          }`}>
            <span className="mr-2">
              {notification.type === 'error' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
