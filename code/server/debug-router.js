import express from "express";
import openEditor from "launch-editor";

import { generateListRoutes } from "#generate-list-routes.js";
import routeName from "#server/utils/name-route.middleware.js";

import eslintMiddleware from "./utils/eslint.middleware.js";

const router = express.Router();

router.get("/", routeName("debug"), async (req, res) => {
    res.render("pages/back-end/debug/index.njk");
});

router.get("/router", routeName("debug_router"), async (req, res) => {
    const listRoutes = generateListRoutes(res.app);
    const listMethods = [...new Set(listRoutes.map(item => item.METHOD))];
    res.render("pages/back-end/debug/router.njk", {
        list_methods: listMethods,
        list_routes: listRoutes.filter((item) => {
            if (listMethods.includes(req.query?.method)) {
                return (
                    item.METHOD === req.query?.method
                    || item.METHOD === "ANY"
                );
            }
            return true;
        }),
    });
});

router.get(
    "/open/file",
    routeName("open_editor"),
    (req, res) => {
        openEditor(`${req.query.file}:${req.query.line}:${req.query.column}`);
        res.status(200).json(null);
    }
);

router.get("/eslint", eslintMiddleware, routeName("eslint"), (req, res) => {
    res.render("pages/back-end/debug/eslint.njk");
});

router.get("/swagger", routeName("swagger"), (req, res) => {
    res.render("pages/back-end/debug/swagger.njk");
});


export default router;
