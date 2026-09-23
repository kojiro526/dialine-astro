# Dialine Astro

Dialine が保存した日記データを、`@dialine/astro-site` で静的サイトへ変換して GitHub Pages に公開するユーザーリポジトリです。

Astro のページ、レイアウト、スタイル、ビルド設定は npm パッケージが管理します。このリポジトリでは投稿データ、メディア、サイト表示設定だけを管理します。

## 必要環境

- Node.js `>=22.19.0`
- pnpm `11.1.2`

## セットアップ

```sh
pnpm install --frozen-lockfile
```

開発サーバーを起動します。

```sh
pnpm dev
```

本番サイトを `dist/` に生成します。

```sh
pnpm build
```

## リポジトリ構成

```text
.
├─ dialine.config.json
├─ content/
│  ├─ diary/YYYY/MM/YYYY-MM-DD.md
│  └─ entries/{entryId}.md
├─ public/
│  └─ media/
├─ src/data/site-metadata.json
├─ package.json
├─ pnpm-lock.yaml
└─ pnpm-workspace.yaml
```

- `dialine.config.json`: Dialineアプリが参照する公開設定
- `content/diary/`: 日別Markdown
- `content/entries/`: 投稿別Markdown
- `public/media/`: 添付画像とプロフィール画像
- `src/data/site-metadata.json`: サイトタイトル、説明文、フッター、RSS文言

`src/data/site-metadata.json` はschema version 1との互換性のため、このパスを維持します。Astroのソースコードではありません。

## URL構成

- Home: `/`
- Archive: `/archive/`
- Diary day: `/diary/YYYY/MM/DD/`
- Entry: `/entries/{entryId}/`
- RSS: `/rss.xml`

## GitHub Pages

`.github/workflows/deploy.yml` が、`main` へのpush時に依存関係を固定lockfileからインストールし、`pnpm build` の出力をGitHub Pagesへデプロイします。

通常のproject siteでは、`GITHUB_REPOSITORY` から `https://<user>.github.io/<repo>/` とbase pathを自動推定します。

独自ドメインなどを使う場合は、GitHub ActionsのVariablesに次を設定します。

- `DIALINE_SITE_URL`: 完全な公開URL
- `DIALINE_BASE_PATH`: 自動推定と異なるbase pathが必要な場合のみ

## パッケージ更新

`@dialine/astro-site` は再現可能なビルドのため完全なバージョンで固定します。更新時は `package.json` のバージョンを変更し、lockfileも更新してください。

```sh
pnpm update @dialine/astro-site --save-exact
pnpm build
```
