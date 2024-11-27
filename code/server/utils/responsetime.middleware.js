import onHeaders from "on-headers";

export default (req, res, next) => {
    const start = new Date();
    if (res._responseTime) return next();
    res._responseTime = true;
    onHeaders(res, () => {
        const duration = new Date() - start;
        res.set("X-Response-Time", `${duration} ms`);
        req.app.locals.response_time = `${duration} ms`;
    });

    next();
};
