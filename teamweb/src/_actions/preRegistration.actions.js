import {
  PRE_REGISTRATION_REQUEST,
  PRE_REGISTRATION_SUCCESS,
  PRE_REGISTRATION_FAIL,
} from "../_constants/preRegistration.constants";

// Submit pre-registration data
export const submitPreRegistration = (preRegData) => async (dispatch) => {
  try {
    dispatch({ type: PRE_REGISTRATION_REQUEST });

    const response = await fetch("https://teamweb-kera.onrender.com/preregistration/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preRegData),
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Failed to submit pre-registration");

    dispatch({ type: PRE_REGISTRATION_SUCCESS, payload: result });
  } catch (error) {
    dispatch({ type: PRE_REGISTRATION_FAIL, payload: error.message });
  }
};
