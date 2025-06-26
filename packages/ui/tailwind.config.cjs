/** @type {import('tailwindcss').Config} */

// TODO: ew
const round = (num) =>
	num
		.toFixed(7)
		.replace(/(\.[0-9]+?)0+$/, "$1")
		.replace(/\.0$/, "");
const em = (px, base) => `${round(px / base)}em`;

module.exports = {
	darkMode: ["class"],
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	prefix: "",
	theme: {
		fontSize: {
			sm: "13px",
			base: "16px",
			italic: "17px",
		},
		container: {
			center: true,
			padding: "2rem",
		},
		fontFamily: {
			sans: ["Helectiva", "sans-serif"],
			inter: ["Inter", "sans-serif"],
			serif: ["Newsreader", "serif"],
			mono: ["Newsreader", "serif"], // TODO probably change eventually but might not use anyway
		},
		extend: {
			screens: {
				"2xl": "1400px",
			},
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},

			typography: {
				DEFAULT: {
					css: {
						color: "inherit",
						maxWidth: "640px",
						h2: {
							color: "inherit",
							fontSize: "calc(1rem + 1px)",
							fontWeight: "inherit",
							fontFamily: "Newsreader, serif",
							fontStyle: "italic",
							marginTop: em(32, 36),
							marginBottom: "2rem",
							lineHeight: round(40 / 36),
						},
						h3: {
							color: "inherit",
							fontSize: "calc(1rem + 1px)",
							fontWeight: "inherit",
							fontFamily: "Newsreader, serif",
							fontStyle: "italic",
							lineHeight: round(40 / 36),
						},
						a: {
							color: "inherit",
						},
						em: {
							color: "inherit",
							fontSize: "calc(1rem + 1px)",
							fontWeight: "inherit",
							fontFamily: "Newsreader, serif",
							fontStyle: "italic",
						},
						"> :first-child": {
							marginTop: em(32, 36),
						},
					},
				},
			},
		},
	},

	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
