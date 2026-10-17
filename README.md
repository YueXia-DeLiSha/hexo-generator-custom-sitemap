# hexo-generator-custom-sitemap

English | [简体中文](README.zh-CN.md)

A customizable sitemap generator for [Hexo](https://hexo.io). Unlike the default
sitemap plugins that dump every route into the file, this one lets you:

- **exclude** paths or single files with an `exclude` array
- **add** paths, files and external websites with an `extra_urls` array
- toggle pages, tags and categories independently

## Install

```bash
npm install hexo-generator-custom-sitemap --save
```

Then restart the server (`hexo clean && hexo generate`).

## Configure

Add a `sitemap` block to your site `_config.yml`:

```yaml
sitemap:
  status: true
  path: sitemap.xml
  rel: false
  tags: true
  categories: true
  exclude: [/tag,
    /404.html,
    /xxx.xxx]
  extra_urls: [/xxx,
    /xxx.html,
    "https://xxxx.com",
    "https://xxxx.top"]
```

### Options

| Key          | Type    | Default       | Description                                              |
| ------------ | ------- | ------------- | -------------------------------------------------------- |
| `status`     | boolean | `true`        | `true` generates the sitemap, `false` disables it.         |
| `path`       | string  | `sitemap.xml` | Where the sitemap is written.                             |
| `rel`        | boolean | `true`        | `true` includes regular pages, `false` excludes them.      |
| `tags`       | boolean | `true`        | `true` includes tag pages, `false` excludes them.          |
| `categories` | boolean | `true`        | `true` includes category pages, `false` excludes them.     |
| `exclude`    | array   | `[]`          | Paths/files to exclude from the sitemap.                  |
| `extra_urls` | array   | `[]`          | Paths/files/URLs to add to the sitemap.                   |

`exclude` and `extra_urls` accept both flow style (one line) and block style
(multiple lines), or even a comma/newline separated string. For example these
are equivalent:

```yaml
exclude: [/tag, /404.html]
```

```yaml
exclude:
  - /tag
  - /404.html
```

```yaml
exclude: "/tag, /404.html"
```

### exclude

Each item is treated as a **file** when its last segment has an extension,
otherwise it is treated as a **path**.

| Entry        | Meaning                                              |
| ------------ | ---------------------------------------------------- |
| `/404.html`  | Excludes exactly that file (`404.html` works too).   |
| `/xxx.xxx`   | Excludes exactly that file.                          |
| `/tag`       | Excludes the whole `/tag` path and everything below. |
| `/`          | Excludes the home page.                              |

Prefix matching respects path boundaries: excluding `/tag` removes `/tag/` and
`/tag/foo/`, but keeps `/tags/foo/`.

### extra_urls

Each item may be a path, a file, or a fully qualified website URL.

| Entry                | Result                        |
| -------------------- | ----------------------------- |
| `/xxx`               | Adds `<site>/xxx`             |
| `/xxx.html`          | Adds `<site>/xxx.html`        |
| `https://xxxx.com`   | Adds the external URL as-is   |
| `https://xxxx.top`   | Adds the external URL as-is   |

`extra_urls` are explicitly added, so `exclude` is not applied to them.

### Optional extras

```yaml
sitemap:
  include_home: true        # include the home page (default: true)
  lastmod: true             # include <lastmod> (default: true)
  changefreq: false         # e.g. daily
  priority: false           # e.g. "0.8"
```

## Output

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
  </url>
  <url>
    <loc>https://example.com/post/hello/</loc>
    <lastmod>2024-01-01T00:00:00.000Z</lastmod>
  </url>
  <url>
    <loc>https://xxxx.com</loc>
  </url>
</urlset>
```

## License

MIT. See [LICENSE](LICENSE).

Third-party attributions are listed in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
This package has no runtime npm dependencies; it only uses the Node.js built-in
`url` module.
