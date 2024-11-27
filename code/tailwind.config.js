/** @type {import('tailwindcss').Config} */

import containerQueries from "@tailwindcss/container-queries";
import forms from "@tailwindcss/forms";
import plugin from "tailwindcss/plugin";

export default {
    content: ["./src/**/*.{js,ts,jsx,tsx,njk}"],
    // safelist: [
    //     {
    //         pattern: /!?(bg|text)-.+/,
    //     },
    //     "hidden",
    // ],
    theme: {
        extend: {
            spacing: {
                11: "2.75rem",
                12: "3.25rem",
                13: "3.75rem",
                14: "4.25rem",
            },
            containers: {
                "5.5xl": "69rem",
            },
            transitionProperty: {
                "dialog": "background-color box-shadow"
            },
        },
    },
    plugins: [
        containerQueries,
        forms,
        plugin(({ addVariant, addComponents, theme }) => {
            addVariant("touch", "@media (pointer: coarse)");
            addVariant("no-touch", "@media (pointer: fine)");
            addVariant("inert", "&:where([inert], [inert] *)");
            addVariant("hocus", ["&:hover", "&:focus-visible"]);
            addVariant('group-hocus', [':merge(.group):hover &', ':merge(.group):focus-visible &']);
            addVariant("starting", "@starting-style");
            addComponents({
                ".active-tab": {
                    backgroundColor: theme("colors.slate.100"),
                },
            });
        }),
    ],
};
