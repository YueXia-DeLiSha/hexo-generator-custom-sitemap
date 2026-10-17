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

### 可选扩展项

```yaml
sitemap:
  include_home: true        # 是否收录首页（默认 true）
  lastmod: true             # 是否输出 <lastmod>（默认 true）
  changefreq: false         # 例如 daily
  priority: false           # 例如 "0.8"
```

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
