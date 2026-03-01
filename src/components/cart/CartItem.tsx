import type { CartItems as Item } from "../../store/cart.store";

interface Props {
  item: Item;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}

export default function CartItem({ item, onQtyChange, onRemove }: Props) {
  return (
    <div className="flex items-center gap-4">

      <div className="w-20 h-20 rounded-lg border bg-white flex items-center justify-center overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1">
        <h4 className="font-semibold text-[var(--color-primary)]">
          {item.name}
        </h4>

        <p className="text-sm text-[var(--color-muted)] mt-1">
          ₹{item.price} × {item.quantity}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() =>
              onQtyChange(Math.max(1, item.quantity - 1))
            }
            className="w-7 h-7 rounded border text-sm font-medium hover:bg-gray-100"
          >
            −
          </button>

          <span className="text-sm font-medium w-6 text-center">
            {item.quantity}
          </span>

          <button
            onClick={() =>
              onQtyChange(item.quantity + 1)
            }
            className="w-7 h-7 rounded border text-sm font-medium hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="text-sm text-red-500 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}