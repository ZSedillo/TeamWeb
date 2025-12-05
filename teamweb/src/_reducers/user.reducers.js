import * as userConstants from '../_constants/user.constants';

const initialState = {
    user: null,
    accounts: [],
    isAuthenticated: false,
    loading: false,
    error: null,
    message: null,
    resetToken: null,
    userId: null,
    checked: false
};

export const userReducer = (state = initialState, action) => {
    switch (action.type) {
        // --- AUTHENTICATION ---
        
        // Group 1: Actions that SHOULD trigger a re-check or loading state
        case userConstants.LOGIN_REQUEST:
        case userConstants.CHECK_AUTH_REQUEST:
        case userConstants.FORGOT_PASSWORD_REQUEST:
        case userConstants.RESET_PASSWORD_REQUEST:
            return { 
                ...state, 
                loading: true, 
                error: null, 
                message: null, 
                checked: false 
            };

        // Group 2: LOGOUT REQUEST (The Fix!)
        // When logging out, we keep 'checked: true' to prevent ProtectedRoute 
        // from panicking and trying to double-check the user again.
        case userConstants.LOGOUT_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
                checked: true // <--- THIS PREVENTS THE "GHOST LOGIN"
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
        
        case userConstants.CHECK_AUTH_SUCCESS:
            return { 
                ...state, 
                loading: false, 
                isAuthenticated: true, 
                user: action.payload, 
                error: null, 
                checked: true 
            };

        case userConstants.LOGOUT_SUCCESS:
            return { 
                ...initialState, 
                message: 'Logged out successfully', 
                checked: true 
            };

        // Failure cases
        case userConstants.LOGIN_FAILURE:
        case userConstants.LOGOUT_FAILURE:
        case userConstants.CHECK_AUTH_FAILURE:
        case userConstants.FORGOT_PASSWORD_FAILURE:
        case userConstants.RESET_PASSWORD_FAILURE:
            return { 
                ...state, 
                loading: false, 
                error: action.payload, 
                checked: true 
            };

        // ... (Keep your existing Manage Accounts cases below) ...
        // Get Accounts List
        case userConstants.GET_ACCOUNTS_REQUEST:
            return { ...state, loading: true, error: null };
        case userConstants.GET_ACCOUNTS_SUCCESS:
            return { ...state, loading: false, accounts: action.payload }; 
        case userConstants.GET_ACCOUNTS_FAILURE:
            return { ...state, loading: false, error: action.payload };

        // Register
        case userConstants.REGISTER_REQUEST:
            return { ...state, loading: true, error: null, message: null };
        case userConstants.REGISTER_SUCCESS:
            return { ...state, loading: false, message: action.payload };
        case userConstants.REGISTER_FAILURE:
            return { ...state, loading: false, error: action.payload };

        // Update
        case userConstants.UPDATE_USER_REQUEST:
            return { ...state, loading: true, error: null, message: null };
        case userConstants.UPDATE_USER_SUCCESS:
             // Logic to update the list locally
            const updatedList = state.accounts.map(acc => 
                (acc._id === action.payload.user._id || acc.id === action.payload.user._id) 
                ? { ...acc, ...action.payload.user } 
                : acc
            );
            const isCurrentUser = state.user && (state.user._id === action.payload.user._id || state.user.id === action.payload.user._id);
            
            return { 
                ...state, 
                loading: false, 
                message: action.payload.message, 
                accounts: updatedList,
                user: isCurrentUser ? { ...state.user, ...action.payload.user } : state.user
            };
        case userConstants.UPDATE_USER_FAILURE:
            return { ...state, loading: false, error: action.payload };

        // Delete
        case userConstants.DELETE_USER_REQUEST:
            return { ...state, loading: true, error: null, message: null };
        case userConstants.DELETE_USER_SUCCESS:
            return { ...state, loading: false, message: action.payload };
        case userConstants.DELETE_USER_FAILURE:
            return { ...state, loading: false, error: action.payload };

        case userConstants.FORGOT_PASSWORD_SUCCESS:
            return { ...state, loading: false, resetToken: action.payload.resetToken, userId: action.payload.userId, message: action.payload.message, checked: true };
        case userConstants.RESET_PASSWORD_SUCCESS:
            return { ...state, loading: false, message: action.payload, checked: true };

        case userConstants.CLEAR_USER_ERRORS:
            return { ...state, error: null, message: null };

        default:
            return state;
    }
};