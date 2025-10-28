import {
  PRE_REGISTRATION_REQUEST,
  PRE_REGISTRATION_SUCCESS,
  PRE_REGISTRATION_FAIL,
  PRE_REGISTRATIONS_REQUEST,
  PRE_REGISTRATIONS_SUCCESS,
  PRE_REGISTRATIONS_FAIL,
  PRE_REGISTRATION_ADD_REQUEST,
  PRE_REGISTRATION_ADD_SUCCESS,
  PRE_REGISTRATION_ADD_FAIL,
  PRE_REGISTRATION_STATUS_UPDATE_REQUEST,
  PRE_REGISTRATION_STATUS_UPDATE_SUCCESS,
  PRE_REGISTRATION_STATUS_UPDATE_FAIL,
  PRE_REGISTRATION_ENROLLMENT_UPDATE_REQUEST,
  PRE_REGISTRATION_ENROLLMENT_UPDATE_SUCCESS,
  PRE_REGISTRATION_ENROLLMENT_UPDATE_FAIL,
  PRE_REGISTRATION_DELETE_REQUEST,
  PRE_REGISTRATION_DELETE_SUCCESS,
  PRE_REGISTRATION_DELETE_FAIL,
  PRE_REGISTRATION_DELETE_ALL_REQUEST,
  PRE_REGISTRATION_DELETE_ALL_SUCCESS,
  PRE_REGISTRATION_DELETE_ALL_FAIL,
} from "../_constants/preRegistration.constants";

const BASE_URL = "https://teamweb-kera.onrender.com";
// ========================== PUBLIC PRE-REGISTRATION SUBMIT ==========================
export const submitPreRegistration = (preRegData) => async (dispatch) => {
  try {
    dispatch({ type: PRE_REGISTRATION_REQUEST });

    const response = await fetch(`${BASE_URL}/preregistration/add`, {
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

// ========================== ADMIN SIDE ACTIONS ==========================
// ---------------- Fetch All Pre-Registrations ----------------
export const fetchPreRegistrations = (queryParams = {}) => async (dispatch) => {
  try {
    dispatch({ type: PRE_REGISTRATIONS_REQUEST });

    const params = new URLSearchParams(queryParams).toString();
    const url = params ? `${BASE_URL}/preregistration/?${params}` : `${BASE_URL}/preregistration/`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch pre-registrations");

    const data = await response.json();

    // Sort by last name
    const sortedRegistrations = (data.preregistration || []).sort((a, b) => {
      const lastA = (a.lastName || '').toLowerCase();
      const lastB = (b.lastName || '').toLowerCase();
      if (lastA < lastB) return -1;
      if (lastA > lastB) return 1;
      return 0;
    });

    dispatch({
      type: PRE_REGISTRATIONS_SUCCESS,
      payload: {
        preRegistrations: sortedRegistrations,
        totalPages: data.totalPages || 1,
        totalRecords: data.totalRecords || sortedRegistrations.length,
        currentPage: data.currentPage || 1,
      },
    });
  } catch (error) {
    dispatch({ type: PRE_REGISTRATIONS_FAIL, payload: error.message });
  }
};

// ---------------- Add Pre-Registration ----------------
export const addPreRegistration = (preRegData) => async (dispatch) => {
  try {
    dispatch({ type: PRE_REGISTRATION_ADD_REQUEST });

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

    dispatch({ type: PRE_REGISTRATION_ADD_SUCCESS });

    // Refresh pre-registrations
    dispatch(fetchPreRegistrations());
  } catch (error) {
    dispatch({ type: PRE_REGISTRATION_ADD_FAIL, payload: error.message });
  }
};

// ---------------- Update Status ----------------
export const updatePreRegistrationStatus = (id, status, studentName, username = "Admin") => async (dispatch) => {
  try {
    dispatch({ type: PRE_REGISTRATION_STATUS_UPDATE_REQUEST });

    const response = await fetch(`${BASE_URL}/preregistration/status/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) throw new Error("Failed to update status");

    // Add report
    await fetch(`${BASE_URL}/report/add-report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        activityLog: `[Manage Pre-Registration:Student Records] Updated status for student ${studentName} (ID: ${id}) to ${status}`,
      }),
    });

    dispatch({ type: PRE_REGISTRATION_STATUS_UPDATE_SUCCESS });
    dispatch(fetchPreRegistrations());
  } catch (error) {
    dispatch({ type: PRE_REGISTRATION_STATUS_UPDATE_FAIL, payload: error.message });
  }
};

// ---------------- Update Enrollment ----------------
export const updatePreRegistrationEnrollment = (id, enrollment, studentName, username = "Admin") => async (dispatch) => {
  try {
    dispatch({ type: PRE_REGISTRATION_ENROLLMENT_UPDATE_REQUEST });

    const response = await fetch(`${BASE_URL}/preregistration/enrollment/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollment }),
    });

    if (!response.ok) throw new Error("Failed to update enrollment status");

    // Add report
    await fetch(`${BASE_URL}/report/add-report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        activityLog: `[Manage Pre-Registration:Student Records] Updated enrollment for student ${studentName} (ID: ${id}) to ${enrollment ? 'Enrolled' : 'Not Enrolled'}`,
      }),
    });

    dispatch({ type: PRE_REGISTRATION_ENROLLMENT_UPDATE_SUCCESS });
    dispatch(fetchPreRegistrations());
  } catch (error) {
    dispatch({ type: PRE_REGISTRATION_ENROLLMENT_UPDATE_FAIL, payload: error.message });
  }
};

// ---------------- Delete Pre-Registration ----------------
export const deletePreRegistration = (id, studentName, username = "Admin") => async (dispatch) => {
  try {
    dispatch({ type: PRE_REGISTRATION_DELETE_REQUEST });

    const response = await fetch(`${BASE_URL}/preregistration/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to delete pre-registration");

    // Add report
    await fetch(`${BASE_URL}/report/add-report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        activityLog: `[Manage Pre-Registration] Deleted student record for ${studentName}`,
      }),
    });

    dispatch({ type: PRE_REGISTRATION_DELETE_SUCCESS });
    dispatch(fetchPreRegistrations());
  } catch (error) {
    dispatch({ type: PRE_REGISTRATION_DELETE_FAIL, payload: error.message });
  }
};

// ---------------- Delete All Pre-Registrations ----------------
export const deleteAllPreRegistrations = (registrationData = [], username = "Admin") => async (dispatch) => {
  try {
    dispatch({ type: PRE_REGISTRATION_DELETE_ALL_REQUEST });

    const response = await fetch(`${BASE_URL}/preregistration/deleteAll`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to delete all pre-registrations");

    // Add report for deletion
    await fetch(`${BASE_URL}/report/add-report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        activityLog: `[Manage Pre-Registration] Deleted all pre-registration records`,
      }),
    });

    // Export CSV if data exists
    if (Array.isArray(registrationData) && registrationData.length > 0) {
      const csvRows = [
        ['Name', 'Phone Number', 'Grade Level', 'Strand', 'Gender', 'Email', 'Student Type', 'Status', 'Registration Date']
      ];

      registrationData.forEach(student => {
        csvRows.push([
          student.name || '',
          student.phone_number || '',
          student.grade_level || '',
          student.strand || 'N/A',
          student.gender || '',
          student.email || '',
          student.isNewStudent === 'new' ? 'New Student' : 'Returning Student',
          student.status || '',
          student.createdAt ? new Date(student.createdAt).toLocaleDateString() : ''
        ]);
      });

      const csvContent = csvRows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `pre_registration_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log export activity
      await fetch(`${BASE_URL}/report/add-report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          activityLog: `[Manage Pre-Registration: Reports] Pre-registration records exported as CSV on ${new Date().toLocaleString()}`,
        }),
      });
    }

    dispatch({ type: PRE_REGISTRATION_DELETE_ALL_SUCCESS });
    dispatch(fetchPreRegistrations());
  } catch (error) {
    dispatch({ type: PRE_REGISTRATION_DELETE_ALL_FAIL, payload: error.message });
  }
};