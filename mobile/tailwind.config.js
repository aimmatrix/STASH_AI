/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: "#10B981",
                background: "#000000",
                card: "#121212",
                "card-foreground": "#FFFFFF",
                border: "#18181B",
            },
            fontFamily: {
                // You can add custom fonts here if loaded via expo-font
            }
        },
    },
    plugins: [],
}
