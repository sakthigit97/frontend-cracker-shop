import { BULK_SCHEMES } from "../../constants/bulkScheme";
import { bulkOrderStore } from "../../store/bulkOrder.store";

export default function SchemeSelector() {

    const scheme = bulkOrderStore(s => s.scheme);

    const setScheme = bulkOrderStore(s => s.setScheme);

    const adminCode = bulkOrderStore(s => s.adminCode);

    const setAdminCode = bulkOrderStore(s => s.setAdminCode);

    return (

        <div className="space-y-5">

            {BULK_SCHEMES.map(item => (

                <label
                    key={item.id}
                    className="
                    flex
                    items-center
                    gap-4
                    border
                    rounded-xl
                    p-5
                    cursor-pointer
                "
                >

                    <input
                        type="radio"
                        checked={scheme?.id === item.id}
                        onChange={() => setScheme(item)}
                    />

                    <div>

                        <div className="font-semibold">

                            {item.label}

                        </div>

                    </div>

                </label>

            ))}

            {scheme?.requiresCode && (

                <div>

                    <label className="font-medium">

                        Admin Code

                    </label>

                    <input
                        value={adminCode}
                        onChange={e =>
                            setAdminCode(e.target.value)
                        }
                        className="
                        mt-2
                        w-full
                        border
                        rounded-lg
                        p-3
                    "
                    />

                </div>

            )}

        </div>

    );

}