import { styled } from "tailwind-styled-v4"

const badge = styled({ base: "inline-block rounded px-3 py-1 bg-purple-600 text-white text-xs" })

document.body.innerHTML = `<div class="p-8"><span class="${badge({})}">Rspack frontend ready</span></div>`
