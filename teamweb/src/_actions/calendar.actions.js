import {
  CALENDAR_EVENTS_REQUEST,
  CALENDAR_EVENTS_SUCCESS,
  CALENDAR_EVENTS_FAIL,
} from "../_constants/calendar.constants";

export const fetchCalendarEvents = () => async (dispatch) => {
  try {
    dispatch({ type: CALENDAR_EVENTS_REQUEST });

    const response = await fetch("https://teamweb-kera.onrender.com/calendar");
    if (!response.ok) throw new Error("Failed to fetch calendar events");

    const data = await response.json();

    const events = data.calendar?.filter(item => item.type === "event") || [];

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
