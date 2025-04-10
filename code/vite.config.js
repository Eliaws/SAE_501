import tailwindcss from "@vituum/vite-plugin-tailwindcss";

export default {
    base: "./code/",
    css: {
        devSourcemap: true,
    },
    plugins: [
        tailwindcss(),
    ],
    appType: "custom",
    server: {
        // Expose the server to the network allowing access from ip address
        host: true,
        hmr: true,
        middlewareMode: true,
    },
};
