import {
  ANNOUNCEMENTS_REQUEST,
  ANNOUNCEMENTS_SUCCESS,
  ANNOUNCEMENTS_FAIL,
} from "../_constants/announcement.constants";

const initialState = {
  announcements: [],
  loading: false,
  error: null,
};

export const announcementReducer = (state = initialState, action) => {
  switch (action.type) {
    case ANNOUNCEMENTS_REQUEST:
      return { ...state, loading: true, error: null };
    case ANNOUNCEMENTS_SUCCESS:
      return { ...state, loading: false, announcements: action.payload };
    case ANNOUNCEMENTS_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
