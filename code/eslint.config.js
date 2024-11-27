import globals from "globals";
import pluginJs from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";

export default [
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    pluginJs.configs.recommended,
    stylistic.configs.customize({
        indent: 4,
        quotes: "double",
        semi: true,
        jsx: true,
    }),
    {
        rules: {
            "no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "no-empty": ["error", { allowEmptyCatch: true }],
            "no-var": "error",
            "@stylistic/quotes": [
                "error",
                "double",
                {
                    avoidEscape: true,
                },
            ],
            "@stylistic/semi": "warn",
            "@stylistic/no-trailing-spaces": "off",
            "@stylistic/no-multiple-empty-lines": "off",
            "@stylistic/arrow-parens": "off",
            "@stylistic/brace-style": ["error", "1tbs"],
            "@stylistic/comma-dangle": [
                "error",
                {
                    arrays: "always-multiline",
                    objects: "always-multiline",
                    imports: "always-multiline",
                    exports: "always-multiline",
                    functions: "never",
                },
            ],
        },
    },
    {
        ignores: [
            "dist/",
            "generate-list-routes.js",
            "tailwind.config.js",
            "eslint-vite.plugin.js",
            "vite.config.js",
            "vite.config.build.js",
            "eslint.config.js",
            "postcss.config.js",
            "server/swagger.js",
            "server/swagger-schemas/",
        ],
    },
];
