export function replaceMeta(html, title, description, image, url) {
  return html
    .replace(/<title>([^<]+)<\/title>/, `<title>$1: ${title}</title>`)
    .replace(/<meta property="([^:]+):title" content="[^"]+" ?\/>/g, `<meta property="$1:title" content="${title}"/>`)
    .replace(/<meta name="description" content="[^"]+" ?\/>/, `<meta name="description" content="${description}"/>`)
    .replace(/<meta property="([^:]+):description" content="[^"]+" ?\/>/g, `<meta property="$1:description" content="${description}"/>`)
    .replace(/<meta property="([^:]+):image" content="[^"]+" ?\/>/g, `<meta property="$1:image" content="${image}"/>`)
    .replace(/<meta property="([^:]+):url" content="[^"]+" ?\/>/g, `<meta property="$1:url" content="${url}"/>`)
}

export function escapeHtml(str) {
  return str
    .replace(/(\r\n|\n|\r)/gm, '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
