const basePath = normalizeBasePath(import.meta.env.BASE_URL);

export function toLogicalPath(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const url = new URL(trimmed, 'https://dialine.invalid');
  let pathname = url.pathname;

  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    pathname = pathname.slice(basePath.length) || '/';
  }

  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  return pathname;
}

export function withBasePath(value: string): string {
  const logicalPath = toLogicalPath(value) ?? '/';

  if (!basePath) {
    return logicalPath;
  }

  return logicalPath === '/' ? `${basePath}/` : `${basePath}${logicalPath}`;
}

function normalizeBasePath(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return undefined;
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}