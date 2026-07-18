export function getMobileNumbers(displayMobile?: string): string[] {
    if (!displayMobile) return [];

    return displayMobile
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
}