// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const site = resolveSiteUrl({
	explicitSiteUrl: process.env.DIALINE_SITE_URL,
	repository: process.env.GITHUB_REPOSITORY,
});

const base = resolveBasePath({
	explicitBasePath: process.env.DIALINE_BASE_PATH,
	site,
});

// https://astro.build/config
export default defineConfig({
	site,
	...(base === undefined ? {} : { base }),
	trailingSlash: 'always',
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		rehypePlugins: [prefixRootRelativeLinks(base)],
	},
});

function resolveSiteUrl({ explicitSiteUrl, repository }) {
	const explicit = normalizeSiteUrl(explicitSiteUrl);
	if (explicit !== undefined) {
		return explicit;
	}

	if (typeof repository === 'string') {
		const [owner, repo] = repository.split('/');
		if (owner && repo) {
			const userSiteRepo = `${owner}.github.io`;
			const pathname =
				repo.toLowerCase() === userSiteRepo.toLowerCase() ? '/' : `/${repo}/`;
			return new URL(pathname, `https://${owner}.github.io/`).toString();
		}
		}

	return 'https://example.com/';
}

function normalizeSiteUrl(value) {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return undefined;
	}

	try {
		return new URL(trimmed).toString();
	} catch {
		return undefined;
	}
}

function resolveBasePath({ explicitBasePath, site }) {
	const explicit = normalizeBasePath(explicitBasePath);
	if (explicit !== undefined) {
		return explicit;
	}

	return normalizeBasePath(new URL(site).pathname);
}

function normalizeBasePath(value) {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();
	if (!trimmed || trimmed === '/') {
		return undefined;
	}

	const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return withLeadingSlash.endsWith('/')
		? withLeadingSlash.slice(0, -1)
		: withLeadingSlash;
}

function prefixRootRelativeLinks(basePath) {
	return function transform(tree) {
		rewriteNode(tree, basePath);
	};
}

function rewriteNode(node, basePath) {
	if (!node || typeof node !== 'object') {
		return;
	}

	if (node.type === 'element' && node.properties) {
		rewriteUrlProperty(node.properties, 'href', basePath);
		rewriteUrlProperty(node.properties, 'src', basePath);
		rewriteUrlProperty(node.properties, 'poster', basePath);
		rewriteSrcSetProperty(node.properties, basePath);
	}

	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			rewriteNode(child, basePath);
		}
	}
}

function rewriteUrlProperty(properties, key, basePath) {
	const value = properties[key];
	if (typeof value !== 'string' || !isRootRelativeUrl(value)) {
		return;
	}

	properties[key] = joinBasePath(basePath, value);
}

function rewriteSrcSetProperty(properties, basePath) {
	const value = properties.srcset;
	if (typeof value !== 'string') {
		return;
	}

	properties.srcset = value
		.split(',')
		.map((candidate) => {
			const trimmed = candidate.trim();
			if (!trimmed) {
				return trimmed;
			}

			const [url, descriptor] = trimmed.split(/\s+/, 2);
			if (!isRootRelativeUrl(url)) {
				return trimmed;
			}

			const rewrittenUrl = joinBasePath(basePath, url);
			return descriptor ? `${rewrittenUrl} ${descriptor}` : rewrittenUrl;
		})
		.join(', ');
}

function isRootRelativeUrl(value) {
	return value.startsWith('/') && !value.startsWith('//');
}

function joinBasePath(basePath, value) {
	const strippedValue = stripBasePath(value, basePath);
	const normalizedValue = strippedValue.startsWith('/')
		? strippedValue
		: `/${strippedValue}`;

	if (basePath === undefined) {
		return normalizedValue;
	}

	return normalizedValue === '/' ? `${basePath}/` : `${basePath}${normalizedValue}`;
}

function stripBasePath(value, basePath) {
	if (basePath === undefined) {
		return value;
	}

	if (value === basePath) {
		return '/';
	}

	if (value.startsWith(`${basePath}/`)) {
		return value.slice(basePath.length);
	}

	return value;
}
