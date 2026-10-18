# hexo-generator-custom-sitemap

[English](README.md) | 简体中文

一个支持自定义的 [Hexo](https://hexo.io) 网站地图生成器。不同于默认插件把所有路由
粗暴地写进文件，本插件可以：

- 用 `exclude` 数组**排除**指定路径或单个文件
- 用 `extra_urls` 数组**追加**路径、文件和外部网站
- 独立控制页面、标签页、分类页是否收录

## 安装

```bash
npm install hexo-generator-custom-sitemap --save
```

安装后重启服务（`hexo clean && hexo generate`）。

## 配置

在站点 `_config.yml` 中添加 `sitemap` 配置块：

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

### 配置项

| 键           | 类型    | 默认值        | 说明                                         |
| ------------ | ------- | ------------- | -------------------------------------------- |
| `status`     | boolean | `true`        | `true` 生成地图，`false` 不生成。            |
| `path`       | string  | `sitemap.xml` | 地图存放路径。                               |
| `rel`        | boolean | `true`        | `true` 收录普通页面，`false` 排除。          |
| `tags`       | boolean | `true`        | `true` 收录标签页，`false` 排除。            |
| `categories` | boolean | `true`        | `true` 收录分类页，`false` 排除。            |
| `sitemap_index` | boolean | `false`   | `true` 将地图切片并生成索引文件。            |
| `sitemap_index_size` | number | `5000` | 每个切片的最大 URL 数（1–50000）。          |
| `exclude`    | array   | `[]`          | 需要从地图中排除的路径/文件。                |
| `extra_urls` | array   | `[]`          | 需要追加到地图的路径/文件/网址。             |

`exclude` 与 `extra_urls` 都支持单行 flow 写法、多行 block 写法，甚至逗号或换行
分隔的字符串。下面三种写法等价：

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

每一项按其最后一段是否带扩展名来判定：带扩展名视为**文件**，否则视为**路径**。

| 写法         | 含义                                     |
| ------------ | ---------------------------------------- |
| `/404.html`  | 仅排除该文件（写 `404.html` 也可以）。   |
| `/xxx.xxx`   | 仅排除该文件。                           |
| `/tag`       | 排除整个 `/tag` 路径及其下所有内容。      |
| `/`          | 排除首页。                               |

前缀匹配会遵守路径边界：排除 `/tag` 会移除 `/tag/`、`/tag/foo/`，但保留 `/tags/foo/`。

### extra_urls

每一项可以是路径、文件或完整的网站网址。

| 写法                 | 结果                          |
| -------------------- | ----------------------------- |
| `/xxx`               | 追加 `<站点>/xxx`             |
| `/xxx.html`          | 追加 `<站点>/xxx.html`        |
| `https://xxxx.com`   | 按原样追加外部网址            |
| `https://xxxx.top`   | 按原样追加外部网址            |

`extra_urls` 属于显式追加，因此不会被 `exclude` 过滤。

### 地图切片（sitemap index）

设置 `sitemap_index: true` 即可把地图切成多个文件：

```yaml
sitemap:
  path: sitemap.xml
  sitemap_index: true
  sitemap_index_size: 5000
```

开启后会生成 `sitemap-1.xml`、`sitemap-2.xml`……，并把 `path` 指定的文件作为
sitemap 索引（`<sitemapindex>`）。`sitemap_index_size` 是每个切片的最大 URL 数
（默认 `5000`）。超出 `1–50000` 或非数字的值会输出 WARN，并回退为 `5000`。

索引与切片文件中的所有 `<loc>` 都是由 `hexo.config.url`（加上 `root`）拼出的
绝对 URL，符合 sitemap 协议的硬性要求。

该功能默认关闭（`sitemap_index: false`），保持原有的单文件行为。

### 可选扩展项

```yaml
sitemap:
  include_home: true        # 是否收录首页（默认 true）
  lastmod: auto             # 更新时间来源（默认 auto）
  changefreq: false         # 例如 daily
  priority: false           # 例如 "0.8"
```

#### lastmod

`lastmod` 控制每个 URL 的 `<lastmod>` 取值：

| 值               | 含义                                                          |
| ---------------- | ------------------------------------------------------------- |
| `auto`（默认）   | 优先使用 front-matter 中显式的 `updated`；如果 `updated` 只是文件修改时间，则回退到文章 `date`。 |
| `updated` / `true` | 使用 Hexo 的 `post.updated`（可能是文件修改时间）。         |
| `date`           | 全部使用文章 `date`。                                          |
| `mtime`          | 强制使用源文件修改时间。                                       |
| `false`          | 不输出 `<lastmod>`。                                           |

Hexo 默认 `updated_option: mtime`，当文章文件被批量复制或恢复时，所有文章的
修改时间会相同，导致 `<lastmod>` 全部一样。`auto` 会回退到每篇文章真实的
`date`，同时仍会识别 front-matter 中显式写的 `updated:`。

## 日志输出

生成完成后会输出统计信息：

```text
[hexo-generator-custom-sitemap] Sitemap 已生成: 32 个 URL（含 extra_urls）  -> sitemap.xml | by yuexia-delisha
```

统计口径：写入地图的 URL 总数 = 应用 `exclude` 后的站内条目 **+** `extra_urls`。
当数量为 `0` 时会输出 `WARN` 警告并附带排查清单，同时跳过生成，不写入任何地图文件。

## 输出示例

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

## 许可证

MIT，详见 [LICENSE](LICENSE)。

第三方组件声明见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
本插件没有运行时 npm 依赖，仅使用 Node.js 内置的 `url` 模块。
