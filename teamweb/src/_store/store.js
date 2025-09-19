import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import * as ReduxThunk from "redux-thunk";
import { homepageReducer } from "../_reducers/homepage.reducers";
import { announcementReducer } from "../_reducers/announcement.reducers";
import { calendarReducer } from "../_reducers/calendar.reducers";

const thunk = ReduxThunk.thunk || ReduxThunk.default;

const reducer = combineReducers({
  homepage: homepageReducer,
  announcementState: announcementReducer,
  calendarState: calendarReducer,
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(reducer, composeEnhancers(applyMiddleware(thunk)));

export default store;