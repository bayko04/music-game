import { useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";

export const SendTransaction = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [receiver, setReceiver] = useState(null);

  const sendTransaction = () => {
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60, // Время жизни транзакции (60 секунд)
      messages: [
        {
          address: "EQDmnxDMhId6v1Ofg_h5KR5coWlFG6e86Ro3pc7Tq4CA0-Jn", // Адрес получателя
          amount: "1000000000", // Сумма в наноТоннах (1 TON)
        },
      ],
    };

    tonConnectUI.sendTransaction(transaction).catch((error) => {
      console.error("Transaction failed:", error);
    });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <form action="">
        <p htmlFor="">Адрес получателя</p>
        <input
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          type="text"
        />
      </form>
      <button onClick={sendTransaction}>Send 1 TON</button>
    </div>
  );
};

export default SendTransaction;
