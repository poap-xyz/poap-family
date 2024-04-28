export function appendFrame(html, eventIds, env) {
  let frame =
    '\n<meta property="fc:frame" content="vNext"/>' +
    `\n<meta property="fc:frame:image" content="${env.FAMILY_URL}/frame/${eventIds.join(',')}"/>` +
    '\n<meta name="fc:frame:button:1" content="View Family"/>' +
    '\n<meta name="fc:frame:button:1:action" content="link"/>' +
    `\n<meta name="fc:frame:button:1:target" content="${env.FAMILY_URL}/event/${eventIds.join(',')}"/>`;

  return html.replace('</head>', `${frame}\n</head>`)
}
