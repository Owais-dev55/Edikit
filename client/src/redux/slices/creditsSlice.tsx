import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CreditsData } from "@/lib/credits";

interface CreditsState extends Partial<CreditsData> {
  isLoading: boolean;
  error: string | null;
}

const initialState: CreditsState = {
  credits: undefined,
  planType: undefined,
  limit: undefined,
  canRender: undefined,
  isLoading: true,
  error: null,
};

const creditsSlice = createSlice({
  name: "credits",
  initialState,
  reducers: {
    setCredits: (state, action: PayloadAction<CreditsData>) => {
      state.credits = action.payload.credits;
      state.planType = action.payload.planType;
      state.limit = action.payload.limit;
      state.canRender = action.payload.canRender;
      state.isLoading = false;
      state.error = null;
    },
    updateCredits: (state, action: PayloadAction<number>) => {
      state.credits = action.payload;
      state.canRender = action.payload > 0;
    },
    setCreditsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCreditsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearCredits: (state) => {
      state.credits = undefined;
      state.planType = undefined;
      state.limit = undefined;
      state.canRender = undefined;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setCredits,
  updateCredits,
  setCreditsLoading,
  setCreditsError,
  clearCredits,
} = creditsSlice.actions;
export default creditsSlice.reducer;
