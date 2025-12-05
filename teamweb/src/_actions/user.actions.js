import * as userConstants from '../_constants/user.constants';

const API_BASE_URL = 'https://teamweb-kera.onrender.com';

// --- HELPER: Send Audit Report (Internal) ---
const sendReport = async (adminUsername, activityLog) => {
    try {
        await fetch(`${API_BASE_URL}/report/add-report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: adminUsername,
                activityLog: activityLog
            }),
        });
    } catch (error) {
        console.error("Failed to send report log:", error);
    }
};

// --- EXISTING AUTH ACTIONS ---
export const login = (credentials) => async (dispatch) => {
    dispatch({ type: userConstants.LOGIN_REQUEST });
    try {
        const response = await fetch(`${API_BASE_URL}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(credentials),
        });
        const data = await response.json();
        if (response.ok) {
            dispatch({ type: userConstants.LOGIN_SUCCESS, payload: { user: data.user, message: data.message } });
            return { success: true, user: data.user };
        } else {
            dispatch({ type: userConstants.LOGIN_FAILURE, payload: data.error || 'Login failed' });
            return { success: false, error: data.error };
        }
    } catch (error) {
        dispatch({ type: userConstants.LOGIN_FAILURE, payload: 'Network error' });
        return { success: false, error: 'Network error' };
    }
};

export const logout = () => async (dispatch) => {
    dispatch({ type: userConstants.LOGOUT_REQUEST });
    try {
        await fetch(`${API_BASE_URL}/user/logout`, { method: 'POST', credentials: 'include' });
        dispatch({ type: userConstants.LOGOUT_SUCCESS });
        return { success: true };
    } catch (error) {
        dispatch({ type: userConstants.LOGOUT_FAILURE, payload: 'Network error' });
        return { success: false };
    }
};

export const checkAuth = () => async (dispatch) => {
    dispatch({ type: userConstants.CHECK_AUTH_REQUEST });
    try {
        const response = await fetch(`${API_BASE_URL}/user/check-auth`, { method: 'GET', credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            dispatch({ type: userConstants.CHECK_AUTH_SUCCESS, payload: data.user });
            return { success: true, user: data.user };
        } else {
            dispatch({ type: userConstants.CHECK_AUTH_FAILURE });
            return { success: false };
        }
    } catch (error) {
        dispatch({ type: userConstants.CHECK_AUTH_FAILURE });
        return { success: false };
    }
};

// --- NEW ACTIONS FOR MANAGE ACCOUNTS ---

// 1. Fetch List of Accounts
export const getAccounts = () => async (dispatch) => {
    dispatch({ type: userConstants.GET_ACCOUNTS_REQUEST });
    try {
        const response = await fetch(`${API_BASE_URL}/user/current-user`, {
            method: 'GET',
            credentials: 'include',
        });
        const data = await response.json();

        if (response.ok) {
            // Determine what list to show based on role response
            let accountsList = [];
            if (data.user.role === 'head_admin' && data.admins) {
                accountsList = data.admins;
            } else {
                // If regular admin, just show themselves
                accountsList = [{ ...data.user, id: data.user._id }];
            }
            dispatch({ type: userConstants.GET_ACCOUNTS_SUCCESS, payload: accountsList });
            return { success: true };
        } else {
            dispatch({ type: userConstants.GET_ACCOUNTS_FAILURE, payload: data.error || 'Failed to load accounts' });
            return { success: false };
        }
    } catch (error) {
        dispatch({ type: userConstants.GET_ACCOUNTS_FAILURE, payload: 'Network error' });
        return { success: false };
    }
};

// 2. Create Account
export const createAccount = (newAccountData, currentAdminName) => async (dispatch) => {
    dispatch({ type: userConstants.REGISTER_REQUEST });
    try {
        const response = await fetch(`${API_BASE_URL}/user/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(newAccountData),
        });
        const data = await response.json();

        if (response.ok) {
            await sendReport(currentAdminName, `[Manage Account] Created account: ${newAccountData.username} (${newAccountData.role})`);
            dispatch({ type: userConstants.REGISTER_SUCCESS, payload: 'Account created successfully' });
            return { success: true };
        } else {
            dispatch({ type: userConstants.REGISTER_FAILURE, payload: data.error });
            return { success: false, error: data.error };
        }
    } catch (error) {
        dispatch({ type: userConstants.REGISTER_FAILURE, payload: 'Network error' });
        return { success: false, error: 'Network error' };
    }
};

// 3. Update Account
export const updateAccount = (updateData, currentAdminName) => async (dispatch) => {
    dispatch({ type: userConstants.UPDATE_USER_REQUEST });
    try {
        const response = await fetch(`${API_BASE_URL}/user/update-user-info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateData),
        });
        const data = await response.json();

        if (response.ok) {
            await sendReport(currentAdminName, `[Manage Account] Updated account: ${updateData.username}`);
            dispatch({ type: userConstants.UPDATE_USER_SUCCESS, payload: { user: data.user, message: 'Updated successfully' } });
            return { success: true };
        } else {
            dispatch({ type: userConstants.UPDATE_USER_FAILURE, payload: data.error });
            return { success: false, error: data.error };
        }
    } catch (error) {
        dispatch({ type: userConstants.UPDATE_USER_FAILURE, payload: 'Network error' });
        return { success: false, error: 'Network error' };
    }
};

// 4. Delete Account
export const deleteAccount = (targetUserId, targetUsername, currentAdminName) => async (dispatch) => {
    dispatch({ type: userConstants.DELETE_USER_REQUEST });
    try {
        const response = await fetch(`${API_BASE_URL}/user/delete-account`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ targetUserId }),
        });
        const data = await response.json();

        if (response.ok) {
            await sendReport(currentAdminName, `[Manage Account] Deleted account: ${targetUsername}`);
            dispatch({ type: userConstants.DELETE_USER_SUCCESS, payload: 'Account deleted successfully' });
            return { success: true };
        } else {
            dispatch({ type: userConstants.DELETE_USER_FAILURE, payload: data.error });
            return { success: false, error: data.error };
        }
    } catch (error) {
        dispatch({ type: userConstants.DELETE_USER_FAILURE, payload: 'Network error' });
        return { success: false, error: 'Network error' };
    }
};

export const clearUserErrors = () => ({ type: userConstants.CLEAR_USER_ERRORS });

// --- PASSWORD RESET ACTIONS ---
export const forgotPassword = (email) => async (dispatch) => {
    dispatch({ type: userConstants.FORGOT_PASSWORD_REQUEST });
    try {
        const response = await fetch(`${API_BASE_URL}/user/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok) {
            dispatch({
                type: userConstants.FORGOT_PASSWORD_SUCCESS,
                payload: { message: data.message, resetToken: data.resetToken, userId: data.userId },
            });
            return { success: true, resetToken: data.resetToken, userId: data.userId };
        } else {
            dispatch({ type: userConstants.FORGOT_PASSWORD_FAILURE, payload: data.error });
            return { success: false, error: data.error };
        }
    } catch (error) {
        dispatch({ type: userConstants.FORGOT_PASSWORD_FAILURE, payload: 'Network error' });
        return { success: false };
    }
};

export const resetPassword = (password, token) => async (dispatch) => {
    dispatch({ type: userConstants.RESET_PASSWORD_REQUEST });
    try {
        const response = await fetch(`${API_BASE_URL}/user/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, token }),
        });
        const data = await response.json();
        if (response.ok) {
            dispatch({ type: userConstants.RESET_PASSWORD_SUCCESS, payload: data.message });
            return { success: true, message: data.message };
        } else {
            dispatch({ type: userConstants.RESET_PASSWORD_FAILURE, payload: data.error });
            return { success: false, error: data.error };
        }
    } catch (error) {
        dispatch({ type: userConstants.RESET_PASSWORD_FAILURE, payload: 'Network error' });
        return { success: false };
    }
};