const message = {
    type: "object",
    properties: {
        _id: {
            type: "string",
            pattern: "([0-9a-f]{24})",
        },
        firstname: {
            type: "string",
        },
        lastname: {
            type: "string",
        },
        email: {
            type: "string",
            format: "binary"
        },
        content: {
            type: "string",
        },
        identity: {
            type: "string",
            enum: ["non_precise", "autre", "etudiant", "parent"],
        },
    },
};

export { message }

export default {
    type: "object",
    properties: {
        count: {
            type: "integer",
        },
        total_pages: {
            type: "integer",
        },
        page: {
            type: "integer",
        },
        query_params: {
            type: "string",
        },
        data: {
            type: "array",
            items: message,
        },
    },
};
