import { FaWhatsapp, FaTimes } from "react-icons/fa";
import WhatsAppContactCard from "./WhatsAppContactCard";

export interface WhatsAppContact {
    name: string;
    role: string;
    phone: string;
    image?: string;
    message?: string;
}

interface Props {
    open: boolean;
    contacts: WhatsAppContact[];
    onClose: () => void;
}

export default function WhatsAppSupportModal({
    open,
    contacts,
    onClose,
}: Props) {
    if (!open) return null;

    return (
        <div
            className="
        fixed
        bottom-24
        right-5
        z-[999]
        w-[340px]
        max-w-[calc(100vw-32px)]
        overflow-hidden
        rounded-2xl
        bg-white
        shadow-2xl
        border
        animate-[fadeIn_.25s_ease]
      "
        >
            {/* Header */}

            <div className="bg-[#25D366] text-white p-4">

                <div className="flex items-start justify-between">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <FaWhatsapp size={22} />
                        </div>

                        <div>

                            <h3 className="font-semibold text-lg">
                                WhatsApp Support
                            </h3>

                            <p className="text-sm text-green-100">
                                Sales & Delivery Support
                            </p>

                        </div>

                    </div>

                    <button
                        onClick={onClose}
                        className="
              rounded-full
              p-2
              hover:bg-white/20
              transition
            "
                    >
                        <FaTimes />
                    </button>

                </div>

            </div>

            {/* Contacts */}

            <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">

                {contacts.map((contact) => (
                    <WhatsAppContactCard
                        key={contact.phone}
                        contact={contact}
                    />
                ))}

            </div>
        </div>
    );
}