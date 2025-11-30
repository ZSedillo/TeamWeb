import {
  CALENDAR_EVENTS_REQUEST,
  CALENDAR_EVENTS_SUCCESS,
  CALENDAR_EVENTS_FAIL,
  CALENDAR_ADD_REQUEST,
  CALENDAR_ADD_SUCCESS,
  CALENDAR_ADD_FAIL,
  CALENDAR_EDIT_REQUEST,
  CALENDAR_EDIT_SUCCESS,
  CALENDAR_EDIT_FAIL,
  CALENDAR_DELETE_REQUEST,
  CALENDAR_DELETE_SUCCESS,
  CALENDAR_DELETE_FAIL,
} from "../_constants/calendar.constants";

const BASE_URL = "https://teamweb-kera.onrender.com";

// ---------------- Fetch All Calendar Events ----------------
export const fetchCalendarEvents = () => async (dispatch) => {
  try {
    dispatch({ type: CALENDAR_EVENTS_REQUEST });

    const response = await fetch(`${BASE_URL}/calendar`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch calendar events");

    const data = await response.json();

    // Filter only events (if backend returns other types) and sort by date
    const events = data.calendar
      ? data.calendar.filter((item) => item.type === "event")
      : [];

    dispatch({
      type: CALENDAR_EVENTS_SUCCESS,
      payload: events,
    });
  } catch (error) {
    dispatch({
      type: CALENDAR_EVENTS_FAIL,
      payload: error.message,
    });
  }
};

// ---------------- Add Calendar Event ----------------
export const addCalendarEvent = (data, username = "Admin") => async (dispatch) => {
  try {
    dispatch({ type: CALENDAR_ADD_REQUEST });

    const response = await fetch(`${BASE_URL}/calendar/add`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add event: ${errorText}`);
    }

    // Add report
    await fetch(`${BASE_URL}/report/add-report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        activityLog: `[Manage Calendar] Added Event: ${data.title} on ${data.date}`,
      }),
    });

    dispatch({ type: CALENDAR_ADD_SUCCESS });

    // Refresh calendar
    dispatch(fetchCalendarEvents());
  } catch (error) {
    dispatch({ type: CALENDAR_ADD_FAIL, payload: error.message });
  }
};

// ---------------- Edit Calendar Event ----------------
export const editCalendarEvent = (id, data, username = "Admin") => async (dispatch) => {
  try {
    dispatch({ type: CALENDAR_EDIT_REQUEST });

    const response = await fetch(`${BASE_URL}/calendar/edit/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to update event");

    // Add report
    await fetch(`${BASE_URL}/report/add-report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        activityLog: `[Manage Calendar] Updated Event: '${data.title}' on '${data.date}'`,
      }),
    });

    dispatch({ type: CALENDAR_EDIT_SUCCESS });
    dispatch(fetchCalendarEvents()); // refresh list
  } catch (error) {
    dispatch({ type: CALENDAR_EDIT_FAIL, payload: error.message });
  }
};

// ---------------- Delete Calendar Event ----------------
export const deleteCalendarEvent = (id, username = "Admin", eventName, eventDate) => async (dispatch) => {
  try {
    dispatch({ type: CALENDAR_DELETE_REQUEST });

    const response = await fetch(`${BASE_URL}/calendar/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to delete event");

    // Add report
    await fetch(`${BASE_URL}/report/add-report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        activityLog: `[Manage Calendar] Deleted Event: '${eventName}' on '${eventDate}'`,
      }),
    });

    dispatch({ type: CALENDAR_DELETE_SUCCESS });
    dispatch(fetchCalendarEvents()); // refresh list
  } catch (error) {
    dispatch({ type: CALENDAR_DELETE_FAIL, payload: error.message });
  }
};

// ---------------- Delete Previous Year Events ----------------
export const deletePreviousYearEvents = () => async (dispatch) => {
  try {
    // Note: We don't necessarily need a specific request type for this unless you want to track it strictly
    // For now, we can just perform the fetch
    const response = await fetch(`${BASE_URL}/calendar/delete-previous-year`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.status === 404) {
      console.log("No data found from last year to delete.");
      return;
    }

    if (!response.ok) throw new Error("Failed to delete previous year's entries");
    
    // Optionally refresh events if needed, though these are old events
    dispatch(fetchCalendarEvents()); 
  } catch (error) {
    console.error("Error deleting previous year entries:", error);
  }
};