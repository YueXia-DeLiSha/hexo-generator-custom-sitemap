'use strict';

const test = require('node:test');
const assert = require('node:assert');

const generator = require('../lib/generator');
const { matchExclude, isFilePath, normalizePath, joinUrl, siteBase, toList, resolveLastmod, slicePathFor, normalizeSliceSize } = generator;

function query(items) {
  return { forEach: (fn) => items.forEach(fn) };
}

function createHexo(sitemap, overrides) {
  const config = Object.assign({ url: 'https://example.com', root: '/' }, overrides || {});
  if (sitemap !== undefined) config.sitemap = sitemap;
  const logs = { info: [], warn: [] };
  const hexo = {
    config: config,
    log: {
      info: function (message) { logs.info.push(message); },
      warn: function (message) { logs.warn.push(message); }
    },
    extend: { generator: { register: function (name, fn) { this.fn = fn; } } }
  };
  generator(hexo);
  hexo.logs = logs;
  return hexo;
}

test('normalizePath adds leading slash and trims trailing slash', () => {
  assert.strictEqual(normalizePath('tag/'), '/tag');
  assert.strictEqual(normalizePath('/404.html'), '/404.html');
  assert.strictEqual(normalizePath(''), '/');
  assert.strictEqual(normalizePath('https://example.com/foo/'), '/foo');
});

test('isFilePath detects extensions only in the last segment', () => {
  assert.strictEqual(isFilePath('/404.html'), true);
  assert.strictEqual(isFilePath('/tag'), false);
  assert.strictEqual(isFilePath('/tags/foo'), false);
  assert.strictEqual(isFilePath('/a.b/foo'), false);
});

test('file name excludes that exact file', () => {
  assert.strictEqual(matchExclude('/404.html', ['/404.html']), true);
  assert.strictEqual(matchExclude('/404.html', ['404.html']), true);
  assert.strictEqual(matchExclude('/about.html', ['/404.html']), false);
});

test('path excludes the whole subtree but not siblings with same prefix', () => {
  assert.strictEqual(matchExclude('/tag', ['/tag']), true);
  assert.strictEqual(matchExclude('/tag/foo/', ['/tag']), true);
  assert.strictEqual(matchExclude('/tag/foo/bar/', ['/tag']), true);
  assert.strictEqual(matchExclude('/tags/foo/', ['/tag']), false);
  assert.strictEqual(matchExclude('/about/', ['/tag']), false);
});

test('multiple entries in the exclude array are all honoured', () => {
  const exclude = ['/tag', '/404.html'];
  assert.strictEqual(matchExclude('/tag/foo/', exclude), true);
  assert.strictEqual(matchExclude('/404.html', exclude), true);
  assert.strictEqual(matchExclude('/post/hello/', exclude), false);
});

test('home page can be excluded by /', () => {
  assert.strictEqual(matchExclude('/', ['/']), true);
});

test('siteBase keeps subdirectory root', () => {
  assert.strictEqual(siteBase({ url: 'https://example.com', root: '/' }), 'https://example.com');
  assert.strictEqual(siteBase({ url: 'https://example.com/', root: '/blog/' }), 'https://example.com/blog');
});

test('joinUrl handles paths, files and absolute urls', () => {
  const base = siteBase({ url: 'https://example.com', root: '/' });
  assert.strictEqual(joinUrl(base, '/'), 'https://example.com/');
  assert.strictEqual(joinUrl(base, '/xxx'), 'https://example.com/xxx');
  assert.strictEqual(joinUrl(base, '/xxx.html'), 'https://example.com/xxx.html');
  assert.strictEqual(joinUrl(base, 'https://other.com/a'), 'https://other.com/a');
});

test('generator filters and appends urls end to end', () => {
  const query = function (items) {
    return { forEach: (fn) => items.forEach(fn) };
  };
  const hexo = {
    config: {
      url: 'https://example.com',
      root: '/',
      sitemap: {
        exclude: ['/tag', '/404.html'],
        extra_urls: ['/custom', '/custom.html', 'https://external.com/page']
      }
    },
    extend: {
      generator: {
        register: function (name, fn) {
          assert.strictEqual(name, 'custom_sitemap');
          this.fn = fn;
        }
      }
    }
  };
  generator(hexo);
  const route = hexo.extend.generator.fn({
    posts: query([{ path: 'post/hello/', permalink: 'https://example.com/post/hello/', updated: '2024-01-01' }]),
    pages: query([
      { path: '404.html', permalink: 'https://example.com/404.html' },
      { path: 'about/', permalink: 'https://example.com/about/' }
    ]),
    tags: query([{ path: 'tag/foo/' }, { path: 'tags/foo/' }]),
    categories: query([{ path: 'categories/bar/' }])
  });

  assert.strictEqual(route.path, 'sitemap.xml');
  assert.match(route.data, /https:\/\/example\.com\/post\/hello\//);
  assert.match(route.data, /https:\/\/example\.com\/about\//);
  assert.match(route.data, /https:\/\/example\.com\/categories\/bar\//);
  assert.match(route.data, /https:\/\/example\.com\/custom<\/loc>/);
  assert.match(route.data, /https:\/\/example\.com\/custom\.html<\/loc>/);
  assert.match(route.data, /https:\/\/external\.com\/page<\/loc>/);
  assert.doesNotMatch(route.data, /404\.html/);
  assert.doesNotMatch(route.data, /\/tag\/foo\//);
  assert.match(route.data, /https:\/\/example\.com\/tags\/foo\//);
});

test('toList accepts arrays and comma or newline separated strings', () => {
  assert.deepStrictEqual(toList(['/a', '/b']), ['/a', '/b']);
  assert.deepStrictEqual(toList('/a, /b'), ['/a', '/b']);
  assert.deepStrictEqual(toList('/a\r\n/b\n/c'), ['/a', '/b', '/c']);
});

test('status false disables generation', () => {
  const hexo = createHexo({ status: false });
  const result = hexo.extend.generator.fn({
    posts: query([{ path: 'p/', permalink: 'https://example.com/p/' }]),
    pages: query([])
  });
  assert.strictEqual(result, null);
});

test('rel, tags and categories switches exclude their sections', () => {
  const hexo = createHexo({ rel: false, tags: false, categories: false });
  const route = hexo.extend.generator.fn({
    posts: query([{ path: 'p/', permalink: 'https://example.com/p/' }]),
    pages: query([{ path: 'about/', permalink: 'https://example.com/about/' }]),
    tags: query([{ path: 'tag/a/' }]),
    categories: query([{ path: 'categories/b/' }])
  });

  assert.match(route.data, /https:\/\/example\.com\/p\//);
  assert.doesNotMatch(route.data, /about/);
  assert.doesNotMatch(route.data, /tag\/a/);
  assert.doesNotMatch(route.data, /categories\/b/);
});

test('external extra_urls with root pathname are not deduped against home', () => {
  const hexo = createHexo({ extra_urls: ['https://sdvg.com', 'https://usduhd.top'] });
  const route = hexo.extend.generator.fn({
    posts: query([]),
    pages: query([]),
    tags: query([]),
    categories: query([])
  });

  assert.match(route.data, /<loc>https:\/\/example\.com\/<\/loc>/);
  assert.match(route.data, /<loc>https:\/\/sdvg\.com<\/loc>/);
  assert.match(route.data, /<loc>https:\/\/usduhd\.top<\/loc>/);
});

test('resolveLastmod supports date, updated and off modes', () => {
  const post = { date: '2026-01-01T00:00:00.000Z', updated: '2026-02-01T00:00:00.000Z' };

  assert.strictEqual(resolveLastmod('date', {}, post), post.date);
  assert.strictEqual(resolveLastmod('updated', {}, post), post.updated);
  assert.strictEqual(resolveLastmod(true, {}, post), post.updated);
  assert.strictEqual(resolveLastmod(false, {}, post), null);
});

test('auto falls back to date when updated comes from file mtime', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-'));
  const file = path.join(dir, 'post.md');
  fs.writeFileSync(file, 'x');
  const mtime = fs.statSync(file).mtimeMs;
  const post = {
    source: 'post.md',
    date: '2026-01-01T00:00:00.000Z',
    updated: new Date(mtime).toISOString()
  };

  assert.strictEqual(resolveLastmod('auto', { source_dir: dir }, post), post.date);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('logs the generated URL count including extra_urls', () => {
  const hexo = createHexo({ extra_urls: ['https://external.example/page'] });
  hexo.extend.generator.fn({
    posts: query([{ path: 'p/', permalink: 'https://example.com/p/' }]),
    pages: query([]),
    tags: query([]),
    categories: query([])
  });

  assert.strictEqual(hexo.logs.info.length, 1);
  assert.strictEqual(hexo.logs.warn.length, 0);
  assert.match(hexo.logs.info[0], /Sitemap 已生成: 3 个 URL（含 extra_urls）/);
  assert.match(hexo.logs.info[0], /-> sitemap\.xml/);
  assert.match(hexo.logs.info[0], /by yuexia-delisha/);
});

test('warns with a troubleshooting checklist when no URL is generated', () => {
  const hexo = createHexo({ include_home: false, extra_urls: [] });
  const result = hexo.extend.generator.fn({
    posts: query([]),
    pages: query([]),
    tags: query([]),
    categories: query([])
  });

  assert.strictEqual(result, null);
  assert.strictEqual(hexo.logs.info.length, 0);
  assert.strictEqual(hexo.logs.warn.length, 1);
  assert.match(hexo.logs.warn[0], /0 个 URL（含 extra_urls）/);
  assert.match(hexo.logs.warn[0], /已跳过生成/);
  assert.match(hexo.logs.warn[0], /排查清单/);
  assert.match(hexo.logs.warn[0], /sitemap\.status/);
  assert.match(hexo.logs.warn[0], /extra_urls/);
});

test('slicePathFor inserts the slice number before the extension', () => {
  assert.strictEqual(slicePathFor('sitemap.xml', 1), 'sitemap-1.xml');
  assert.strictEqual(slicePathFor('dir/sitemap.xml', 2), 'dir/sitemap-2.xml');
  assert.strictEqual(slicePathFor('sitemap', 3), 'sitemap-3.xml');
});

test('sitemap_index slices urls and writes an index', () => {
  const hexo = createHexo({
    include_home: false,
    sitemap_index: true,
    sitemap_index_size: 2
  });
  const posts = Array.from({ length: 5 }, function (_, i) {
    return { path: 'p' + i + '/', permalink: 'https://example.com/p' + i + '/', updated: '2026-01-0' + (i + 1) + 'T00:00:00.000Z' };
  });
  const result = hexo.extend.generator.fn({
    posts: query(posts),
    pages: query([]),
    tags: query([]),
    categories: query([])
  });

  assert.ok(Array.isArray(result));
  assert.strictEqual(result.length, 4);

  const index = result.find(function (route) { return route.path === 'sitemap.xml'; });
  const slices = result.filter(function (route) { return route.path !== 'sitemap.xml'; });

  assert.ok(index);
  assert.match(index.data, /<sitemapindex/);
  assert.strictEqual(slices.length, 3);
  assert.match(index.data, /https:\/\/example\.com\/sitemap-1\.xml/);
  assert.match(index.data, /https:\/\/example\.com\/sitemap-3\.xml/);

  const counts = slices.map(function (route) {
    return (route.data.match(/<loc>/g) || []).length;
  });
  assert.deepStrictEqual(counts, [2, 2, 1]);

  assert.strictEqual(hexo.logs.info.length, 1);
  assert.match(hexo.logs.info[0], /5 个 URL（含 extra_urls）/);
  assert.match(hexo.logs.info[0], /共 3 个切片/);
});

test('normalizeSliceSize falls back to 5000 when out of range', () => {
  assert.deepStrictEqual(normalizeSliceSize(0), { size: 5000, invalid: true });
  assert.deepStrictEqual(normalizeSliceSize(50001), { size: 5000, invalid: true });
  assert.deepStrictEqual(normalizeSliceSize('abc'), { size: 5000, invalid: true });
  assert.deepStrictEqual(normalizeSliceSize(20), { size: 20, invalid: false });
  assert.deepStrictEqual(normalizeSliceSize('20'), { size: 20, invalid: false });
});

test('out-of-range sitemap_index_size warns and falls back to 5000', () => {
  const hexo = createHexo({ include_home: false, sitemap_index: true, sitemap_index_size: 999999 });
  const result = hexo.extend.generator.fn({
    posts: query([{ path: 'p/', permalink: 'https://example.com/p/' }]),
    pages: query([]),
    tags: query([]),
    categories: query([])
  });

  assert.ok(Array.isArray(result));
  assert.match(hexo.logs.warn.join('\n'), /sitemap_index_size 越界或无效/);
  assert.match(hexo.logs.warn.join('\n'), /5000/);
});

test('exact multiple of slice size does not create an empty slice', () => {
  const hexo = createHexo({ include_home: false, sitemap_index: true, sitemap_index_size: 2 });
  const posts = Array.from({ length: 4 }, function (_, i) {
    return { path: 'p' + i + '/', permalink: 'https://example.com/p' + i + '/' };
  });
  const result = hexo.extend.generator.fn({
    posts: query(posts),
    pages: query([]),
    tags: query([]),
    categories: query([])
  });

  const slices = result.filter(function (route) { return route.path !== 'sitemap.xml'; });
  assert.strictEqual(slices.length, 2);
  assert.deepStrictEqual(
    slices.map(function (route) { return (route.data.match(/<loc>/g) || []).length; }),
    [2, 2]
  );
});

test('0 urls with slicing enabled warns and generates nothing', () => {
  const hexo = createHexo({ include_home: false, sitemap_index: true });
  const result = hexo.extend.generator.fn({
    posts: query([]),
    pages: query([]),
    tags: query([]),
    categories: query([])
  });

  assert.strictEqual(result, null);
  assert.strictEqual(hexo.logs.warn.length, 1);
  assert.match(hexo.logs.warn[0], /已跳过生成/);
});

test('sitemap index loc is absolute and includes the subdirectory root', () => {
  const hexo = createHexo(
    { include_home: false, sitemap_index: true, sitemap_index_size: 1 },
    { url: 'https://example.com', root: '/blog/' }
  );
  const result = hexo.extend.generator.fn({
    posts: query([{ path: 'p/', permalink: 'https://example.com/blog/p/' }]),
    pages: query([]),
    tags: query([]),
    categories: query([])
  });

  const index = result.find(function (route) { return route.path === 'sitemap.xml'; });
  const slice = result.find(function (route) { return route.path === 'sitemap-1.xml'; });

  assert.match(index.data, /<loc>https:\/\/example\.com\/blog\/sitemap-1\.xml<\/loc>/);
  assert.match(slice.data, /<loc>https:\/\/example\.com\/blog\/p\/<\/loc>/);
});
