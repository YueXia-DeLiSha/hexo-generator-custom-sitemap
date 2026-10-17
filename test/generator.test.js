'use strict';

const test = require('node:test');
const assert = require('node:assert');

const generator = require('../lib/generator');
const { matchExclude, isFilePath, normalizePath, joinUrl, siteBase, toList } = generator;

function query(items) {
  return { forEach: (fn) => items.forEach(fn) };
}

function createHexo(sitemap) {
  const config = { url: 'https://example.com', root: '/' };
  if (sitemap !== undefined) config.sitemap = sitemap;
  const hexo = {
    config: config,
    extend: { generator: { register: function (name, fn) { this.fn = fn; } } }
  };
  generator(hexo);
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
