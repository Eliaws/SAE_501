import express from "express";
import mongoose from "mongoose";

import CommentArticle from "#models/comment-article.js";
import Article from "#models/article.js";

const router = express.Router();
const base = "articles";

/**
 * @openapi
 * /articles/{id}/comments:
 *   post:
 *     tags:
 *      - Articles
 *     summary: Add a comment to an article
 *     parameters:
 *      - name: id
 *        in: path
 *        description: Article's _id or slug
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24}|[\w\d\-]+\-[a-f0-9]{24})'
 *     requestBody:
 *        content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  required: ["content"]
 *                  properties:
 *                    content:
 *                      type: string
 *     responses:
 *       201:
 *         description: Creates a comment for an article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentArticle'
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
router.post([`/${base}/:id([a-f0-9]{24})/comments`, `/${base}/:slug([\\w\\d\\-]+\\-[a-f0-9]{24})/comments`], async (req, res) => {
    try {
        const searchKey = req.params.id ? "_id" : "slug";
        const searchParam = req.params?.id || req.params.slug;

        const [article] = await Article.find({ [searchKey]: searchParam });
        if (!article) {
            throw new mongoose.Error.DocumentNotFoundError();
        }
        const ressource = new CommentArticle({ ...req.body, article });
        await ressource.save();

        article.list_comments.push(ressource);
        await article.save();

        res.status(201).json(ressource.getClean());
    } catch (err) {
        if (err instanceof mongoose.Error.DocumentNotFoundError) {
            res.status(404).json({
                errors: [`L'article "${req.params.id}" n'existe pas`],
            });
        } else if (err instanceof mongoose.Error.CastError) {
            res.status(400).json({
                errors: [`"${req.params.id}" n'est pas un _id valide`],
            });
        } else {
            res.status(400).json({
                errors: [
                    ...Object.values(err?.errors || [{ message: "Il y a eu un problème" }]).map(val => val.message),
                ],
            });
        }
    }
});

/**
 * @openapi
 * /articles/{id}/comments:
 *   get:
 *     tags:
 *      - Articles
 *     summary: Get comments for one article
 *     description: |
 *        Returns 20 by 20 comments related to one article
 *     parameters:
 *      - name: id
 *        in: path
 *        description: article's _id or slug
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24}|[\w\d\-]+\-[a-f0-9]{24})'
 *      - in: query
 *        name: page
 *        schema:
 *          type: integer
 *          example: 1
 *        description: Page's number
 *     responses:
 *      200:
 *         description: Get all comments for an article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListCommentsArticle'
 *      400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *      404:
 *        description: Ressource not found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Error'
 */
router.get([`/${base}/:id([a-f0-9]{24})/comments`, `/${base}/:slug([\\w\\d\\-]+\\-[a-f0-9]{24})/comments`], async (req, res) => {
    try {
        const page = Math.max(1, req.query.page || 1);
        const perPage = 20;

        const ressource = await Article.aggregate([
            { $match: {
                $or: [
                    { _id: mongoose.Types.ObjectId.createFromHexString(req.params.id) },
                    { slug: req.params.slug },
                ],
            } },
            {
                $project: {
                    list_comments: 1,
                },
            },
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
                    page: page,
                    count: { $size: "$list_comments" },
                    total_pages: {
                        $ceil: {
                            $divide: [{ $size: "$list_comments" }, perPage],
                        },
                    },
                    list_comments: {
                        $slice: [
                            {
                                $sortArray: {
                                    input: "$list_comments",
                                    sortBy: {
                                        created_at: -1,
                                    },
                                },
                            },
                            Math.max(page - 1, 0) * perPage,
                            perPage,
                        ],
                    },
                },
            },
        ]);

        if (!ressource.length) {
            return res.status(404).json({
                errors: [`L'article "${req.params.id}" n'existe pas`],
            });
        }

        res.status(200).json(ressource[0]);
    } catch (err) {
        res.status(400).json({
            errors: [
                ...Object.values(
                    err?.errors || [{ message: "Il y a eu un problème" }]
                ).map(val => val.message),
            ],
        });
    }
});

/**
 * @openapi
 * /articles/{id}/comments/{comment_id}:
 *   delete:
 *     tags:
 *      - Articles
 *     summary: Delete a comment
 *     parameters:
 *      - name: id
 *        in: path
 *        description: article's _id
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24})'
 *      - name: comment_id
 *        in: path
 *        description: article's comment's _id
 *        required: true
 *        schema:
 *          type: string
 *          pattern: '([0-9a-f]{24})'
 *     responses:
 *       200:
 *         description: Deletes an article's comment's
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentArticle'
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
router.delete([`/${base}/:id([a-f0-9]{24})/comments/:comment_id([a-f0-9]{24})`, `/${base}/:slug([\\w\\d\\-]+\\-[a-f0-9]{24})/comments/:comment_id([a-f0-9]{24})`], async (req, res) => {
    try {
        const ressource = await CommentArticle.findOneAndDelete({
            article: req.params.id,
            _id: req.params.comment_id,
        });

        if (ressource) {
            req.flash("success", "Element supprimé");
            return res.status(200).json(ressource);
        }
        return res.status(404).json({
            errors: [`Le commentaire "${req.params.comment_id}" n'existe pas`],
        });
    } catch (_error) {
        return res
            .status(400)
            .json({
                error: "Quelque chose s'est mal passé, veuillez recommencer",
            });
    }
});

export default router;
