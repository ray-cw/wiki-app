import { Crimson_Pro } from "next/font/google";
import localFont from "next/font/local";

// Headings: Beleren, the Magic card title face (from @saeris/typeface-beleren-bold).
export const beleren = localFont({
  src: "../node_modules/@saeris/typeface-beleren-bold/Beleren2016-Bold.woff",
  weight: "700",
  variable: "--font-beleren",
  fallback: ["Georgia", "serif"],
});

// Body: Crimson Pro, a free serif in the tradition of Minion Pro.
export const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson-pro",
});

// Tables and sidebars: Scaly Sans, from Solbera's D&D 5e fonts (CC BY-SA 4.0).
export const scalySans = localFont({
  src: [
    {
      path: "../node_modules/solbera-dnd-fonts/dist/Scaly Sans.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/solbera-dnd-fonts/dist/Scaly Sans Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../node_modules/solbera-dnd-fonts/dist/Scaly Sans Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../node_modules/solbera-dnd-fonts/dist/Scaly Sans Bold Italic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-scaly-sans",
  fallback: ["system-ui", "sans-serif"],
});
