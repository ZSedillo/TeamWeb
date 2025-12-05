import {
  REPORTS_REQUEST,
  REPORTS_SUCCESS,
  REPORTS_FAIL,
  REPORTS_DELETE_REQUEST,
  REPORTS_DELETE_SUCCESS,
  REPORTS_DELETE_FAIL
} from "../_constants/report.constants";

const initialState = {
  reports: [],
  loading: false,
  error: null,
  deleting: false,
  deleteSuccess: false
};

export const reportReducer = (state = initialState, action) => {
  switch (action.type) {
    // --- Fetch Reports ---
    case REPORTS_REQUEST:
      return { ...state, loading: true, error: null };
    case REPORTS_SUCCESS:
      return { ...state, loading: false, reports: action.payload };
    case REPORTS_FAIL:
      return { ...state, loading: false, error: action.payload };
    
    // --- Delete Reports ---
    case REPORTS_DELETE_REQUEST:
      return { ...state, deleting: true, deleteSuccess: false, error: null };
    case REPORTS_DELETE_SUCCESS:
      return { ...state, deleting: false, deleteSuccess: true, reports: [] }; // Clear local list immediately
    case REPORTS_DELETE_FAIL:
      return { ...state, deleting: false, error: action.payload };

    default:
      return state;
  }
};