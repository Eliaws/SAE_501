import express from "express";
import mongoose from "mongoose";
import querystring from "querystring";
import routeName from "#server/utils/name-route.middleware.js";


import Message from "#models/message.js";

const router = express.Router();
const base = "messages";



/**
 * @openapi
 * /messages:
 *   post:
 *     tags:
 *       - Messages
 *     summary: Create a Message
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['lastname', 'firstname', 'email', 'content']
 *             properties:
 *               lastname:
 *                 type: string
 *                 description: Last name of the sender
 *                 required: true
 *               firstname:
 *                 type: string
 *                 description: First name of the sender
 *                 required: true
 *               email:
 *                 type: string
 *                 description: Email of the sender
 *                 required: true
 *               content:
 *                 type: string
 *                 description: Message content
 *                 required: true
 *               identity:
 *                 type: string
 *                 enum: [non_precise, autre, etudiant, parent]
 *                 description: Identity of the sender
 *     responses:
 *       201:
 *         description: Creates a Message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(`/${base}`, async (req, res) => {
    const ressource = new Message(req.body);

    try {
        await ressource.save();
        res.status(201).json(ressource);
    } catch (e) {
        res.status(400).json({
            errors: [...Object.values(e?.errors).map((item) => item.message),
            ],
        })
    }
})

router.get(`/${base}`, async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    let perPage = Number(req.query.per_page) || 7;
    // Clamps the value between 1 and 20
    perPage = Math.min(Math.max(perPage, 1), 20);
    try {
        const listRessources = await Message.aggregate([
            { $sort: { _id: -1 } },
            { $skip: Math.max(page - 1, 0) * perPage },
            { $limit: perPage },
        ]);

        const count = await Message.countDocuments();

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





export default router;

