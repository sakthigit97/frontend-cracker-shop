export interface PincodeLocation {
    pincode: string;
    state: string;
    district: string;
    city: string;
}

export async function getPincodeLocation(
    pincode: string
): Promise<PincodeLocation | null> {
    const cleanPincode = pincode
        .replace(/\D/g, "")
        .trim();

    if (cleanPincode.length !== 6) {
        return null;
    }

    const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanPincode}`
    );

    const data = await response.json();

    if (
        !data ||
        data[0]?.Status !== "Success" ||
        !data[0]?.PostOffice?.length
    ) {
        return null;
    }

    const postOffice = data[0].PostOffice[0];

    const state =
        postOffice.State?.trim() ?? "";

    const district =
        postOffice.District?.trim() ?? "";

    const city =
        postOffice.Block?.trim() ?? "";

    if (!state || !district || !city) {
        return null;
    }

    return {
        pincode: cleanPincode,
        state,
        district,
        city,
    };
}