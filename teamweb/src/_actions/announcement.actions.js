import {
  ANNOUNCEMENTS_REQUEST,
  ANNOUNCEMENTS_SUCCESS,
  ANNOUNCEMENTS_FAIL,
  ANNOUNCEMENT_ADD_REQUEST,
  ANNOUNCEMENT_ADD_SUCCESS,
  ANNOUNCEMENT_ADD_FAIL,
  ANNOUNCEMENT_EDIT_REQUEST,
  ANNOUNCEMENT_EDIT_SUCCESS,
  ANNOUNCEMENT_EDIT_FAIL,
  ANNOUNCEMENT_DELETE_REQUEST,
  ANNOUNCEMENT_DELETE_SUCCESS,
  ANNOUNCEMENT_DELETE_FAIL,
} from "../_constants/announcement.constants";

const BASE_URL = "https://teamweb-kera.onrender.com";

// Helper function to log activity
const logActivity = async (username, activityLog) => {
  try {
    await fetch(`${BASE_URL}/report/add-report`, {
      method: "POST",
      credentials: "include", // ✅ Send Cookies
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, activityLog }),
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

// ---------------- Fetch All Announcements ----------------
export const fetchAnnouncements = () => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENTS_REQUEST });

    const response = await fetch(`${BASE_URL}/announcement`, {
      method: "GET",
      credentials: "include", // ✅ Send Cookies
    });

    if (!response.ok) throw new Error("Failed to fetch announcements");

    const data = await response.json();

    const sortedAnnouncements = (data.announcements || []).sort(
      (a, b) =>
        new Date(b.created_at || b.createdAt) -
        new Date(a.created_at || a.createdAt)
    );

    dispatch({ type: ANNOUNCEMENTS_SUCCESS, payload: sortedAnnouncements });
  } catch (error) {
    dispatch({ type: ANNOUNCEMENTS_FAIL, payload: error.message });
  }
};

// ---------------- Add Announcement ----------------
export const addAnnouncement = (data, username) => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENT_ADD_REQUEST });

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    
    if (data.image_url instanceof File) {
        formData.append("image", data.image_url);
    } else if (typeof data.image_url === "string" && data.image_url) {
        formData.append("existing_image", data.image_url);
    }

    const response = await fetch(`${BASE_URL}/announcement/add`, {
      method: "POST",
      credentials: "include", // ✅ Send Cookies
      // Note: Do NOT set Content-Type header when sending FormData; browser sets it automatically
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to add announcement");

    // Log Activity
    await logActivity(username, `[Manage Announcement] Added Announcement: ${data.title}`);

    dispatch({ type: ANNOUNCEMENT_ADD_SUCCESS });

    // Refresh list
    dispatch(fetchAnnouncements());
  } catch (error) {
    dispatch({ type: ANNOUNCEMENT_ADD_FAIL, payload: error.message });
  }
};

// ---------------- Edit Announcement ----------------
export const editAnnouncement = (id, data, username) => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENT_EDIT_REQUEST });

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    
    if (data.image_url instanceof File) {
        formData.append("image", data.image_url);
    } else if (typeof data.image_url === "string" && data.image_url) {
        formData.append("existing_image", data.image_url);
    }

    const response = await fetch(`${BASE_URL}/announcement/edit/${id}`, {
      method: "PUT",
      credentials: "include", // ✅ Send Cookies
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to edit announcement");

    // Log Activity
    await logActivity(username, `[Manage Announcement] Edited Announcement: ${data.title}`);

    dispatch({ type: ANNOUNCEMENT_EDIT_SUCCESS });
    dispatch(fetchAnnouncements()); 
  } catch (error) {
    dispatch({ type: ANNOUNCEMENT_EDIT_FAIL, payload: error.message });
  }
};

// ---------------- Delete Announcement ----------------
export const deleteAnnouncement = (id, username, title) => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENT_DELETE_REQUEST });

    const response = await fetch(`${BASE_URL}/announcement/delete/${id}`, {
      method: "DELETE",
      credentials: "include", // ✅ Send Cookies
    });

    if (!response.ok) throw new Error("Failed to delete announcement");

    // Log Activity
    await logActivity(username, `[Manage Announcement] Deleted Announcement: ${title}`);

    dispatch({ type: ANNOUNCEMENT_DELETE_SUCCESS });
    dispatch(fetchAnnouncements()); 
  } catch (error) {
    dispatch({ type: ANNOUNCEMENT_DELETE_FAIL, payload: error.message });
  }
};