import {
  CALENDAR_EVENTS_REQUEST,
  CALENDAR_EVENTS_SUCCESS,
  CALENDAR_EVENTS_FAIL,
} from "../_constants/calendar.constants";

const initialState = {
  events: [],
  loading: false,
  error: null,
};

export const calendarReducer = (state = initialState, action) => {
  switch (action.type) {
    case CALENDAR_EVENTS_REQUEST:
      return { ...state, loading: true, error: null };
    case CALENDAR_EVENTS_SUCCESS:
      return { ...state, loading: false, events: action.payload };
    case CALENDAR_EVENTS_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
