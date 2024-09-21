import React from "react";
import "./App.css";
import MusicTilesGame from "./components/MusicTilesGame";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Wallet } from "./components/Wallet";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import manifest from "./manifest.json";

function App() {
  return (
    // <BrowserRouter>
    //   {/* <TonConnectUIProvider manifestUrl={manifest}> */}
    //   {/* Ваши компоненты приложения */}
    //   <div className="App">
    //     <Routes>
    //       <Route
    //         path="/"
    //         element={
    //           <>
    //             <Outlet></Outlet>
    //           </>
    //         }
    //       >
    //         <Route index element={<MusicTilesGame />} />
    //         <Route path="wallets" element={<Wallet />} />
    //       </Route>
    //     </Routes>
    //   </div>
    //   {/* </TonConnectUIProvider> */}
    // </BrowserRouter>
    <MusicTilesGame />
  );
}

export default App;
