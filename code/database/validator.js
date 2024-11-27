// Validation rules

const imageValidator = (image, listAllowedMimeType = ["image/png", "image/jpg", "image/jpeg", "image/avif"], maxSizeFactor = 0.8) => {
    if (
        !listAllowedMimeType.includes(image?.mimetype || image.type)
    ) {
        return { message: "Format incorrect uploadé", type: "incorrect_format" };
    }

    const oneMo = 1024 * 1024;
    const fileLimit = oneMo * maxSizeFactor; // 800kB
    if (image.size > fileLimit) {
        const limitHundred = Math.floor(maxSizeFactor * 1024 / 100) * 100;
        return { 
            message: `Fichier trop lourd (${(image.size / oneMo).toFixed(2)} MB). ${limitHundred} kB maximum.`, 
            type: "upload_size",
        };
    }

    return { };
};

export { imageValidator };
