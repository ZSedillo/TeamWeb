import React, { useState, useEffect } from "react";
import AdminHeader from '../Component/AdminHeader.jsx';
import "./ManageAccount.css";

function ManageAccount() {
  const [accounts, setAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Updated state for editing user info
  const [editUserInfo, setEditUserInfo] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // New account form state
  const [newAccount, setNewAccount] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin" // Default role
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiErrors, setApiErrors] = useState({});

  // Get the JWT token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };
  
  // Fetch current user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const token = getToken();
        if (!token) {
          setError("Not authenticated");
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        
        const response = await fetch('https://teamweb-kera.onrender.com/user/current-user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          setError("Session expired. Please login again.");
          window.location.href = '/login';
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          setUsername("");
          navigate("/login");
          throw new Error(errorData.error || 'Failed to load user data');
        }
        
        const data = await response.json();
        
        // Set current user
        setCurrentUser(data.user);
        
        // Handle accounts based on role
        if (data.user.role === 'head_admin' && data.admins) {
          // For head admin, show all admin accounts
          setAccounts(data.admins);
        } else {
          // For regular admin, show only their own account
          setAccounts([{
            id: data.user._id,
            username: data.user.username,
            email: data.user.email || 'No email provided',
            role: data.user.role
          }]);
        }
      } catch (err) {
        console.error('Fetch user error:', err);
        // localStorage.removeItem("token");
        // localStorage.removeItem("username");
        // setUsername("");
        // navigate("/login");
        setError("Failed to load user data: " + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Close all modals
  const closeModals = () => {
    setShowDeleteModal(false);
    setShowEditModal(false);
    setShowCreateModal(false);
    setSelectedAccount(null);
    setApiErrors({});
    setFormErrors({});
  };

  // Handle opening the edit modal with full user info
  const handleEditClick = (account) => {
    setSelectedAccount(account);
    setEditUserInfo({
      username: account.username,
      email: account.email || "",
      password: "",
      confirmPassword: ""
    });
    setShowEditModal(true);
  };

  // Handle opening the delete modal
  const handleDeleteClick = (account) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  // Handle opening the create account modal
  const handleCreateClick = () => {
    setNewAccount({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin"
    });
    setFormErrors({});
    setApiErrors({});
    setShowCreateModal(true);
  };

  // Validate user info form
  const validateUserInfoForm = () => {
    const errors = {};
    
    if (!editUserInfo.username.trim()) {
      errors.username = "Username is required";
    }
    
    if (!editUserInfo.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(editUserInfo.email)) {
      errors.email = "Email is invalid";
    }
    
    // Password is optional, but if provided, must match
    if (editUserInfo.password) {
      if (editUserInfo.password !== editUserInfo.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle user info update
  const handleUserInfoUpdate = async () => {
      if (!validateUserInfoForm()) return;

      setLoading(true);
      setApiErrors({});

      try {
          const token = getToken();
          const response = await fetch('https://teamweb-kera.onrender.com/user/update-user-info', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  targetUserId: selectedAccount.id || selectedAccount._id,
                  username: editUserInfo.username,
                  email: editUserInfo.email,
                  ...(editUserInfo.password && { password: editUserInfo.password })
              })
          });

          const data = await response.json();

          if (!response.ok) {
              // Handle specific API errors
              if (data.error) {
                  if (data.error.includes("Username already exists")) {
                      setApiErrors({ username: "Username already exists" });
                  } else if (data.error.includes("Email already exists")) {
                      setApiErrors({ email: "Email already exists" });
                  } else {
                      setError(data.error || 'Failed to update user info');
                  }
                  return;
              }
              throw new Error(data.error || 'Failed to update user info');
          }

          // ✅ Call `/add-report` API
          await fetch("https://teamweb-kera.onrender.com/report/add-report", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  username: currentUser.username, // Admin performing the update
                  activityLog: `[Manage Account] Updated user accout: ${selectedAccount.username}`
              }),
          });

          localStorage.setItem("username", editUserInfo.username); // Save username

          // Success
          alert('User information updated successfully');
          closeModals();

          // Refresh the accounts list
          window.location.reload();
      } catch (err) {
          setError(err.message);
          console.error(err);
      } finally {
          setLoading(false);
      }
  };


  // Handle account deletion
  const handleAccountDelete = async () => {
      setLoading(true);
      try {
          const token = getToken();
          if (!token) {
              setError("Not authenticated");
              return;
          }

          let targetUserId = null;

          // Allow head_admin to delete any user
          if (currentUser.role === "head_admin" && selectedAccount) {
              targetUserId = selectedAccount.id || selectedAccount._id;
          } else if (selectedAccount.role === "admin") {
              targetUserId = selectedAccount.id;
          } else if (selectedAccount.role === "home_admin") {
              targetUserId = selectedAccount._id;
          }

          if (!targetUserId) {
              setError("Invalid user selection or missing ID");
              return;
          }

          const response = await fetch('https://teamweb-kera.onrender.com/user/delete-account', {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  targetUserId
              })
          });

          const data = await response.json();

          if (!response.ok) {
              // Handle specific error messages from the backend
              if (data.error) {
                  if (data.error === 'Cannot delete the last head admin account') {
                      setError('You cannot delete the last head admin account');
                  } else if (data.error === 'Unauthorized to delete this account') {
                      setError('You are not authorized to delete this account');
                  } else {
                      setError(data.error || 'Failed to delete account');
                  }
                  return;
              }
              throw new Error(data.error || 'Failed to delete account');
          }

          // ✅ Call `/add-report` API
          await fetch("https://teamweb-kera.onrender.com/report/add-report", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  username: currentUser.username, // Admin performing the deletion
                  activityLog: `[Manage Account] Deleted account: ${selectedAccount.username}`
              }),
          });

          // Success - handle logout or refresh
          if (targetUserId === currentUser._id) {
              // If deleting own account, logout
              localStorage.removeItem('token');
              alert('Account deleted successfully');
              window.location.href = '/login';
          } else {
              // If deleting another account, refresh the list
              alert('Account deleted successfully');
              window.location.reload();
          }
      } catch (err) {
          setError(err.message);
          console.error(err);
      } finally {
          setLoading(false);
      }
  };


  // Handle new account form changes
  const handleNewAccountChange = (e) => {
    const { name, value } = e.target;
    setNewAccount({
      ...newAccount,
      [name]: value
    });
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
    
    // Clear API error for this field when user types
    if (apiErrors[name]) {
      setApiErrors({
        ...apiErrors,
        [name]: null
      });
    }
  };

  // Validate the new account form
  const validateForm = () => {
    const errors = {};
    
    if (!newAccount.username.trim()) {
      errors.username = "Username is required";
    }
    
    if (!newAccount.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(newAccount.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!newAccount.password) {
      errors.password = "Password is required";
    }
    
    if (newAccount.password !== newAccount.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create account
  const handleCreateAccount = async () => {
      if (!validateForm()) return;

      setLoading(true);
      setApiErrors({});

      try {
          const token = getToken();
          const response = await fetch('https://teamweb-kera.onrender.com/user/register', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` // Include token for admin-only registration
              },
              body: JSON.stringify({
                  username: newAccount.username,
                  email: newAccount.email,
                  password: newAccount.password,
                  role: currentUser.role === 'head_admin' ? newAccount.role : 'admin'
              })
          });

          const data = await response.json();

          if (!response.ok) {
              // Handle specific API errors and map them to form fields
              if (data.error) {
                  if (data.error.includes("Username already exists")) {
                      setApiErrors({ username: "Username already exists" });
                  } else if (data.error.includes("Email already exists")) {
                      setApiErrors({ email: "Email already exists" });
                  } else {
                      setError(data.error || 'Failed to create account');
                  }
                  return;
              }
              throw new Error(data.error || 'Failed to create account');
          }

          // ✅ Call `/add-report` API
          await fetch("https://teamweb-kera.onrender.com/report/add-report", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  username: currentUser.username, // Replace with the admin's username
                  activityLog: `[Manage Account] Created a new account: ${newAccount.username} (${newAccount.role})`
              }),
          });

          // Success
          alert('Account created successfully');
          closeModals();

          // Refresh the accounts list
          window.location.reload();
      } catch (err) {
          setError(err.message);
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="admin-page-accounts">
      <AdminHeader />
      <div className="content-container">
        <div className="page-header">
          <h1>Account Management</h1>
          <p>
            {currentUser?.role === 'head_admin' 
              ? "Manage all admin accounts" 
              : "Manage your account"}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="admin-content-accounts">
        <div className="dashboard-panel-accounts">
          <div className="panel-header-accounts">
            <div className="header-content-accounts">
              <h2 className="panel-title-accounts">
                {currentUser?.role === 'head_admin' 
                  ? "Manage Admin Accounts" 
                  : "Manage Your Account"}
              </h2>
              {(currentUser?.role === 'head_admin' || currentUser?.role === 'admin') && (
                <button 
                  className="btn-accounts btn-create-accounts" 
                  onClick={handleCreateClick}
                  disabled={loading}
                >
                  Create Account
                </button>
              )}
            </div>
          </div>

          <div className="data-table-container-accounts">
            {loading ? (
                <div className="loading-state-admin">
                          <div className="loading-spinner-admin"></div>
                          <p>Loading Admin data...</p>
                      </div>
            ) : (
              <table className="data-table-accounts">
                <thead className="table-head-accounts">
                  <tr className="table-row-accounts">
                    <th className="table-header-accounts">Username</th>
                    <th className="table-header-accounts">Email</th>
                    {currentUser?.role === 'head_admin'&& (
                      <th className="table-header-accounts">Role</th>
                    )}
                    <th className="table-header-accounts">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body-accounts">
                {accounts.map((account) => (
    <tr 
        key={currentUser?.role === "head_admin" ? account._id : account.id || account._id} 
        className="table-row-accounts"
    >
        <td className="table-cell-accounts">{account.username}</td>
        <td className="table-cell-accounts">{account.email}</td>
        {currentUser?.role === "head_admin" && (
            <td className="table-cell-accounts">
                {account.role === "head_admin" ? "Head Admin" : "Admin"}
            </td>
        )}
        <td className="table-cell-accounts">
            <div className="action-buttons-accounts">
                <button 
                    className="btn-accounts btn-edit-accounts" 
                    onClick={() => handleEditClick(account)}
                    disabled={loading}
                >
                    Edit
                </button>
                {(currentUser?.role === "head_admin" && account.role !== "head_admin") ||
                (currentUser?.role === "admin" && account.id === currentUser?._id) ? (
                    <button 
                        className="btn-accounts btn-delete-accounts" 
                        onClick={() => handleDeleteClick(account)}
                        disabled={loading}
                        style={loading ? { backgroundColor: "#f8d7da", opacity: 0.6, cursor: "not-allowed" } : {}}
                    >
                        Delete Account
                    </button>
                ) : (
                    <button 
                        className="btn-accounts btn-delete-accounts-disable" 
                        disabled
                        style={{ backgroundColor: "#e0e0e0", color: "#a0a0a0", cursor: "not-allowed", border: "1px solid #d6d6d6" }}
                    >
                        Delete Account
                    </button>
                )}
            </div>
        </td>
    </tr>
))}

                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit User Info Modal */}
      {showEditModal && (
        <div className="modal-overlay-accounts">
          <div className="modal-container-accounts">
            <div className="modal-header-accounts">
              <h3 className="modal-title-accounts">Edit User Information</h3>
              <button className="close-btn-accounts" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body-accounts">
              <div className="form-group-accounts">
                <label className="form-label-accounts" htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={editUserInfo.username}
                  onChange={(e) => setEditUserInfo({
                    ...editUserInfo,
                    username: e.target.value
                  })}
                  placeholder="Enter username"
                  className={`form-input-accounts ${formErrors.username || apiErrors.username ? 'input-error-accounts' : ''}`}
                />
                {formErrors.username && <div className="error-message-accounts">{formErrors.username}</div>}
                {apiErrors.username && <div className="error-message-accounts">{apiErrors.username}</div>}
              </div>
              
              <div className="form-group-accounts">
                <label className="form-label-accounts" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editUserInfo.email}
                  onChange={(e) => setEditUserInfo({
                    ...editUserInfo,
                    email: e.target.value
                  })}
                  placeholder="Enter email address"
                  className={`form-input-accounts ${formErrors.email || apiErrors.email ? 'input-error-accounts' : ''}`}
                />
                {formErrors.email && <div className="error-message-accounts">{formErrors.email}</div>}
                {apiErrors.email && <div className="error-message-accounts">{apiErrors.email}</div>}
              </div>
              
              <div className="form-group-accounts">
                <label className="form-label-accounts" htmlFor="password">New Password (Optional)</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={editUserInfo.password}
                  onChange={(e) => setEditUserInfo({
                    ...editUserInfo,
                    password: e.target.value
                  })}
                  placeholder="Enter new password"
                  className="form-input-accounts"
                />
              </div>
              
              {editUserInfo.password && (
                <div className="form-group-accounts">
                  <label className="form-label-accounts" htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={editUserInfo.confirmPassword}
                    onChange={(e) => setEditUserInfo({
                      ...editUserInfo,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirm new password"
                    className={`form-input-accounts ${formErrors.confirmPassword ? 'input-error-accounts' : ''}`}
                  />
                  {formErrors.confirmPassword && <div className="error-message-accounts">{formErrors.confirmPassword}</div>}
                </div>
              )}
            </div>
            <div className="modal-footer-accounts">
              <button className="btn-accounts btn-cancel-accounts" onClick={closeModals} disabled={loading}>Cancel</button>
              <button 
                className="btn-accounts btn-primary-accounts" 
                onClick={handleUserInfoUpdate}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Information"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay-accounts">
          <div className="modal-container-accounts">
            <div className="modal-header-accounts warning-accounts">
              <h3 className="modal-title-accounts">Delete Account</h3>
              <button className="close-btn-accounts" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body-accounts">
              <div className="warning-icon-accounts">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
              </div>
              <p className="modal-text-accounts warning-text-accounts">
                Are you sure you want to delete {selectedAccount.username}'s account?
              </p>
              <p className="modal-subtext-accounts">This action cannot be undone. All account data will be permanently removed.</p>
            </div>
            <div className="modal-footer-accounts">
              <button className="btn-accounts btn-cancel-accounts" onClick={closeModals} disabled={loading}>Cancel</button>
              <button 
                className="btn-accounts btn-danger-accounts" 
                onClick={handleAccountDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="modal-overlay-accounts">
          <div className="modal-container-accounts">
            <div className="modal-header-accounts">
              <h3 className="modal-title-accounts">Create Account</h3>
              <button className="close-btn-accounts" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body-accounts">
              <div className="form-group-accounts">
                <label className="form-label-accounts" htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={newAccount.username}
                  onChange={handleNewAccountChange}
                  placeholder="Enter username"
                  className={`form-input-accounts ${formErrors.username || apiErrors.username ? 'input-error-accounts' : ''}`}
                />
                {formErrors.username && <div className="error-message-accounts">{formErrors.username}</div>}
                {apiErrors.username && <div className="error-message-accounts">{apiErrors.username}</div>}
              </div>
              
              <div className="form-group-accounts">
                <label className="form-label-accounts" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newAccount.email}
                  onChange={handleNewAccountChange}
                  placeholder="Enter email address"
                  className={`form-input-accounts ${formErrors.email || apiErrors.email ? 'input-error-accounts' : ''}`}
                />
                {formErrors.email && <div className="error-message-accounts">{formErrors.email}</div>}
                {apiErrors.email && <div className="error-message-accounts">{apiErrors.email}</div>}
              </div>
              
              <div className="form-group-accounts">
                <label className="form-label-accounts" htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newAccount.password}
                  onChange={handleNewAccountChange}
                  placeholder="Enter password"
                  className={`form-input-accounts ${formErrors.password || apiErrors.password ? 'input-error-accounts' : ''}`}
                />
                {formErrors.password && <div className="error-message-accounts">{formErrors.password}</div>}
                {apiErrors.password && <div className="error-message-accounts">{apiErrors.password}</div>}
              </div>
              
              <div className="form-group-accounts">
                <label className="form-label-accounts" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={newAccount.confirmPassword}
                  onChange={handleNewAccountChange}
                  placeholder="Confirm your password"
                  className={`form-input-accounts ${formErrors.confirmPassword ? 'input-error-accounts' : ''}`}
                />
                {formErrors.confirmPassword && <div className="error-message-accounts">{formErrors.confirmPassword}</div>}
              </div>

              {/* Role selection for Head Admin */}
              {currentUser?.role === 'head_admin' && (
              <div className="form-group-accounts">
                <label className="form-label-accounts" htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value="admin" // Locked to "Admin"
                  className="form-input-accounts"
                  disabled // Makes it unchangeable
                  style={{
                    backgroundColor: '#e0e0e0', // Light gray to indicate it's locked
                    cursor: 'not-allowed', // Shows a 'not allowed' cursor
                    color: '#666', // Makes text slightly faded
                    border: '1px solid #ccc', // Gives it a subtle border
                    padding: '8px', // Keeps it looking normal
                    fontSize: '14px',
                  }}
                >
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            </div>
            <div className="modal-footer-accounts">
              <button className="btn-accounts btn-cancel-accounts" onClick={closeModals} disabled={loading}>Cancel</button>
              <button 
                className="btn-accounts btn-primary-accounts" 
                onClick={handleCreateAccount}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAccount;