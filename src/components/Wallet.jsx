import { useTonWallet } from "@tonconnect/ui-react";
import { TonConnectButton } from "@tonconnect/ui-react";
import { useEffect } from "react";

export const Wallet = () => {
  const wallet = useTonWallet();

  return (
    <>
      <span>Мое приложение с React UI</span>
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
      s )
    </>
  );
};
