import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import _ from "lodash";
import ip from "ip";
import FastGlob from "fast-glob";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nunjucks from "nunjucks";
import { DateTime } from "luxon";
import helmet from "helmet";
import cors from "cors";
import expressFlash from "express-flash";
import cookieSession from "cookie-session";

import mongoServer from "#database/index.js";

import frontendRouter from "./front-end-router.js";
import backendRouter from "./back-end-router/index.js";
import apiRouter from "./api-router/index.js";

import breadcrumb from "./utils/breadcrumb.middleware.js";
import responseTimeMiddleware from "./utils/responsetime.middleware.js";
import profilerFakeMiddleware from "./utils/profiler.middleware.js";

import { generateUrl, getNameForRoute } from "#generate-list-routes.js";
// import packageJSON from "../package.json" with { "type": "json" };

let envFilePath = `${process.cwd()}/env/.env.prod.local`;
if (process.env.NODE_ENV === "development") {
    envFilePath = `${process.cwd()}/env/.env.dev.local`;
}

const envVars = dotenv.config({ path: envFilePath });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hasEnvFile = fs.existsSync(envFilePath);

const app = express();
const hostip = ip.address();

if (process.env.NODE_ENV === "development") {
    const viteConfig = await import("../vite.config.js");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer(viteConfig);

    app.use(vite.middlewares);
}

if (process.env.NODE_ENV === "production") {
    const { rateLimit } = await import("express-rate-limit");
    // Authorize X requests / minutes / client
    const nbMaxRequests = 42;
    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: nbMaxRequests,
        headers: true,
        message: async () => {
            return { message: `La limite de ${nbMaxRequests} requêtes par minute a été dépassée.` };
        },
    });
    app.use(limiter);
}

// To improve security
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: false,
    })
);
app.use(cookieParser());
app.use(expressFlash());
app.use(cors());

app.use(
    cookieSession({
        name: "session",
        keys: ["scret"],
        maxAge: 24 * 60 * 60 * 1000,
    })
);

let publicPath = path.join(path.resolve(), "public");
if (process.env.NODE_ENV === "production") {
    publicPath = path.join(path.resolve(), "dist");
}

mongoServer()
    .then((res) => {
        console.log("---------------------------");
        console.log(`• \x1b[36m${res}\x1b[0m`);
        console.log("---------------------------");
    })
    .catch((err) => {
        console.log("\x1b[31m---------------------------");
        console.log(`• \x1b[31m${err}\x1b[0m`);
        console.log("\x1b[31m---------------------------");
    });

app.use(
    express.json({
        type: [
            "application/json",
            "application/csp-report",
            "application/reports+json",
            "application/importmap+json",
        ],
    })
);

let jsonFilesContent = {};
FastGlob.sync("./src/data/**/*.json").forEach((entry) => {
    try {
        const filePath = path.resolve(entry);
        jsonFilesContent = _.merge(
            jsonFilesContent,
            JSON.parse(fs.readFileSync(filePath).toString())
        );
    } catch {}
});

const getCurrentURL = (url) => {
    let computedURL = url;
    if (url.at(-1) === "/") {
        computedURL = computedURL.substring(0, computedURL.length - 1);
    }

    return computedURL;
};

const getAllCookies = (cookie) => {
    const res = cookie?.split("; ").map((item) => {
        return { [item.split("=")[0]]: item.split("=")[1] };
    });

    return res?.reduce((result, curr) => Object.assign(result, curr), {}) || {};
};

app.use(responseTimeMiddleware, function (req, res, next) {
    const start = new Date();
    const current_url = getCurrentURL(
        `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`
    );
    const base_url = `${req.protocol}://${req.get("host")}`;

    const context = {
        NODE_ENV: process.env.NODE_ENV,
        HOST_IP: hostip,
        current_url,
        base_url,
        admin_url: `${base_url}/admin${envVars.parsed?.ADMIN_SUFFIX || ""}`,
        upload_dir: "/uploads/",
        upload_path: path.normalize(`${publicPath}/uploads/`),
        upload_url: `${base_url}/uploads/`,
        query_string_params: req.query,
        list_cookies: getAllCookies(req.headers.cookie),
    };

    res.locals = {
        ...jsonFilesContent,
        ...context,
        ...envVars.parsed,
    };   
    
    const originalRender = res.render;
    res.render = async function (view, local, callback) {
        let tplContent = {};

        const tplContentPath = path.join(__dirname, "..", `/src/${view}.json`);
        const tplTmpFilename = path.format({ ...path.parse(view), base: "", ext: ".tmp.njk" });
        const tplTmpContentPath = path.join(__dirname, "..", `/src/${tplTmpFilename}.json`);

        if (fs.existsSync(tplContentPath)) {
            tplContent = JSON.parse(fs.readFileSync(tplContentPath).toString());
        } else if (fs.existsSync(tplTmpContentPath)) {
            tplContent = JSON.parse(fs.readFileSync(tplTmpContentPath).toString());
        }

        if (process.env.NODE_ENV === "development" && getNameForRoute(app, req.baseUrl + req.route?.path).NAME !== "eslint") {
            const { getReport: getEslintReport } = await import("./utils/eslint.middleware.js");
            req.app.locals.eslint_report = await getEslintReport("short");
        }

        const duration = new Date() - start;

        profilerFakeMiddleware(req, res);

        req.app.locals.profiler = {
            ...req.app.locals.profiler,
            has_env_file: hasEnvFile,
        };

        res.type(".html");
        const args = [
            view, 
            { 
                ...local, 
                ...tplContent, 
                response_time: duration, 
                is_admin: ["admin", "debug"].some((item) => req.originalUrl.includes(item)), 
            }, 
            callback,
        ];

        originalRender.apply(this, args);
    };

    next();
});

app.use(express.static(publicPath));

app.set("view engine", "nunjucks");
app.set("views", path.join(__dirname, "..", "/src"));

if (!hasEnvFile) {
    console.log("\x1b[33m~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    console.log(`⚠ Please create a ${envFilePath.replace(process.cwd(), "")} file`);
    console.log("\x1b[33m~~~~~~~~~~~~~~~~~~~~~~~~~~~");

    if (process.env.NODE_ENV === "production") {
        app.use("*", (req, res) => {
            res.render("pages/missing-env.njk");
        });
    }
}

app.use(`/admin${envVars.parsed?.ADMIN_SUFFIX || ""}`, breadcrumb, backendRouter);
app.use("/api", apiRouter);
app.use(frontendRouter);

if (process.env.NODE_ENV === "development") {
    const options = {
        customSiteTitle: "Swagger SAE 501",
    };
    
    app.use(function (req, res, next) {
        res.on("finish", async function () {
            if (req.route !== undefined) {
                const useEslintAutoFix = (envVars.parsed?.IS_ESLINT_AUTO_FIX_ENABLED === "true");
                const { ESLint } = await import("eslint");
                const eslint = new ESLint({ fix: useEslintAutoFix });
                
                const results = await eslint.lintFiles([
                    "./server/**/*.js",
                    "./database/**/*.js",
                    "./src/**/*.js",
                ]);
        
                if (useEslintAutoFix) {
                    await ESLint.outputFixes(results);
                }        
            }
        });
        next();
    });

    const swaggerUi = await import("swagger-ui-express")
    const swaggerSpec = await import("./swagger.js");

    app.use(["/swagger", "/api-docs"], swaggerUi.serve, swaggerUi.setup(swaggerSpec.default, options));

    const debugRouter = await import("./debug-router.js");
    app.use("/debug", breadcrumb, debugRouter.default);
    app.use(async (err, req, res, _next) => {
        res.status(500);
        const response = {
            error: err,
            statusCode: res.statusCode,
            sourceCode: null,
        };

        try {
            const regexErrorLineAndFile
                = /\((([A-z]:)?.*)\).*\[Line\s*(\d+).*Column\s*(\d+)/gs;
            const results = [
                ...err.toString().matchAll(regexErrorLineAndFile),
            ].flat();
            const filePath = results[1];
            const lineError = Number(results[3] || 1);
            const columnError = Number(results[4] || 1);

            const data = fs.readFileSync(filePath, "utf8");
            const location = {
                start: { line: lineError, column: columnError },
            };

            const { codeFrameColumns } = await import("@babel/code-frame");

            const result = codeFrameColumns(data, location, {
                linesAbove: 5,
                linesBelow: 5,
            });
            response.sourceCode = result;
            const listFileName = {
                njk: "nunjucks",
                js: "javascript",
            };
            response.fileType
                = listFileName?.[filePath.split(".").at(-1)] || "";
            response.details = {
                file_path: filePath,
                line: lineError,
                column: columnError,
            };
        } catch (err) {
            console.error(err);
        }

        res.render("pages/error.njk", response);
    });

    ;(async () => {
        const { ESLint } = await import("eslint");
        const eslint = new ESLint();
        
        const results = await eslint.lintFiles([
            "./server/**/*.js",
            "./database/**/*.js",
            "./src/**/*.js",
        ]);

        const formatter = await eslint.loadFormatter("stylish");
        const resultText = formatter.format(results);

        if (resultText.length) {
            console.log("\x1b[30m\x1b[33m\x1b[4m---------- ESLint ---------\x1b[0m");
            console.log(resultText);
            console.log("\x1b[30m\x1b[33m\x1b[4m---------------------------\x1b[0m");
        }
    })().catch((error) => {
        process.exitCode = 1;
        console.error(error);
    });
}

const nunjucksEnv = nunjucks.configure(app.get("views"), {
    autoescape: true,
    express: app,
    noCache: process.env.NODE_ENV === "development",
    web: {
        useCache: process.env.NODE_ENV !== "development",
    },
});

nunjucksEnv.addFilter("date", (value, format) => {
    return DateTime.fromISO(value).toFormat(format);
});

const getContextData = (root) => {
    let res = {};
    const getThroughObj = (obj, parentKey) => {
        const pathKey = [];
        pathKey.push(parentKey);
        Object.entries(obj).forEach(([key, value]) => {
            if (!["settings"].includes(key) && !_.isFunction(value)) {
                if (
                    value
                    && typeof value === "object"
                    && !Array.isArray(value)
                ) {
                    return getThroughObj(value, key);
                }

                const objKeyPath = pathKey.filter(Boolean);
                res = {
                    ...res,
                    ...objKeyPath.reduceRight(
                        (acc, obj) => {
                            return { [obj]: acc };
                        },
                        {
                            [key]: value,
                            ...objKeyPath.reduce(
                                (acc, resKey) => acc[resKey],
                                res
                            ),
                        }
                    ),
                };
            }
        });
    };

    getThroughObj(root);

    return res;
};

nunjucksEnv.addGlobal("context", function () {
    if (process.env.NODE_ENV === "development") {
        return getContextData(this.ctx);
    }
    return {};
});

nunjucksEnv.addFilter("routeName", function (name, params = {}) {
    const finalURL = generateUrl(app, name, params);

    return `/${finalURL}`;
});

nunjucksEnv.addFilter("getEslintLink", function (rule) {
    const baseURLStylistic = "https://eslint.style/rules/js";
    const baseURLEslint = "https://eslint.org/docs/latest/rules";

    if (rule?.includes("stylistic")) {
        const cleanedRule = rule.replace("@stylistic/", "");
        return `${baseURLStylistic}/${cleanedRule}`;
    }

    return `${baseURLEslint}/${rule}`;
});

nunjucksEnv.addFilter("formatNumber", function (value) {
    return new Intl.NumberFormat("fr-FR").format(
        value
    );
});

console.log(`
        ███████╗ █████╗ ███████╗    ███████╗ ██████╗  ██╗
        ██╔════╝██╔══██╗██╔════╝    ██╔════╝██╔═████╗███║
        ███████╗███████║█████╗      ███████╗██║██╔██║╚██║
        ╚════██║██╔══██║██╔══╝      ╚════██║████╔╝██║ ██║
        ███████║██║  ██║███████╗    ███████║╚██████╔╝ ██║
        ╚══════╝╚═╝  ╚═╝╚══════╝    ╚══════╝ ╚═════╝  ╚═╝
`);

if (process.env.NODE_ENV === "production") {
    console.log(`
    ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗
    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
    ██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║   ██║██║   ██║██╔██╗ ██║
    ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║   ██║██║   ██║██║╚██╗██║
    ██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
`);
}

const listDomains = [hostip, "::"];
const port = envVars?.parsed?.PORT || 3900;

app.listen(port, listDomains, () => {
    console.log("---------------------------");
    console.log(
        "Express server running at (ctrl/cmd + click to open in your browser):"
    );
    ["localhost", ...listDomains]
        .filter(Boolean)
        .filter((item) => item !== "::")
        .forEach((item) => {
            let prefix = "Network";
            if (item.includes("localhost")) {
                prefix = "Local";
            }
            console.log(`\x1b[35m➜\x1b[0m  ${prefix}: \x1b[35mhttp://${item}:${port}/\x1b[0m`);
        });
});
