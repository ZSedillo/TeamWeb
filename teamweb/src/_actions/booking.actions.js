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

const BASE_URL = "https://teamweb-kera.onrender.com";

// ========================== PUBLIC BOOKING SUBMIT ==========================
export const submitBooking = (bookingData) => async (dispatch) => {
  try {
    dispatch({ type: BOOKING_REQUEST });

    const response = await fetch(`${BASE_URL}/preregistration/addBooking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
      credentials: "include", // use cookies
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Failed to submit booking");

    dispatch({ type: BOOKING_SUCCESS, payload: result });
  } catch (error) {
    dispatch({ type: BOOKING_FAIL, payload: error.message });
  }
};

// ========================== ADMIN SIDE ACTIONS ==========================

// --- Fetch booking availability ---
export const fetchBookingAvailability = () => async (dispatch) => {
  try {
    dispatch({ type: BOOKING_AVAILABILITY_REQUEST });

    const res = await fetch(`${BASE_URL}/booking/bookingAvailability`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch booking availability");

    const data = await res.json();

    dispatch({ type: BOOKING_AVAILABILITY_SUCCESS, payload: data });
  } catch (err) {
    dispatch({ type: BOOKING_AVAILABILITY_FAIL, payload: err.message });
  }
};

// --- Fetch bookings (within date range) ---
export const fetchBookings = (startDate, endDate) => async (dispatch) => {
  try {
    dispatch({ type: BOOKINGS_LIST_REQUEST });

    const res = await fetch(`${BASE_URL}/booking/getBookings?start=${startDate}&end=${endDate}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch bookings");

    const data = await res.json();

    dispatch({ type: BOOKINGS_LIST_SUCCESS, payload: data });
  } catch (err) {
    dispatch({ type: BOOKINGS_LIST_FAIL, payload: err.message });
  }
};

// --- Save (Add/Update) booking availability ---
export const saveBookingAvailability = (availabilityPayload) => async (dispatch) => {
  try {
    dispatch({ type: BOOKING_SAVE_REQUEST });

    const res = await fetch(`${BASE_URL}${availabilityPayload.url}`, {
      method: availabilityPayload.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(availabilityPayload.data),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save booking availability");
    }

    dispatch({ type: BOOKING_SAVE_SUCCESS });
    dispatch(fetchBookingAvailability()); // refresh availability after save
  } catch (err) {
    dispatch({ type: BOOKING_SAVE_FAIL, payload: err.message });
  }
};

// --- Delete booking availability ---
export const deleteBookingAvailability = (id) => async (dispatch) => {
  try {
    dispatch({ type: BOOKING_DELETE_REQUEST });

    const res = await fetch(`${BASE_URL}/booking/editBookingAvailability/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: {} }),
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to delete booking availability");

    dispatch({ type: BOOKING_DELETE_SUCCESS });
    dispatch(fetchBookingAvailability()); // refresh availability after delete
  } catch (err) {
    dispatch({ type: BOOKING_DELETE_FAIL, payload: err.message });
  }
};
