import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminHeader from '../Component/AdminHeader.jsx';
import { 
    getAccounts, 
    createAccount, 
    updateAccount, 
    deleteAccount, 
    clearUserErrors 
} from "../../_actions/user.actions";
import "./ManageAccount.css"; 

function ManageAccount() {
    const dispatch = useDispatch();

    // 1. Get state from Redux
    const { user: currentUser, accounts, loading, error, message } = useSelector((state) => state.user);

    // Local state for modals and forms
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    
    // Form states
    const [editUserInfo, setEditUserInfo] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [newAccount, setNewAccount] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "admin"
    });

    const [formErrors, setFormErrors] = useState({});

    // 2. Load Accounts on Mount
    useEffect(() => {
        dispatch(getAccounts());
    }, [dispatch]);

    // 3. Clear errors when modals close
    const closeModals = () => {
        setShowDeleteModal(false);
        setShowEditModal(false);
        setShowCreateModal(false);
        setSelectedAccount(null);
        setFormErrors({});
        dispatch(clearUserErrors());
    };

    // --- Handlers ---
    const handleEditClick = (account) => {
        dispatch(clearUserErrors());
        setSelectedAccount(account);
        setEditUserInfo({
            username: account.username,
            email: account.email || "",
            password: "",
            confirmPassword: ""
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (account) => {
        dispatch(clearUserErrors());
        setSelectedAccount(account);
        setShowDeleteModal(true);
    };

    const handleCreateClick = () => {
        dispatch(clearUserErrors());
        setNewAccount({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "admin"
        });
        setFormErrors({});
        setShowCreateModal(true);
    };

    // --- Validation ---
    const validateUserInfoForm = () => {
        const errors = {};
        if (!editUserInfo.username.trim()) errors.username = "Username is required";
        if (!editUserInfo.email.trim()) errors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(editUserInfo.email)) errors.email = "Email is invalid";
        if (editUserInfo.password && editUserInfo.password !== editUserInfo.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateCreateForm = () => {
        const errors = {};
        if (!newAccount.username.trim()) errors.username = "Username is required";
        if (!newAccount.email.trim()) errors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(newAccount.email)) errors.email = "Email is invalid";
        if (!newAccount.password) errors.password = "Password is required";
        if (newAccount.password !== newAccount.confirmPassword) errors.confirmPassword = "Passwords do not match";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // --- Action Dispatchers ---

    const onUpdateSubmit = async () => {
        if (!validateUserInfoForm()) return;
        
        const updateData = {
            targetUserId: selectedAccount.id || selectedAccount._id,
            username: editUserInfo.username,
            email: editUserInfo.email,
            ...(editUserInfo.password && { password: editUserInfo.password })
        };

        const result = await dispatch(updateAccount(updateData, currentUser.username));
        if (result.success) {
            alert('User updated successfully');
            closeModals();
            dispatch(getAccounts()); // Refresh list
        }
    };

    const onDeleteSubmit = async () => {
        const targetId = selectedAccount.id || selectedAccount._id;
        const result = await dispatch(deleteAccount(targetId, selectedAccount.username, currentUser.username));
        
        if (result.success) {
            alert('Account deleted successfully');
            closeModals();
            
            // If deleting self, force full reload (which triggers auth check failure -> login)
            if (targetId === currentUser._id || targetId === currentUser.id) {
                window.location.reload(); 
            } else {
                dispatch(getAccounts()); // Refresh list
            }
        }
    };

    const onCreateSubmit = async () => {
        if (!validateCreateForm()) return;

        const data = {
            username: newAccount.username,
            email: newAccount.email,
            password: newAccount.password,
            role: currentUser.role === 'head_admin' ? newAccount.role : 'admin'
        };

        const result = await dispatch(createAccount(data, currentUser.username));
        if (result.success) {
            alert('Account created successfully');
            closeModals();
            dispatch(getAccounts()); // Refresh list
        }
    };

    return (
        <div className="admin-page-accounts">
            <AdminHeader />
            <div className="content-container">
                <div className="page-header">
                    <h1>Account Management</h1>
                    <p>{currentUser?.role === 'head_admin' ? "Manage all admin accounts" : "Manage your account"}</p>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={() => dispatch(clearUserErrors())}>×</button>
                </div>
            )}

            <div className="admin-content-accounts">
                <div className="dashboard-panel-accounts">
                    <div className="panel-header-accounts">
                        <div className="header-content-accounts">
                            <h2 className="panel-title-accounts">
                                {currentUser?.role === 'head_admin' ? "Manage Admin Accounts" : "Manage Your Account"}
                            </h2>
                            {(currentUser?.role === 'head_admin' || currentUser?.role === 'admin') && (
                                <button className="btn-accounts btn-create-accounts" onClick={handleCreateClick} disabled={loading}>
                                    Create Account
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="data-table-container-accounts">
                        {loading && accounts.length === 0 ? (
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
                                        {currentUser?.role === 'head_admin' && <th className="table-header-accounts">Role</th>}
                                        <th className="table-header-accounts">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body-accounts">
                                    {accounts.map((account) => (
                                        <tr key={account._id || account.id} className="table-row-accounts">
                                            <td className="table-cell-accounts">{account.username}</td>
                                            <td className="table-cell-accounts">{account.email}</td>
                                            {currentUser?.role === "head_admin" && (
                                                <td className="table-cell-accounts">
                                                    {account.role === "head_admin" ? "Head Admin" : "Admin"}
                                                </td>
                                            )}
                                            <td className="table-cell-accounts">
                                                <div className="action-buttons-accounts">
                                                    <button className="btn-accounts btn-edit-accounts" onClick={() => handleEditClick(account)} disabled={loading}>
                                                        Edit
                                                    </button>
                                                    {((currentUser?.role === "head_admin" && account.role !== "head_admin") ||
                                                        (currentUser?.role === "admin" && (account.id === currentUser?._id || account.id === currentUser?.id))) ? (
                                                        <button 
                                                            className="btn-accounts btn-delete-accounts" 
                                                            onClick={() => handleDeleteClick(account)} 
                                                            disabled={loading}
                                                            style={loading ? { opacity: 0.6 } : {}}
                                                        >
                                                            Delete Account
                                                        </button>
                                                    ) : (
                                                        <button className="btn-accounts btn-delete-accounts-disable" disabled>Delete Account</button>
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
                                <label className="form-label-accounts">Username</label>
                                <input type="text" value={editUserInfo.username} onChange={(e) => setEditUserInfo({...editUserInfo, username: e.target.value})} className={`form-input-accounts ${formErrors.username ? 'input-error-accounts' : ''}`} />
                                {formErrors.username && <div className="error-message-accounts">{formErrors.username}</div>}
                            </div>
                            <div className="form-group-accounts">
                                <label className="form-label-accounts">Email</label>
                                <input type="email" value={editUserInfo.email} onChange={(e) => setEditUserInfo({...editUserInfo, email: e.target.value})} className={`form-input-accounts ${formErrors.email ? 'input-error-accounts' : ''}`} />
                                {formErrors.email && <div className="error-message-accounts">{formErrors.email}</div>}
                            </div>
                            <div className="form-group-accounts">
                                <label className="form-label-accounts">New Password (Optional)</label>
                                <input type="password" value={editUserInfo.password} onChange={(e) => setEditUserInfo({...editUserInfo, password: e.target.value})} className="form-input-accounts" />
                            </div>
                            {editUserInfo.password && (
                                <div className="form-group-accounts">
                                    <label className="form-label-accounts">Confirm New Password</label>
                                    <input type="password" value={editUserInfo.confirmPassword} onChange={(e) => setEditUserInfo({...editUserInfo, confirmPassword: e.target.value})} className={`form-input-accounts ${formErrors.confirmPassword ? 'input-error-accounts' : ''}`} />
                                    {formErrors.confirmPassword && <div className="error-message-accounts">{formErrors.confirmPassword}</div>}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer-accounts">
                            <button className="btn-accounts btn-cancel-accounts" onClick={closeModals} disabled={loading}>Cancel</button>
                            <button className="btn-accounts btn-primary-accounts" onClick={onUpdateSubmit} disabled={loading}>
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
                            <p className="modal-text-accounts warning-text-accounts">Are you sure you want to delete {selectedAccount?.username}'s account?</p>
                            <p className="modal-subtext-accounts">This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer-accounts">
                            <button className="btn-accounts btn-cancel-accounts" onClick={closeModals} disabled={loading}>Cancel</button>
                            <button className="btn-accounts btn-danger-accounts" onClick={onDeleteSubmit} disabled={loading}>
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
                                <label className="form-label-accounts">Username</label>
                                <input type="text" value={newAccount.username} onChange={(e) => setNewAccount({...newAccount, username: e.target.value})} className={`form-input-accounts ${formErrors.username ? 'input-error-accounts' : ''}`} />
                                {formErrors.username && <div className="error-message-accounts">{formErrors.username}</div>}
                            </div>
                            <div className="form-group-accounts">
                                <label className="form-label-accounts">Email</label>
                                <input type="email" value={newAccount.email} onChange={(e) => setNewAccount({...newAccount, email: e.target.value})} className={`form-input-accounts ${formErrors.email ? 'input-error-accounts' : ''}`} />
                                {formErrors.email && <div className="error-message-accounts">{formErrors.email}</div>}
                            </div>
                            <div className="form-group-accounts">
                                <label className="form-label-accounts">Password</label>
                                <input type="password" value={newAccount.password} onChange={(e) => setNewAccount({...newAccount, password: e.target.value})} className={`form-input-accounts ${formErrors.password ? 'input-error-accounts' : ''}`} />
                                {formErrors.password && <div className="error-message-accounts">{formErrors.password}</div>}
                            </div>
                            <div className="form-group-accounts">
                                <label className="form-label-accounts">Confirm Password</label>
                                <input type="password" value={newAccount.confirmPassword} onChange={(e) => setNewAccount({...newAccount, confirmPassword: e.target.value})} className={`form-input-accounts ${formErrors.confirmPassword ? 'input-error-accounts' : ''}`} />
                                {formErrors.confirmPassword && <div className="error-message-accounts">{formErrors.confirmPassword}</div>}
                            </div>
                            {currentUser?.role === 'head_admin' && (
                                <div className="form-group-accounts">
                                    <label className="form-label-accounts">Role</label>
                                    <select disabled className="form-input-accounts" style={{ backgroundColor: '#e0e0e0' }}><option>Admin</option></select>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer-accounts">
                            <button className="btn-accounts btn-cancel-accounts" onClick={closeModals} disabled={loading}>Cancel</button>
                            <button className="btn-accounts btn-primary-accounts" onClick={onCreateSubmit} disabled={loading}>
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