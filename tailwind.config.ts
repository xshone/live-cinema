import type { Config } from "tailwindcss"

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "neo-bg": "#FFFDF5",
                "neo-accent": "#FF6B6B",
                "neo-secondary": "#FFD93D",
                "neo-muted": "#C4B5FD",
            },
            fontFamily: {
                space: ["var(--font-space-grotesk)", "sans-serif"],
            },
            boxShadow: {
                "neo-sm": "4px 4px 0px 0px #000",
                "neo-md": "8px 8px 0px 0px #000",
                "neo-lg": "12px 12px 0px 0px #000",
                "neo-xl": "16px 16px 0px 0px #000",
                "neo-white-md": "8px 8px 0px 0px #fff",
                "neo-white-lg": "12px 12px 0px 0px #fff",
            },
            animation: {
                "spin-slow": "spin-slow 12s linear infinite",
                "spin-slow-reverse": "spin-slow-reverse 8s linear infinite",
                marquee: "marquee 22s linear infinite",
                marquee2: "marquee2 22s linear infinite",
            },
            keyframes: {
                "spin-slow": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                },
                "spin-slow-reverse": {
                    from: { transform: "rotate(360deg)" },
                    to: { transform: "rotate(0deg)" },
                },
                marquee: {
                    "0%": { transform: "translateX(0%)" },
                    "100%": { transform: "translateX(-50%)" },
                },
                marquee2: {
                    "0%": { transform: "translateX(0%)" },
                    "100%": { transform: "translateX(-50%)" },
                },
            },
        },
    },
    plugins: [],
}
export default config
