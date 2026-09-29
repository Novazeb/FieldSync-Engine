import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

interface SessionState {
  isAuthenticated: boolean;
  userId: string | null;
  userName: string | null;
  warehouseId: string | null;
}

const initialSession: SessionState = {
  isAuthenticated: false,
  userId: null,
  userName: null,
  warehouseId: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState: initialSession,
  reducers: {
    login(state, action: PayloadAction<{ userId: string; userName: string; warehouseId: string }>) {
      state.isAuthenticated = true;
      state.userId = action.payload.userId;
      state.userName = action.payload.userName;
      state.warehouseId = action.payload.warehouseId;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.userId = null;
      state.userName = null;
      state.warehouseId = null;
    },
  },
});

export const { login, logout } = sessionSlice.actions;

export const store = configureStore({
  reducer: {
    session: sessionSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
