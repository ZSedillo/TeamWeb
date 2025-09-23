import * as userConstants from '../_constants/user.constants';

const API_BASE_URL = 'https://teamweb-kera.onrender.com';

// Login action
export const login = (credentials) => {
    return async (dispatch) => {
        dispatch({ type: userConstants.LOGIN_REQUEST });
        
        try {
            const response = await fetch(`${API_BASE_URL}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important: include cookies in requests
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({
                    type: userConstants.LOGIN_SUCCESS,
                    payload: {
                        user: data.user,
                        message: data.message
                    }
                });
                return { success: true, user: data.user };
            } else {
                dispatch({
                    type: userConstants.LOGIN_FAILURE,
                    payload: data.error || 'Login failed'
                });
                return { success: false, error: data.error };
            }
        } catch (error) {
            dispatch({
                type: userConstants.LOGIN_FAILURE,
                payload: 'Network error. Please try again.'
            });
            return { success: false, error: 'Network error. Please try again.' };
        }
    };
};

// Logout action
export const logout = () => {
    return async (dispatch) => {
        dispatch({ type: userConstants.LOGOUT_REQUEST });
        
        try {
            const response = await fetch(`${API_BASE_URL}/user/logout`, {
                method: 'POST',
                credentials: 'include', // Important: include cookies in requests
            });

            if (response.ok) {
                dispatch({ type: userConstants.LOGOUT_SUCCESS });
                return { success: true };
            } else {
                const data = await response.json();
                dispatch({
                    type: userConstants.LOGOUT_FAILURE,
                    payload: data.error || 'Logout failed'
                });
                return { success: false, error: data.error };
            }
        } catch (error) {
            dispatch({
                type: userConstants.LOGOUT_FAILURE,
                payload: 'Network error. Please try again.'
            });
            return { success: false, error: 'Network error. Please try again.' };
        }
    };
};

// Check authentication action (for page loads/refreshes)
export const checkAuth = () => {
    return async (dispatch) => {
        dispatch({ type: userConstants.CHECK_AUTH_REQUEST });
        
        try {
            const response = await fetch(`${API_BASE_URL}/user/check-auth`, {
                method: 'GET',
                credentials: 'include', // Important: include cookies in requests
            });

            if (response.ok) {
                const data = await response.json();
                dispatch({
                    type: userConstants.CHECK_AUTH_SUCCESS,
                    payload: data.user
                });
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
};

// Clear errors action
export const clearUserErrors = () => ({
    type: userConstants.CLEAR_USER_ERRORS
});

// Get current user action (protected route)
export const getCurrentUser = () => {
    return async (dispatch) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/current-user`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, data };
            } else {
                return { success: false };
            }
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };
};

// Forgot password action
export const forgotPassword = (email) => {
    return async (dispatch) => {
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
                    payload: data.message || "Verification email sent",
                });
                return { success: true, resetToken: data.resetToken, userId: data.userId };
            } else {
                dispatch({
                    type: userConstants.FORGOT_PASSWORD_FAILURE,
                    payload: data.error || "Failed to verify email",
                });
                return { success: false, error: data.error };
            }
        } catch (error) {
            dispatch({
                type: userConstants.FORGOT_PASSWORD_FAILURE,
                payload: "Network error. Please try again.",
            });
            return { success: false, error: "Network error. Please try again." };
        }
    };
};



// Reset password action
export const resetPassword = (password, token) => {
    return async (dispatch) => {
        dispatch({ type: userConstants.RESET_PASSWORD_REQUEST });

        try {
            const response = await fetch(`${API_BASE_URL}/user/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, token }),
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({
                    type: userConstants.RESET_PASSWORD_SUCCESS,
                    payload: data.message || 'Password reset successful',
                });
                return { success: true, message: data.message };
            } else {
                dispatch({
                    type: userConstants.RESET_PASSWORD_FAILURE,
                    payload: data.error || 'Failed to reset password',
                });
                return { success: false, error: data.error };
            }
        } catch (error) {
            dispatch({
                type: userConstants.RESET_PASSWORD_FAILURE,
                payload: 'Network error. Please try again.',
            });
            return { success: false, error: 'Network error. Please try again.' };
        }
    };
};

