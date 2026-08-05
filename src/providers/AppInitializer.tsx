import { useEffect } from "react";
import { useConfigStore } from "../store/config.store";
const CONFIG_REFRESH_INTERVAL = 2 * 60 * 1000;
type Props = {
    children: React.ReactNode;
};

export default function AppInitializer({ children }: Props) {
    useEffect(() => {
        useConfigStore
            .getState()
            .loadConfig()
            .catch((err) => {
                console.error(
                    "Failed to load global configuration.",
                    err
                );
            });
    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== "visible") {
                return;
            }

            useConfigStore
                .getState()
                .refreshConfig()
                .catch((err) => {
                    console.error(
                        "Background config refresh failed.",
                        err
                    );
                });
        }, CONFIG_REFRESH_INTERVAL);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== "visible") {
                return;
            }

            useConfigStore
                .getState()
                .refreshConfig()
                .catch((err) => {
                    console.error(
                        "Visibility config refresh failed.",
                        err
                    );
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
    }, []);

    return <>{children}</>;
}