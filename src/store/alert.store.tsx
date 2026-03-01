import { createContext, useContext, useState, useEffect } from "react";

export type AlertType = "success" | "error" | "info";

interface AlertState {
  id: number;
  type: AlertType;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

type AlertInput = Omit<AlertState, "id">;

interface AlertContextType {
  alert: AlertState | null;
  showAlert: (alert: AlertInput) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [alert, setAlert] = useState<AlertState | null>(null);
  useEffect(() => {
    if (!alert) return;

    const shouldAutoClose = alert.autoClose !== false;
    if (!shouldAutoClose) return;

    const duration = alert.duration ?? 3000;

    const timer = setTimeout(() => {
      setAlert(null);
    }, duration);

    return () => clearTimeout(timer);
  }, [alert?.id]);

  const showAlert = (data: AlertInput) => {
    setAlert({
      ...data,
      id: Date.now(),
    });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  return (
    <AlertContext.Provider
      value={{
        alert,
        showAlert,
        hideAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used inside AlertProvider");
  }
  return ctx;
}