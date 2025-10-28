import {
  PRE_REGISTRATION_REQUEST,
  PRE_REGISTRATION_SUCCESS,
  PRE_REGISTRATION_FAIL,
  PRE_REGISTRATIONS_REQUEST,
  PRE_REGISTRATIONS_SUCCESS,
  PRE_REGISTRATIONS_FAIL,
  PRE_REGISTRATION_ADD_REQUEST,
  PRE_REGISTRATION_ADD_SUCCESS,
  PRE_REGISTRATION_ADD_FAIL,
  PRE_REGISTRATION_STATUS_UPDATE_REQUEST,
  PRE_REGISTRATION_STATUS_UPDATE_SUCCESS,
  PRE_REGISTRATION_STATUS_UPDATE_FAIL,
  PRE_REGISTRATION_ENROLLMENT_UPDATE_REQUEST,
  PRE_REGISTRATION_ENROLLMENT_UPDATE_SUCCESS,
  PRE_REGISTRATION_ENROLLMENT_UPDATE_FAIL,
  PRE_REGISTRATION_DELETE_REQUEST,
  PRE_REGISTRATION_DELETE_SUCCESS,
  PRE_REGISTRATION_DELETE_FAIL,
  PRE_REGISTRATION_DELETE_ALL_REQUEST,
  PRE_REGISTRATION_DELETE_ALL_SUCCESS,
  PRE_REGISTRATION_DELETE_ALL_FAIL,
} from "../_constants/preRegistration.constants";

const initialState = {
  loading: false,
  preRegistrations: [],
  totalPages: 1,
  totalRecords: 0,
  currentPage: 1,
  success: false,
  error: null,
};

export const preRegistrationReducer = (state = initialState, action) => {
  switch (action.type) {
    // ========================= PUBLIC SUBMISSION =========================
    case PRE_REGISTRATION_REQUEST:
      return { ...state, loading: true, error: null, success: false };
    case PRE_REGISTRATION_SUCCESS:
      return { ...state, loading: false, success: true };
    case PRE_REGISTRATION_FAIL:
      return { ...state, loading: false, error: action.payload };

    // ========================= FETCH ALL =========================
    case PRE_REGISTRATIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case PRE_REGISTRATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        preRegistrations: action.payload.preRegistrations,
        totalPages: action.payload.totalPages,
        totalRecords: action.payload.totalRecords,
        currentPage: action.payload.currentPage,
      };
    case PRE_REGISTRATIONS_FAIL:
      return { ...state, loading: false, error: action.payload };

    // ========================= ADD =========================
    case PRE_REGISTRATION_ADD_REQUEST:
      return { ...state, loading: true, error: null };
    case PRE_REGISTRATION_ADD_SUCCESS:
      return { ...state, loading: false, success: true };
    case PRE_REGISTRATION_ADD_FAIL:
      return { ...state, loading: false, error: action.payload };

    // ========================= UPDATE STATUS =========================
    case PRE_REGISTRATION_STATUS_UPDATE_REQUEST:
      return { ...state, loading: true, error: null };
    case PRE_REGISTRATION_STATUS_UPDATE_SUCCESS:
      return { ...state, loading: false, success: true };
    case PRE_REGISTRATION_STATUS_UPDATE_FAIL:
      return { ...state, loading: false, error: action.payload };

    // ========================= UPDATE ENROLLMENT =========================
    case PRE_REGISTRATION_ENROLLMENT_UPDATE_REQUEST:
      return { ...state, loading: true, error: null };
    case PRE_REGISTRATION_ENROLLMENT_UPDATE_SUCCESS:
      return { ...state, loading: false, success: true };
    case PRE_REGISTRATION_ENROLLMENT_UPDATE_FAIL:
      return { ...state, loading: false, error: action.payload };

    // ========================= DELETE ONE =========================
    case PRE_REGISTRATION_DELETE_REQUEST:
      return { ...state, loading: true, error: null };
    case PRE_REGISTRATION_DELETE_SUCCESS:
      return { ...state, loading: false, success: true };
    case PRE_REGISTRATION_DELETE_FAIL:
      return { ...state, loading: false, error: action.payload };

    // ========================= DELETE ALL =========================
    case PRE_REGISTRATION_DELETE_ALL_REQUEST:
      return { ...state, loading: true, error: null };
    case PRE_REGISTRATION_DELETE_ALL_SUCCESS:
      return { ...state, loading: false, success: true };
    case PRE_REGISTRATION_DELETE_ALL_FAIL:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};
