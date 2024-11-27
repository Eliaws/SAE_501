export default (req, res, next) => {
    const fullUrl = req.originalUrl.split("?")[0];

    const arrayURL = fullUrl.split("/").filter(Boolean);
    let breadcrumb = [];

    arrayURL.forEach((_, idx) => {
        const urlPart = [arrayURL[idx]].map((item) => item.toLowerCase().replace("add", "créer"));

        if (idx === 0) {
            breadcrumb.push(urlPart);
        } else {
            breadcrumb.push([
                ...breadcrumb[idx - 1].filter(Boolean),
                ...urlPart,
            ]);
        }
    });

    breadcrumb = breadcrumb.map((item) => item.flat().join("/"));

    req.app.locals.breadcrumb = breadcrumb;

    next();
};
