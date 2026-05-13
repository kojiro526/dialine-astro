# Dialine Astro Template

Dialine の GitHub 公開機能向けに作成した Astro テンプレートです。

- `content/diary` にある日別 Markdown を `/diary/YYYY/MM/DD/` で配信
- `content/entries` にある投稿別 Markdown を `/entries/{entryId}/` で配信
- `/archive/` で投稿一覧
- `/rss.xml` で RSS フィード

## 必要環境

- Node.js `>=22.12.0`

## セットアップ

1. 依存関係をインストール

```sh
npm ci
```

2. 開発サーバー起動

```sh
npm run dev
```

3. 本番ビルド

```sh
npm run build
```

## 重要ファイル

- `dialine.config.json`
	- Flutter 側の公開処理が参照する設定ファイル
- `content/diary/`
	- 日別 Markdown の格納先
- `content/entries/`
	- 投稿別 Markdown の格納先
- `public/media/`
	- 添付メディアの格納先
- `.github/workflows/deploy.yml`
	- GitHub Pages 用デプロイ workflow

## URL 構成

- Home: `/`
- Archive: `/archive/`
- Diary day: `/diary/YYYY/MM/DD/`
- Entry: `/entries/{entryId}/`
- RSS: `/rss.xml`

## Markdown frontmatter 例

### 投稿別 (`content/entries/{entryId}.md`)

```md
---
type: "diary_entry"
id: "entry_01HXABC"
title: "2026-05-12 09:12"
date: "2026-05-12"
time: "09:12"
createdAt: "2026-05-12T09:12:00+09:00"
updatedAt: "2026-05-12T09:12:00+09:00"
permalink: "/entries/entry_01HXABC/"
dayUrl: "/diary/2026/05/12/"
---

朝に散歩した。
```

### 日別 (`content/diary/YYYY/MM/YYYY-MM-DD.md`)

```md
---
type: "diary_day"
date: "2026-05-12"
title: "2026-05-12"
updatedAt: "2026-05-12T22:10:00+09:00"
entries:
	- id: "entry_01HXABC"
		time: "09:12"
		createdAt: "2026-05-12T09:12:00+09:00"
		updatedAt: "2026-05-12T09:12:00+09:00"
		url: "/entries/entry_01HXABC/"
---

## 09:12

朝に散歩した。
```

## GitHub Pages 設定

このテンプレートには `.github/workflows/deploy.yml` を同梱しています。

- Pages の公開ソースを「GitHub Actions」に設定
- `main` への push で `dist/` を deploy

### base path の扱い

- GitHub Pages の project site (`https://<user>.github.io/<repo>/`) は base path が必要です
- このテンプレートは `astro.config.mjs` で `site` から `base` を自動推定します
- GitHub Actions 上では `DIALINE_SITE_URL` 未設定でも `GITHUB_REPOSITORY` から既定の Pages URL を推定します
- 独自ドメインや `username.github.io` リポジトリでは `base` は通常不要です

設定方法:

1. 既定の GitHub Pages URL を使う場合
	- 追加設定なしで build/deploy 可能です
2. 独自ドメインや別URLを使う場合
	- `DIALINE_SITE_URL` に公開URLを設定します
3. URL path と build base を明示的にずらしたい場合
	- `DIALINE_BASE_PATH` を追加で設定します

例:

```sh
DIALINE_SITE_URL=https://kojiro526.github.io/dialine-astro/
```

frontmatter / entries 配列の `permalink`, `dayUrl`, `url` は base を含まない論理パスとして扱われ、テンプレート側で現在の `base` を付与します。

## 初期公開時の推奨確認

1. 独自ドメインや明示URLを使う場合は `DIALINE_SITE_URL` または `astro.config.mjs` の `site` を公開予定 URL に合わせる
2. `dialine.config.json` の `branch` が公開ブランチと一致しているか確認
3. `content/diary` と `content/entries` に Markdown がある状態で `npm run build` を実行
