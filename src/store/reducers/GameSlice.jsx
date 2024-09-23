import { createSlice } from "@reduxjs/toolkit";

const GameSlice = createSlice({
  name: "game",
  initialState: {
    isGameStarted: false,
    name: "",
    game: null,
  },
  reducers: {
    setIsGameStarted: (state, action) => {
      state.isGameStarted = action.payload;
    },
    setName: (state, action) => {
      state.name = action.payload;
    },
    setMusic: (state, action) => {
      state.music = action.payload;
    },
  },
});

export const { setIsGameStarted, setName, setMusic } = GameSlice.actions;
export default GameSlice.reducer;
