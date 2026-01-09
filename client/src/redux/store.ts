import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/authSlice';
import creditsReducer from './slices/creditsSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    credits: creditsReducer,
  },
});


export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store;