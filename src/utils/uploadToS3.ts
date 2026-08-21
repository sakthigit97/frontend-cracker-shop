export async function uploadFilesToS3(
    uploads: { uploadUrl: string }[],
    files: File[],
    preserveDimensions?: boolean
) {
    if (uploads.length !== files.length) {
        throw new Error(
            `Upload mismatch: expected ${uploads.length} files but received ${files.length}.`
        );
    }

    await Promise.all(
        uploads.map(async (u, i) => {
            const originalFile = files[i];
            const optimizedFile = await compressImage(originalFile, preserveDimensions);
            const res = await fetch(
                u.uploadUrl,
                {
                    method: "PUT",
                    body: optimizedFile,
                    headers: {
                        "Content-Type":
                            optimizedFile.type,
                    },
                }
            );

            if (!res.ok) {
                throw new Error(
                    `Failed to upload ${originalFile.name}`
                );
            }
        })
    );
}

async function compressImage(
    file: File,
    preserveDimensions = false
): Promise<File> {
    if (!file.type.startsWith("image/")) {
        return file;
    }

    if (
        file.type === "image/svg+xml" ||
        file.type === "image/gif"
    ) {
        return file;
    }

    const TARGET_WIDTH = 1254;
    const TARGET_HEIGHT = 1254;
    const QUALITY = 0.82;

    const imageUrl = URL.createObjectURL(file);

    try {
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () =>
                reject(
                    new Error(
                        `Unable to read ${file.name}`
                    )
                );

            img.src = imageUrl;
        });

        let canvasWidth: number;
        let canvasHeight: number;
        let drawWidth: number;
        let drawHeight: number;
        let x: number;
        let y: number;

        if (preserveDimensions) {
            canvasWidth = img.naturalWidth;
            canvasHeight = img.naturalHeight;
            drawWidth = img.naturalWidth;
            drawHeight = img.naturalHeight;

            x = 0;
            y = 0;
        } else {
            canvasWidth = TARGET_WIDTH;
            canvasHeight = TARGET_HEIGHT;
            const scale = Math.min(
                TARGET_WIDTH / img.naturalWidth,
                TARGET_HEIGHT / img.naturalHeight
            );

            drawWidth = Math.round(
                img.naturalWidth * scale
            );

            drawHeight = Math.round(
                img.naturalHeight * scale
            );

            x = Math.round(
                (TARGET_WIDTH - drawWidth) / 2
            );

            y = Math.round(
                (TARGET_HEIGHT - drawHeight) / 2
            );
        }

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error(
                "Unable to create canvas"
            );
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
            img,
            x,
            y,
            drawWidth,
            drawHeight
        );

        const blob = await new Promise<Blob | null>(
            (resolve) => {
                canvas.toBlob(
                    resolve,
                    "image/webp",
                    QUALITY
                );
            }
        );

        if (!blob) {
            throw new Error(
                `Unable to convert ${file.name} to WebP`
            );
        }

        const name =
            file.name.substring(
                0,
                file.name.lastIndexOf(".")
            ) || file.name;

        return new File(
            [blob],
            `${name}.webp`,
            {
                type: "image/webp",
                lastModified: Date.now(),
            }
        );
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}