import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice"; // ✅ Import the default reducer directly
import voteSlice from "./vote-slice";

const store = configureStore({
  reducer: { ui: uiReducer, vote: voteSlice.reducer } // ✅ This now works!
});

export default store;
