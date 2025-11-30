import {
  CALENDAR_EVENTS_REQUEST,
  CALENDAR_EVENTS_SUCCESS,
  CALENDAR_EVENTS_FAIL,
  CALENDAR_ADD_REQUEST,
  CALENDAR_ADD_SUCCESS,
  CALENDAR_ADD_FAIL,
  CALENDAR_EDIT_REQUEST,
  CALENDAR_EDIT_SUCCESS,
  CALENDAR_EDIT_FAIL,
  CALENDAR_DELETE_REQUEST,
  CALENDAR_DELETE_SUCCESS,
  CALENDAR_DELETE_FAIL,
} from "../_constants/calendar.constants";

const initialState = {
  events: [],
  loading: false,
  error: null,
};

export const calendarReducer = (state = initialState, action) => {
  switch (action.type) {
    // --- Fetch ---
    case CALENDAR_EVENTS_REQUEST:
      return { ...state, loading: true, error: null };
    case CALENDAR_EVENTS_SUCCESS:
      return { ...state, loading: false, events: action.payload };
    case CALENDAR_EVENTS_FAIL:
      return { ...state, loading: false, error: action.payload };

    // --- Add ---
    case CALENDAR_ADD_REQUEST:
      return { ...state, loading: true, error: null };
    case CALENDAR_ADD_SUCCESS:
      return { ...state, loading: false };
    case CALENDAR_ADD_FAIL:
      return { ...state, loading: false, error: action.payload };

    // --- Edit ---
    case CALENDAR_EDIT_REQUEST:
      return { ...state, loading: true, error: null };
    case CALENDAR_EDIT_SUCCESS:
      return { ...state, loading: false };
    case CALENDAR_EDIT_FAIL:
      return { ...state, loading: false, error: action.payload };

    // --- Delete ---
    case CALENDAR_DELETE_REQUEST:
      return { ...state, loading: true, error: null };
    case CALENDAR_DELETE_SUCCESS:
      return { ...state, loading: false };
    case CALENDAR_DELETE_FAIL:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};