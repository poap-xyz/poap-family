import { NextResponse } from 'next/server';
import { getEnv } from './netlify/loaders/env.js';
import { getEventInfo } from './netlify/loaders/api.js';
import { escapeHtml, replaceMeta } from './netlify/utils/html.js';
import { encodeEvent, parseEventId } from './netlify/utils/event.js';
import { appendFrame } from './netlify/utils/frame.js';

function parseRequestUrl(requestUrl) {
    const url = new URL(requestUrl);
    const [, rawEventId] = url.pathname.match(/event\/([^/]+)/);
    const searchParams = url.searchParams.toString();
    return [rawEventId, searchParams ? `?${searchParams}` : ''];
}

export async function middleware(request) {
    const response = await fetch(request);
    const html = await response.text();

    const [rawEventId, queryString] = parseRequestUrl(request.url);
    const eventId = parseEventId(rawEventId);
    const env = getEnv({});

    if (String(eventId) !== String(rawEventId)) {
        return new NextResponse(html, {
            status: 400,
            headers: {
                'content-type': 'text/html',
            },
        });
    }

    let eventInfo;
    try {
        eventInfo = await getEventInfo(eventId, env);
    } catch (err) {
        if (err?.response?.status === 404) {
            return new NextResponse(html, {
                status: 404,
                headers: {
                    'content-type': 'text/html',
                },
            });
        }
        return new NextResponse(html, {
            status: 503,
            headers: {
                'content-type': 'text/html',
            },
        });
    }

    if (!eventInfo) {
        return new NextResponse(html, {
            status: 200,
            headers: {
                'content-type': 'text/html',
            },
        });
    }

    const modifiedHtml = appendFrame(
        replaceMeta(
            html,
            escapeHtml(eventInfo.event.name),
            escapeHtml(encodeEvent(eventInfo)),
            `${eventInfo.event.image_url}?size=large`,
            `${env.FAMILY_URL}/event/${eventId}${queryString}`
        ),
        env,
        [eventId],
        eventInfo.ts
    );

    return new NextResponse(modifiedHtml, {
        ...response,
        headers: {
            'content-type': 'text/html',
        },
    });
}

export const config = {
    matcher: '/event/:path*',
};
