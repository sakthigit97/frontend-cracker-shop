export default function Toggle({
    checked,
    onChange,
    disabled,
}: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onChange}
            disabled={disabled}
            className={`
        w-10 h-5 flex items-center rounded-full p-1 transition
        ${checked ? "bg-green-500" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
        >
            <div
                className={`
          bg-white w-4 h-4 rounded-full shadow transform transition
          ${checked ? "translate-x-5" : ""}
        `}
            />
        </button>
    );
}