import { useTonAddress } from "@tonconnect/ui-react";

export const Address = () => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);

  return (
    userFriendlyAddress && (
      <div>
        <span>Удобный адрес: {userFriendlyAddress}</span>
        <span>Сырой адрес: {rawAddress}</span>
      </div>
    )
  );
};
