import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import voteReducer from "./vote-slice";
import authReducer from "./authSlice";

const store = configureStore({
  reducer: { ui: uiReducer, vote: voteReducer, auth: authReducer }
});

export default store;
