import * as preRegConstants from "../_constants/preRegistration.constants";

const BASE_URL = "https://teamweb-kera.onrender.com";

// Helper for Reports (Internal)
const logActivity = async (username, activityLog) => {
  try {
    await fetch(`${BASE_URL}/report/add-report`, {
      method: "POST",
      credentials: "include", // Cookie Auth
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, activityLog }),
    });
  } catch (err) {
    console.error("Logging failed", err);
  }
};

// =================================================================
//  PUBLIC ACTIONS (No Authentication Required)
// =================================================================

// 1. Submit Pre-Registration (For Students/Parents)
export const submitPreRegistration = (formData) => async (dispatch) => {
  try {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_REQUEST });

    const response = await fetch(`${BASE_URL}/preregistration/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit registration");
    }

    dispatch({
      type: preRegConstants.PRE_REGISTRATION_SUCCESS,
      payload: data.message || "Registration submitted successfully",
    });
    
    return { success: true }; // Allow component to know it succeeded
  } catch (error) {
    dispatch({
      type: preRegConstants.PRE_REGISTRATION_FAIL,
      payload: error.message,
    });
    return { success: false, error: error.message };
  }
};

// =================================================================
//  ADMIN ACTIONS (Authentication Required)
// =================================================================

// 2. Fetch All (Main Table)
export const fetchPreRegistrations = (queryParams = {}) => async (dispatch) => {
  try {
    dispatch({ type: preRegConstants.PRE_REGISTRATIONS_REQUEST });
    const params = new URLSearchParams(queryParams).toString();
    const url = params ? `${BASE_URL}/preregistration/?${params}` : `${BASE_URL}/preregistration/`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch pre-registrations");
    const data = await response.json();

    // Sort locally by name for consistency
    const sortedRegistrations = (data.preregistration || []).sort((a, b) => {
        const lastA = (a.lastName || '').toLowerCase();
        const lastB = (b.lastName || '').toLowerCase();
        if (lastA < lastB) return -1;
        if (lastA > lastB) return 1;
        return 0;
    });

    dispatch({
      type: preRegConstants.PRE_REGISTRATIONS_SUCCESS,
      payload: {
        preRegistrations: sortedRegistrations,
        totalPages: data.totalPages || 1,
        totalRecords: data.totalRecords || sortedRegistrations.length,
        currentPage: data.currentPage || 1,
      },
    });
  } catch (error) {
    dispatch({ type: preRegConstants.PRE_REGISTRATIONS_FAIL, payload: error.message });
  }
};

// 3. Fetch Enrolled Students (Enrolled Page)
export const fetchEnrolledStudents = (queryParams = {}) => async (dispatch) => {
  try {
    dispatch({ type: preRegConstants.GET_ENROLLED_REQUEST });
    const params = new URLSearchParams(queryParams).toString();
    const url = `${BASE_URL}/preregistration/enrolled?${params}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch enrolled students");
    const data = await response.json();

    dispatch({
      type: preRegConstants.GET_ENROLLED_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({ type: preRegConstants.GET_ENROLLED_FAIL, payload: error.message });
  }
};

// 4. Fetch Report Data (For Expected & Reports Page)
export const fetchReportData = (year) => async (dispatch) => {
  try {
    dispatch({ type: preRegConstants.GET_REPORT_DATA_REQUEST });
    const url = `${BASE_URL}/preregistration?registration_year=${year}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch report data");
    const data = await response.json();
    
    // Normalize data structure (handle backend variations)
    const finalData = data.preregistration || data; 

    dispatch({ type: preRegConstants.GET_REPORT_DATA_SUCCESS, payload: finalData });
  } catch (error) {
    dispatch({ type: preRegConstants.GET_REPORT_DATA_FAIL, payload: error.message });
  }
};

// 5. Update Enrollment Status
export const updatePreRegistrationEnrollment = (id, enrollment, studentName, username) => async (dispatch) => {
  try {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_ENROLLMENT_UPDATE_REQUEST });
    const response = await fetch(`${BASE_URL}/preregistration/enrollment/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollment }),
    });
    if (!response.ok) throw new Error("Failed to update enrollment");
    
    await logActivity(username, `[Manage Enrollment] Updated ${studentName} to ${enrollment ? 'Enrolled' : 'Not Enrolled'}`);
    
    dispatch({ type: preRegConstants.PRE_REGISTRATION_ENROLLMENT_UPDATE_SUCCESS });
  } catch (error) {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_ENROLLMENT_UPDATE_FAIL, payload: error.message });
  }
};

// 6. Update Application Status (Approved/Rejected)
export const updatePreRegistrationStatus = (id, status, studentName, username) => async (dispatch) => {
  try {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_STATUS_UPDATE_REQUEST });
    const response = await fetch(`${BASE_URL}/preregistration/status/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) throw new Error("Failed to update status");

    await logActivity(username, `[Manage Pre-Registration] Updated status for ${studentName} to ${status}`);

    dispatch({ type: preRegConstants.PRE_REGISTRATION_STATUS_UPDATE_SUCCESS });
    dispatch(fetchPreRegistrations());
  } catch (error) {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_STATUS_UPDATE_FAIL, payload: error.message });
  }
};

// 7. Admin Add (Manually adding a student from dashboard)
export const addPreRegistration = (preRegData, username) => async (dispatch) => {
  try {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_ADD_REQUEST });

    const response = await fetch(`${BASE_URL}/preregistration/add`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preRegData),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to submit pre-registration");
    }

    await logActivity(username, `[Manage Pre-Registration] Manually added student: ${preRegData.firstName} ${preRegData.lastName}`);

    dispatch({ type: preRegConstants.PRE_REGISTRATION_ADD_SUCCESS });
    dispatch(fetchPreRegistrations());
  } catch (error) {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_ADD_FAIL, payload: error.message });
  }
};

// 8. Delete One
export const deletePreRegistration = (id, studentName, username) => async (dispatch) => {
  try {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_DELETE_REQUEST });
    const response = await fetch(`${BASE_URL}/preregistration/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to delete record");

    await logActivity(username, `[Manage Pre-Registration] Deleted student record for ${studentName}`);

    dispatch({ type: preRegConstants.PRE_REGISTRATION_DELETE_SUCCESS });
    dispatch(fetchPreRegistrations());
  } catch (error) {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_DELETE_FAIL, payload: error.message });
  }
};

// 9. Delete All
export const deleteAllPreRegistrations = (username) => async (dispatch) => {
  try {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_DELETE_ALL_REQUEST });
    const response = await fetch(`${BASE_URL}/preregistration/deleteAll`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to delete all records");

    await logActivity(username, `[Manage Pre-Registration] Deleted ALL student records`);

    dispatch({ type: preRegConstants.PRE_REGISTRATION_DELETE_ALL_SUCCESS });
    dispatch(fetchPreRegistrations());
  } catch (error) {
    dispatch({ type: preRegConstants.PRE_REGISTRATION_DELETE_ALL_FAIL, payload: error.message });
  }
};