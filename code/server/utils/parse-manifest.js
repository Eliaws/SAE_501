import path from "path";
import fs from "fs/promises";

export default async (manifest) => {
    if (process.env.NODE_ENV !== "production") {
        return {};
    }

    const manifestPath = path.join(
        path.resolve(),
        "dist",
        manifest
    );

    const manifestFile = await fs.readFile(manifestPath);

    return JSON.parse(manifestFile);
};
