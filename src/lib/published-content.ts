import { toLogicalPath } from './site-path';

type FrontmatterRecord = Record<string, unknown>;

type MarkdownModule = {
  frontmatter?: FrontmatterRecord;
  Content?: unknown;
  default?: unknown;
  rawContent?: () => string;
};

export interface DiaryDayEntryRef {
  id: string;
  time: string;
  entryAt?: string;
  url: string;
}

export interface EntryImageRef {
  id?: string;
  alt: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sortOrder?: number;
}

export interface DiaryDayDocument {
  date: string;
  title: string;
  updatedAt?: string;
  year: string;
  month: string;
  day: string;
  entries: DiaryDayEntryRef[];
  excerpt: string;
  permalink: string;
  Content: unknown;
  sourcePath: string;
  sortDate: Date;
}

export interface EntryDocument {
  id: string;
  title: string;
  date: string;
  time: string;
  entryAt?: string;
  createdAt?: string;
  updatedAt?: string;
  permalink: string;
  dayUrl?: string;
  images: EntryImageRef[];
  excerpt: string;
  Content: unknown;
  sourcePath: string;
  sortDate: Date;
}

const dayModules = import.meta.glob('../../content/diary/**/*.md', {
  eager: true,
}) as Record<string, MarkdownModule>;

const entryModules = import.meta.glob('../../content/entries/**/*.md', {
  eager: true,
}) as Record<string, MarkdownModule>;

const dayDocuments = Object.entries(dayModules)
  .map(([sourcePath, moduleValue]) => toDiaryDayDocument(sourcePath, moduleValue))
  .filter((value): value is DiaryDayDocument => value !== null)
  .sort((left, right) => right.sortDate.getTime() - left.sortDate.getTime());

const entryDocuments = Object.entries(entryModules)
  .map(([sourcePath, moduleValue]) => toEntryDocument(sourcePath, moduleValue))
  .filter((value): value is EntryDocument => value !== null)
  .sort((left, right) => right.sortDate.getTime() - left.sortDate.getTime());

export function listDiaryDays(): DiaryDayDocument[] {
  return dayDocuments;
}

export function listEntries(): EntryDocument[] {
  return entryDocuments;
}

export function findDiaryDayByDate(date: string): DiaryDayDocument | undefined {
  return dayDocuments.find((entry) => entry.date === date);
}

export function findEntryById(id: string): EntryDocument | undefined {
  return entryDocuments.find((entry) => entry.id === id);
}

function toDiaryDayDocument(
  sourcePath: string,
  moduleValue: MarkdownModule,
): DiaryDayDocument | null {
  const frontmatter = moduleValue.frontmatter ?? {};
  const date = stringValue(frontmatter.date);

  if (!date || !isDateString(date)) {
    return null;
  }

  const [year, month, day] = date.split('-');
  const title = stringValue(frontmatter.title) ?? date;
  const updatedAt = stringValue(frontmatter.updatedAt);
  const entries = normalizeDayEntries(frontmatter.entries);
  const permalink = `/diary/${year}/${month}/${day}/`;

  return {
    date,
    title,
    updatedAt,
    year,
    month,
    day,
    entries,
    excerpt: toExcerpt(moduleValue.rawContent?.() ?? title),
    permalink,
    Content: moduleValue.Content ?? moduleValue.default,
    sourcePath,
    sortDate: asDateOrDefault(updatedAt, `${date}T00:00:00Z`),
  };
}

function toEntryDocument(
  sourcePath: string,
  moduleValue: MarkdownModule,
): EntryDocument | null {
  const frontmatter = moduleValue.frontmatter ?? {};
  const id = stringValue(frontmatter.id);
  const date = stringValue(frontmatter.date);

  if (!id || !date || !isDateString(date)) {
    return null;
  }

  const time = normalizeTime(stringValue(frontmatter.time) ?? '00:00');
  const title = stringValue(frontmatter.title) ?? `${date} ${time}`;
  const permalink = toLogicalPath(stringValue(frontmatter.permalink)) ?? `/entries/${id}/`;
  const dayUrl = toLogicalPath(stringValue(frontmatter.dayUrl));
  const entryAt = stringValue(frontmatter.entryAt);
  const createdAt = stringValue(frontmatter.createdAt);
  const updatedAt = stringValue(frontmatter.updatedAt);
  const images = normalizeEntryImages(frontmatter.images);

  return {
    id,
    title,
    date,
    time,
    entryAt,
    createdAt,
    updatedAt,
    permalink,
    dayUrl,
    images,
    excerpt: toExcerpt(moduleValue.rawContent?.() ?? title),
    Content: moduleValue.Content ?? moduleValue.default,
    sourcePath,
    sortDate: resolveEntrySortDate({
      updatedAt,
      entryAt,
      createdAt,
      date,
      time,
    }),
  };
}

function normalizeEntryImages(value: unknown): EntryImageRef[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((image) => {
      if (!image || typeof image !== 'object') {
        return null;
      }

      const record = image as Record<string, unknown>;
      const alt = stringValue(record.alt) ?? stringValue(record.fileName) ?? 'image';
      const url = toLogicalPath(stringValue(record.url));

      if (!url) {
        return null;
      }

      return {
        id: stringValue(record.id),
        alt,
        url,
        fileName: stringValue(record.fileName),
        mimeType: stringValue(record.mimeType),
        width: integerValue(record.width),
        height: integerValue(record.height),
        sortOrder: integerValue(record.sortOrder),
      };
    })
    .filter((image): image is EntryImageRef => image !== null)
    .sort((left, right) => {
      const order = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
      if (order != 0) {
        return order;
      }

      return left.url.localeCompare(right.url);
    });
}

function normalizeDayEntries(value: unknown): DiaryDayEntryRef[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const id = stringValue(record.id);
      const time = normalizeTime(stringValue(record.time) ?? '00:00');
      const entryAt = stringValue(record.entryAt);
      const url = toLogicalPath(stringValue(record.url));

      if (!id || !url) {
        return null;
      }

      return { id, time, entryAt, url };
    })
    .filter((entry): entry is DiaryDayEntryRef => entry !== null);
}

function toExcerpt(source: string): string {
  const withoutFrontmatter = source.replace(/^---[\s\S]*?---\s*/, '').trim();
  const plainText = withoutFrontmatter
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[`*_>~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) {
    return '';
  }

  return plainText.length <= 180 ? plainText : `${plainText.slice(0, 177)}...`;
}

function resolveEntrySortDate(value: {
  updatedAt?: string;
  entryAt?: string;
  createdAt?: string;
  date: string;
  time: string;
}): Date {
  const candidates = [
    value.updatedAt,
    value.entryAt,
    value.createdAt,
    `${value.date}T${value.time}:00Z`,
  ];

  for (const candidate of candidates) {
    const date = asDateOrNull(candidate);
    if (date) {
      return date;
    }
  }

  return new Date(0);
}

function asDateOrDefault(value: string | undefined, fallback: string): Date {
  return asDateOrNull(value) ?? asDateOrNull(fallback) ?? new Date(0);
}

function asDateOrNull(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function integerValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeTime(value: string): string {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const parts = value.split(':');
  if (parts.length < 2) {
    return '00:00';
  }

  const hour = Number.parseInt(parts[0] ?? '0', 10);
  const minute = Number.parseInt(parts[1] ?? '0', 10);

  const safeHour = Number.isNaN(hour) ? 0 : Math.min(Math.max(hour, 0), 23);
  const safeMinute = Number.isNaN(minute) ? 0 : Math.min(Math.max(minute, 0), 59);

  return `${safeHour.toString().padStart(2, '0')}:${safeMinute
    .toString()
    .padStart(2, '0')}`;
}
