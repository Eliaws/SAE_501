import _ from "lodash";

const listRoutes = [];
const listNamedRoutes = {};
const regexRouteParams = /((:[A-z])\w+\??)/g;
const regexOptionalURLFileExt = /(\(\.([A-z])*\)\??)/g;

const print = (path, layer) => {
    if (layer.route) {
        layer.route.stack.forEach(
            print.bind(null, path.concat(split(layer.route.path)))
        );
    } else if (layer.name === "router" && layer.handle.stack) {
        layer.handle.stack.forEach(
            print.bind(null, path.concat(split(layer.regexp)))
        );
    } else if (layer.method || path.includes("*")) {
        const url = path.concat(split(layer.regexp)).filter(Boolean).join("/");

        url.split(",").forEach((item, idx, array) => {
            let computedPath = item;
            const method = path.includes("*") ? "ANY" : layer.method.toUpperCase();
           
            if (array.length > 1 && idx > 0) {
                const prefix = path.find((el) => el !== "");
                computedPath = prefix + computedPath;
            }

            const _routeName = () => {
                if (layer.handle.name === "namedRoute") {
                    const routeName = layer.handle();
                    listNamedRoutes[routeName] = [
                        ...(listNamedRoutes?.[routeName] || []),
                        {
                            url: computedPath.replace(
                                regexOptionalURLFileExt,
                                ""
                            ),
                            params: Array.from(
                                computedPath.matchAll(regexRouteParams)
                            )
                                .map((_item) => _item[0])
                                .map((_item) =>
                                    _item.replace(":", "").replace("?", "")
                                ),
                        },
                    ];

                    listNamedRoutes[routeName] = _.uniqBy(
                        listNamedRoutes[routeName],
                        "url"
                    );

                    return routeName;
                }

                return "";
            };

            const routeName = _routeName();

            listRoutes.push({
                METHOD: method,
                PATH: computedPath,
                NAME: routeName,
            });
        });
    }
};

const split = (thing) => {
    if (typeof thing === "string") {
        return thing.split("/");
    } else if (thing.fast_slash) {
        return "";
    } else {
        const match = thing
            .toString()
            .replace("\\/?", "")
            .replace("(?=\\/|$)", "$")
            .match(
                /^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//
            );

        return match
            ? match[1].replace(/\\(.)/g, "$1").split("/")
            : thing.toString().substring(1);
    }
};

const generateListRoutes = (app) => {
    if (!app) {
        throw new Error("app object is missing");
    }
    app._router.stack.forEach(print.bind(null, []));
    
    const listRoutesComputed = listRoutes
        .map((item) => {
            if (item.PATH[0] === "/") {
                return item;
            }

            return {
                ...item,
                PATH: `/${item.PATH}`,
            };
        })
        
    const response = []
    let indexRoute = -1;
    listRoutesComputed.forEach((route) => {
        indexRoute = response.findIndex((_item) => _item.PATH === route.PATH && _item.METHOD === route.METHOD)
        if(indexRoute > -1) {
            if (response[indexRoute].NAME === "") {
                response[indexRoute] = route;
            }
            return;
        } 

        response.push(route);
    })

    return response;
};

const generateNamedRoutes = (app) => {
    if (!app) {
        throw new Error("app object is missing");
    }
    app._router.stack.forEach(print.bind(null, []));

    return listNamedRoutes;
};

const generateUrl = (app, name, params) => {
    generateNamedRoutes(app);

    if (!listNamedRoutes[name]) {
        throw new Error(
            `Route named "${name}" is unknown. Please verify your routes.`
        );
    }

    let finalURL = "";
    const nbParamsInCommon = [];
    listNamedRoutes[name].forEach(({ params: urlParams }) => {
        nbParamsInCommon.push(
            _.intersection(Object.keys(params), urlParams).length
        );
    });
    const nbMaxParamsInCommon = Math.max(...nbParamsInCommon);
    const indexMaxParamsInComment = nbParamsInCommon.findIndex(
        (item) => item === nbMaxParamsInCommon
    );

    if (nbMaxParamsInCommon === 0) {
        // As default, we take the route with no params
        const { url, params: urlParams } = listNamedRoutes[name].find(
            (item) => item.params.length === 0
        );
        finalURL = url;

        const listQSParams = new URLSearchParams();
        _.difference(Object.keys(params), urlParams).forEach((item) => {
            listQSParams.append(item, params[item]);
        });

        if (listQSParams.toString()) {
            finalURL += `?${listQSParams.toString()}`;
        }
    } else {
        const { url, params: urlParams } = listNamedRoutes[name][indexMaxParamsInComment];
        urlParams.forEach((param) => {
            const valueForParam = params[param];
            // const regexGetUrlRegex = new RegExp(String.raw`:[${param}]+.(?<=\()([\[\]\w\-\{\}\\\+]+)(?=\))`, "g");
            // const regexUrl = [...url.matchAll(regexGetUrlRegex)][0][1];
            // const regexTestParam = new RegExp(String.raw`${regexUrl}`, "g");

            // if(!regexTestParam.test(valueForParam)) {
            //     throw new Error(
            //         `The value "${valueForParam}" is not correct for the param "${param}" in the route named "${name}". It doesn't match /${regexUrl}/. Please fix the value.`
            //     );
            // }
            const re = new RegExp(
                String.raw`:[${param}]+(\(.+\))?\??`,
                "g"
            );
            finalURL = url.replace(re, valueForParam);
        });
        const listQSParams = new URLSearchParams();
        _.difference(Object.keys(params), urlParams).forEach((item) => {
            listQSParams.append(item, params[item]);
        });

        if (listQSParams.toString()) {
            finalURL += `?${listQSParams.toString()}`;
        }
    }

    return finalURL;
};

const getNameForRoute = (app, pattern) => {
    if (!app) {
        throw new Error("app object is missing");
    }
    const listRoutes = generateListRoutes(app);

    const _route = listRoutes.filter((item) => item.NAME !== "").find((item) => {
        return pattern.split(",").includes(item.PATH);
    })

    return {
        ...(_route || { NAME: null }), 
        // QUERY_STRING: Object.fromEntries(new URLSearchParams(queryString)) 
    };
}

export { generateListRoutes, generateUrl, getNameForRoute };
