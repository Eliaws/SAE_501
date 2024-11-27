import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import querystring from "querystring";

import upload from "#server/uploader.js";

const base = "articles";
const router = express.Router();

// Get multiple articles
router.get(`/${base}`, async (req, res) => {
    const queryParams = querystring.stringify(req.query);
    const options = {
        method: "GET",
        url: `${res.locals.base_url}/api/${base}?${queryParams}`,
    };
    let result = {};
    try {
        result = await axios(options);
    } catch {}

    res.render("pages/back-end/articles/list.njk", {
        list_articles: result.data,
    });
});

// Get or create article
router.get([`/${base}/:id`, `/${base}/add`], async (req, res) => {
    const isEdit = req.params.id !== "add";

    let result = {};
    let listErrors = [];

    try {
        if (isEdit) {
            const options = {
                method: "GET",
                url: `${res.locals.base_url}/api/${base}/${req.params.id}`,
            };
            result = await axios(options);
        }
    } catch (error) {
        listErrors = error.response.data.errors;
    }

    res.render("", {
        article: result?.data || {},
        list_errors: listErrors,
        is_edit: isEdit,
    });
});

// Create or update article
router.post([`/${base}/:id`, `/${base}/add`], upload.single("image"), async (req, res) => {
    let ressource = {};

    const isEdit = mongoose.Types.ObjectId.isValid(req.params.id);

    let listErrors = [];
    let listAuthors = [];

    let options = {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        data: {
            ...req.body,
            file: req.file,
        },
    };

    if (isEdit) {
        options = {
            ...options,
            method: "PUT",
            url: `${res.locals.base_url}/api/${base}/${req.params.id}`,
        };
    } else {
        options = {
            ...options,
            method: "POST",
            url: `${res.locals.base_url}/api/${base}`,
        };
    }

    try {
        const result = await axios(options);
        ressource = result.data;

        listAuthors = await axios({
            method: "GET",
            url: `${res.locals.base_url}/api/authors`,
        });
        listAuthors = listAuthors.data.data;
    } catch (e) {
        listErrors = e.response.data.errors;
        ressource = e.response.data.ressource || {};
    } finally {
        if (listErrors.length || isEdit) {
            res.render("", {
                article: ressource,
                list_errors: listErrors,
                list_authors: listAuthors,
                is_edit: isEdit,
            });
        } else {
            res.redirect(`${res.locals.admin_url}/${base}`);
        }
    }
});

export default router;
