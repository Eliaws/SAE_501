import { ESLint } from "eslint";
import path from "path";

const diffString = (diffMe, diffBy) => diffMe.split(diffBy).join("");

export const getReport = async (type = "full") => {
    const eslint = new ESLint();

    const results = await eslint.lintFiles([
        "./server/**/*.js",
        "./database/**/*.js",
        "./src/**/*.js",
    ]);

    let eslintReport = {
        server: {
            report_details: [],
            summary: {
                errorCount: 0,
                warningCount: 0,
            },
        },
        frontend: {
            report_details: [],
            summary: {
                errorCount: 0,
                warningCount: 0,
            },
        },
    };

    const JSONformatter = await eslint.loadFormatter("json");
    let resultJSON = JSON.parse(
        JSONformatter.format(results, { hour12: false })
    );
    resultJSON = resultJSON.filter((item) => {
        return item.messages.length > 0;
    });

    if (resultJSON.length > 0) {
        resultJSON = resultJSON.map((item) => {
            const copy = { ...item };
            const rootFolder = item.filePath.split(path.sep)[0];
            copy.filePathShorten = `${rootFolder}${path.sep}[...]${diffString(
                item.filePath,
                process.cwd()
            )}`;

            delete copy.source;

            return copy;
        });

        const frontendResult = resultJSON.filter((item) =>
            item.filePath.includes("src")
        );
        const serverResult = resultJSON.filter(
            (item) => !item.filePath.includes("src")
        );

        eslintReport["server"] = {
            report_details: serverResult,
            summary: {
                errorCount: serverResult.reduce(
                    (accumulator, currentValue) =>
                        accumulator + currentValue.errorCount,
                    0
                ),
                warningCount: serverResult.reduce(
                    (accumulator, currentValue) =>
                        accumulator + currentValue.warningCount,
                    0
                ),
            },
        };
        eslintReport["frontend"] = {
            report_details: frontendResult,
            summary: {
                errorCount: frontendResult.reduce(
                    (accumulator, currentValue) =>
                        accumulator + currentValue.errorCount,
                    0
                ),
                warningCount: frontendResult.reduce(
                    (accumulator, currentValue) =>
                        accumulator + currentValue.warningCount,
                    0
                ),
            },
        };

        if (type !== "full") {
            eslintReport = {
                errorCount:
                    eslintReport["frontend"].summary.errorCount
                    + eslintReport["server"].summary.errorCount,
                warningCount:
                    eslintReport["frontend"].summary.warningCount
                    + eslintReport["server"].summary.warningCount,
            };
        }
    }

    return eslintReport;
};

export default async (req, res, next) => {
    if (
        process.env.NODE_ENV !== "development"
        || req.originalUrl.includes("src")
        || req.originalUrl.includes("@vite")
        || req.originalUrl.includes("node_modules")
        || req.originalUrl.includes("database")
        || req.originalUrl.includes("api")
    ) {
        return next();
    }

    const t0 = performance.now();
    const eslintReport = await getReport();
    const t1 = performance.now();

    if (req.app.locals.eslint_report !== JSON.stringify(eslintReport)) {
        const today = new Date();
        const timezoneOffset = -(today.getTimezoneOffset() / 60);

        req.app.locals.time_execution = ((t1 - t0) / 1000).toFixed(2);
        req.app.locals.last_report_time = `${today.toUTCString()}+${timezoneOffset} (${
            Intl.DateTimeFormat().resolvedOptions().timeZone
        })`;
    }

    req.app.locals.eslint_report = eslintReport;
    
    next();
};

