const routeName = (routeName) => {
    return function namedRoute(req, res, next) {
        if (next) {
            next();
            return;
        }

        return routeName;
    };
};

export default routeName;
