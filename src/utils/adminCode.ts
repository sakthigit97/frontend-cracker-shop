const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAdminCode(
    length = 8
) {

    let code = "";

    for (
        let i = 0;
        i < length;
        i++
    ) {

        code +=
            CHARS[
            Math.floor(
                Math.random() *
                CHARS.length
            )
            ];

    }

    return code;

}

export const SCHEMES: {
    value: any;
    label: string;
}[] = [
        {
            value: "2_TO_5_LAKH",
            label: "₹2 Lakh - ₹5 Lakh",
        },
        {
            value: "ABOVE_5_LAKH",
            label: "Above ₹5 Lakh",
        },
    ];