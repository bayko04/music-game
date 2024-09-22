import { useTonConnectModal } from "@tonconnect/ui-react";

export const ModalControl = () => {
  const { state, open, close } = useTonConnectModal();

  return (
    <div>
      <div>Состояние модального окна: {state?.status}</div>
      <button onClick={open}>Открыть модальное окно</button>
      <button onClick={close}>Закрыть модальное окно</button>
    </div>
  );
};
