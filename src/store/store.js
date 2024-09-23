import { configureStore } from "@reduxjs/toolkit";
import GameReducer from "./reducers/GameSlice";

const store = configureStore({
  reducer: {
    game: GameReducer,
  },
});

export default store;
