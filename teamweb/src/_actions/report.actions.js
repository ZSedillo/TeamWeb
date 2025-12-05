import {
  REPORTS_REQUEST,
  REPORTS_SUCCESS,
  REPORTS_FAIL,
  REPORTS_DELETE_REQUEST,
  REPORTS_DELETE_SUCCESS,
  REPORTS_DELETE_FAIL
} from "../_constants/report.constants";

const BASE_URL = "https://teamweb-kera.onrender.com";

// Fetch reports
export const fetchReports = () => async (dispatch) => {
  try {
    dispatch({ type: REPORTS_REQUEST });

    const res = await fetch(`${BASE_URL}/report/view-report`, {
      method: "GET",
      credentials: "include", // ✅ Cookie Auth
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch reports");

    dispatch({ type: REPORTS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: REPORTS_FAIL, payload: error.message });
  }
};

// Delete all reports (and log who did it)
export const deleteReports = (username) => async (dispatch) => {
  try {
    dispatch({ type: REPORTS_DELETE_REQUEST });

    const res = await fetch(`${BASE_URL}/report/delete-reports`, {
      method: "DELETE",
      credentials: "include", // ✅ Cookie Auth
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }) // ✅ Pass the username to backend
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete reports");

    dispatch({ type: REPORTS_DELETE_SUCCESS, payload: data.message });
    
    // Optional: Fetch again to see the single "Logs cleared" entry
    dispatch(fetchReports()); 
  } catch (error) {
    dispatch({ type: REPORTS_DELETE_FAIL, payload: error.message });
  }
};