import { useEffect } from "react";
import { useConfigStore } from "../store/config.store";

const CONFIG_REFRESH_INTERVAL = 20 * 60 * 1000;
type Props = {
    children: React.ReactNode;
};

export default function AppInitializer({ children }: Props) {
    const loadConfig = useConfigStore((s) => s.loadConfig);
    const refreshConfig = useConfigStore((s) => s.refreshConfig);
    useEffect(() => {
        loadConfig().catch((err) => {
            console.error("Failed to load global configuration.", err);
        });
    }, [loadConfig]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== "visible") {
                return;
            }

            refreshConfig().catch((err) => {
                console.error("Background config refresh failed.", err);
            });
        }, CONFIG_REFRESH_INTERVAL);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [refreshConfig]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== "visible") {
                return;
            }

            refreshConfig().catch((err) => {
                console.error("Visibility config refresh failed.", err);
            });
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [refreshConfig]);

    return <>{children}</>;
}