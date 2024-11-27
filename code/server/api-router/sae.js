import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import querystring from "querystring";

import SAE from "#models/sae.js";
import routeName from "#server/utils/name-route.middleware.js";

import upload, { uploadImage, deleteUpload } from "#server/uploader.js";

const router = express.Router();
const base = "saes";

/**
 * @openapi
 * /saes:
 *   get:
 *     tags:
 *      - SAEs
 *     summary: Get all SAEs
 *     responses:
 *       200:
 *         description: Returns all SAEs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListSAEs'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     parameters:
 *      - in: query
 *        name: page
 *        schema:
 *          type: integer
 *          example: 1
 *        description: Page's number
 *      - in: query
 *        name: per_page
 *        required: false
 *        schema:
 *          type: integer
 *          example: 7
 *        description: Number of items per page. Max 20
 *      - in: query
 *        name: id
 *        required: false
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *            pattern: '([0-9a-f]{24})'
 *        description: List of SAEs' _id. **Invalid ids will be skipped.**
 */
router.get(`/${base}`, routeName("sae_api"), async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    let perPage = Number(req.query.per_page) || 7;
    // Clamps the value between 1 and 20
    perPage = Math.min(Math.max(perPage, 1), 20);

    let listIds = req.query?.id;
    if (req.query.id && !Array.isArray(req.query.id)) {
        listIds = [listIds];
    }

    listIds = (listIds || [])
        .filter(mongoose.Types.ObjectId.isValid)
        .map(item => mongoose.Types.ObjectId.createFromHexString(item));

    try {
        const listRessources = await SAE.aggregate([
            ...(listIds.length ? [{ $match: { _id: { $in: listIds } } }] : []),
            { $sort: { _id: -1 } },
            { $skip: Math.max(page - 1, 0) * perPage },
            { $limit: perPage },
        ]);

        const count = await SAE.countDocuments(
            listIds.length ? { _id: { $in: listIds } } : null
        );

        const queryParam = { ...req.query };
        delete queryParam.page;

        res.status(200).json({
            data: listRessources,
            total_pages: Math.ceil(count / perPage),
            count,
            page,
            query_params: querystring.stringify(queryParam),
        });
    } catch (e) {
        res.status(400).json({
            errors: [
                ...Object.values(
                    e?.errors || [{ message: e?.message || "Il y a eu un problème" }]
                ).map(val => val.message),
            ],
        });
    }
});

/**
 * @openapi
 * /saes/{id}:
 *   get:
 *     tags:
 *      - SAEs
 *     summary: Get a SAE
 *     parameters:
 *      - name: id
 *        in: path
 *        description: sae's _id
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24})'
 *     responses:
 *       200:
 *         description: Returns a specific SAE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SAE'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ressource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(`/${base}/:id([a-f0-9]{24})`, routeName("sae_api"), async (req, res) => {
    let listErrors = [];

    const ressource = await SAE.findOne({ _id: req.params.id })
        .orFail()
        .catch(() => {
            res.status(404).json({
                errors: [...listErrors, "Élément non trouvé"],
            });
        });

    return res.status(200).json(ressource);
});

/**
 * @openapi
 * /saes:
 *   post:
 *     tags:
 *      - SAEs
 *     summary: Create a SAE
 *     requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            required: ['title']
 *            properties:
 *              title:
 *                type: string
 *                description: SAE's title
 *                required: true
 *              content:
 *                type: string
 *              image:
 *                type: string
 *                format: binary
 *     responses:
 *       201:
 *         description: Creates a SAE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SAE'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(`/${base}`, routeName("sae_api"), upload.single("image"), async (req, res) => {
    let imagePayload = {};
    let listErrors = [];
    let targetPath = undefined;
    const uploadedImage = req.body.file || req.file;

    if (uploadedImage) {
        let imageName;
        ({
            image_path: targetPath,
            errors: listErrors,
            image_name: imageName,
        } = await uploadImage(uploadedImage, res.locals.upload_path));
        imagePayload = { image: imageName };
    }

    if (listErrors.length) {
        return res.status(400).json({
            errors: listErrors,
            ressource: req.body,
        });
    }

    const ressource = new SAE({ ...req.body, ...imagePayload });

    try {
        await ressource.save();
        res.status(201).json(ressource);
    } catch (err) {
        res.status(400).json({
            errors: [
                ...listErrors,
                ...deleteUpload(targetPath),
                ...Object.values(
                    err?.errors || [{ message: "Il y a eu un problème" }]
                ).map(val => val.message),
            ],
            ressource: req.body,
        });
    }
});

/**
 * @openapi
 * /saes/{id}:
 *   put:
 *     tags:
 *      - SAEs
 *     summary: Update a SAE
 *     parameters:
 *      - name: id
 *        in: path
 *        description: sae's _id
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24})'
 *     requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            required: ['title']
 *            properties:
 *              title:
 *                type: string
 *                description: SAE's title
 *              content:
 *                type: string
 *              image:
 *                type: string
 *                format: binary
 *     responses:
 *       200:
 *         description: Updates a specific SAE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SAE'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(`/${base}/:id([a-f0-9]{24})`, routeName("sae_api"), upload.single("image"), async (req, res) => {
    let imagePayload = {};
    let listErrors = [];
    let targetPath = undefined;

    const uploadedImage = req.body.file || req.file;

    if (uploadedImage) {
        let imageName;
        ({
            image_path: targetPath,
            errors: listErrors,
            image_name: imageName,
        } = await uploadImage(uploadedImage, res.locals.upload_path));
        imagePayload = { image: imageName };
    }

    let oldRessource = {};
    try {
        oldRessource = await SAE.findById(req.params.id).lean();
    } catch (_error) {
        oldRessource = {};
    }
    if (listErrors.length) {
        return res.status(400).json({
            errors: listErrors,
            ressource: { ...oldRessource, ...req.body },
        });
    }

    const payload = structuredClone(req.body);

    // delete previous image and doesn't upload a new one
    if ("delete_file_image" in payload && "file" in payload === false) {
        payload.image = "";
        const targetPath = `${res.locals.upload_path}${oldRessource.image}`;
        fs.unlink(targetPath, () => {});
    }

    // delete previous image
    if ("file" in payload) {
        const targetPath = `${res.locals.upload_path}${oldRessource.image}`;
        fs.unlink(targetPath, () => {});
    }

    const ressource = await SAE.findOneAndUpdate(
        { _id: req.params.id },
        { ...payload, _id: req.params.id, ...imagePayload },
        { new: true }
    )
        .orFail()
        .catch((err) => {
            if (err instanceof mongoose.Error.DocumentNotFoundError) {
                res.status(404).json({
                    errors: [`La SAÉ "${req.params.id}" n'existe pas`],
                });
            } else if (err instanceof mongoose.Error.CastError) {
                res.status(400).json({
                    errors: [`"${req.params.id}" n'est pas un _id valide`],
                });
            } else {
                res.status(400).json({
                    errors: [
                        ...listErrors,
                        ...Object.values(
                            err?.errors || [
                                { message: "Il y a eu un problème" },
                            ]
                        ).map(val => val.message),
                        ...deleteUpload(targetPath),
                    ],
                    ressource: { ...oldRessource, ...req.body },
                });
            }
        });

    return res.status(200).json(ressource);
});

/**
 * @openapi
 * /saes/{id}:
 *   delete:
 *     tags:
 *      - SAEs
 *     summary: Delete a SAE
 *     parameters:
 *      - name: id
 *        in: path
 *        description: sae's _id
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24})'
 *     responses:
 *       200:
 *         description: Deletes a specific SAE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SAE'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ressource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(`/${base}/:id([a-f0-9]{24})`, routeName("sae_api"), async (req, res) => {
    try {
        const ressource = await SAE.findByIdAndDelete(req.params.id);

        if (ressource?.image) {
            const targetPath = `${res.locals.upload_path}${ressource.image}`;
            fs.unlink(targetPath, () => {});
        }

        if (ressource) {
            req.flash("success", "Element supprimé");
            return res.status(200).json(ressource);
        }
        return res.status(404).json({
            errors: [`La SAE "${req.params.id}" n'existe pas`],
        });
    } catch (_error) {
        return res.status(400).json({
            error: "Quelque chose s'est mal passé, veuillez recommencer",
        });
    }
});

export default router;
