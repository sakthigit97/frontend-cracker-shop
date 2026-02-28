export async function uploadFilesToS3(
    uploads: { uploadUrl: string }[],
    files: File[]
) {
    await Promise.all(
        uploads.map((u, i) =>
            fetch(u.uploadUrl, {
                method: "PUT",
                body: files[i],
                headers: {
                    "Content-Type": files[i].type,
                },
            })
        )
    );
}