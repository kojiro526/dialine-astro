import type { APIContext } from 'astro';

import { listEntries } from '../lib/published-content';
import { withBasePath } from '../lib/site-path';
import { loadSiteMetadata } from '../lib/site-metadata';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function asUtcString(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toUTCString();
}

export function GET(context: APIContext): Response {
  const siteMetadata = loadSiteMetadata();
  const site = context.site ?? new URL('https://example.com');
  const feedUrl = new URL(withBasePath('/rss.xml'), site).toString();
  const now = new Date().toUTCString();
  const entries = listEntries().slice(0, 50);

  const itemsXml = entries
    .map((entry) => {
      const entryUrl = new URL(withBasePath(entry.permalink), site).toString();
      const pubDate = asUtcString(
        entry.updatedAt ?? entry.createdAt ?? `${entry.date}T${entry.time}:00Z`,
        now,
      );

      return `<item>\n<title>${escapeXml(entry.title)}</title>\n<link>${entryUrl}</link>\n<guid>${entryUrl}</guid>\n<pubDate>${pubDate}</pubDate>\n<description>${escapeXml(entry.excerpt || entry.title)}</description>\n</item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n<title>${escapeXml(siteMetadata.rss.title)}</title>\n<link>${site.toString()}</link>\n<description>${escapeXml(siteMetadata.rss.description)}</description>\n<lastBuildDate>${now}</lastBuildDate>\n<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />\n${itemsXml}\n</channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
