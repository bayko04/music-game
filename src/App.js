import { useState } from "react";
import "./App.css";
import MusicTilesGame from "./components/MusicTilesGame";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Wallet } from "./components/Wallet";
import { WalletBalance } from "./components/WalletBalance";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import music0 from "./musics/2.mp3";
import music1 from "./musics/ENOUGH.mp3";
import music2 from "./musics/Paradise.mp3";
import music3 from "./musics/Drift.mp3";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsGameStarted,
  setMusic,
  setName,
} from "./store/reducers/GameSlice";

function App() {
  const [start, setStart] = useState(false);
  const { isGameStarted, name } = useSelector((state) => state.game);
  const dispatch = useDispatch();

  console.log(name);
  return (
    // <BrowserRouter>
    //   <TonConnectUIProvider
    //     manifestUrl={`https://music-game-six.vercel.app/tonconnect-manifest.json`}
    //   >
    //     {/* Ваши компоненты приложения */}
    //     <div className="App">
    //       <Routes>
    //         <Route
    //           path="/"
    //           element={
    //             <>
    //               <Outlet></Outlet>
    //             </>
    //           }
    //         >
    //           <Route index element={<MusicTilesGame />} />
    //           {/* <Route path="wallets" element={<Wallet />} />
    //           <Route path="wallets-balance" element={<WalletBalance />} /> */}
    //         </Route>
    //       </Routes>
    //     </div>
    //   </TonConnectUIProvider>
    // </BrowserRouter>
    <div className="buttons-parent">
      <MusicTilesGame /* songName="ENOUGH" music={music1} */ />
      {!isGameStarted && (
        <ul>
          <li
            onClick={(e) => {
              dispatch(setMusic(music0));
              dispatch(setIsGameStarted(true));
              dispatch(setName("SpiderMan"));
            }}
          >
            SpiderMan
          </li>
          <li
            onClick={(e) => {
              dispatch(setMusic(music1));
              dispatch(setIsGameStarted(true));
              dispatch(setName("ENOUGH"));
            }}
          >
            ENOUGH
          </li>
          <li
            onClick={(e) => {
              dispatch(setMusic(music2));
              dispatch(setIsGameStarted(true));
              dispatch(setName("Paradise"));
            }}
          >
            Paradise
          </li>
          <li
            onClick={(e) => {
              dispatch(setMusic(music3));
              dispatch(setIsGameStarted(true));
              dispatch(setName("Tokyo Drift"));
            }}
          >
            Tokyo Drift
          </li>
        </ul>
      )}
    </div>
  );
}

export default App;
