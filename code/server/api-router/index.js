import express from "express";

import SAERouter from "./sae.js";
import ArticleRouter from "./article.js";
import AuthorRouter from "./author.js";
import ArticleCommentRouter from "./comment-article.js";
import MessageRouter from "./message.js";

const router = express.Router();

router.use(SAERouter);
router.use(ArticleRouter);
router.use(AuthorRouter);
router.use(ArticleCommentRouter);
router.use(MessageRouter);
router.all("*", (req, res) => {
    res.status(404).json({
        errors: [
            `La route "${req.path}" n'existe pas`,
        ],
    });
});

export default router;
