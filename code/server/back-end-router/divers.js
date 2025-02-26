import express from "express";
import routeName from "#server/utils/name-route.middleware.js";

const base = "divers";
const router = express.Router();

// Get multiple authors
router.get(`/${base}`, routeName("divers_list"), async (req, res) => {
    res.render("pages/back-end/divers/divers.njk", {
    });
});


export default router;
