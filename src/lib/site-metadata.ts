import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface DialineConfigLike {
  siteMetaPath?: string;
}

export interface SiteMetadata {
  site: {
    title: string;
    description: string;
    language: string;
    footerText: string;
  };
  profile: {
    avatarImagePath: string | null;
    faviconImagePath: string | null;
  };
  navigation: {
    homeLabel: string;
    archiveLabel: string;
    rssLabel: string;
  };
  home: {
    pageTitle: string;
    pageDescription: string;
    headline: string;
    intro: string;
    latestDaysHeading: string;
    latestEntriesHeading: string;
    emptyDaysText: string;
    emptyEntriesText: string;
  };
  archive: {
    pageTitle: string;
    pageDescription: string;
    emptyText: string;
  };
  entry: {
    backToDayLabel: string;
    contentUnavailableText: string;
  };
  day: {
    contentUnavailableText: string;
  };
  rss: {
    title: string;
    description: string;
  };
}

const projectRoot = process.cwd();
const dialineConfigPath = resolve(projectRoot, 'dialine.config.json');
const defaultSiteMetaPath = 'src/data/site-metadata.json';

const defaultSiteMetadata: SiteMetadata = {
  site: {
    title: 'Dialine Diary',
    description: '公開日記のサイトテンプレート',
    language: 'ja',
    footerText: 'Powered by Astro template for Dialine publishing.',
  },
  profile: {
    avatarImagePath: null,
    faviconImagePath: null,
  },
  navigation: {
    homeLabel: 'Home',
    archiveLabel: 'Archive',
    rssLabel: 'RSS',
  },
  home: {
    pageTitle: 'Dialine Diary',
    pageDescription: '公開済みの断片を日付別に表示する公式テンプレート',
    headline: 'Dialine Diary',
    intro: 'Dialine から公開された日記を表示する Astro テンプレートです。\n日別ページと投稿別ページを静的生成します。',
    latestDaysHeading: '最近の日別ページ',
    latestEntriesHeading: '最近の投稿',
    emptyDaysText: 'まだ日別ページがありません。',
    emptyEntriesText: 'まだ投稿がありません。',
  },
  archive: {
    pageTitle: 'Archive',
    pageDescription: '公開済みの投稿を月別に一覧表示します。',
    emptyText: 'まだ公開済みの投稿がありません。',
  },
  entry: {
    backToDayLabel: 'この日の一覧へ',
    contentUnavailableText: '投稿本文を表示できません。',
  },
  day: {
    contentUnavailableText: 'この日付の本文を表示できません。',
  },
  rss: {
    title: 'Dialine Diary',
    description: 'Dialine で公開された日記エントリーの RSS',
  },
};

export function loadSiteMetadata(): SiteMetadata {
  const dialineConfig = readJsonFile<DialineConfigLike>(dialineConfigPath);
  const siteMetaPath = normalizeRelativePath(dialineConfig?.siteMetaPath) ?? defaultSiteMetaPath;
  const siteMetadataJson = readJsonFile<Record<string, unknown>>(
    resolve(projectRoot, siteMetaPath),
  );

  return mergeSiteMetadata(siteMetadataJson);
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    const raw = readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function mergeSiteMetadata(source: Record<string, unknown> | null): SiteMetadata {
  const site = asRecord(source?.site);
  const profile = asRecord(source?.profile);
  const navigation = asRecord(source?.navigation);
  const home = asRecord(source?.home);
  const archive = asRecord(source?.archive);
  const entry = asRecord(source?.entry);
  const day = asRecord(source?.day);
  const rss = asRecord(source?.rss);

  return {
    site: {
      title: stringValue(site.title) ?? defaultSiteMetadata.site.title,
      description: stringValue(site.description) ?? defaultSiteMetadata.site.description,
      language: stringValue(site.language) ?? defaultSiteMetadata.site.language,
      footerText: stringValue(site.footerText) ?? defaultSiteMetadata.site.footerText,
    },
    profile: {
      avatarImagePath:
        stringValue(profile.avatarImagePath) ?? defaultSiteMetadata.profile.avatarImagePath,
      faviconImagePath:
        stringValue(profile.faviconImagePath) ?? defaultSiteMetadata.profile.faviconImagePath,
    },
    navigation: {
      homeLabel: stringValue(navigation.homeLabel) ?? defaultSiteMetadata.navigation.homeLabel,
      archiveLabel:
        stringValue(navigation.archiveLabel) ?? defaultSiteMetadata.navigation.archiveLabel,
      rssLabel: stringValue(navigation.rssLabel) ?? defaultSiteMetadata.navigation.rssLabel,
    },
    home: {
      pageTitle: stringValue(home.pageTitle) ?? defaultSiteMetadata.home.pageTitle,
      pageDescription:
        stringValue(home.pageDescription) ?? defaultSiteMetadata.home.pageDescription,
      headline: stringValue(home.headline) ?? defaultSiteMetadata.home.headline,
      intro: stringValue(home.intro) ?? defaultSiteMetadata.home.intro,
      latestDaysHeading:
        stringValue(home.latestDaysHeading) ?? defaultSiteMetadata.home.latestDaysHeading,
      latestEntriesHeading:
        stringValue(home.latestEntriesHeading) ??
        defaultSiteMetadata.home.latestEntriesHeading,
      emptyDaysText:
        stringValue(home.emptyDaysText) ?? defaultSiteMetadata.home.emptyDaysText,
      emptyEntriesText:
        stringValue(home.emptyEntriesText) ?? defaultSiteMetadata.home.emptyEntriesText,
    },
    archive: {
      pageTitle: stringValue(archive.pageTitle) ?? defaultSiteMetadata.archive.pageTitle,
      pageDescription:
        stringValue(archive.pageDescription) ?? defaultSiteMetadata.archive.pageDescription,
      emptyText: stringValue(archive.emptyText) ?? defaultSiteMetadata.archive.emptyText,
    },
    entry: {
      backToDayLabel:
        stringValue(entry.backToDayLabel) ?? defaultSiteMetadata.entry.backToDayLabel,
      contentUnavailableText:
        stringValue(entry.contentUnavailableText) ??
        defaultSiteMetadata.entry.contentUnavailableText,
    },
    day: {
      contentUnavailableText:
        stringValue(day.contentUnavailableText) ?? defaultSiteMetadata.day.contentUnavailableText,
    },
    rss: {
      title: stringValue(rss.title) ?? defaultSiteMetadata.rss.title,
      description: stringValue(rss.description) ?? defaultSiteMetadata.rss.description,
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function stringValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeRelativePath(value: string | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}