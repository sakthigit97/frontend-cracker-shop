import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";

export interface MobileAccordionItem {
    label: string;
    to?: string;
    icon?: ReactNode;
    danger?: boolean;
    onClick?: () => void;
}

interface MobileAccordionProps {
    title: string;
    items: MobileAccordionItem[];
    defaultOpen?: boolean;
    icon?: ReactNode;
    onNavigate?: () => void;
}

export default function MobileAccordion({
    title,
    items,
    defaultOpen = false,
    icon,
    onNavigate,
}: MobileAccordionProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div
            className="
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-sm
      "
        >
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="
          flex
          w-full
          items-center
          justify-between
          px-4
          py-3
          text-left
          transition-all
          duration-200
          hover:bg-white/10
        "
            >
                <div className="flex items-center gap-3">
                    {icon && (
                        <span className="text-white/90">
                            {icon}
                        </span>
                    )}

                    <span className="font-medium text-white">
                        {title}
                    </span>
                </div>

                <FaChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            <div
                className={`
          overflow-hidden
          transition-all
          duration-300
          ${open
                        ? "max-h-[600px] opacity-100"
                        : "max-h-0 opacity-0"
                    }
        `}
            >
                <div className="border-t border-white/10">
                    {items.map((item, index) => {
                        const commonClass = `
              flex
              items-center
              gap-3
              px-6
              py-3
              text-sm
              transition-all
              duration-200
              hover:bg-white/10
              ${item.danger
                                ? "text-red-300 hover:text-red-200"
                                : "text-white/90 hover:text-white"
                            }
            `;

                        if (item.to) {
                            return (
                                <Link
                                    key={index}
                                    to={item.to}
                                    onClick={() => {
                                        onNavigate?.();
                                    }}
                                    className={commonClass}
                                >
                                    {item.icon}

                                    <span>{item.label}</span>
                                </Link>
                            );
                        }

                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => {
                                    item.onClick?.();
                                    onNavigate?.();
                                }}
                                className={`${commonClass} w-full text-left`}
                            >
                                {item.icon}

                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}