import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type jsPDF from "jspdf";

export async function savePdf(
    pdf: jsPDF,
    fileName: string
): Promise<void> {
    if (Capacitor.getPlatform() !== "android") {
        pdf.save(fileName);
        return;
    }

    const dataUri = pdf.output("datauristring");
    const base64Data = dataUri.split(",")[1];

    if (!base64Data) {
        throw new Error("Unable to generate PDF data.");
    }

    const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
    });

    await Share.share({
        title: fileName,
        text: "PDF document",
        url: result.uri,
        dialogTitle: "Save or share PDF",
    });
}