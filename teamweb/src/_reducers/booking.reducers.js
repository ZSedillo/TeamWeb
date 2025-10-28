import {
  BOOKING_REQUEST,
  BOOKING_SUCCESS,
  BOOKING_FAIL,
  BOOKING_AVAILABILITY_REQUEST,
  BOOKING_AVAILABILITY_SUCCESS,
  BOOKING_AVAILABILITY_FAIL,
  BOOKINGS_LIST_REQUEST,
  BOOKINGS_LIST_SUCCESS,
  BOOKINGS_LIST_FAIL,
  BOOKING_SAVE_REQUEST,
  BOOKING_SAVE_SUCCESS,
  BOOKING_SAVE_FAIL,
  BOOKING_DELETE_REQUEST,
  BOOKING_DELETE_SUCCESS,
  BOOKING_DELETE_FAIL,
} from "../_constants/booking.constants";

// --- Existing preregistration booking submit reducer ---
const initialState = { loading: false, success: false, error: null };
export const bookingReducer = (state = initialState, action) => {
  switch (action.type) {
    case BOOKING_REQUEST:
      return { ...state, loading: true, error: null };
    case BOOKING_SUCCESS:
      return { ...state, loading: false, success: true };
    case BOOKING_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// --- Booking availability for calendar ---
export const bookingAvailabilityReducer = (state = { availability: [], loading: false, error: null }, action) => {
  switch(action.type){
    case BOOKING_AVAILABILITY_REQUEST:
      return { ...state, loading: true };
    case BOOKING_AVAILABILITY_SUCCESS:
      return { loading: false, availability: action.payload };
    case BOOKING_AVAILABILITY_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// --- Bookings list for selected date/week ---
export const bookingsListReducer = (state = { bookings: [], loading: false, error: null }, action) => {
  switch(action.type){
    case BOOKINGS_LIST_REQUEST:
      return { ...state, loading: true };
    case BOOKINGS_LIST_SUCCESS:
      return { loading: false, bookings: action.payload };
    case BOOKINGS_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// --- Save (add/update) booking availability ---
export const bookingSaveReducer = (state = { success: false, loading: false, error: null }, action) => {
  switch(action.type){
    case BOOKING_SAVE_REQUEST:
      return { ...state, loading: true };
    case BOOKING_SAVE_SUCCESS:
      return { loading: false, success: true };
    case BOOKING_SAVE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// --- Delete booking availability ---
export const bookingDeleteReducer = (state = { success: false, loading: false, error: null }, action) => {
  switch(action.type){
    case BOOKING_DELETE_REQUEST:
      return { ...state, loading: true };
    case BOOKING_DELETE_SUCCESS:
      return { loading: false, success: true };
    case BOOKING_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
