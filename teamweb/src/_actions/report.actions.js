import {
  REPORTS_REQUEST,
  REPORTS_SUCCESS,
  REPORTS_FAIL,
  REPORTS_DELETE_REQUEST,
  REPORTS_DELETE_SUCCESS,
  REPORTS_DELETE_FAIL
} from "../_constants/report.constants";

// Fetch reports
export const fetchReports = () => async (dispatch) => {
  try {
    dispatch({ type: REPORTS_REQUEST });
    const token = localStorage.getItem("token");

    const res = await fetch("https://teamweb-kera.onrender.com/report/view-report", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch reports");

    dispatch({ type: REPORTS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: REPORTS_FAIL, payload: error.message });
  }
};

// Delete all reports
export const deleteReports = () => async (dispatch) => {
  try {
    dispatch({ type: REPORTS_DELETE_REQUEST });
    const token = localStorage.getItem("token");

    const res = await fetch("https://teamweb-kera.onrender.com/report/delete-reports", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete reports");

    dispatch({ type: REPORTS_DELETE_SUCCESS, payload: data.message });
    dispatch(fetchReports()); // Refresh after deletion
  } catch (error) {
    dispatch({ type: REPORTS_DELETE_FAIL, payload: error.message });
  }
};
