import * as preRegConstants from "../_constants/preRegistration.constants";

const initialState = {
  loading: false,
  preRegistrations: [], // Main Table Data
  enrolledStudents: [], // Enrolled Page Data
  reportData: [],       // Reports/Expected Data
  totalPages: 1,
  totalRecords: 0,
  currentPage: 1,
  success: false,
  error: null,
};

export const preRegistrationReducer = (state = initialState, action) => {
  switch (action.type) {
    // --- Public Submit ---
    case preRegConstants.PRE_REGISTRATION_REQUEST:
      return { ...state, loading: true, error: null, success: false };
    case preRegConstants.PRE_REGISTRATION_SUCCESS:
      return { ...state, loading: false, success: true };
    case preRegConstants.PRE_REGISTRATION_FAIL:
      return { ...state, loading: false, error: action.payload };

    // --- Fetch All (Main Table) ---
    case preRegConstants.PRE_REGISTRATIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case preRegConstants.PRE_REGISTRATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        preRegistrations: action.payload.preRegistrations,
        totalPages: action.payload.totalPages,
        totalRecords: action.payload.totalRecords,
        currentPage: action.payload.currentPage,
      };
    case preRegConstants.PRE_REGISTRATIONS_FAIL:
      return { ...state, loading: false, error: action.payload };

    // --- Fetch Enrolled (Enrolled Page) ---
    case preRegConstants.GET_ENROLLED_REQUEST:
      return { ...state, loading: true, error: null };
    case preRegConstants.GET_ENROLLED_SUCCESS:
      return {
        ...state,
        loading: false,
        enrolledStudents: action.payload.preregistration,
        totalPages: action.payload.totalPages,
        totalRecords: action.payload.totalRecords,
        currentPage: action.payload.currentPage,
      };
    case preRegConstants.GET_ENROLLED_FAIL:
      return { ...state, loading: false, error: action.payload };

    // --- Fetch Report Data ---
    case preRegConstants.GET_REPORT_DATA_REQUEST:
      return { ...state, loading: true, error: null };
    case preRegConstants.GET_REPORT_DATA_SUCCESS:
      return { ...state, loading: false, reportData: action.payload };
    case preRegConstants.GET_REPORT_DATA_FAIL:
      return { ...state, loading: false, error: action.payload };

    // --- CRUD Success States ---
    case preRegConstants.PRE_REGISTRATION_ADD_SUCCESS:
    case preRegConstants.PRE_REGISTRATION_STATUS_UPDATE_SUCCESS:
    case preRegConstants.PRE_REGISTRATION_ENROLLMENT_UPDATE_SUCCESS:
    case preRegConstants.PRE_REGISTRATION_DELETE_SUCCESS:
    case preRegConstants.PRE_REGISTRATION_DELETE_ALL_SUCCESS:
      return { ...state, loading: false, success: true };

    // --- CRUD Loading/Fail ---
    case preRegConstants.PRE_REGISTRATION_ADD_REQUEST:
    case preRegConstants.PRE_REGISTRATION_STATUS_UPDATE_REQUEST:
    case preRegConstants.PRE_REGISTRATION_ENROLLMENT_UPDATE_REQUEST:
    case preRegConstants.PRE_REGISTRATION_DELETE_REQUEST:
    case preRegConstants.PRE_REGISTRATION_DELETE_ALL_REQUEST:
      return { ...state, loading: true, error: null };

    case preRegConstants.PRE_REGISTRATION_ADD_FAIL:
    case preRegConstants.PRE_REGISTRATION_STATUS_UPDATE_FAIL:
    case preRegConstants.PRE_REGISTRATION_ENROLLMENT_UPDATE_FAIL:
    case preRegConstants.PRE_REGISTRATION_DELETE_FAIL:
    case preRegConstants.PRE_REGISTRATION_DELETE_ALL_FAIL:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};