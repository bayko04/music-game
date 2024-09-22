import { useTonWallet } from "@tonconnect/ui-react";
import { TonConnectButton } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import { Address, useAddress } from "../hooks/useAdress";
import { ModalControl } from "./ModalControl";
import { useTonAddress } from "@tonconnect/ui-react";

export const Wallet = () => {
  const wallet = useTonWallet();
  const [balance, setBalance] = useState(null);
  const [userFriendlyAddress, rawAddress] = useAddress();

  // useEffect(() => {
  //   const fetchBalance = async () => {
  //     try {
  //       const adress = await fetch(
  //         `https://toncenter.com/api/v2/getAddressBalance?address=${userFriendlyAddress}`
  //       );
  //       const balance = await adress.json();
  //       setBalance(balance);
  //     } catch (error) {
  //       console.error("Ошибка получения баланса:", error);
  //       setBalance(0);
  //     }
  //   };

  //   fetchBalance();
  // }, [userFriendlyAddress]);

  console.log(userFriendlyAddress);

  return (
    <>
      {userFriendlyAddress && <h1>Баланс кошелька {balance}</h1>}
      <TonConnectButton />
      <div>
        {wallet ? (
          <>
            <span>Подключенный кошелек: {wallet.name}</span>
            <span>Устройство: {wallet.device.appName}</span>
          </>
        ) : (
          <span>Кошелек не подключен</span>
        )}
      </div>
    </>
  );
};
