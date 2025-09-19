import {
  ANNOUNCEMENTS_REQUEST,
  ANNOUNCEMENTS_SUCCESS,
  ANNOUNCEMENTS_FAIL,
} from "../_constants/announcement.constants";

export const fetchAnnouncements = () => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENTS_REQUEST });

    const response = await fetch("https://teamweb-kera.onrender.com/announcement");
    if (!response.ok) throw new Error("Failed to fetch announcements");

    const data = await response.json();

    // Sort announcements by created date
    const sortedAnnouncements = data.announcements?.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt);
      const dateB = new Date(b.created_at || b.createdAt);
      return dateB - dateA;
    }) || [];

    dispatch({
      type: ANNOUNCEMENTS_SUCCESS,
      payload: sortedAnnouncements,
    });
  } catch (error) {
    dispatch({
      type: ANNOUNCEMENTS_FAIL,
      payload: error.message,
    });
  }
};
