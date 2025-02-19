import express from "express";
import axios from "axios";
import querystring from "querystring";

import routeName from "#server/utils/name-route.middleware.js";
import parseManifest from "#server/utils/parse-manifest.js";

// Routers
import SAERouter from "./sae.js";
import articleRouter from "./article.js";
import auteurRouter from "./author.js";
import messageRouter from "./message.js";

const router = express.Router();

router.use(async (_req, res, next) => {
    const originalRender = res.render;
    res.render = async function (view, local, callback) {
        const manifest = {
            manifest: await parseManifest("backend.manifest.json"),
        };

        const args = [view, { ...local, ...manifest }, callback];
        originalRender.apply(this, args);
    };

    next();
});

router.use(SAERouter);
router.use(articleRouter);
router.use(auteurRouter);
router.use(messageRouter);

router.get("/", routeName("admin"), async (req, res) => {
    const queryParamsSAEs = querystring.stringify({ per_page: 5 });
    const optionsSAEs = {
        method: "GET",
        url: `${res.locals.base_url}/api/saes?${queryParamsSAEs}`,
    };

    const listSAEs = await axios(optionsSAEs);

    const queryParamsArticles = querystring.stringify({ per_page: 5 });
    const optionsArticles = {
        method: "GET",
        url: `${res.locals.base_url}/api/articles?${queryParamsArticles}`,
    };
    const listArticles = await axios(optionsArticles);

    const optionsMessages = {
        method: "GET",
        url: `${res.locals.base_url}/api/messages`,
    };

    const listMessages = await axios(optionsMessages);

    res.render("pages/back-end/index.njk", {
        list_saes: {
            data: listSAEs.data.data,
            count: listSAEs.data.count,
        },
        list_articles: {
            data: listArticles.data.data,
            count: listArticles.data.count,
        },
        list_messages: {
            data: listMessages.data.data,
            count: listMessages.data.count,
        },
    });
});

export default router;
