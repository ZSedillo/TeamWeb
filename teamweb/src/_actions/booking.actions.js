import {
  BOOKING_REQUEST,
  BOOKING_SUCCESS,
  BOOKING_FAIL,
} from "../_constants/booking.constants";

// Submit booking data
export const submitBooking = (bookingData) => async (dispatch) => {
  try {
    dispatch({ type: BOOKING_REQUEST });

    const response = await fetch("https://teamweb-kera.onrender.com/preregistration/addBooking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to submit booking");

    dispatch({ type: BOOKING_SUCCESS, payload: result });
  } catch (error) {
    dispatch({ type: BOOKING_FAIL, payload: error.message });
  }
};
