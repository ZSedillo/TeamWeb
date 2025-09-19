import {
  HOMEPAGE_IMAGES_REQUEST,
  HOMEPAGE_IMAGES_SUCCESS,
  HOMEPAGE_IMAGES_FAIL,
} from "../_constants/homepage.constants";

export const fetchHomepageImages = () => async (dispatch) => {
  try {
    dispatch({ type: HOMEPAGE_IMAGES_REQUEST });

    const response = await fetch(
      "https://teamweb-kera.onrender.com/homepage/images"
    );

    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const data = await response.json();

    dispatch({ type: HOMEPAGE_IMAGES_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: HOMEPAGE_IMAGES_FAIL,
      payload:
        error.message || "Something went wrong while fetching homepage images",
    });
  }
};
