import express from "express";
import fs from "fs";
import querystring from "querystring";

import Article from "#models/article.js";
import Author from "#models/author.js";

import upload, { uploadImage, deleteUpload } from "#server/uploader.js";
import mongoose from "mongoose";

const router = express.Router();

const base = "articles";

/**
 * @openapi
 * /articles:
 *   get:
 *     tags:
 *      - Articles
 *     summary: Get all articles
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
 *            pattern: '([0-9a-f]{24}|[\w\d\-]+\-[a-f0-9]{24})'
 *        description: List of articles' _id or slug (you can mix). **Invalid _ids will be skipped.**
 *      - in: query
 *        name: sorting
 *        required: false
 *        schema:
 *          type: string
 *          enum: ["desc", "asc"]
 *          example: "desc"
 *          default: desc
 *        description: Sort articles related to their last update time. If the param is missing the order is "desc".
 *      - in: query
 *        name: is_active
 *        required: false
 *        schema:
 *          type: string
 *          enum: ["true", "false", "all"]
 *          example: "all"
 *          default: all
 *        description: |
 *          Search articles related to their "is_active" key value. If the value is unknown only `{ is_active: false }` articles will be returned.
 *          **Note : You cannot use that predicate with search by _id or slug**
 *     responses:
 *       200:
 *         description: Returns all articles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListArticles'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(`/${base}`, async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    let perPage = Number(req.query.per_page) || 7;
    perPage = Math.min(Math.max(perPage, 1), 20);

    let listIds = req.query?.id;
    if (req.query.id && !Array.isArray(req.query.id)) {
        listIds = [listIds];
    }
    listIds = listIds || [];

    const isActive = req.query.is_active?.toLowerCase() || "all";

    try {
        const listRessources = await getArticles(
            listIds.length ? listIds : [],
            { ...req.query, page, perPage, isActive }
        );

        const searchPredicates = {
            ...(isActive !== "all" ? { is_active: isActive === "true" } : {}),
        };

        const listBsonIds = listIds.filter(mongoose.Types.ObjectId.isValid).map(item => mongoose.Types.ObjectId.createFromHexString(item));

        const countQuery = {
            $or: [
                { _id: { $in: listBsonIds } },
                { slug: { $in: listIds } },
            ],
        };

        const count = await Article.countDocuments(listIds.length ? countQuery : searchPredicates);

        const queryParam = Object.fromEntries(
            Object.entries({ ...req.query }).filter(([_, value]) =>
                Boolean(value)
            )
        );
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
 * /articles/{id}:
 *   get:
 *     tags:
 *      - Articles
 *     summary: Get an article
 *     parameters:
 *      - name: id
 *        in: path
 *        description: article's _id or slug
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24}|[\\w\\d\\-]+\\-[a-f0-9]{24})'
 *     responses:
 *       200:
 *         description: Returns a specific article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get([`/${base}/:id([a-f0-9]{24})`, `/${base}/:slug([\\w\\d\\-]+\\-[a-f0-9]{24})`], async (req, res) => {
    try {
        const id = req.params.id ? mongoose.Types.ObjectId.createFromHexString(req.params.id) : req.params.slug;
        const [ressource] = await getArticles(id);

        if (ressource) {
            return res.status(200).json(ressource);
        }
        return res.status(404).json({
            errors: [`L'article "${id}" n'existe pas`],
        });
    } catch (_error) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                errors: [`"${req.params.id}" n'est pas un id valide`],
            });
        }
        return res
            .status(400)
            .json({ errors: ["Quelque chose s'est mal passé"] });
    }
});

/**
 * @openapi
 * /articles:
 *   post:
 *     tags:
 *      - Articles
 *     summary: Create an article
 *     requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            required: ['title', 'content', 'image']
 *            properties:
 *              title:
 *                type: string
 *                description: article's title
 *              abstract:
 *                type: string
 *              content:
 *                type: string
 *              image:
 *                type: string
 *                format: binary
 *              is_active:
 *                type: boolean
 *                default: false
 *              yt_video_id:
 *                type: string
 *                description: article's Youtube video id
 *              author:
 *                type: string
 *                description: author's _id. If the value is not valid or null, the article won't have a author anymore
 *     responses:
 *       201:
 *         description: Creates an article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(`/${base}`, upload.single("image"), async (req, res) => {
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
        } = uploadImage(uploadedImage, res.locals.upload_path));
        imagePayload = { image: imageName };
    }

    if (listErrors.length) {
        return res.status(400).json({
            errors: listErrors,
            ressource: req.body,
        });
    }

    const computedBody = structuredClone(req.body);
    if (!mongoose.Types.ObjectId.isValid(req.body.author)) {
        delete computedBody.author;
    }

    const ressource = new Article({ ...computedBody, ...imagePayload });
    try {
        await ressource.save();
        const [ressourceComputed] = await getArticles(ressource._id);

        if (ressourceComputed?.author) {
            ressourceComputed.author.nb_articles++;
            await Author.findOneAndUpdate(
                { _id: req.body.author },
                { $push: { list_articles: ressource._id } }
            );
        }
        res.status(201).json(ressourceComputed);
    } catch (error) {
        res.status(400).json({
            errors: [
                ...listErrors,
                ...deleteUpload(targetPath),
                ...Object.values(
                    error?.errors || [{ message: "Il y a eu un problème" }]
                ).map(val => val.message),
            ],
        });
    }
});

/**
 * @openapi
 * /articles/{id}:
 *   put:
 *     tags:
 *      - Articles
 *     summary: Update an article
 *     description: |
 *      If the author change, the previous author lose the article
 *     parameters:
 *      - name: id
 *        in: path
 *        description: article's _id or slug
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24}|[\\w\\d\\-]+\\-[a-f0-9]{24})'
 *     requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            required: ['title', 'content']
 *            properties:
 *              title:
 *                type: string
 *                description: article's title
 *              abstract:
 *                type: string
 *              content:
 *                type: string
 *              image:
 *                type: string
 *                format: binary
 *              is_active:
 *                type: boolean
 *                default: false
 *              yt_video_id:
 *                type: string
 *                description: article's Youtube video id
 *              author:
 *                type: string
 *                description: author's _id. If the value is not valid or null, the article won't have a author anymore
 *     responses:
 *       200:
 *         description: Updates a specific article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put([`/${base}/:id([a-f0-9]{24})`, `/${base}/:slug([\\w\\d\\-]+\\-[a-f0-9]{24})`], upload.single("image"), async (req, res) => {
    let imagePayload = {};
    let listErrors = [];
    let targetPath = undefined;

    const uploadedImage = req.body.file || req.file;
    const searchKey = req.params.id ? "_id" : "slug";
    const searchParam = req.params?.id || req.params.slug;

    if (uploadedImage) {
        let imageName;
        ({
            image_path: targetPath,
            errors: listErrors,
            image_name: imageName,
        } = uploadImage(uploadedImage, res.locals.upload_path));
        imagePayload = { image: imageName };
    }

    let oldRessource = {};
    try {
        [oldRessource] = await Article.find({ [searchKey]: searchParam }).lean();
    } catch (_error) {
        oldRessource = {};
    }

    if (listErrors.length) {
        return res.status(400).json({
            errors: listErrors,
            ressource: { ...oldRessource, ...req.body },
        });
    }

    try {
        let [ressource] = await Article.find({ [searchKey]: searchParam });
        const newPayload = { ...req.body, ...imagePayload };
        Object.entries(newPayload).forEach(([key, value]) => {
            ressource[key] = value;
        });

        if (req.body.author !== ressource.author) {
            // Unlink article with author
            await Author.findOneAndUpdate(
                { _id: ressource.author },
                { $pull: { list_articles: ressource._id } }
            );

            if (
                req.body.author
                && mongoose.Types.ObjectId.isValid(req.body.author)
            ) {
                ressource.author = req.body.author;
                await Author.findOneAndUpdate(
                    { _id: req.body.author },
                    { $addToSet: { list_articles: ressource._id } }
                );
            } else {
                // Unlink with no author
                ressource.author = null;
            }
        }
        await ressource.save();

        const [ressourceComputed] = await getArticles(ressource._id);

        res.status(200).json(ressourceComputed);
    } catch (err) {
        if (err instanceof mongoose.Error.DocumentNotFoundError) {
            res.status(404).json({
                errors: [`L'article "${req.params?.id || req.params.slug}" n'existe pas`],
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
                        err?.errors || [{ message: "Il y a eu un problème" }]
                    ).map(val => val.message),
                    ...deleteUpload(targetPath),
                ],
                ressource: { ...oldRessource, ...req.body },
            });
        }
    }
});

/**
 * @openapi
 * /articles/{id}:
 *   delete:
 *     tags:
 *      - Articles
 *     summary: Delete an article
 *     description: |
 *      On deletion all comments related are deleted
 *     parameters:
 *      - name: id
 *        in: path
 *        description: article's _id or slug
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24}|[\w\d\-]+\-[a-f0-9]{24})'
 *     responses:
 *       200:
 *         description: Deletes a specific article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
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
router.delete([`/${base}/:id([a-f0-9]{24})`, `/${base}/:slug([\\w\\d\\-]+\\-[a-f0-9]{24})`], async (req, res) => {
    try {
        const searchKey = req.params.id ? "_id" : "slug";
        const searchParam = req.params?.id || req.params.slug;
        const ressource = await Article.findOneAndDelete({ [searchKey]: searchParam });

        if (ressource?.image) {
            const targetPath = `${res.locals.upload_path}${ressource.image}`;
            fs.unlink(targetPath, () => {});
        }

        if (ressource) {
            req.flash("success", "Element supprimé");
            return res.status(200).json(ressource);
        }
        return res.status(404).json({
            errors: [`L'article "${req.params?.id || req.params.slug}" n'existe pas`],
        });
    } catch (_error) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                errors: [`"${req.params.id}" n'est pas un id valide`],
            });
        }
        return res
            .status(400)
            .json({ errors: ["Quelque chose s'est mal passé"] });
    }
});

const getArticles = async (id, queryParams) => {
    const computedQueryParams = {
        sorting: "desc",
        ...queryParams,
    };

    const searchPredicates = {
        ...(queryParams?.isActive !== "all" ? { is_active: queryParams?.isActive === "true" } : {}),
    };

    const isArray = Array.isArray(id);
    const listBsonIds = (isArray ? id : []).filter(mongoose.Types.ObjectId.isValid).map(item => mongoose.Types.ObjectId.createFromHexString(item));

    const ressource = await Article.aggregate([
        ...(isArray
            ? [...(id.length
                    ? [
                            { $match: {
                                $or: [
                                    { _id: { $in: listBsonIds } },
                                    { slug: { $in: id } },
                                ],
                            } },
                        ]
                    : [])]
            : [
                    {
                        $match: {
                            $or: [
                                { _id: id },
                                { slug: id },
                            ],
                        },
                    },
                ]
        ),
        ...(isArray
            ? [
                    { $match: searchPredicates },
                    { $sort: { updated_at: computedQueryParams.sorting === "asc" ? 1 : -1 } },
                    {
                        $skip: Math.max(computedQueryParams.page - 1, 0) * computedQueryParams.perPage,
                    },
                    { $limit: computedQueryParams.perPage },

                ]
            : []
        ),
        {
            $lookup: {
                from: "commentarticles",
                localField: "list_comments",
                foreignField: "_id",
                as: "list_comments",
            },
        },
        {
            $addFields: {
                nb_comments: { $size: "$list_comments" },
            },
        },
        { $unset: "list_comments" },
        {
            $lookup: {
                from: "authors",
                localField: "author",
                foreignField: "_id",
                as: "author",
            },
        },
        {
            $unwind: {
                path: "$author",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $addFields: {
                "author.nb_articles": {
                    // https://stackoverflow.com/questions/14213636/conditional-grouping-with-exists-inside-cond
                    $cond: [
                        { $not: ["$author.list_articles"] },
                        "$$REMOVE",
                        { $size: "$author.list_articles" },
                    ],
                },
            },
        },
        {
            $set: {
                author: {
                    $cond: [
                        { $not: ["$author.list_articles"] },
                        null,
                        "$author",
                    ],
                },
            },
        },
        { $unset: "author.list_articles" },
    ]);

    return ressource;
};

export default router;
