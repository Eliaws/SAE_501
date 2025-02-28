import express from "express";
import axios from "axios";
// import mongoose from "mongoose";
import querystring from "querystring";

// import upload from "#server/uploader.js";

const base = "messages";
const router = express.Router();

// Get multiple messages
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
    res.render("pages/back-end/messages/list.njk", {
        list_messages: result.data,
        count: result.data.count,
    });
});

// Get single message
router.get(`/${base}/:id`, async (req, res) => {
    const options = {
        method: "GET",
        url: `${res.locals.base_url}/api/${base}/${req.params.id}`,
    };
    let result = {};
    try {
        result = await axios(options);
    } catch {}
    res.render("pages/back-end/messages/detailsMessage.njk", {
        message: result.data,
    });
});

export default router;

