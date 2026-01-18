import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import voteReducer from "./vote-slice";

const store = configureStore({
  reducer: { ui: uiReducer, vote: voteReducer }
});

export default store;
