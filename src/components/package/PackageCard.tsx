import { useNavigate } from "react-router-dom";
import defaultImage from "../../assets/default-image.png";

interface Props {
    packageItem: {
        id: string;
        name: string;
        imageUrl: string;
        productCount: number;
    };
}

export default function PackageCard({
    packageItem,
}: Props) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() =>
                navigate(`/combo-packages/${packageItem.id}`)
            }
            className="
                cursor-pointer
                bg-white
                rounded-xl
                border
                border-gray-200
                shadow-sm
                overflow-hidden
                transition-all
                duration-300
                hover:shadow-lg
                hover:border-[var(--color-primary)]
            "
        >
            <div className="flex">
                <img
                    src={
                        packageItem.imageUrl ||
                        defaultImage
                    }
                    className="
                        w-28
                        h-28
                        object-cover
                        flex-shrink-0
                    "
                />

                <div
                    className="
                        flex-1
                        p-4
                        flex
                        flex-col
                        justify-center
                    "
                >
                    <h3
                        className="
                            text-base
                            font-semibold
                            text-[var(--color-primary)]
                            line-clamp-2
                        "
                    >
                        {packageItem.name}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                        {packageItem.productCount} Products
                    </p>

                    <span
                        className="
                            mt-3
                            text-sm
                            font-medium
                            text-[var(--color-secondary)]
                        "
                    >
                        Explore Package →
                    </span>
                </div>
            </div>
        </div>
    );
}