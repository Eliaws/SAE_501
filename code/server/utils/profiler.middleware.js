import { getNameForRoute } from "#generate-list-routes.js";

// Note : Fake middleware
export default (req, res) => {
    const routeData = getNameForRoute(res.app, req.baseUrl + req.route?.path);

    req.app.locals.profiler = {
        status_code: res.statusCode,
        current_route: routeData.NAME,
        query_string: routeData.QUERY_STRING,
        eslint_report: req.app.locals.eslint_report,
    };
};
