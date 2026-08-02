import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import WhatsAppSupportModal from "./WhatsAppSupportModal";
import type { WhatsAppContact } from "./WhatsAppSupportModal";
import { useConfigStore } from "../../store/config.store";

export default function WhatsAppSupport() {
    const config = useConfigStore((s) => s.config);
    const contacts: WhatsAppContact[] = config?.whatsAppSupport?.contacts ?? [];

    const [open, setOpen] = useState(false);

    useEffect(() => {
        const alreadyShown = sessionStorage.getItem(
            "whatsapp-popup-shown"
        );

        if (alreadyShown) return;

        sessionStorage.setItem(
            "whatsapp-popup-shown",
            "true"
        );

        const openTimer = setTimeout(() => {
            setOpen(true);
            const closeTimer = setTimeout(() => {
                setOpen(false);
            }, 8000);
            return () => clearTimeout(closeTimer);
        }, 1000);

        return () => clearTimeout(openTimer);
    }, []);

    return (
        <>
            <WhatsAppSupportModal
                open={open}
                contacts={contacts}
                onClose={() => setOpen(false)}
            />

            {contacts.length > 0 && (
                <button
                    onClick={() => setOpen((v) => !v)}
                    aria-label="WhatsApp Support"
                    className="
                    fixed
                    bottom-20
                    right-6
                    z-50

                    flex
                    items-center
                    justify-center

                    w-14
                    h-14

                    rounded-full

                    bg-[#25D366]
                    text-white

                    shadow-xl

                    transition-all
                    duration-300

                    hover:scale-110
                    active:scale-95
                    "
                >
                    <FaWhatsapp size={32} />
                </button>
            )}
        </>
    );
}