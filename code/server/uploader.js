import path from "path";
import fs from "fs/promises";
import { existsSync } from "node:fs";
import multer from "multer";

import { imageValidator } from "#database/validator.js";

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${path.extname(
                file.originalname
            )}`
        );
    },
});

const upload = multer({ storage });

export default upload;

const uploadImage = async (image, dist_dir) => {
    let targetPath = undefined;
    const listErrors = [];
    const error = imageValidator(image);

    if (Object.keys(error) > 0) {
        listErrors.push(error.message);
    } else {
        if (existsSync(path.normalize(dist_dir))) {
            targetPath = `${dist_dir}${image.filename}`;
            const tempPath = image.path;
            try {
                await fs.copyFile(tempPath, targetPath);
            } catch (err) {
                listErrors.push(err);
            }
        } else {
            listErrors.push(`Veuillez créer le dossier "${dist_dir}"`);
        }
    }
    return {
        image_path: targetPath,
        errors: listErrors,
        image_name: image.filename,
    };
};

const deleteUpload = (path) => {
    if (!path) return [];
    const listErrors = [];
    fs.unlink(path)
        .then()
        .catch((err) => {
            listErrors.push(err);
        });

    return listErrors;
};

export { uploadImage, deleteUpload };
