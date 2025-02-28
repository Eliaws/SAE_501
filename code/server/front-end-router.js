import express from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";

import routeName from "#server/utils/name-route.middleware.js";
import parseManifest from "#server/utils/parse-manifest.js";

const router = express.Router();
const jsonJPO = path.join(process.cwd(), "src", "data", "divers.json");

router.use(async (_req, res, next) => {
    const originalRender = res.render;
    res.render = async function (view, local, callback) {
        const manifest = {
            manifest: await parseManifest("frontend.manifest.json"),
        };

        const args = [view, { ...local, ...manifest }, callback];
        originalRender.apply(this, args);
    };

    next();
});

router.get("/", routeName("homepage"), async (req, res) => {
    const diversDataJPO = JSON.parse(await fs.readFile(jsonJPO, "utf-8"));
  
    // On crée un objet URLSearchParams basé sur req.query
    const params = new URLSearchParams(req.query);
    // Supprimer toutes les occurrences de "page"
    params.delete("page");
    // Puis, si req.query.page existait, on le ré-ajoute (en prenant la première valeur s'il s'agit d'un tableau)
    if (req.query.page) {
        const page = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
        params.set("page", page);
    }
  
    // Forcer les paramètres is_active et per_page
    params.set("is_active", "true");
    params.set("per_page", "3");

    const options = {
        method: "GET",
        url: `${res.locals.base_url}/api/articles?${params.toString()}`,
    };

    let result = {};
    try {
        result = await axios(options);
    } catch (error) {
        console.error("Erreur lors de la récupération des articles :", error);
    }
  
    res.render("pages/front-end/index.njk", {
        list_articles: result.data.data,
        diversDataJPO: diversDataJPO.jpo,
        paginator: {
            page: result.data.page || 1,  
            total_pages: result.data.total_pages || 1,  
            query_params: params.toString(),  
        },
    });
});

  
// "(.html)?" makes ".html" optional in the url
router.get("/a-propos(.html)?", routeName("about"), async (_req, res) => {
    const options = {
        method: "GET",
        url: `${res.locals.base_url}/api/saes?per_page=9`,
    };

    let result = {};
    try {
        result = await axios(options);
    } catch (_error) {}

    res.render("pages/front-end/about.njk", {
        list_saes: result.data,
    });
});

router.get("/nous-contacter(.html)?", async (req, res) => {
    res.render("pages/front-end/contact.njk", {
    });
});

router.get("/lieux(.html)?", async (req, res) => {
    res.render("pages/front-end/lieux.njk", {
    });
});

router.get("/sur-les-medias(.html)?", async (req, res) => {
    res.render("pages/front-end/medias.njk", {
    });
});

router.get("/author(.html)?", async (req, res) => {
    res.render("pages/front-end/author.njk", {
    });
});

router.get("/article/:id", async (req, res) => {
    const optionsArticle = {
        method: "GET",
        url: `${res.locals.base_url}/api/articles/${req.params.id}`,
    };
    const optionsComment = {
        method: "GET",
        url: `${res.locals.base_url}/api/articles/${req.params.id}/comments`,
    };

    let resultArticle = {};
    let resultComment = {};
    try {
        resultArticle = await axios(optionsArticle);
        resultComment = await axios(optionsComment);
    } catch (_error) {}

    res.render("pages/front-end/article.njk", {
        article: resultArticle.data,
        comments: resultComment.data,
    });
});

router.post("/article/:id/comments", async (req, res) => {
    try {
        const response = await axios.post(
            `${res.locals.base_url}/api/articles/${req.params.id}/comments`,
            req.body,
            { headers: { "Content-Type": "application/json" } }
        );

        req.flash("success", "Votre commentaire a bien été posté.");
        return res.json({ message: response.data });
    } catch (error) {
        const listErrors = error.response?.data?.errors || ["Erreur lors de l'envoi du commentaire"];
        res.render("pages/front-end/article.njk", { list_errors: listErrors });
    }
});


router.get("/author/:id", async (req, res) => {
    const options = {
        method: "GET",
        url: `${res.locals.base_url}/api/authors/${req.params.id}`,
    };

    let result = {};
    try {
        result = await axios(options);
    } catch (_error) {}

    res.render("pages/front-end/author.njk", {
        author: result.data,
    });
});

router.post("/nous-contacter(.html)?", async (req, res) => {
    try {
        // Envoi asynchrone des données au endpoint API
        const response = await axios.post(
            `${res.locals.base_url}/api/messages`,
            req.body,
            { headers: { "Content-Type": "application/json" } }
        );
        
        req.flash(
            "success",
            "Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais."
        );
        
        return res.json({ message: response.data });
    } catch (error) {
        const listErrors = error.response?.data?.errors || ["Erreur lors de l'envoi du message"];
        res.render("pages/front-end/contact.njk", { list_errors: listErrors });
    }
});


export default router;
