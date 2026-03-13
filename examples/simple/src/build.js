import { parseTailwindClasses } from "tailwind-styled-v4"

const parsed = parseTailwindClasses("md:hover:bg-blue-500 text-white")
console.log("parsed tokens =>", parsed.length)
