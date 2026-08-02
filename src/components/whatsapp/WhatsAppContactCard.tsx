import defaultAvatar from "../../assets/default-image.png";

interface WhatsAppContact {
    name: string;
    role: string;
    phone: string;
    image?: string;
    message?: string;
}

interface Props {
    contact: WhatsAppContact;
}

export default function WhatsAppContactCard({
    contact,
}: Props) {
    const handleChat = () => {
        const text =
            contact.message ??
            "Hi, I need help with crackers.";

        window.open(
            `https://wa.me/${contact.phone}?text=${encodeURIComponent(
                text
            )}`,
            "_blank"
        );
    };

    return (
        <div
            className="
        flex
        items-center
        gap-3
        rounded-xl
        border
        p-3
        hover:bg-gray-50
        transition
      "
        >
            <img
                src={contact.image || defaultAvatar}
                alt={contact.name}
                className="
          w-14
          h-14
          rounded-full
          object-cover
          border
          shrink-0
        "
            />

            <div className="flex-1 min-w-0">

                <h4 className="font-semibold text-gray-900 truncate">
                    {contact.name}
                </h4>

                <p className="text-sm text-gray-500 truncate">
                    {contact.role}
                </p>

                <div className="flex items-center gap-2 mt-1">

                    <span className="w-2 h-2 rounded-full bg-green-500" />

                    <span className="text-xs text-green-600">
                        Online
                    </span>

                </div>

            </div>

            <button
                onClick={handleChat}
                className="
          rounded-lg
          bg-[#25D366]
          px-3
          py-2
          text-sm
          font-medium
          text-white
          hover:brightness-95
          transition
        "
            >
                Chat
            </button>
        </div>
    );
}