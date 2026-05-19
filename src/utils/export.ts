function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function slugifyFilename(name: string) {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || 'french-writing'
}

export function downloadPlainTextFile(title: string, plainText: string) {
  downloadBlob(`${slugifyFilename(title)}.txt`, plainText, 'text/plain;charset=utf-8')
}

export function downloadHtmlFile(title: string, html: string) {
  const documentHtml = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    ${html}
  </body>
</html>`

  downloadBlob(`${slugifyFilename(title)}.html`, documentHtml, 'text/html;charset=utf-8')
}
