import {
  BOOKING_REQUEST,
  BOOKING_SUCCESS,
  BOOKING_FAIL,
} from "../_constants/booking.constants";

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
