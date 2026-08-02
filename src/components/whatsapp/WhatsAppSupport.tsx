import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import WhatsAppSupportModal from "./WhatsAppSupportModal";
import type { WhatsAppContact } from "./WhatsAppSupportModal";
import { useConfigStore } from "../../store/config.store";

export default function WhatsAppSupport() {
    const config = useConfigStore((s) => s.config);
    const contacts: WhatsAppContact[] = config?.whatsAppSupport?.contacts ?? [];
    const support = config?.whatsAppSupport;
    const openDelay = support?.autoOpenDelay ?? 1000;
    const autoCloseDelay = support?.autoCloseAfter ?? 8000;
    const [open, setOpen] = useState(false);

useEffect(() => {
    console.log("Support config:", support);

    if (!support?.enabled) {
        console.log("Support disabled or not loaded yet");
        return;
    }

    if (sessionStorage.getItem("whatsapp-popup-shown")) {
        console.log("Already shown");
        return;
    }

    sessionStorage.setItem("whatsapp-popup-shown", "true");

    console.log("Scheduling popup...");

    const openTimer = window.setTimeout(() => {
        console.log("Opening popup");
        setOpen(true);
    }, openDelay);

    const closeTimer = window.setTimeout(() => {
        console.log("Closing popup");
        setOpen(false);
    }, openDelay + autoCloseDelay);

    return () => {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
    };
}, [support, openDelay, autoCloseDelay]);

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