export function appendFrame(html, env, eventIds, ts, viewInFamily) {
  let frame =
    '\n<meta property="fc:frame" content="vNext"/>' +
    `\n<meta property="fc:frame:image" content="${env.FAMILY_URL}/frame/${eventIds.join(',')}${ts ? `?ts=${ts}` : ''}"/>` +
    '\n<meta name="fc:frame:button:1" content="View Family"/>' +
    '\n<meta name="fc:frame:button:1:action" content="link"/>' +
    `\n<meta name="fc:frame:button:1:target" content="${viewInFamily}"/>`;

  return html.replace('</head>', `${frame}\n</head>`)
}
