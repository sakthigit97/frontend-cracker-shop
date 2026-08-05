export async function uploadFilesToS3(
    uploads: { uploadUrl: string }[],
    files: File[]
) {
    if (uploads.length !== files.length) {
        throw new Error(
            `Upload mismatch: expected ${uploads.length} files but received ${files.length}.`
        );
    }

    await Promise.all(
        uploads.map(async (u, i) => {
            const res = await fetch(u.uploadUrl, {
                method: "PUT",
                body: files[i],
                headers: {
                    "Content-Type": files[i].type,
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to upload ${files[i].name}`);
            }
        })
    );
}