import { POAP_SCAN_URL } from '../models/poap'

const regexp =
  /[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/gi;

export default function linkify(text, Anchor) {
  const texts = []
  const urls = []

  let cursor = 0
  let match

  while ((match = regexp.exec(text))) {
    if (!text) {
      break
    }
    const matchedText = match[0]

    texts.push(text.slice(cursor, match.index))
    urls.push(matchedText)

    cursor = match.index + matchedText.length
  }

  texts.push(text.slice(cursor, text.length))

  const results = []

  for (let i = 0; i < texts.length; i++) {
    results.push(texts[i])

    if (urls[i]) {
      const href = /^https?:\/\//i.test(urls[i])
        ? urls[i]
        : /\.eth$/i.test(urls[i])
        ? `${POAP_SCAN_URL}/${urls[i]}`
        : `https://${urls[i]}`

      results.push(Anchor({ href, key: `${i}-${href}`, children: urls[i] }));
    }
  }

  return results.filter((x) => x)
}
