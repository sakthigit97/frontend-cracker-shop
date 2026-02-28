import { useNavigate } from "react-router-dom";

interface Props {
  id: string;
  name: string;
  image: string;
  type: "category" | "brand";
}

export default function CategoryCard({ id, name, image, type }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(
      type === "category"
        ? `/products/category/${id}`
        : `/products/brand/${id}`
    );
  };

  return (
    <div
      onClick={handleClick}
      className="
        cursor-pointer
        bg-[var(--color-surface)]
        rounded-2xl
        border
        overflow-hidden
        shadow-sm
        hover:shadow-xl
        transition-all
        duration-300
        group
      "
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      <div className="p-4 text-center">
        <h3 className="font-semibold text-sm md:text-base text-[var(--color-primary)]">
          {name}
        </h3>
        <span className="text-xs text-orange-600 font-medium group-hover:underline">
          Explore →
        </span>
      </div>
    </div>
  );
}