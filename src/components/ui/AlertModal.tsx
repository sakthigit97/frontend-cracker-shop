import { useAlert } from "../../store/alert.store";

export default function AlertModal() {
  const { alert, hideAlert } = useAlert();

  if (!alert) return null;

  const styles = {
    success: "bg-green-100 border-green-300 text-green-800",
    error: "bg-red-100 border-red-300 text-red-800",
    info: "bg-blue-100 border-blue-300 text-blue-800",
  };

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div
        className={`rounded-xl border p-4 shadow-lg bg-white ${styles[alert.type]}`}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg">
            {icons[alert.type]}
          </span>

          <p className="text-sm font-medium flex-1">
            {alert.message}
          </p>

          <button
            onClick={hideAlert}
            className="text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <button
          onClick={hideAlert}
          className="mt-3 w-full rounded-md bg-white border py-1.5 text-sm font-medium"
        >
          OK
        </button>
      </div>
    </div>
  );
}