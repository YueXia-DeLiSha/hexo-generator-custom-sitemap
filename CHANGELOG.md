# 版本说明

本项目遵循语义化版本（SemVer）。历史记录以 Git 标签与 npm 发布为准。

## 1.0.6 — 2026-10-19

### 变更

- 兼容性要求收紧为 **Node.js >= 18**、**Hexo >= 7.0.0**，与 Hexo 7 的实际运行要求一致。
- 中英文 README 新增「兼容性」小节。

## 1.0.5 — 2026-10-19

### 变更

- `sitemap_index_size` 越界（小于 1 或大于 50000）或非数字时输出 `WARN`，并回退为 `5000`。
- 切片数量为整数除法，恰好整除时不会产生空切片。
- 开启切片且最终 URL 为 0 时：输出 `WARN` 排查清单并跳过生成，不写入任何地图文件。
- 确认索引与切片内的所有 `<loc>` 均使用 `hexo.config.url`（含 `root`）拼成绝对 URL。
- 未配置 `hexo.config.url` 时输出 `WARN`，提示 `<loc>` 可能不是绝对 URL。

## 1.0.4 — 2026-10-19

### 新增

- 新增 `sitemap_index` 开关（默认 `false`）：开启后将地图切片为多个文件，并生成 sitemap 索引。
- 新增 `sitemap_index_size`（默认 `5000`，范围 1–50000）：每个切片包含的最大 URL 数。
- 开启后输出 `sitemap-1.xml`、`sitemap-2.xml`……，索引写入 `path` 指定的文件。
- 生成日志会显示切片数量。

### 说明

- 统计口径不受切片影响：日志中的 URL 总数仍为最终写入的条目（含 `extra_urls`）。
- 仅在 `sitemap_index: true` 时启用；默认保持原单文件行为。

## 1.0.3 — 2026-10-19

### 新增

- 生成完成后输出统计日志：
  `Sitemap 已生成: N 个 URL（含 extra_urls） -> path | by yuexia-delisha`
- URL 数为 0 时输出 `WARN`，并附带排查清单。
- 明确统计口径：URL 总数 = 站内收录条目 + `extra_urls`（已应用 `exclude`）。

## 1.0.2 — 2026-10-19

### 修复

- 新增 `lastmod` 配置，默认 `auto`。
- 当 Hexo `updated_option: mtime` 导致文章更新时间全部相同时，`auto` 会回退到每篇文章真实的 `date`。
- 支持 `auto` / `updated` / `date` / `mtime` / `false`。

## 1.0.1 — 2026-10-18

### 变更

- 补充 `repository`、`bugs`、`homepage` 元数据。
- 新增英文与中文 README。
- 新增 `LICENSE`、`THIRD-PARTY-NOTICES.md` 与第三方协议文件。

## 1.0.0 — 2026-10-17

### 新增

- 初始版本。
- 支持 `status`、`path`、`rel`、`tags`、`categories` 配置。
- `exclude` 支持按文件或路径排除。
- `extra_urls` 支持追加路径、文件与外部网址。
