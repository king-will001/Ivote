import { createSlice } from '@reduxjs/toolkit';
import { loadAuth } from '../utils/authStorage';

const storedAuth = loadAuth();

const initialState = {
  user: storedAuth?.user || null,
  token: storedAuth?.token || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action) {
      state.user = action.payload?.user || null;
      state.token = action.payload?.token || null;
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;
