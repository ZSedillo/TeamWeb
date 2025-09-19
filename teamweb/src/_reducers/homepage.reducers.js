import {
  HOMEPAGE_IMAGES_REQUEST,
  HOMEPAGE_IMAGES_SUCCESS,
  HOMEPAGE_IMAGES_FAIL,
} from "../_constants/homepage.constants";

const initialState = {
  images: [],
  loading: false,
  error: null,
};

export const homepageReducer = (state = initialState, action) => {
  switch (action.type) {
    case HOMEPAGE_IMAGES_REQUEST:
      return { ...state, loading: true, error: null };
    case HOMEPAGE_IMAGES_SUCCESS:
      return { ...state, loading: false, images: action.payload };
    case HOMEPAGE_IMAGES_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
