import { useTonAddress } from "@tonconnect/ui-react";

export const useAddress = () => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);

  return [userFriendlyAddress, rawAddress];
};
