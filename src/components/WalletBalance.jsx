import { useTonWallet } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";

export const WalletBalance = () => {
  const wallet = useTonWallet();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (wallet) {
      fetchBalance(wallet.address);
    }
  }, [wallet]);

  const fetchBalance = async (address) => {
    try {
      // Запрос баланса через API, например, Toncenter API
      const response = await fetch(
        `https://toncenter.com/api/v2/getAddressBalance?address=${address}`
      );
      const data = await response.json();
      setBalance(data.result);
    } catch (error) {
      console.error("Ошибка при получении баланса:", error);
    }
  };

  if (!wallet) {
    return <div>Кошелек не подключен</div>;
  }

  return (
    <div>
      <span>Кошелек: {wallet.address}</span>
      {balance ? (
        <span>Баланс: {balance / 10 ** 9} TON</span>
      ) : (
        <span>Загрузка баланса...</span>
      )}
    </div>
  );
};
