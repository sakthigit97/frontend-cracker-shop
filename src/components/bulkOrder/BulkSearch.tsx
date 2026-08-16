import { memo, useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface BulkSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounce?: number;
}

function BulkSearch({
    value,
    onChange,
    placeholder = "Search products...",
    debounce = 300,
}: BulkSearchProps) {
    const [keyword, setKeyword] = useState(value);

    useEffect(() => {
        setKeyword(value);
    }, [value]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const trimmedKeyword = keyword.trim();

            if (trimmedKeyword !== value.trim()) {
                onChange(trimmedKeyword);
            }
        }, debounce);

        return () => {
            window.clearTimeout(timer);
        };
    }, [keyword, debounce, onChange, value]);

    const clear = () => {
        setKeyword("");
        onChange("");
    };

    return (
        <div className="relative w-full">
            <Search
                size={18}
                className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                "
            />

            <input
                type="search"
                value={keyword}
                onChange={(event) => {
                    setKeyword(event.target.value);
                }}
                placeholder={placeholder}
                className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    pl-11
                    pr-11
                    outline-none
                    transition
                    focus:border-primary
                "
            />

            {keyword && (
                <button
                    type="button"
                    onClick={clear}
                    aria-label="Clear search"
                    className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        rounded-full
                        p-1
                        hover:bg-gray-100
                    "
                >
                    <X
                        size={16}
                        className="text-gray-500"
                    />
                </button>
            )}
        </div>
    );
}

export default memo(BulkSearch);