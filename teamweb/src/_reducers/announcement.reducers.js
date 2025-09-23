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

const initialState = {
  announcements: [],
  loading: false,
  error: null,
};

export const announcementReducer = (state = initialState, action) => {
  switch (action.type) {
    case ANNOUNCEMENTS_REQUEST:
    case ANNOUNCEMENT_ADD_REQUEST:
    case ANNOUNCEMENT_EDIT_REQUEST:
    case ANNOUNCEMENT_DELETE_REQUEST:
      return { ...state, loading: true, error: null };
    
    case ANNOUNCEMENTS_SUCCESS:
      return { ...state, loading: false, announcements: action.payload };
    
    case ANNOUNCEMENT_ADD_SUCCESS:
    case ANNOUNCEMENT_EDIT_SUCCESS:
    case ANNOUNCEMENT_DELETE_SUCCESS:
      return { ...state, loading: false };

    case ANNOUNCEMENTS_FAIL:
    case ANNOUNCEMENT_ADD_FAIL:
    case ANNOUNCEMENT_EDIT_FAIL:
    case ANNOUNCEMENT_DELETE_FAIL:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};
