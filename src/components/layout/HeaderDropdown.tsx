import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { FaChevronDown as ChevronDown } from "react-icons/fa";


export interface HeaderDropdownItem {
    label: string;
    to?: string;
    icon?: ReactNode;
    danger?: boolean;
    onClick?: () => void;
}

interface HeaderDropdownProps {
    title: string;
    items: HeaderDropdownItem[];
    icon?: ReactNode;
    className?: string;
}

export default function HeaderDropdown({
    title,
    items,
    icon,
    className = "",
}: HeaderDropdownProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleOutside(event: MouseEvent) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutside);

        return () =>
            document.removeEventListener("mousedown", handleOutside);
    }, []);

    const close = () => setOpen(false);

    return (
        <div
            ref={wrapperRef}
            className={`relative ${className}`}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                onFocus={() => setOpen(true)}
                className="
          flex
          items-center
          gap-1.5
          rounded-xl
          px-3
          py-2
          text-sm
          font-medium
          transition-all
          duration-200
          hover:bg-white/10
          focus:outline-none
          focus:ring-2
          focus:ring-white/20
        "
            >
                {icon}

                <span>{title}</span>

                <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            <div
                className={`
          absolute
          left-0
          top-full
          z-50
          mt-2
          w-64
          origin-top-left
          rounded-2xl
          border
          border-gray-100
          bg-white/95
          backdrop-blur-xl
          shadow-2xl
          overflow-hidden
          transition-all
          duration-200
          ${open
                        ? "visible opacity-100 scale-100"
                        : "invisible opacity-0 scale-95"
                    }
        `}
            >
                <div className="py-2">
                    {items.map((item, index) => {
                        const classes = `
              flex
              items-center
              gap-3
              px-4
              py-3
              text-sm
              transition-all
              duration-200
              hover:bg-gray-50
              ${item.danger
                                ? "text-red-600 hover:text-red-700"
                                : "text-gray-700 hover:text-[var(--color-primary)]"
                            }
            `;

                        if (item.to) {
                            return (
                                <Link
                                    key={index}
                                    to={item.to}
                                    onClick={close}
                                    className={classes}
                                >
                                    {item.icon}

                                    <span>{item.label}</span>
                                </Link>
                            );
                        }

                        return (
                            <Fragment key={index}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        item.onClick?.();
                                    }}
                                    className={`${classes} w-full text-left`}
                                >
                                    {item.icon}

                                    <span>{item.label}</span>
                                </button>
                            </Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}