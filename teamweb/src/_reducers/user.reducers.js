import * as userConstants from '../_constants/user.constants';

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    message: null,
    resetToken: null,
    userId: null,
    checked: false // ✅ new flag
};

export const userReducer = (state = initialState, action) => {
    switch (action.type) {
        // Login cases
        case userConstants.LOGIN_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                message: null,
                checked: false
            };
        
        case userConstants.LOGIN_SUCCESS:
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                user: action.payload.user,
                message: action.payload.message,
                error: null,
                checked: true
            };
        
        case userConstants.LOGIN_FAILURE:
            return {
                ...state,
                loading: false,
                isAuthenticated: false,
                user: null,
                error: action.payload,
                message: null,
                checked: true
            };

        // Logout cases
        case userConstants.LOGOUT_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                checked: false
            };
        
        case userConstants.LOGOUT_SUCCESS:
            return {
                ...initialState, // Reset to initial state
                message: 'Logged out successfully',
                checked: true
            };
        
        case userConstants.LOGOUT_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                checked: true
            };

        // Check authentication cases
        case userConstants.CHECK_AUTH_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                checked: false
            };
        
        case userConstants.CHECK_AUTH_SUCCESS:
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                user: action.payload,
                error: null,
                checked: true
            };
        
        case userConstants.CHECK_AUTH_FAILURE:
            return {
                ...state,
                loading: false,
                isAuthenticated: false,
                user: null,
                error: null, // Don't set error for failed auth check
                checked: true
            };

        // Clear errors
        case userConstants.CLEAR_USER_ERRORS:
            return {
                ...state,
                error: null,
                message: null
            };

        // Forgot password cases
        case userConstants.FORGOT_PASSWORD_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                message: null,
                checked: false
            };

        case userConstants.FORGOT_PASSWORD_SUCCESS:
            return {
                ...state,
                loading: false,
                resetToken: action.payload.resetToken,
                userId: action.payload.userId,
                message: action.payload.message,
                error: null,
                checked: true
            };

        case userConstants.FORGOT_PASSWORD_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                checked: true
            };

        // Reset password cases
        case userConstants.RESET_PASSWORD_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                message: null,
                checked: false,
            };

        case userConstants.RESET_PASSWORD_SUCCESS:
            return {
                ...state,
                loading: false,
                message: action.payload,
                error: null,
                checked: true,
            };

        case userConstants.RESET_PASSWORD_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                checked: true,
            };


        default:
            return state;
    }
};
